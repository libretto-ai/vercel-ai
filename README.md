# @libretto/vercel-ai

Libretto AI's Middleware package for integrating with [Vercel's AI SDK](https://ai-sdk.dev/). 

NOTE: Currently only the `generate` functionality is captured in Libretto, streaming is *not* supported in this current release.

## Installation

```bash
npm install @libretto/vercel-ai
```

## Usage

Vercel's documentation on [Language Model Middleware](https://ai-sdk.dev/docs/ai-sdk-core/middleware#language-model-middleware) contains the best documentation for using Middleware in general.

For capturing all requests in Libretto made through the Vercel AI SDK though, you can do the following:


```typescript
...
import { librettoMiddleware } from "@libretto/vercel-ai";
...

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
        name: "John",
        tone: "cheerful",
      },
    } satisfies LibrettoCreateOptions,
  },
});

```

`librettoOptions` is where you can set the usual Libretto settings. 

For all settings, you can see them here: [Lirbetto Core Create Options](https://github.com/libretto-ai/core-ts/blob/main/src/types.ts#L17)