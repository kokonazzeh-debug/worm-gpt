import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8787);
const HF_BASE = "https://router.huggingface.co/v1";
const HF_TOKEN = process.env.HF_TOKEN?.trim();
const allowedOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

if (!HF_TOKEN) {
  console.warn("[NAZZEH AI] HF_TOKEN is missing. Add it to backend/.env before starting.");
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin not allowed"));
  }
}));
app.use(express.json({ limit: "15mb" }));

function hfHeaders() {
  return {
    "Authorization": `Bearer ${HF_TOKEN}`,
    "Content-Type": "application/json"
  };
}

function requireToken(res) {
  if (!HF_TOKEN) {
    res.status(500).json({
      error: "HF_TOKEN is not configured on the backend.",
      setup: "Open setup.html and follow the Hugging Face token steps."
    });
    return false;
  }
  return true;
}

app.get("/", (_req, res) => {
  res.json({ name: "NAZZEH AI Backend", status: "online" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(HF_TOKEN) });
});

let modelCache = { at: 0, data: [] };
const CACHE_MS = 5 * 60 * 1000;

app.get("/api/models", async (_req, res) => {
  if (!requireToken(res)) return;
  if (Date.now() - modelCache.at < CACHE_MS && modelCache.data.length) {
    return res.json({ data: modelCache.data, cached: true });
  }

  try {
    const r = await fetch(`${HF_BASE}/models`, { headers: hfHeaders() });
    const raw = await r.text();
    if (!r.ok) return res.status(r.status).send(raw);

    const json = JSON.parse(raw);
    const models = Array.isArray(json.data) ? json.data : [];
    const cleaned = models.map(m => {
      const providers = Array.isArray(m.providers) ? m.providers : [];
      const live = providers.filter(p => p.status === "live");
      const imageInput = m.architecture?.input_modalities?.includes("image") ||
        providers.some(p => p.input_modalities?.includes?.("image"));
      const isFreeNow = providers.some(p => p.is_free === true);
      return {
        id: m.id,
        inputModalities: m.architecture?.input_modalities || [],
        outputModalities: m.architecture?.output_modalities || [],
        supportsImage: Boolean(imageInput),
        freeNow: Boolean(isFreeNow),
        providers: live.map(p => p.provider).slice(0, 6),
        contextLength: Math.max(0, ...live.map(p => Number(p.context_length || 0)))
      };
    }).filter(m => m.id);

    // Keep the UI fast while still exposing a large model catalog.
    cleaned.sort((a, b) => (Number(b.supportsImage) - Number(a.supportsImage)) || a.id.localeCompare(b.id));
    modelCache = { at: Date.now(), data: cleaned.slice(0, 150) };
    return res.json({ data: modelCache.data, cached: false });
  } catch (err) {
    return res.status(502).json({ error: "Could not load Hugging Face models.", details: err.message });
  }
});

app.post("/api/chat", async (req, res) => {
  if (!requireToken(res)) return;
  const { model, messages, max_tokens = 2048, temperature = 0.7, stream = false } = req.body || {};
  if (!model || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "model and messages are required" });
  }
  if (stream) {
    return res.status(400).json({ error: "Streaming is not enabled in this starter build." });
  }

  try {
    const r = await fetch(`${HF_BASE}/chat/completions`, {
      method: "POST",
      headers: hfHeaders(),
      body: JSON.stringify({
        model,
        messages,
        max_tokens: Math.min(Number(max_tokens) || 2048, 8192),
        temperature: Math.min(Math.max(Number(temperature) || 0.7, 0), 2)
      })
    });
    const raw = await r.text();
    res.status(r.status).type("application/json").send(raw);
  } catch (err) {
    res.status(502).json({ error: "Hugging Face request failed.", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[NAZZEH AI] Backend running on http://localhost:${PORT}`);
});
