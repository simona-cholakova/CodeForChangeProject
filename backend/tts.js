import gTTS from 'gtts';
import fs from 'fs';
import path from 'path';

const inputFile = './texts/example.json';
const folder = './audios';

if (!fs.existsSync(folder)) fs.mkdirSync(folder);

function extractTextFromJSON(jsonData) {
    let text = '';

    function recurse(obj) {
        if (typeof obj === 'string') {
            text += obj + ' ';
        } else if (Array.isArray(obj)) {
            obj.forEach(recurse);
        } else if (typeof obj === 'object' && obj !== null) {
            Object.values(obj).forEach(recurse);
        }
    }

    recurse(jsonData);
    return text.trim();
}

try {
    const rawData = fs.readFileSync(inputFile, 'utf-8');
    const jsonData = JSON.parse(rawData);

    const text = extractTextFromJSON(jsonData);

    if (!text) {
        console.error('No text found in JSON.');
        process.exit(1);
    }

    const audioPath = path.join(folder, `tts_${Date.now()}.mp3`);
    const speech = new gTTS(text, 'en'); // change 'en' to another language if needed
    speech.save(audioPath, (err) => {
        if (err) console.error('Error generating audio:', err);
        else console.log('Audio saved as', audioPath);
    });

} catch (err) {
    console.error('Error reading JSON file:', err);
}
