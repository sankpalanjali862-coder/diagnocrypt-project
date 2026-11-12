require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
// PROVIDER = "gemini" (free tier, default) or "claude" (paid)
const PROVIDER = (process.env.PROVIDER || "gemini").toLowerCase();
const KEYS = { gemini: process.env.GEMINI_API_KEY, claude: process.env.ANTHROPIC_API_KEY };
const MODEL =
  process.env.MODEL || (PROVIDER === "claude" ? "claude-sonnet-5-5" : "gemini-2.5-flash");

if (!KEYS[PROVIDER]) {
  console.error(
    PROVIDER === "claude"
      ? "Missing ANTHROPIC_API_KEY in .env"
      : "Missing GEMINI_API_KEY in .env (get a free key at https://aistudio.google.com/apikey)"
  );
  process.exit(1);
}

async function generate(prompt) {
  if (PROVIDER === "claude") {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KEYS.claude, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
    });
    const d = await r.json();
    if (!r.ok) throw { status: r.status, d };
    return (d.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  }
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
    {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": KEYS.gemini },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1000 },
      }),
    }
  );
  const d = await r.json();
  if (!r.ok) throw { status: r.status, d };
  const parts = (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || [];
  return parts.map((p) => p.text || "").join("\n");
}

app.use(express.json({ limit: "100kb" }));
app.use(express.static(path.join(__dirname, "public")));

// Simple per-IP rate limit (30 requests / minute) to protect your API key
const hits = new Map();
app.use("/api/", (req, res, next) => {
  const now = Date.now();
  const arr = (hits.get(req.ip) || []).filter((t) => now - t < 60000);
  if (arr.length >= 30) return res.status(429).json({ error: "Too many requests" });
  arr.push(now);
  hits.set(req.ip, arr);
  next();
});

app.post("/api/chat", async (req, res) => {
  const prompt = req.body && req.body.prompt;
  if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 20000) {
    return res.status(400).json({ error: "Invalid prompt" });
  }
  try {
    const text = await generate(prompt);
    res.json({ text: text || "Sorry, I couldn't produce an answer. Please try again." });
  } catch (e) {
    console.error("AI error:", e.status || "", JSON.stringify(e.d || e));
    res.status(e.status === 429 ? 429 : 502).json({ error: "AI request failed" });
  }
});

app.listen(PORT, () => console.log(`DiagnoCrypt running at http://localhost:${PORT} (provider: ${PROVIDER}, model: ${MODEL})`));
