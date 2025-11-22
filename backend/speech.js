const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');

process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, 'key.json');

async function transcribeAudio(audioFilePath) {
    try {
        if (!fs.existsSync(audioFilePath)) {
            throw new Error(`Audio file not found: ${audioFilePath}`);
        }

        const client = new speech.SpeechClient();
        const audioBytes = fs.readFileSync(audioFilePath).toString('base64');

        console.log('Processing WebM file with 48kHz configuration...');

        // Use 48000 Hz to match the WebM file
        const request = {
            audio: {
                content: audioBytes,
            },
            config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000, // Match the actual WebM sample rate
                languageCode: 'en-US',
                enableAutomaticPunctuation: true,
                model: 'default',
                audioChannelCount: 1, // Force mono
            },
        };

        console.log('Sending to Google Speech-to-Text...');
        
        const [response] = await client.recognize(request);
        
        if (!response.results || response.results.length === 0) {
            return {
                success: false,
                error: 'No speech detected in the audio file',
                transcription: '',
                confidence: 0
            };
        }

        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        const confidence = response.results[0].alternatives[0].confidence;

        console.log('Transcription completed successfully');
        
        return {
            success: true,
            transcription: transcription,
            confidence: confidence
        };

    } catch (error) {
        console.error('ERROR in transcribeAudio:', error);
        return {
            success: false,
            error: error.message,
            transcription: '',
            confidence: 0
        };
    }
}

module.exports = { transcribeAudio };