import { getTutorApiKey, getTutorCodeModel } from "../../hooks/useTutorApiSettings";
import type {
  TutorChatMessage,
  TutorGuidanceResponse,
  TutorPatchResponse,
  TutorStructuredEditResponse,
  TutorToolAssistantMessage,
  TutorToolChatMessage,
  TutorToolDefinition,
} from "./types";
import { logTutorEvent } from "./tutorDebugLogger";

const OPENAI_MODEL = "gpt-4.1-nano";
const TOOL_LOOP_MAX_TOKENS = 6000;
const EDIT_SESSION_MAX_TOKENS = 6000;
const MAX_RATE_LIMIT_RETRIES = 3;

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function getRetryDelayMs(response: Response, body: string) {
  const retryAfter = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return retryAfter * 1000;
  }

  const secondsMatch = body.match(/try again in ([\d.]+)s/i);
  const seconds = Number(secondsMatch?.[1]);
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds * 1000;
  }

  const millisecondsMatch = body.match(/try again in ([\d.]+)ms/i);
  const milliseconds = Number(millisecondsMatch?.[1]);
  return Number.isFinite(milliseconds) && milliseconds > 0 ? milliseconds : 0;
}

export interface TutorProvider {
  request(messages: TutorChatMessage[]): Promise<TutorPatchResponse | null>;
}

export interface TutorToolProvider {
  requestToolStep(
    messages: TutorToolChatMessage[],
    tools: TutorToolDefinition[],
  ): Promise<TutorToolAssistantMessage | null>;
}

export interface TutorStructuredEditProvider {
  requestStructuredEdit(messages: TutorChatMessage[]): Promise<TutorStructuredEditResponse | null>;
}

export interface TutorGuidanceProvider {
  requestGuidance(messages: TutorChatMessage[]): Promise<TutorGuidanceResponse | null>;
}

async function requestChatCompletionJson<T>({
  messages,
  maxTokens,
  temperature,
  logPrefix,
}: {
  messages: TutorChatMessage[];
  maxTokens: number;
  temperature: number;
  logPrefix: string;
}): Promise<T | null> {
  const apiKey = getTutorApiKey().trim();
  if (!apiKey) {
    logTutorEvent(`${logPrefix} skipped: no API key`, undefined, "warn");
    return null;
  }
  const model = getTutorCodeModel().trim() || "gpt-4.1";

  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    logTutorEvent(`${logPrefix} OpenAI request started`, {
      model,
      attempt: attempt + 1,
      messageCount: messages.length,
      maxTokens,
    });
    console.info(`[${logPrefix}] OpenAI request: ${JSON.stringify({
      model,
      attempt: attempt + 1,
      messages: messages.length,
      maxTokens,
    })}`);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        temperature,
        max_tokens: maxTokens,
        messages,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      const retryDelayMs = response.status === 429 ? getRetryDelayMs(response, body) : 0;
      logTutorEvent(`${logPrefix} OpenAI request failed`, {
        status: response.status,
        retryDelayMs,
        bodyPreview: body.slice(0, 1000),
      }, "error");
      console.error(`[${logPrefix}] OpenAI request failed: ${JSON.stringify({
        status: response.status,
        retryDelayMs,
        body,
      })}`);

      if (response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES && retryDelayMs > 0) {
        await delay(Math.min(retryDelayMs + 500, 25000));
        continue;
      }

      throw new Error(`${logPrefix} provider failed with ${response.status}: ${body}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error(`${logPrefix} provider returned an empty response.`);
    }

    logTutorEvent(`${logPrefix} OpenAI response received`, {
      attempt: attempt + 1,
      contentLength: content.length,
    });
    return JSON.parse(content) as T;
  }

  throw new Error(`${logPrefix} provider exhausted retry attempts.`);
}

export class OpenAiTutorProvider implements TutorProvider, TutorStructuredEditProvider, TutorGuidanceProvider {
  async request(messages: TutorChatMessage[]) {
    const apiKey = getTutorApiKey().trim();
    if (!apiKey) {
      logTutorEvent("legacy tutor provider skipped: no API key", undefined, "warn");
      return null;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 6000,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tutor provider failed with ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      throw new Error("Tutor provider returned an empty response.");
    }

    return JSON.parse(content) as TutorPatchResponse;
  }

  async requestStructuredEdit(messages: TutorChatMessage[]) {
    return requestChatCompletionJson<TutorStructuredEditResponse>({
      messages,
      maxTokens: EDIT_SESSION_MAX_TOKENS,
      temperature: 0.1,
      logPrefix: "TutorEditSession",
    });
  }

  async requestGuidance(messages: TutorChatMessage[]) {
    return requestChatCompletionJson<TutorGuidanceResponse>({
      messages,
      maxTokens: 1000,
      temperature: 0.2,
      logPrefix: "TutorGuidance",
    });
  }
}

export class OpenAiTutorToolProvider implements TutorToolProvider {
  async requestToolStep(messages: TutorToolChatMessage[], tools: TutorToolDefinition[]) {
    const apiKey = getTutorApiKey().trim();
    if (!apiKey) {
      logTutorEvent("TutorToolLoop skipped: no API key", undefined, "warn");
      return null;
    }
    const model = getTutorCodeModel().trim() || "gpt-4.1";

    for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
      logTutorEvent("TutorToolLoop OpenAI request started", {
        model,
        attempt: attempt + 1,
        messageCount: messages.length,
        tools: tools.map((tool) => tool.function.name),
      });
      console.info(`[TutorToolLoop] OpenAI request: ${JSON.stringify({
        model,
        attempt: attempt + 1,
        messages: messages.length,
        tools: tools.map((tool) => tool.function.name),
      })}`);

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.1,
          max_tokens: TOOL_LOOP_MAX_TOKENS,
          messages,
          tools,
          tool_choice: "auto",
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        const retryDelayMs = response.status === 429 ? getRetryDelayMs(response, body) : 0;
        logTutorEvent("TutorToolLoop OpenAI request failed", {
          status: response.status,
          retryDelayMs,
          bodyPreview: body.slice(0, 1000),
        }, "error");
        console.error(`[TutorToolLoop] OpenAI request failed: ${JSON.stringify({
          status: response.status,
          retryDelayMs,
          body,
        })}`);

        if (response.status === 429 && attempt < MAX_RATE_LIMIT_RETRIES && retryDelayMs > 0) {
          await delay(Math.min(retryDelayMs + 500, 25000));
          continue;
        }

        throw new Error(`Tutor tool provider failed with ${response.status}: ${body}`);
      }

      const data = await response.json();
      const message = data?.choices?.[0]?.message;
      if (!message) {
        throw new Error("Tutor tool provider returned an empty response.");
      }

      console.info(`[TutorToolLoop] OpenAI response: ${JSON.stringify({
        finishReason: data?.choices?.[0]?.finish_reason,
        toolCalls: Array.isArray(message.tool_calls)
          ? message.tool_calls.map((toolCall: { function?: { name?: string } }) => toolCall.function?.name)
          : [],
        contentLength: typeof message.content === "string" ? message.content.length : 0,
      })}`);
      logTutorEvent("TutorToolLoop OpenAI response received", {
        finishReason: data?.choices?.[0]?.finish_reason,
        toolCalls: Array.isArray(message.tool_calls)
          ? message.tool_calls.map((toolCall: { function?: { name?: string } }) => toolCall.function?.name)
          : [],
        contentLength: typeof message.content === "string" ? message.content.length : 0,
      });

      return {
        role: "assistant",
        content: typeof message.content === "string" ? message.content : null,
        tool_calls: Array.isArray(message.tool_calls) ? message.tool_calls : undefined,
      } satisfies TutorToolAssistantMessage;
    }

    throw new Error("Tutor tool provider exhausted retry attempts.");
  }
}

export const openAiTutorProvider = new OpenAiTutorProvider();
export const openAiTutorToolProvider = new OpenAiTutorToolProvider();
