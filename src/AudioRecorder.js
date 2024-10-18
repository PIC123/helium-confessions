import React, { useState, useRef } from "react";
import { Loader2, Mic, Send, PlayCircle, AlertCircle } from "lucide-react";
import "./App.css"; // Ensure this line is present

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [randomAudioUrl, setRandomAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [showSecret, setShowSecret] = useState(false);
  const [showAudio, setShowAudio] = useState(false);

  const startRecording = async () => {
    console.log("Recording started");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      console.log("audio good");
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone", error);
      setError("Failed to access microphone");
    }
  };

  const stopRecording = () => {
    console.log("Recording stopped");
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setShowAudio(true);
  };
  const sendAudioToAzureFunction = async () => {
    if (!audioUrl) return;

    setIsSubmitting(true);
    setError(null);
    setShowAudio(false);
    const formData = new FormData();
    const audioBlob = await fetch(audioUrl).then((r) => r.blob());
    formData.append("audio", audioBlob, "recording.webm");

    try {
      const response = await fetch(
        "https://labracadabra-confessional.azurewebsites.net/api/saveAudioBlob",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        console.log("Audio uploaded successfully");
        setAudioUrl(null); // Clear the recorded audio
      } else {
        throw new Error("Audio upload failed");
      }
    } catch (error) {
      console.error("Error sending audio:", error);
      setError("Failed to upload audio");
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  const getRandomAudio = async () => {
    setIsLoading(true);
    setError(null);
    setShowSecret(true);
    try {
      const response = await fetch(
        "https://labracadabra-confessional.azurewebsites.net/api/loadRandomAudioBlob?"
      );
      if (response.ok) {
        const audioUrl = await response.text();
        setRandomAudioUrl(audioUrl);
        // Check if the audio file exists
        const audioCheck = await fetch(audioUrl, { method: "HEAD" });
        if (!audioCheck.ok) {
          throw new Error("Audio file not found");
        }
      } else {
        throw new Error("Failed to get random audio");
      }
    } catch (error) {
      console.error("Error getting random audio:", error);
      setError(error.message);
      setRandomAudioUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    setRecording(null);
    setIsSubmitted(false);
    setShowSecret(false);
    setShowAudio(false);
  };

  const handleRestart = () => {
    setRecording(null);
    setIsSubmitted(false);
    setShowSecret(false);
    setAudioUrl(null); // Clear the recorded audio
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Logic to submit the recording to the database
    // Simulate a delay for submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 2000);
  };

  console.log("audioUrl", audioUrl);
  console.log("show audio: ", showAudio);
  console.log("issubmitted: ", isSubmitted);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">
          Hellium Confessional
        </h2>

        {!recording && !isSubmitted && !isSubmitting && !showAudio && (
          <div className="center-screen">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              // className={`px-4 py-2 rounded-full ${
              className={`circle-button ${isRecording ? "pulse" : ""}`}
            >
              {/* {isRecording ? <Mic className="h-6 w-6" /> : "Start Recording"} */}
              {isRecording ? "STOP" : "Record Confession"}
            </button>
          </div>
        )}

        {audioUrl && showAudio && (
          <div className="center-screen">
            <div className="vertical-stack">
              <h3 className="font-semibold mb-2">Your secret:</h3>
              <div className="secret-container">
                <audio controls src={audioUrl} className="w-full" />
              </div>
              <button onClick={handleDelete}>Try again</button>
              <button
                onClick={sendAudioToAzureFunction}
                disabled={isSubmitting}
                className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 w-full flex justify-center items-center"
              >
                {/* {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5 mr-2" />
              )} */}
                {isSubmitting ? "Submitting..." : "Submit secret"}
              </button>
            </div>
          </div>
        )}

        {isSubmitting && (
          <div className="mt-6">
            <p>Submitting...</p>
          </div>
        )}

        {isSubmitted && !showAudio && !showSecret && (
          <div className="mt-6">
            <p>Recording submitted successfully!</p>
            <button
              onClick={getRandomAudio}
              disabled={isLoading}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 w-full flex justify-center items-center"
            >
              {/* {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <PlayCircle className="h-5 w-5 mr-2" />
              )} */}
              {isLoading ? "Loading..." : "Get secret"}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {randomAudioUrl && !error && showSecret && (
          <div className="center-screen">
            <div className="vertical-stack">
              <div className="secret-container">
                <h3 className="font-semibold mb-2">Someone else's secret...</h3>
                <audio
                  controls
                  src={randomAudioUrl}
                  className="w-full"
                  onError={() => setError("Failed to load audio")}
                />
              </div>
              <button onClick={handleRestart}>Add a new secret</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;
