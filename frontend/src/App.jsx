import { useState, useRef } from "react";

function App() {
  const [recordingStatus, setRecordingStatus] = useState("stopped");
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      // Force mono audio with explicit constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1, // MONO - this is the key!
          sampleRate: 16000, // 16kHz
          sampleSize: 16,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      streamRef.current = stream;
      audioChunksRef.current = [];

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm; codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        sendToBackend(audioBlob);
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second
      setRecordingStatus("recording");
      
      // Start timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds++;
        setRecordingTime(seconds);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Cannot access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === "recording") {
      mediaRecorderRef.current.stop();
      setRecordingStatus("stopped");
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
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

      const response = await fetch("http://localhost:5000/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        console.log("Transcription:", result.transcription);
        alert(`Transcription: ${result.transcription}`);
      } else {
        console.error("Error:", result.error);
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Check console for details.");
    } finally {
      setIsUploading(false);
      setRecordingTime(0);
    }
  };

  const getButtonText = () => {
    if (isUploading) return "Uploading...";
    if (recordingStatus === "recording") return "Stop & Transcribe";
    return "Start Recording (Mono)";
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Voice Recorder (MONO 16kHz)</h1>
      
      <div style={{ marginBottom: "20px" }}>
        <span style={{ fontSize: "18px", fontWeight: "bold" }}>
          Status: {recordingStatus} {recordingTime > 0 && `- ${formatTime(recordingTime)}`}
        </span>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={handleRecordButtonClick}
          disabled={isUploading}
          style={{
            padding: "15px 30px",
            fontSize: "18px",
            backgroundColor: recordingStatus === "recording" ? "#ff4444" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: isUploading ? "not-allowed" : "pointer",
            minWidth: "200px"
          }}
        >
          {getButtonText()}
        </button>
      </div>

      {recordingStatus === "recording" && (
        <div style={{ color: "#ff4444", fontWeight: "bold" }}>
          ● Recording MONO audio...
        </div>
      )}

      {isUploading && (
        <div style={{ color: "#2196F3", fontWeight: "bold" }}>
          Uploading and processing audio...
        </div>
      )}
    </div>
  );
}

export default App;