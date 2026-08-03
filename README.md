# Break Stuff

Break a task that is too big to begin into a short, ordered list of steps, each with a
time estimate. Any step can be broken down again. Everything stays in the browser.

Live at [breakstuff.netlify.app](https://breakstuff.netlify.app/).

## Stack

| Concern       | Choice                                                    |
| ------------- | --------------------------------------------------------- |
| Framework     | Nuxt 4 (Vue 3.5, `<script setup>`, Composition API)       |
| Styling       | Tailwind CSS v4, CSS-first theme, no `tailwind.config.js` |
| State         | Pinia setup store, persisted to `localStorage`            |
| UI primitives | Reka UI (dialog, dropdown, checkbox, collapsible)         |
| Icons         | Phosphor                                                  |
| Toasts        | vue-sonner                                                |
| Model access  | Vercel AI SDK v7 through OpenRouter                       |

## Setup

Requires Node 22+.

```bash
npm install
cp .env.example .env   # then add your OpenRouter key
npm run dev            # http://localhost:3000
```

| Script              | Does                             |
| ------------------- | -------------------------------- |
| `npm run dev`       | Dev server with HMR              |
| `npm run build`     | Production build into `.output/` |
| `npm run preview`   | Serve the production build       |
| `npm run typecheck` | `vue-tsc` over the whole project |
| `npm run lint`      | Prettier check                   |
| `npm run format`    | Prettier write                   |

## Configuration

Two variables, both server-side only:

| Variable             | Required | Default                      |
| -------------------- | -------- | ---------------------------- |
| `OPENROUTER_API_KEY` | yes      | none                         |
| `OPENROUTER_MODEL`   | no       | `poolside/laguna-s-2.1:free` |

Without a key, `/api/breakdown` returns 503 and the UI reports that breakdowns are not
configured. The rest of the app works: adding, editing, completing and reordering tasks
never touches the network.

`nuxt dev` reads `.env` **once, at startup**. Editing it while the server is running
changes nothing until you restart. If a key is rejected, the route logs which source it
came from plus a masked fingerprint, so you can tell whether the key being sent is the
one you think it is.

### Swapping the model

The route asks for structured output by forcing a tool call rather than using
`response_format`, so any tool-capable OpenRouter model works. Check before switching:

```bash
curl -s https://openrouter.ai/api/v1/models \
  | jq '.data[] | select(.id=="<model>") | .supported_parameters'
```

`tools` must be present. `response_format` is not needed and is deliberately not relied
on: the default model advertises the former and not the latter, and AI SDK v7 does not
fall back to prompt-level JSON instructions when a provider ignores a schema.

## Layout

```
app/
  assets/css/main.css     design tokens, keyframes, base styles
  components/
    layout/               header, hero, footer, mark, theme toggle
    task/                 composer, list, item, toolbar, dialog, skeleton, empty state
    ui/                   BaseButton, BaseCheckbox
  pages/index.vue         composition surface only
  stores/tasks.ts         the task tree and every operation on it
server/api/breakdown.post.ts   the only server route
shared/types/task.ts      types shared by client and server
```

`app/pages/index.vue` wires the store to the feature components and holds no task UI of
its own. Nesting logic (find, reorder, filter, roll up estimates) lives in the store so
there is one place where tree behaviour is defined.

## Design notes

The palette is brown throughout, in the Notion register: the hue lives in the neutrals
rather than in large flat fills, and a single clay accent is used for state. Two ramps
(`cocoa` for surfaces and text, `clay` for the accent) feed semantic tokens
(`--ui-canvas`, `--ui-text`, `--ui-border-strong`, ...) that swap under `.dark`.
Components reference the semantic tokens only, so light and dark stay in lockstep.

Light and dark ramps diverge where they have to. No single value clears WCAG AA against
both a white and a near-black background, so subtle text and control borders are defined
per theme rather than shared. Every text pair and control boundary was measured in the
browser; the numbers are in the comments next to the tokens they justify.

Motion is deliberately quiet, because this is a page people keep open. Two rules decide
everything: frequency of use, and whether the element is entering or already on screen.

- Anything entering uses a strong ease-out (`--ease-snap`); anything already on screen
  moving A to B uses ease-in-out (`--ease-glide`). Exits are faster than entrances.
- The one loud moment is a breakdown landing: the five steps stagger in 45ms apart, so
  you watch the task split instead of finding it already split.
- Nothing loops. The single exception is the skeleton shimmer, which exists only while a
  request is in flight.
- Theme switching is not animated. It repaints the whole page in one frame, and animating
  a 16px icon on top of that just reads as lag.
- `prefers-reduced-motion` collapses travel to cross-fades but keeps the collapse height
  animation, shortened. Removing it entirely makes every row below a disclosure teleport,
  which is more disorienting than the motion it replaces.

Animations are registered as `--animate-*` theme entries rather than hand-written
classes. A hand-written `.animate-x` cannot be composed with a Tailwind variant, so
`data-[state=open]:animate-collapse-open` silently generates nothing.

## Accessibility

- Every text pair and control boundary meets WCAG AA (4.5:1 for text, 3:1 for control
  outlines) in both themes, verified by measuring computed styles in a browser rather
  than by eye.
- The task tree is fully keyboard operable. Reordering is move-up / move-down buttons
  rather than drag-and-drop: it is the only reorder gesture that works equally well with
  a keyboard, a screen reader and a thumb.
- Row controls are revealed on hover but also on `focus-within`, so tabbing never lands
  on something invisible. On touch, where there is no hover, they are always shown.
- Filters are a real `tablist`; the delete confirmation is an `alertdialog` with focus
  trapped and returned. Icon-only buttons name their task, and the promoted "Break down"
  button's accessible name starts with its visible text (WCAG 2.5.3).
- A skip link is the first tab stop. Focus is never removed, only restyled.

## CI

`.github/workflows/ci.yml` runs on push, on pull requests, and weekly (advisories land
after code stops changing):

- **verify** - Prettier check, `vue-tsc`, production build
- **gitleaks** - secret scan over full history
- **trivy** - dependencies, config and secrets; reports everything, fails on HIGH and
  CRITICAL that have fixes
- **semgrep** - `p/typescript`, `p/javascript`, `p/secrets`, `p/security-audit`

Trivy and Semgrep upload SARIF to GitHub code scanning.

## Licence

MIT
