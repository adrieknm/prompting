
const SCHEMA = {
  type: "OBJECT",
  properties: {
    role: { type: "STRING" },
    task: { type: "STRING" },
    context: { type: "ARRAY", items: { type: "STRING" } },
    reasoning: { type: "STRING" },
    stop_conditions: { type: "ARRAY", items: { type: "STRING" } },
    output: { type: "ARRAY", items: { type: "STRING" } },
    assumptions: { type: "ARRAY", items: { type: "STRING" } },
    master_prompt: { type: "STRING" }
  },
  required: [
    "role", "task", "context", "reasoning",
    "stop_conditions", "output", "assumptions", "master_prompt"
  ],
  propertyOrdering: [
    "role", "task", "context", "reasoning",
    "stop_conditions", "output", "assumptions", "master_prompt"
  ]
};

const INSTRUCTIONS = `
You are Prompt Architect, an expert prompt engineer.

Transform the user's short prompt into a copy-paste-ready MASTER PROMPT.

Use exactly six sections:
1. ROLE
2. TASK
3. CONTEXT
4. REASONING
5. STOP CONDITIONS
6. OUTPUT

Rules:
- Preserve the user's actual goal.
- Make every section specific and actionable.
- Infer reasonable missing details, but never invent facts.
- Put inferred details in assumptions.
- Reasoning means concise decision criteria, NOT private chain-of-thought.
- Stop Conditions must define observable completion criteria.
- Output must specify useful deliverables and format.
- Use the same language as the user's prompt.
- Avoid generic filler.
- master_prompt must contain all six labeled sections.
`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY belum diatur di Vercel."
    });
  }

  try {
    const prompt = typeof req.body?.prompt === "string"
      ? req.body.prompt.trim()
      : "";

    if (!prompt) {
      return res.status(400).json({
        error: "Prompt tidak boleh kosong."
      });
    }

    if (prompt.length > 12000) {
      return res.status(400).json({
        error: "Prompt terlalu panjang. Maksimum 12.000 karakter."
      });
    }

    const model = process.env.GEMINI_MODEL || "gemini-3.8-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: INSTRUCTIONS }]
          },
          contents: [{
            role: "user",
            parts: [{ text: `SHORT PROMPT USER:\n${prompt}` }]
          }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: SCHEMA,
            maxOutputTokens: 5000,
            temperature: 0.7
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Gemini API gagal memproses permintaan."
      });
    }

    const resultText =
      data.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("");

    if (!resultText) {
      return res.status(502).json({
        error: "Gemini tidak menghasilkan jawaban. Coba lagi."
      });
    }

    const result = JSON.parse(resultText);

    return res.status(200).json(result);

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Terjadi kesalahan pada server."
    });
  }
}
