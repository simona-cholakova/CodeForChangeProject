import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import path from 'path';
import fs from 'fs';

const ai = new GoogleGenAI({});

async function main() {
  var file_path = "data/img_and_pdf/1Predavanja IPP-2.pdf";
  const mimeType = getMimeType(file_path);

  const myfile = await ai.files.upload({
    file: file_path,
    config: { mimeType: mimeType },
  });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: createUserContent([
      createPartFromUri(myfile.uri, myfile.mimeType),
      "Provide a summary for this document, provide the output as json text. As one of the fields put a title, with the title of the lecture/contents and a current date and time field.",
    ]),
  });
  
  WriteOutputToFile(response.text.replaceAll("`", "").replace("json", ""));
}

function WriteOutputToFile(txt){
  fs.writeFile("responses/testFile.json", txt, err => {
    if (err){
      console.err(err);
    } else{
      console.log("[+] File Written!");
    }
  });
}

function getMimeType(url) {
  const ext = path.extname(url).toLowerCase();
  const mimeTypes = {
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.doc': 'application/msword',
    '.pdf': 'application/pdf',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.png': 'image/png', '.txt': 'text/plain'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

await main();