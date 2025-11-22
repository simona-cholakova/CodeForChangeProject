import express from 'express';
import { textToSpeech } from '../tts.js';

const router = express.Router();

router.post('/tts', textToSpeech);

export default router;