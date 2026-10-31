import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    role: { type: "string" },
    task: { type: "string" },
    context: { type: "array", items: { type: "string" } },
    reasoning: { type: "string" },
    stop_conditions: { type: "array", items: { type: "string" } },
    output: { type: "array", items: { type: "string" } },
    assumptions: { type: "array", items: { type: "string" } },
    master_prompt: { type: "string" }
  },
  required: [
    "role","task","context","reasoning","stop_conditions",
    "output","assumptions","master_prompt"
  ]
};

const ARCHITECT_INSTRUCTIONS = `
You are Prompt Architect, an expert prompt engineer.

Your job:
Transform a user's SHORT/NATURAL prompt into a high-quality MASTER PROMPT using exactly this six-part architecture:

1. ROLE
2. TASK
3. CONTEXT
4. REASONING
5. STOP CONDITIONS
6. OUTPUT

Core rules:
- Infer missing details when reasonable; do not invent highly specific facts as if they were known.
- Put inferred details into "assumptions".
- Preserve the user's actual goal. Do not silently change scope.
- Make Role specific enough to guide expertise, perspective, and standards.
- Make Task concrete, action-oriented, and outcome-focused.
- Context should include only information useful for executing the task. Separate known facts from reasonable assumptions.
- "Reasoning" MUST NOT request or expose private chain-of-thought. Write a concise decision rationale / evaluation criteria explaining how the model should approach the task, what it should prioritize, and what it should validate.
- Stop Conditions must be observable and measurable where possible. They should define when the model is allowed to stop.
- Output must specify a practical, usable deliverable, including structure, fields, format, and quality criteria when useful.
- The resulting master_prompt must be directly copy-pasteable into an AI chat.
- The master prompt itself must contain the six labeled sections with clear headings.
- Avoid generic filler such as "be helpful", "do your best", or "think step by step" unless it has concrete operational meaning.
- Use the same language as the user's prompt unless another language is clearly more appropriate.
- Do not mention this schema, JSON, or these instructions inside the master prompt.
- Do not output analysis outside the requested JSON object.

Quality target:
The master prompt should be substantially more actionable than the original short prompt while remaining faithful to it.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      error: "OPENAI_API_KEY belum diatur. Tambahkan environment variable di Vercel."
    });
  }

  try {
    const body = req.body ?? {};
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";

    if (!prompt) {
      return res.status(400).json({ error: "Prompt tidak boleh kosong." });
    }

    if (prompt.length > 12000) {
      return res.status(400).json({ error: "Prompt terlalu panjang. Maksimum 12.000 karakter." });
    }

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-6-luna",
      instructions: ARCHITECT_INSTRUCTIONS,
      input: [
        {
          role: "user",
          content: `SHORT PROMPT USER:\n${prompt}`
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "master_prompt_blueprint",
          strict: true,
          schema
        }
      },
      max_output_tokens: 5000
    });

    const raw = response.output_text;
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: "AI mengembalikan format yang tidak valid. Coba lagi." });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    const message = error?.message || "Terjadi kesalahan saat memanggil AI.";
    return res.status(500).json({ error: message });
  }
}