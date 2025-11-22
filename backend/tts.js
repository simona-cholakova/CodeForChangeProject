import gTTS from 'gtts';
import fs from 'fs';
import path from 'path';

const text = "Hello, how are you?"; 
const speech = new gTTS(text, 'en');  

const folder = path.join('.', 'audios'); 
if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
}

const filePath = path.join(folder, `tts_${Date.now()}.mp3`);

speech.save(filePath, function (err) {
    if (err) {
        console.error('Error generating audio:', err);
    } else {
        console.log('Audio saved as', filePath);
    }
});
