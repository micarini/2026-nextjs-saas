// Thin wrapper around the Gemini REST API — no SDK, same `fetch`-based
// style already used for Google Books / Open Library in this project.
//
// Requires GEMINI_API_KEY in the environment. Get one at
// https://aistudio.google.com/apikey (free tier is enough for this).
// GEMINI_MODEL is optional and overrides the default model below.

// Bump this if Google retires the model again — the API's error message
// names the current recommended replacement when that happens.
const DEFAULT_GEMINI_MODEL = "gemini-3.6-flash";

function geminiUrl() {
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
}

async function callGemini(apiKey, { prompt, schema, system, temperature }) {
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  };

  if (system) {
    body.systemInstruction = { parts: [{ text: system }] };
  }

  if (typeof temperature === "number") {
    body.generationConfig.temperature = temperature;
  }

  const response = await fetch(geminiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Header instead of ?key= so the key never ends up in URL logs.
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const error = new Error(`Gemini API error ${response.status}: ${detail.slice(0, 300)}`);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned no content.");
  }

  return JSON.parse(text);
}

export function isGeminiConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

// Asks Gemini for a single JSON object matching `schema` (Gemini's
// structured-output mode), for a given `prompt` and optional `system`
// instruction. Throws on any failure — callers decide the fallback, this
// module never silently degrades.
//
// One retry on 503 (the model reporting transient overload) — seen often
// enough in practice to be worth a single short wait before giving up.
// 429 (free-tier rate limit) is NOT retried: the caller falls back instead.
export async function generateJSON({ prompt, schema, system, temperature }) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const options = { prompt, schema, system, temperature };

  try {
    return await callGemini(apiKey, options);
  } catch (error) {
    if (error.status !== 503) {
      throw error;
    }

    await new Promise((resolve) => setTimeout(resolve, 600));
    return callGemini(apiKey, options);
  }
}
