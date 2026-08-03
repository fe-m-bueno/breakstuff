import { APICallError, generateText, tool } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { z } from 'zod';
import type { BreakdownResponse } from '~~/shared/types/task';

/**
 * Task breakdown, generated through OpenRouter with the Vercel AI SDK.
 *
 * Structured output comes from a forced tool call rather than `Output.object()`.
 * That is deliberate: the default model here advertises `tools` but not
 * `response_format` / `structured_outputs`, and AI SDK v7 relies on the provider
 * honouring `response_format` (it does not fall back to injecting JSON
 * instructions into the prompt). A JSON schema would therefore be dropped by
 * OpenRouter and the model would answer in prose. Forcing a tool call gets a
 * schema-validated object out of any tool-capable model, which is what makes
 * OPENROUTER_MODEL genuinely swappable.
 *
 * Check a model before swapping it in:
 *   curl -s https://openrouter.ai/api/v1/models | jq '.data[]
 *     | select(.id=="<model>") | .supported_parameters'
 */
const DEFAULT_MODEL = 'poolside/laguna-s-2.1:free';

/** Leaves the handler room to still return JSON after giving up on the model. */
const MODEL_TIMEOUT_MS = 45_000;

const requestSchema = z.object({
  task: z.string().trim().min(1).max(500),
  /**
   * The ancestor step this one came from. Without it, breaking down a generated
   * step loses the plot: "Buy flour" under "Bake a cake" would otherwise be
   * split as if it were a standalone errand.
   */
  parentContext: z.string().trim().max(500).optional(),
  /** Only used to ask the model to answer in the user's language. */
  locale: z.string().trim().max(35).optional()
});

const stepsSchema = z.object({
  steps: z
    .array(
      z.object({
        text: z.string().min(1).max(160).describe('One concrete action, imperative mood, at most 12 words'),
        estimated: z.number().int().min(1).max(1440).describe('Realistic minutes for this single step')
      })
    )
    /*
     * Asked for five, but accept a range. A free model that returns four or six
     * good steps would otherwise fail validation and lose an answer that was
     * fine. Trimmed to five below.
     */
    .min(2)
    .max(8)
    .describe('The ordered steps, five where possible')
});

const CACHE_TTL = 10 * 60 * 1000;
const CACHE_MAX = 200;
const cache = new Map<string, { data: BreakdownResponse; expires: number }>();

function readCache(key: string): BreakdownResponse | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() >= hit.expires) {
    cache.delete(key);
    return null;
  }
  // Refresh insertion order so hot keys survive eviction.
  cache.delete(key);
  cache.set(key, hit);
  return hit.data;
}

function writeCache(key: string, data: BreakdownResponse) {
  // An unbounded Map in a long-lived serverless instance is a slow leak.
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next();
    if (!oldest.done) cache.delete(oldest.value);
  }
  cache.set(key, { data, expires: Date.now() + CACHE_TTL });
}

export default defineEventHandler(async (event): Promise<BreakdownResponse> => {
  const config = useRuntimeConfig(event);

  /*
   * process.env first, runtimeConfig second.
   *
   * runtimeConfig defaults are evaluated when nuxt.config.ts is loaded, which for
   * a built app is build time, and Nitro only re-reads them at runtime from
   * NUXT_-prefixed variables. Reading OPENROUTER_API_KEY through runtimeConfig
   * alone therefore works in dev and then silently serves a stale or empty key in
   * production. Reading the environment here means the plain, unprefixed names
   * work the same in both, which is the point of keeping them unprefixed.
   *
   * Trimmed because a value pasted into .env with a trailing space or wrapping
   * quotes is rejected upstream as a bad key, which is a confusing way to find out.
   */
  const fromEnv = clean(process.env.OPENROUTER_API_KEY);
  const openrouterApiKey = fromEnv || clean(config.openrouterApiKey);
  const keySource = fromEnv ? 'process.env' : 'runtimeConfig';
  const openrouterModel = clean(process.env.OPENROUTER_MODEL) || clean(config.openrouterModel);

  if (!openrouterApiKey) {
    // Naming the variable turns a dead end into something actionable.
    console.error('OPENROUTER_API_KEY is not set; cannot generate a breakdown.');
    throw createError({
      statusCode: 503,
      statusMessage: 'Breakdowns are not configured (missing OPENROUTER_API_KEY).'
    });
  }

  const parsed = requestSchema.safeParse(await readBody(event).catch(() => null));
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body.' });
  }
  const { task, parentContext, locale } = parsed.data;

  const cacheKey = `${locale ?? ''}|${parentContext ?? ''}|${task}`.toLowerCase();
  const cached = readCache(cacheKey);
  if (cached) return cached;

  const openrouter = createOpenRouter({ apiKey: openrouterApiKey });
  const model = openrouter(openrouterModel || DEFAULT_MODEL);

  try {
    const result = await generateText({
      model,
      // Reasoning models wrap answers in commentary. The tool call is the only
      // channel that is read, so say so plainly.
      system: [
        'You break a task into the smallest number of concrete, sequential steps that actually finish it.',
        'You always answer by calling the emit_steps tool exactly once, and never in prose.',
        'Steps must be ordered so that doing them in sequence completes the task.',
        'Each step is one action a person can start immediately. No step may restate the original task.',
        'Estimates are realistic minutes for that step alone, not cumulative.',
        'Reply in the same language as the task text. Plain text only, no markdown and no numbering.'
      ].join(' '),
      prompt: [
        parentContext && parentContext !== task
          ? `This step belongs to a larger task: "${parentContext}". Stay inside that scope.`
          : null,
        `Task: ${task}`,
        locale ? `The user's locale is ${locale}; prefer their language if the task is ambiguous.` : null,
        'Break it into five steps where five is natural, fewer if the task is small.'
      ]
        .filter(Boolean)
        .join('\n'),
      tools: {
        emit_steps: tool({
          description: 'Return the ordered steps for the task.',
          inputSchema: stepsSchema
        })
      },
      toolChoice: 'required',
      temperature: 0.5,
      abortSignal: AbortSignal.timeout(MODEL_TIMEOUT_MS)
    });

    const call = result.staticToolCalls.find((c) => c.toolName === 'emit_steps');
    if (!call) {
      throw createError({ statusCode: 502, statusMessage: 'The model did not return any steps.' });
    }

    const payload: BreakdownResponse = {
      steps: call.input.steps.slice(0, 5).map((step) => ({
        text: step.text,
        estimated: step.estimated
      }))
    };

    writeCache(cacheKey, payload);
    return payload;
  } catch (error) {
    // A createError from the block above is already the response we want.
    if (isError(error)) throw error;

    // Log server-side, return something generic: provider errors echo request
    // details back and should not reach the browser.
    console.error('OpenRouter breakdown failed:', error);

    const name = (error as Error)?.name;
    if (name === 'TimeoutError' || name === 'AbortError') {
      throw createError({ statusCode: 504, statusMessage: 'The model took too long. Try again.' });
    }

    /*
     * Distinguish the failure modes that need different action from whoever
     * operates this. A single generic 502 made a rejected key look identical to
     * a model having a bad minute.
     */
    if (APICallError.isInstance(error)) {
      // The upstream body names the model and echoes the request, so it is
      // logged rather than returned.
      console.error(`OpenRouter status ${error.statusCode}: ${error.responseBody}`);

      if (error.statusCode === 401 || error.statusCode === 403) {
        /*
         * Say which key was actually sent, without printing it. A rejected key is
         * almost always a different key than the one in .env: `nuxt dev` reads
         * .env once at startup and never again, so editing it in a running server
         * changes nothing until a restart. Without this line that is invisible,
         * and the only symptom is a 401 against a key that tests fine by hand.
         */
        console.error(
          `Rejected key came from ${keySource}, fingerprint ${fingerprint(openrouterApiKey)}, ` +
            `length ${openrouterApiKey.length}. If that does not match your .env, restart the server.`
        );
        throw createError({
          statusCode: 503,
          statusMessage: 'The configured OPENROUTER_API_KEY was rejected.'
        });
      }
      if (error.statusCode === 402) {
        throw createError({
          statusCode: 503,
          statusMessage: 'The OpenRouter account is out of credit.'
        });
      }
      if (error.statusCode === 404) {
        throw createError({
          statusCode: 503,
          statusMessage: 'The configured OPENROUTER_MODEL is unavailable to this account.'
        });
      }
      if (error.statusCode === 429) {
        throw createError({
          statusCode: 429,
          statusMessage: 'Rate limited by OpenRouter. Try again shortly.'
        });
      }
    }

    throw createError({ statusCode: 502, statusMessage: 'Could not generate a breakdown right now.' });
  }
});

/** Strips whitespace and the quotes a .env value is often pasted with. */
function clean(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']|["']$/g, '');
}

/**
 * Enough of the key to tell two of them apart in a log, and not enough to use.
 * Only the first and last few characters, which is how OpenRouter's own dashboard
 * identifies a key.
 */
function fingerprint(key: string): string {
  if (key.length < 12) return '<too short to be a key>';
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

/** True for an h3 error that already carries the status we mean to send. */
function isError(value: unknown): value is ReturnType<typeof createError> {
  return typeof value === 'object' && value !== null && 'statusCode' in value && '__h3_error__' in value;
}
