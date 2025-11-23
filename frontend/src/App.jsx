import { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  const [recordingStatus, setRecordingStatus] = useState("stopped");
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const [isFileUploading, setIsFileUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [folderName, setFolderName] = useState("");
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null); // New ref for folder input

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (!isInputFocused()) {
        if ((event.key === 'S' || event.key === 's')) {
          event.preventDefault();
          handleRecordButtonClick();
        } else if ((event.key === 'U' || event.key === 'u')) {
          event.preventDefault();
          handleUploadShortcut();
        } else if ((event.key === 'F' || event.key === 'f')) {
          event.preventDefault();
          handleFolderShortcut();
        }
      }
    };

    const isInputFocused = () => {
      const activeElement = document.activeElement;
      return (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.isContentEditable
      );
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [recordingStatus, isUploading, selectedFile]);

  const handleUploadShortcut = () => {
    if (selectedFile) {
      handleFileUpload();
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFolderShortcut = () => {
    // Focus on the folder input and select all text
    if (folderInputRef.current) {
      folderInputRef.current.focus();
      folderInputRef.current.select();
      speak("Folder name input selected");
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice =>
        voice.lang.includes('en') && voice.name.includes('Female')
      );
      if (englishVoice) {
        utterance.voice = englishVoice;
      }

      window.speechSynthesis.speak(utterance);
    } else {
      console.log("Text-to-speech not supported in this browser");
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm; codecs=opus",
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        sendToBackend(audioBlob);
      };

      mediaRecorder.start(1000);
      setRecordingStatus("recording");

      speak("Recording started");

      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      speak("Cannot access microphone");
      alert("Cannot access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === "recording") {
      mediaRecorderRef.current.stop();
      setRecordingStatus("stopped");

      speak("Recording stopped");

      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  const handleRecordButtonClick = () => {
    if (recordingStatus === "recording") {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const sendToBackend = async (audioBlob) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, `recording-${Date.now()}.webm`);

      const res = await fetch("http://localhost:5000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (result.success) {
        speak(`Transcription: ${result.transcription}`);
        alert(`Transcription: ${result.transcription}`);
      } else {
        speak("Transcription failed");
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
      speak("Upload failed");
      alert("Upload failed.");
    } finally {
      setIsUploading(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    if (file) {
      speak(`File selected: ${file.name}`);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      speak("Please select a file");
      alert("Please select a file.");
      return;
    }

    setIsFileUploading(true);
    speak("Uploading file");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      // Add folder name to form data
      if (folderName.trim()) {
        formData.append("folder", folderName.trim());
      }

      const response = await fetch(
        "http://localhost:5000/api/upload-material",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        speak("File uploaded successfully");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        speak("Upload failed");
      }
    } catch (error) {
      console.error(error);
      speak("Upload failed");
    } finally {
      setIsFileUploading(false);
    }
  };

  return (
    <div className="app-card">
      <h1>Start Talking</h1>

      <div>
        <strong>
          {recordingTime > 0 && `- ${formatTime(recordingTime)}`}
        </strong>
      </div>

      <button
        onClick={handleRecordButtonClick}
        disabled={isUploading}
        style={{
          padding: "15px 30px",
          marginTop: "20px",
          backgroundColor:
            recordingStatus === "recording" ? "#ff4444" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "5px",
        }}
      >
        {isUploading
          ? "Uploading..."
          : recordingStatus === "recording"
            ? "Stop & Transcribe"
            : "Start Recording"}
      </button>

      {recordingStatus === "recording" && (
        <div style={{ color: "red", marginTop: "10px" }}>
          ● Recording audio... (Press S to stop)
        </div>
      )}

      <h2 style={{ marginTop: "40px" }}>Upload File</h2>

      <div style={{ marginBottom: "15px"}}>
        <label htmlFor="folder-input" style={{ display: "block", marginBottom: "5px" }}>
          Folder Name (optional):
        </label>
        <input
          id="folder-input"
          type="text"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="Enter folder name"
          ref={folderInputRef} // Added ref here
          style={{
            padding: "8px 12px",
            border: "2px solid #e0e0e0",
            borderRadius: "6px",
            width:"250px",
            backgroundColor: "#fafafa",
            color: "#333",
            fontSize: "14px",
            outline: "none",
            transition: "border-color 0.3s"
          }}
        />
      </div>

      <input
        id="file-input"
        type="file"
        onChange={handleFileSelect}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        style={{ marginRight: "10px", padding: "10px 20px" }}
      >
        Select File
      </button>

      <button
        onClick={handleFileUpload}
        disabled={!selectedFile || isFileUploading}
        style={{ padding: "10px 20px" }}
      >
        {isFileUploading ? "Uploading..." : "Upload File"}
      </button>

      {selectedFile && (
        <div style={{ marginTop: "10px", color: "#666" }}>
          Selected: {selectedFile.name}
          {folderName && ` → Folder: ${folderName}`}
          <br />
          (Press U to upload)
        </div>
      )}
    </div>
  );
}

export default App;