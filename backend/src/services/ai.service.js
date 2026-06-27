/**
 * Thin wrapper that tries Gemini first, falls back to OpenAI.
 * Both return { text: string }.
 */

async function callGemini(systemPrompt, userMessage) {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const chat = model.startChat({ history: [] });
  const result = await chat.sendMessage(`${systemPrompt}\n\n${userMessage}`);
  return { text: result.response.text() };
}

async function callOpenAI(systemPrompt, userMessage) {
  const OpenAI = require("openai");
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });
  return { text: completion.choices[0].message.content };
}

async function generateAIResponse(systemPrompt, userMessage) {
  if (process.env.GEMINI_API_KEY) return callGemini(systemPrompt, userMessage);
  if (process.env.OPENAI_API_KEY) return callOpenAI(systemPrompt, userMessage);
  throw new Error("No AI API key configured. Set GEMINI_API_KEY or OPENAI_API_KEY in .env");
}

module.exports = { generateAIResponse };
