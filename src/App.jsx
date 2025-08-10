import React, { useState, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export default function App() {
  const [listening, setListening] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const recognitionRef = useRef(null);

  const startListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setQuestion(text);
      getGeminiResponse(text);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  };

const getGeminiResponse = async (text) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(text);
    let responseText = await result.response.text();

    // 1️⃣ Remove Markdown formatting
    responseText = responseText.replace(/\*\*/g, ""); // remove bold
    responseText = responseText.replace(/\*/g, ""); // remove italics
    responseText = responseText.replace(/#+\s/g, ""); // remove headings
    responseText = responseText.replace(/\[(.*?)\]\(.*?\)/g, "$1"); // remove links but keep text

    // 2️⃣ Limit spoken text length (optional)
    const maxSpeakLength = 250; // characters
    let speakText = responseText;
    if (speakText.length > maxSpeakLength) {
      speakText = speakText.slice(0, maxSpeakLength) + "...";
    }

    setAnswer(responseText);
    speak(speakText); // speak only the short version
  } catch (error) {
    console.error(error);
    setAnswer("Error: " + error.message);
  }
};


  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl p-6 max-w-lg w-full">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6">
          🎤 My Voice App
        </h1>

        <button
          onClick={startListening}
          disabled={listening}
          className={`w-full py-3 rounded-lg text-lg font-semibold transition duration-300 ${
            listening
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {listening ? "Listening..." : "🎙 Start Speaking"}
        </button>

        {question && (
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-700">You said:</h3>
            <p className="mt-1">{question}</p>
          </div>
        )}

        {answer && (
          <div className="mt-6 p-4 bg-indigo-50 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-700">
              Gemini says:
            </h3>
            <p className="mt-1">{answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}
