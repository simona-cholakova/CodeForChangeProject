const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');

// Set Google credentials
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.join(__dirname, 'key.json');

async function transcribeAudio(audioFilePath) {
    try {
        // Check if file exists
        if (!fs.existsSync(audioFilePath)) {
            throw new Error(`Audio file not found: ${audioFilePath}`);
        }

        // Initialize Google Speech client
        const client = new speech.SpeechClient();

        // Read audio file
        const audioBytes = fs.readFileSync(audioFilePath).toString('base64');

        // Configure the request
        const request = {
            audio: {
                content: audioBytes,
            },
            config: {
                encoding: 'WEBM_OPUS', // Adjust based on your audio format
                sampleRateHertz: 48000,
                languageCode: 'en-US',
                enableAutomaticPunctuation: true,
            },
        };

        console.log('Sending to Google Speech-to-Text...');
        
        // Detect speech
        const [response] = await client.recognize(request);
        
        // Process the response
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