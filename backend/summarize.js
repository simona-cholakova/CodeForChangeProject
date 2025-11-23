const fs = require("fs");
const path = require("path");
const { GoogleGenAI, createUserContent, createPartFromUri } = require("@google/genai");

const ai = new GoogleGenAI({});

const allowedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".txt", ".json"];

const LECTURE_DIR = path.join(__dirname, "uploads");

/**
 * Try to extract a filename-like keyword from the user message.
 * Examples:
 *  "summarize lecture 5"  → "lecture5"
 *  "summary for Algorithms_final" → "algorithms_final"
 *  "summarize chapter3.pdf" → "chapter3"
 */
function extractFilename(userMessage) {
  // Normalize
  const text = userMessage.toLowerCase();

  // Try exact filename with extension
  const extRegex = /(lecture\d+|[\w-]+)\.(pdf|png|jpg|jpeg|txt|json)/i;
  const extMatch = userMessage.match(extRegex);
  if (extMatch) {
    return extMatch[1]; // remove extension
  }

  // Try “lecture 5”
  const lectureRegex = /lecture\s*(\d+)/i;
  const lectureMatch = text.match(lectureRegex);
  if (lectureMatch) {
    return `lecture${lectureMatch[1]}`;
  }

  // Try any standalone word that resembles a filename
  const wordMatch = text.match(/([a-zA-Z0-9_-]+)/);
  if (wordMatch) {
    return wordMatch[1];
  }

  return null;
}

function findFile(baseName) {
  const files = fs.readdirSync(LECTURE_DIR);

  for (const file of files) {
    const fileLower = file.toLowerCase();
    const ext = path.extname(fileLower);

    if (!allowedExtensions.includes(ext)) continue;

    // Match prefix or exact filename
    if (
      fileLower.startsWith(baseName.toLowerCase()) ||
      fileLower.includes(baseName.toLowerCase())
    ) {
      return path.join(LECTURE_DIR, file);
    }
  }

  return null;
}

async function summarizeFile(userMessage) {
  try {
    // Extract file name from text
    const baseName = extractFilename(userMessage);

    if (!baseName) {
      return { success: false, error: "Could not detect filename from your message." };
    }

    const foundFile = findFile(baseName);

    if (!foundFile) {
      return { success: false, error: `No file found matching '${baseName}'.` };
    }

    const ext = path.extname(foundFile).toLowerCase();
    let mimeType;

    if (ext === ".pdf") mimeType = "application/pdf";
    else if (ext === ".txt") mimeType = "text/plain";
    else if (ext === ".png") mimeType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
    else mimeType = "application/octet-stream";

    // Upload file to Gemini
    const uploaded = await ai.files.upload({
      file: foundFile,
      config: { mimeType }
    });

    // Ask Gemini for summary (good JSON format)
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: createUserContent([
        createPartFromUri(uploaded.uri, uploaded.mimeType),
        `
        Summarize the content in structured JSON:

        {
          "file": "${path.basename(foundFile)}",
          "title": "Short descriptive title",
          "summary": "5–8 sentence summary",
          "key_points": ["point1", "point2", "point3", ...],
          "important_terms": ["term1", "term2", "term3"]
        }
        `
      ])
    });

    return { success: true, summary: response.text };

  } catch (error) {
    console.error("SUMMARY ERROR:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { summarizeFile };
