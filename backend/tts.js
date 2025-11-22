import gTTS from 'gtts';
import fs from 'fs';

const text = "Hello, how are you?"; // Slovenian text
const speech = new gTTS(text, 'en');  // 'sl' = Slovenian

speech.save('output.mp3', function (err) {
    if (err) {
        console.error('Error generating audio:', err);
    } else {
        console.log('Audio saved as output.mp3');
    }
});
