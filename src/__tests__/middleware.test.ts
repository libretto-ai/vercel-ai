import { LanguageModelV1Prompt } from "ai";
import {
  modifyPromptForChatHistory,
  parseModelId,
  standardizeChatHistory,
} from "../middleware";

describe("parseModelId", () => {
  it("should return the model ID when it contains a slash", () => {
    expect(parseModelId("models/gpt-4")).toBe("gpt-4");
    expect(parseModelId("openai/gpt-3.5-turbo")).toBe("gpt-3.5-turbo");
  });

  it("should return the model ID unchanged when it does not contain a slash", () => {
    expect(parseModelId("gpt-4")).toBe("gpt-4");
    expect(parseModelId("claude-3")).toBe("claude-3");
  });
});

describe("modifyPromptForChatHistory", () => {
  it("should modify messages with isChatHistory flag", () => {
    const prompt: LanguageModelV1Prompt = [
      {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
        providerMetadata: {
          librettoOptions: {
            isChatHistory: true,
          },
        },
      },
      {
        role: "assistant",
        content: [{ type: "text", text: "Hi there" }],
        providerMetadata: {
          librettoOptions: {
            isChatHistory: false,
          },
        },
      },
    ];

    const { modifiedPrompt, hasChatHistory } =
      modifyPromptForChatHistory(prompt);

    expect(hasChatHistory).toBe(true);
    expect(modifiedPrompt[0].role).toBe("chat_history");
    expect(modifiedPrompt[1].role).toBe("assistant");
  });

  it("should not modify messages without isChatHistory flag", () => {
    const prompt: LanguageModelV1Prompt = [
      {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      },
      {
        role: "assistant",
        content: [{ type: "text", text: "Hi there" }],
      },
    ];

    const { modifiedPrompt, hasChatHistory } =
      modifyPromptForChatHistory(prompt);

    expect(hasChatHistory).toBe(false);
    expect(modifiedPrompt[0].role).toBe("user");
    expect(modifiedPrompt[1].role).toBe("assistant");
  });
});

describe("standardizeChatHistory", () => {
  it("should standardize messages with string content", () => {
    const messages = [
      {
        role: "user",
        content: "Hello",
      },
      {
        role: "assistant",
        content: "Hi there",
      },
    ];

    const standardized = standardizeChatHistory(messages);

    expect(standardized[0].content).toEqual([{ type: "text", text: "Hello" }]);
    expect(standardized[1].content).toEqual([
      { type: "text", text: "Hi there" },
    ]);
  });

  it("should not modify system messages", () => {
    const messages = [
      {
        role: "system",
        content: "You are a helpful assistant",
      },
    ];

    const standardized = standardizeChatHistory(messages);

    expect(standardized[0].content).toBe("You are a helpful assistant");
  });

  it("should not modify messages with array content", () => {
    const messages = [
      {
        role: "user",
        content: [{ type: "text", text: "Hello" }],
      },
    ];

    const standardized = standardizeChatHistory(messages);

    expect(standardized[0].content).toEqual([{ type: "text", text: "Hello" }]);
  });
});
