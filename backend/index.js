const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { transcribeAudio } = require("./speech"); // Import your speech function

const fs = require('fs');


const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static('uploads'));


// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    const fs = require('fs');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});


const upload = multer({ storage: storage });
const materialUpload = multer({ storage: materialStorage });



// NEW: Speech transcription route
app.post("/api/transcribe", upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: 'No audio file uploaded' 
      });
    }

    console.log('Processing audio file:', req.file.filename);

    // Call your speech.js function
    const result = await transcribeAudio(req.file.path);

    // Clean up the uploaded file
    const fs = require('fs');
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Send response back to frontend
    res.json({
      success: result.success,
      transcription: result.transcription,
      confidence: result.confidence,
      error: result.error
    });

  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

  app.post('/api/upload-material', materialUpload.single('file'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    res.json({
      success: true,
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`
    });
  });

// NEW: Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running with speech functionality',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/health');
  console.log('  POST /api/transcribe');
});


