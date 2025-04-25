import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { generateText, LanguageModelV1, wrapLanguageModel } from "ai";
import { z } from "zod";
import { librettoMiddleware } from "../src/middleware";
import { LibrettoCreateOptions } from "../src/types";

async function main(model: LanguageModelV1) {
  console.log(`Starting ${model.modelId} example with zod parameters...`);
  const wrappedLlm = wrapLanguageModel({
    model: model,
    middleware: [librettoMiddleware],
  });

  const { text, toolCalls } = await generateText({
    model: wrappedLlm,
    messages: [
      {
        role: "user",
        content: "What's the weather like in {location}?",
      },
    ],
    temperature: 1.0,
    tools: {
      get_current_weather: {
        type: "function",
        description: "Get the current weather in a location",
        parameters: z.object({
          location: z.string(),
          unit: z.string().optional(),
        }),
      },
    },
    providerOptions: {
      librettoOptions: {
        // apiKey: Libretto api key, or set LIBRETTO_API_KEY env var
        promptTemplateName: `vercelai-test-tools`,
        templateParams: {
          location: "Austin, TX",
        },
      } satisfies LibrettoCreateOptions,
    },
  });

  console.log(`${model.modelId} Response: `, text);
  console.log(
    `${model.modelId} Tool Calls: `,
    JSON.stringify(toolCalls, null, 2),
  );
}

main(openai("gpt-4o-mini"));
main(anthropic("claude-3-5-sonnet-20240620"));
main(google("models/gemini-2.0-flash-exp"));
main(groq("llama-3.3-70B-versatile"));
