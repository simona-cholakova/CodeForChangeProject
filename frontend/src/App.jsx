import { useState, useRef } from "react";

import "./App.css";


function App() {
  const [recordingStatus, setRecordingStatus] = useState("stopped");
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // File upload
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

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

      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Cannot access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === "recording") {
      mediaRecorderRef.current.stop();
      setRecordingStatus("stopped");

      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current)
        streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  const handleRecordButtonClick = () =>
    recordingStatus === "recording" ? stopRecording() : startRecording();

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
        alert(`Transcription: ${result.transcription}`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err) {
      console.error(err);
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
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file.");
      return;
    }

    setIsFileUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch(
        "http://localhost:5000/api/upload-material",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        alert(`File uploaded: ${result.filename}`);
        setSelectedFile(null);
        document.getElementById("file-input").value = "";
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Upload failed.");
    } finally {
      setIsFileUploading(false);
    }
  };


  return (
    <div className="app-card">
      <h1>Start Talking</h1>

      <div>
        <strong>
          {/* Status: {recordingStatus}{" "} */}
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
          : "Start Recording (Mono)"}
      </button>


      {recordingStatus === "recording" && (
        <div style={{ color: "red", marginTop: "10px" }}>
          ● Recording MONO audio...
        </div>
      )}

      <h2 style={{ marginTop: "40px" }}>Upload File</h2>

      <input id="file-input" type="file" onChange={handleFileSelect} />

      <button
        onClick={handleFileUpload}
        disabled={!selectedFile || isFileUploading}
        style={{ marginLeft: "10px", padding: "10px 20px" }}
      >
        {isFileUploading ? "Uploading..." : "Upload File"}
      </button>
    </div>
  );
}

export default App;
