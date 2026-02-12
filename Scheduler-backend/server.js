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
app.post("/ai-schedule", async (req, res) => {
  try {
    const { activities, startTime, endTime } = req.body;

    if (!activities || !startTime || !endTime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ---- VALIDATION STEP ----
    const validationPrompt = `
You are an intelligent daily scheduling assistant.

Each activity contains:
- "title": what the task is
- "info": user-provided context (duration, urgency, preferred time, energy level, constraints)

You MUST actively use the "info" field to make scheduling decisions.

Rules:
- Start at ${startTime}
- End by ${endTime}
- Respect duration hints in info (e.g. "2 hours", "30 minutes")
- Respect time preferences in info (morning, evening, after lunch, etc.)
- High-focus tasks (coding, studying) → earlier in the day
- Physical activities → morning or late afternoon
- Light / relaxing tasks → evening
- Insert breaks after long or intense tasks
- Be realistic and human-friendly

IMPORTANT:
- Use BOTH title and info to decide placement
- Preserve the original info in the output
- Return ONLY raw JSON
- No markdown
- No backticks
- No explanations

Activities:
${JSON.stringify(activities)}

Return format:
[
  { "title": "string", "info": "string", "valid": true | false }
]
`;

    const validationRes = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: validationPrompt }],
      temperature: 0
    });

    const validated = JSON.parse(
      validationRes.choices[0].message.content
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim()
    );

    const validActivities = validated.filter(a => a.valid);

    if (validActivities.length === 0) {
      return res.json([]);
    }

    // ---- SCHEDULING STEP ----
    const schedulePrompt = `
Create a realistic daily schedule.

Start: ${startTime}
End: ${endTime}

Return ONLY JSON.

Activities:
${JSON.stringify(validActivities)}

Format:
[
  {
    "day": 1,
    "start": "09:00",
    "end": "10:00",
    "task": "Task name",
    "info": "Extra details",
    "reason": "Why placed here"
  }
]
`;

    const scheduleRes = await openai.chat.completions.create({
     model: "openai/gpt-3.5-turbo",

      messages: [{ role: "user", content: schedulePrompt }],
      temperature: 0.3
    });

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
