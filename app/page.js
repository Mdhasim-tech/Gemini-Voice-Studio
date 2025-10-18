"use client";
import "./Home.css";
import { useState } from "react";

export default function Home() {
  const [audioSrc, setAudioSrc] = useState("");
  const [audioSrc1, setAudioSrc1] = useState("");
  const [audioSrc2, setAudioSrc2] = useState("");
  const [text, setText] = useState("");
  const [voiceName, setVoiceName] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);

  // ----------------- Single Speaker TTS -----------------
  const handleSingleSpeaker = async () => {
    if (!text || !voiceName) {
      alert("Please enter text and select a voice!");
      return;
    }
    setLoading3(true);

    try {
      const response = await fetch("/api/tts2", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceName }),
      });

      if (!response.ok) {
        const err = await response.json();
        alert(err.error || "Error generating audio");
        setLoading3(false);
        return;
      }

      const blob = await response.blob();
      console.log(blob);
      // ✅ Gemini returns WAV
      const audioBlob = new Blob([blob], { type: "audio/wav" });
      console.log(audioBlob)
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log(audioUrl)
      // ✅ Set for <audio> UI
      setAudioSrc(audioUrl);
    } catch (error) {
      console.error(error);
      alert("Error generating audio");
    } finally {
      setLoading3(false);
    }
  };

  // ----------------- Multi Speaker Podcast -----------------
  const handleMultiSpeaker = async () => {
    setLoading1(true);

    try {
      const response = await fetch("/api/tts3");
      if (!response.ok) {
        alert("Error generating conversation");
        setLoading1(false);
        return;
      }

      const blob = await response.blob();

      // ✅ Gemini returns WAV
      const audioBlob = new Blob([blob], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log(audioUrl)
      // ✅ Set for <audio> UI
      setAudioSrc1(audioUrl);


    } catch (err) {
      console.error(err);
      alert("Failed to fetch audio");
    } finally {
      setLoading1(false);
    }
  };


  // ----------------- Transcript to Audio -----------------
  const handleTranscript = async () => {
    if (!transcript) {
      alert("Please enter text for transcript!");
      return;
    }
    setLoading2(true);

    try {
      const response = await fetch("/api/tts4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        alert("Error generating audio");
        setLoading2(false);
        return;
      }

      const blob = await response.blob();

      // ✅ Gemini returns WAV
      const audioBlob = new Blob([blob], { type: "audio/wav" });
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log(audioUrl)
      // ✅ Set for <audio> UI
      setAudioSrc2(audioUrl);
    } catch (error) {
      console.error(error);
      alert("Error generating audio");
    } finally {
      setLoading2(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🎙️ Gemini Voice Studio</h1>
        <p>Text-to-Speech • Multi-Speaker • Transcript AI</p>
      </header>

      <div className="container">
        {/* Single Speaker Section */}
        <section className="card">
          <h2>🎤 Single Speaker TTS</h2>
          <textarea
            className="textar"
            placeholder="Enter text for TTS"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
          />
          <select
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            className="dropdown"
          >
            <option value="">Select Voice</option>
            <option value="Kore">Kore</option>
            <option value="Puck">Puck</option>
            <option value="Leda">Leda</option>
            <option value="Gacrux">Gacrux</option>
          </select>
          <button className="button1" onClick={handleSingleSpeaker}>
            🎧 Generate Audio
          </button>
          {loading3 && <p className="load3">Loading...</p>}
          {audioSrc && (
            <div className="audio-player">
              <audio key={audioSrc} controls src={audioSrc} />
            </div>
          )}
        </section>

        {/* Multi Speaker Section */}
        <section className="card">
          <h2>🗣️ Multi Speaker Podcast</h2>
          <p>Generate a fun back-and-forth dialogue between two speakers.</p>
          <button className="button1" onClick={handleMultiSpeaker}>
            🎙️ Generate Conversation
          </button>
          {loading1 && <p className="load">Loading...</p>}
          {audioSrc1 && (
            <div className="audio-player">
              <audio key={audioSrc1} controls src={audioSrc1} />
            </div>
          )}
        </section>

        {/* Transcript Section */}
        <section className="card">
          <h2>📜 Transcript to Audio</h2>
          <textarea
            className="textar"
            placeholder="Paste or write your transcript here..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={4}
          />
          <button className="button1" onClick={handleTranscript}>
            🔊 Generate Podcast Audio
          </button>
          {loading2 && <p className="load2">Loading...</p>}
          {audioSrc2 && (
            <div className="audio-player">
              <audio key={audioSrc2} controls src={audioSrc2} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
