const fs = require("fs");
const { cosineSimilarity, getEmbeddingPlaceholder } = require("./utils");
const FILE = "./outputs.json";
const SIMILARITY_THRESHOLD = 0.85;

// Load outputs
function loadOutputs() {
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "{}");
  return JSON.parse(fs.readFileSync(FILE, "utf-8"));
}

// Save outputs
function saveOutputs(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

// Add a new prompt + response
function addPrompt(userId, prompt, response, embedding = null) {
  const data = loadOutputs();
  if (!data[userId]) data[userId] = [];
  data[userId].push({
    prompt,
    response,
    embedding,
    dateTime: new Date().toISOString()
  });
  saveOutputs(data);
}

// Find similar prompt for user
function findSimilar(userId, prompt, embedding = null) {
  const data = loadOutputs();
  const outputs = data[userId] || [];

  for (const item of outputs) {
    if (item.embedding && embedding) {
      const sim = cosineSimilarity(embedding, item.embedding);
      if (sim >= SIMILARITY_THRESHOLD) return item.response;
    } else {
      if (item.prompt.trim().toLowerCase() === prompt.trim().toLowerCase()) {
        return item.response;
      }
    }
  }

  return null;
}

module.exports = { addPrompt, findSimilar };
