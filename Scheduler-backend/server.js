import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

// ---------- CHECK ENV ----------
console.log(
  "OPENROUTER KEY LOADED:",
  process.env.OPENROUTER_API_KEY ? "YES" : "NO"
);

// ---------- CREATE APP (IMPORTANT) ----------
const app = express();
app.use(cors());
app.use(express.json());

// ---------- OPENROUTER CLIENT ----------
const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
   "HTTP-Referer": "https://scheduler-one-delta.vercel.app",
,
    "X-Title": "AI Scheduler App"
  }
});

// ---------- HEALTH CHECK ----------
app.get("/", (req, res) => {
  res.send("✅ AI Scheduler Backend is running");
});

// ---------- AI SCHEDULER ----------
app.get("/test", async (req, res) => {
  try {
    const response = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say hello" }]
    });

    res.json(response);
  } catch (err) {
    console.error("TEST ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


  

// ---------- START SERVER ----------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
