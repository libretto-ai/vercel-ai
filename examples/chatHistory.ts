import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import {
  CoreMessage,
  generateText,
  LanguageModelV1,
  wrapLanguageModel,
} from "ai";
import { librettoMiddleware } from "../src/middleware";
import { LibrettoCreateOptions, LibrettoMessageOptions } from "../src/types";

async function main(model: LanguageModelV1) {
  console.log(`Starting ${model.modelId} example with chat history...`);
  const wrappedLlm = wrapLanguageModel({
    model: model,
    middleware: [librettoMiddleware],
  });

  const { text } = await generateText({
    model: wrappedLlm,
    messages: [
      {
        role: "system",
        content: `My role is to be the AI Coach Supervisor to help guide the coach. I will receive a question from the coach, and I will guide them on the content and quality of the question.`,
      },
      {
        role: "user",
        content: "{prev_messages} {second_history}",
        providerOptions: {
          librettoOptions: {
            isChatHistory: true,
          } satisfies LibrettoMessageOptions,
        },
      },
      {
        role: "user",
        content: "{coach_question}",
      },
    ] as CoreMessage[], // need to cast because of Libretto's chat_history role
    temperature: 1.0,
    providerOptions: {
      librettoOptions: {
        // apiKey: Libretto api key, or set LIBRETTO_API_KEY env var
        promptTemplateName: "vercel-ai-supervisor",
        templateParams: {
          prev_messages: [
            {
              role: "user",
              content: "I am not feeling very good because of my home life.",
            },
            {
              role: "assistant",
              content: "I am sorry to hear that.",
            },
          ],
          second_history: [
            {
              role: "user",
              content: "Thank you for the kind words.",
            },
            {
              role: "assistant",
              content: "You're welcome",
            },
          ],
          coach_question: "How do i get my employees to work harder?",
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
