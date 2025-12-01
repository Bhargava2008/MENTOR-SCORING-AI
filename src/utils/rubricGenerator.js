const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Check if rubric file already exists
function rubricExists(roleSlug) {
  return fs.existsSync(path.join(__dirname, `../rubrics/${roleSlug}.json`));
}

// Load rubric JSON
function loadRubric(roleSlug) {
  const file = path.join(__dirname, `../rubrics/${roleSlug}.json`);
  const data = fs.readFileSync(file, "utf-8");
  return JSON.parse(data);
}

// Save generated rubric
function saveRubric(roleSlug, data) {
  fs.writeFileSync(
    path.join(__dirname, `../rubrics/${roleSlug}.json`),
    JSON.stringify(data, null, 2)
  );
}

// Generate rubric using GROQ LLM
async function generateRubric(role) {
  const prompt = `
Generate a detailed teacher-evaluation rubric for the role: "${role}".
Output ONLY valid JSON. No text outside JSON.

The JSON must follow this exact structure:

{
  "dimensions": [
    {
      "name": "Concept Clarity",
      "weight": 0.25,
      "description": "How clearly the teacher explains concepts.",
      "examplesOfGood": "Uses simple definitions; explains with examples.",
      "examplesOfBad": "Confusing explanations; jumps between ideas."
    },
    {
      "name": "Delivery & Communication",
      "weight": 0.25,
      "description": "Voice clarity, pace, energy, engagement.",
      "examplesOfGood": "Clear voice, varied tone, steady pace.",
      "examplesOfBad": "Monotone voice, too fast, too many fillers."
    },
    {
      "name": "Content Structure",
      "weight": 0.20,
      "description": "Flow of explanation: intro → concept → example → summary.",
      "examplesOfGood": "Follows logical order with transitions.",
      "examplesOfBad": "Random jumping; no proper sequence."
    },
    {
      "name": "Student Engagement",
      "weight": 0.15,
      "description": "Interaction, questions asked, examples used.",
      "examplesOfGood": "Asks questions and checks understanding.",
      "examplesOfBad": "One-way explanation; no learner involvement."
    },
    {
      "name": "Accuracy",
      "weight": 0.15,
      "description": "Correctness of information delivered.",
      "examplesOfGood": "No factual mistakes.",
      "examplesOfBad": "Wrong formulas, incorrect definitions."
    }
  ]
}
`;

  const response = await groq.chat.completions.create({
    model: "groq/compound-mini", // FAST + FREE for rubric generation
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
    max_tokens: 800,
  });

  return response.choices[0].message.content;
}

// MAIN FUNCTION to use in scoring controller
exports.getRubricForRole = async (role) => {
  const roleSlug = role.toLowerCase().replace(/\s+/g, "-");

  // If already exists → load
  if (rubricExists(roleSlug)) {
    return loadRubric(roleSlug);
  }

  console.log("Rubric missing → generating new rubric for:", role);

  // Generate using Groq
  const raw = await generateRubric(role);
  const json = JSON.parse(raw);

  // Save for future use
  saveRubric(roleSlug, json);

  return json;
};
