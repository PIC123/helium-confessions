import React from 'react';
import AudioRecorder from './AudioRecorder'; // Import the component

function App() {
  return (
    <div className="App" style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to Audio Recorder App</h1>
      <AudioRecorder /> {/* Render the AudioRecorder component */}
    </div>
  );
}

export default App;
