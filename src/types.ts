import { CoreLibrettoCreateParams } from "@libretto/core";
import { generateText, LanguageModelV1 } from "ai";

/**
 * Used to pass up to Libretto
 */
export type ModelParameters = Record<string, unknown> & {
  modelProvider: string; // The underlying provider (openai, anthropic, etc)
  modelType: "completion" | "chat";
  model: string;
};

/**
 * Need the type of messages to be used for Libretto's Create Params, so templateChat
 * can be typed to that specific type.
 */
type GenerateTextParams = Parameters<typeof generateText>[0];

export type LibrettoCreateParams = CoreLibrettoCreateParams<
  GenerateTextParams["messages"]
> & {
  redactPii?: boolean;
};

export type ResponseMetrics = {
  usage: Awaited<ReturnType<LanguageModelV1["doGenerate"]>>["usage"];
  finish_reason: Awaited<
    ReturnType<LanguageModelV1["doGenerate"]>
  >["finishReason"];
  logprobs: Awaited<ReturnType<LanguageModelV1["doGenerate"]>>["logprobs"];
};

export type VercelAiToolCall = Awaited<
  ReturnType<LanguageModelV1["doGenerate"]>
>["toolCalls"];
