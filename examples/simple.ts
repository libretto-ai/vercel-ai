import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { generateText, LanguageModelV1, wrapLanguageModel } from "ai";
import { librettoMiddleware } from "../src/middleware";
import { LibrettoCreateOptions } from "../src/types";

async function main(model: LanguageModelV1) {
  console.log(`Starting ${model.modelId} example...`);
  const wrappedLlm = wrapLanguageModel({
    model: model,
    middleware: [librettoMiddleware],
  });

  const { text } = await generateText({
    model: wrappedLlm,
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that addresses people in a {tone} tone.",
      },
      { role: "user", content: "Hello, my name is {name}" },
    ],
    temperature: 1.0,
    providerOptions: {
      librettoOptions: {
        // apiKey: Libretto api key, or set LIBRETTO_API_KEY env var
        promptTemplateName: "vercelai-test-simple",
        templateParams: {
          name: "Jamie",
          tone: "funny",
        },
      } satisfies LibrettoCreateOptions,
    },
  });

  console.log("Response: ", text);
}

main(openai("gpt-4o-mini"));
main(anthropic("claude-3-5-sonnet-20240620"));
main(google("models/gemini-2.0-flash-exp"));
main(groq("llama-3.3-70B-versatile"));
