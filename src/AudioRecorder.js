import React, { useState, useRef } from 'react';
import { Loader2, Mic, Send, PlayCircle, AlertCircle } from 'lucide-react';

const AudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [randomAudioUrl, setRandomAudioUrl] = useState(null);
  const [error, setError] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        audioChunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone', error);
      setError('Failed to access microphone');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const sendAudioToAzureFunction = async () => {
    if (!audioUrl) return;

    setIsSubmitting(true);
    setError(null);
    const formData = new FormData();
    const audioBlob = await fetch(audioUrl).then(r => r.blob());
    formData.append('audio', audioBlob, 'recording.webm');

    try {
      const response = await fetch('https://labracadabra-confessional.azurewebsites.net/api/saveAudioBlob', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        console.log('Audio uploaded successfully');
        setAudioUrl(null); // Clear the recorded audio
      } else {
        throw new Error('Audio upload failed');
      }
    } catch (error) {
      console.error('Error sending audio:', error);
      setError('Failed to upload audio');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRandomAudio = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://labracadabra-confessional.azurewebsites.net/api/loadRandomAudioBlob?');
      if (response.ok) {
        const audioUrl = await response.text();
        setRandomAudioUrl(audioUrl);
        // Check if the audio file exists
        const audioCheck = await fetch(audioUrl, { method: 'HEAD' });
        if (!audioCheck.ok) {
          throw new Error('Audio file not found');
        }
      } else {
        throw new Error('Failed to get random audio');
      }
    } catch (error) {
      console.error('Error getting random audio:', error);
      setError(error.message);
      setRandomAudioUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white shadow-xl rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">Audio Recorder</h2>
        
        <div className="flex justify-center mb-4">
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={`px-4 py-2 rounded-full ${isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            {isRecording ? <Mic className="h-6 w-6" /> : 'Start Recording'}
          </button>
        </div>

        {audioUrl && (
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Preview:</h3>
            <audio controls src={audioUrl} className="w-full" />
            <button 
              onClick={sendAudioToAzureFunction}
              disabled={isSubmitting}
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 w-full flex justify-center items-center"
            >
              {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5 mr-2" />}
              {isSubmitting ? 'Submitting...' : 'Submit Recording'}
            </button>
          </div>
        )}

        <div className="mt-6">
          <button 
            onClick={getRandomAudio}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50 w-full flex justify-center items-center"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5 mr-2" />}
            {isLoading ? 'Loading...' : 'Play Random Recording'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {randomAudioUrl && !error && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Random Recording:</h3>
            <audio controls src={randomAudioUrl} className="w-full" onError={() => setError('Failed to load audio')} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioRecorder;