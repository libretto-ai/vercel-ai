import {
  CoreEventMetadata,
  getResolvedMessages,
  objectTemplate,
  sendEvent,
} from "@libretto/core";
import {
  LanguageModelV1CallOptions,
  LanguageModelV1Middleware,
  LanguageModelV1Prompt,
} from "ai";
import {
  LibrettoCreateParams,
  ModelParameters,
  ResponseMetrics,
  VercelAiToolCall,
} from "./types";

/**
 * Mapping from the input format in Vercel to the model type in Libretto.
 */
const INPUT_TO_LIBRETTO_METADATA: Record<
  LanguageModelV1CallOptions["inputFormat"],
  ModelParameters["modelType"]
> = {
  messages: "chat",
  prompt: "completion",
};

const RAW_CALL_SETTINGS_REMOVAL_KEYS = ["system", "systemInstruction"];

export const librettoMiddleware: LanguageModelV1Middleware = {
  transformParams: async ({ params }) => {
    // Need to filter out the providerMedata from each element in the prompt
    const slimmedPrompt = params.prompt.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ providerMetadata, ...rest }) => rest,
    );

    // Wrap the prompt in Libretto's ObjectTemplate system for formatting
    const librettoPromptTemplate = objectTemplate(slimmedPrompt);

    const librettoParams = params.providerMetadata
      ?.librettoOptions as LibrettoCreateParams;

    // Resolve the messages using parameters
    const resolvedPrompt = getResolvedMessages(
      librettoPromptTemplate,
      librettoParams?.templateParams,
    );

    // Set the templateChat to be the resolved template
    if (!librettoParams?.templateChat && resolvedPrompt.template) {
      librettoParams.templateChat = resolvedPrompt.template as any[];
    }

    // Now that we've resolved the materialized prompt, this is what needs to
    // be set back on the parameters.
    params.prompt = resolvedPrompt.messages as LanguageModelV1Prompt;

    return params;
  },

  wrapGenerate: async ({ doGenerate, params, model }) => {
    // Remove the prompt from the data we save as metadata
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { inputFormat } = params;

    const librettoParams = params.providerMetadata
      ?.librettoOptions as LibrettoCreateParams;

    //
    // DO ACTUAL CALL
    const now = Date.now();
    const returnValue = await doGenerate();
    const duration = Date.now() - now;
    // END ACTUAL CALL
    //

    // Similar code as in openai/anthropic libretto sdks
    const feedbackKey = librettoParams?.feedbackKey ?? crypto.randomUUID();
    const promptTemplateName = librettoParams?.promptTemplateName;

    const responseMetrics: ResponseMetrics = {
      usage: returnValue.usage,
      finish_reason: returnValue.finishReason,
      logprobs: returnValue.logprobs,
    };

    // get the model provider from the model, which has a suffix added
    const modelProvider = model.provider?.split(".")[0];

    // Need to get the model id parsed correctly as well
    const modelId = parseModelId(model.modelId);

    const rawCallSettings = Object.fromEntries(
      Object.entries(returnValue.rawCall?.rawSettings ?? {}).filter(
        ([key]) => !RAW_CALL_SETTINGS_REMOVAL_KEYS.includes(key),
      ),
    );

    // Create the model params with the expected model provider and model type values.
    // These 2 fields are required by the server in libretto.
    const modelParameters: ModelParameters = {
      ...rawCallSettings,
      modelProvider,
      model: modelId,
      modelType: INPUT_TO_LIBRETTO_METADATA[inputFormat],
    };

    // This is the provider specific response
    const rawResponse = returnValue.rawResponse?.body;

    // TODO: redact PII if that flag is on
    if (librettoParams?.redactPii) {
      // TODO: redact PII from messages and raw response
    }

    const toolDefs = getTools(params.mode);

    sendEvent<
      CoreEventMetadata<ModelParameters, VercelAiToolCall, ResponseMetrics>
    >({
      responseTime: duration,
      response: returnValue.text,
      rawResponse: rawResponse,
      // TODO: responseErrors
      responseMetrics,
      params: librettoParams?.templateParams ?? {},
      apiKey: librettoParams?.apiKey ?? process.env.LIBRETTO_API_KEY,
      promptTemplateChat: librettoParams?.templateChat ?? params.prompt,
      promptTemplateName,
      apiName: promptTemplateName,
      prompt: {},
      chatId: librettoParams?.chatId,
      chainId: librettoParams?.chainId,
      feedbackKey,
      modelParameters,
      tools: toolDefs,
      toolCalls: returnValue.toolCalls,
      source: "vercel-ai",
    }).catch((err) => {
      console.error("Error sending event to Libretto: ", err);
    });

    return returnValue;
  },
};

/**
 * Model ids can be entered in the format of "models/modelId" or just "modelId".
 */
function parseModelId(modelId: string) {
  if (modelId.includes("/")) {
    return modelId.split("/")[1];
  }
  return modelId;
}

function getTools(mode: LanguageModelV1CallOptions["mode"]) {
  if (mode.type === "regular") {
    return mode.tools;
  }
  if (mode.type === "object-tool") {
    return [mode.tool];
  }
  if (mode.type === "object-json") {
    console.warn(
      `The object-json tool type in Vercel AI SDK is not supported yet in Libretto. Consider using another format like zod.`,
    );
    // TODO, im not clear on the path of how to get here anyway
    return [];
  }

  return [];
}
