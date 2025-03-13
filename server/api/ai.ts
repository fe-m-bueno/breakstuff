import { defineEventHandler, readBody } from 'h3';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export default defineEventHandler(async (event) => {
  const { task } = await readBody(event);

  try {
    const response = await groq.chat.completions.create({
      model: 'qwen-2.5-32b',
      messages: [
        {
          role: 'system',
          content: `You will receive a task from the user and break it down into five smaller tasks, each with an estimated completion time in minutes.
          First, detect the user's input language and respond in the same language.  
          Ensure the breakdown is logical and sequential, making it easier to complete the main task step by step.  
          Return the result as a JSON object in the following schema:
          {
            "response": {
              "firstTask": { "text": "string", "estimated": number },
              "secondTask": { "text": "string", "estimated": number },
              "thirdTask": { "text": "string", "estimated": number },
              "fourthTask": { "text": "string", "estimated": number }, 
              "fifthTask": { "text": "string", "estimated": number }
            }
          },`,
        },
        { role: 'user', content: task },
      ],
      temperature: 0.6,
      max_completion_tokens: 4096,
      top_p: 0.95,
      stream: false,
      response_format: {
        type: 'json_object',
      },
    });
    const text = response.choices[0].message.content;
    if (!text) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No response from AI',
      });
    }
    const json = JSON.parse(text);

    return json;
  } catch (error) {
    console.error(error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal Server Error',
    });
  }
});
