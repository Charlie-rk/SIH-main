import React, { useState } from 'react';
import { analyzeSentiment, analyzeTranscript } from '../services/API';



function AIAnalyzer() {
  // State for the Sentiment tool
  const [sentimentText, setSentimentText] = useState('');
  const [sentimentResult, setSentimentResult] = useState(null);
  const [isSentLoading, setIsSentLoading] = useState(false);

  // State for the Transcript tool
  const [transcriptText, setTranscriptText] = useState('');
  const [transcriptResult, setTranscriptResult] = useState(null);
  const [isTransLoading, setIsTransLoading] = useState(false);

  /**
   * --- SIMULATED API CALL 1 ---
   * Handles the submission for sentiment analysis.
   */
  const handleSentimentSubmit = async () => {
  setIsSentLoading(true);
  setSentimentResult(null);

  try {
    const data = await analyzeSentiment(sentimentText);
    // expected shape: { label: 'POSITIVE'|'NEGATIVE', score: 0.xx }
    setSentimentResult(data);
  } catch (err) {
    console.error('Sentiment API error', err);
    setSentimentResult({ label: 'ERROR', score: 0 });
  } finally {
    setIsSentLoading(false);
  }
};

// replace handleTranscriptSubmit with:
const handleTranscriptSubmit = async () => {
  setIsTransLoading(true);
  setTranscriptResult(null);

  try {
    const data = await analyzeTranscript(transcriptText);
    // expected shape: { tags: [...] }
    setTranscriptResult(data);
  } catch (err) {
    console.error('Transcript API error', err);
    setTranscriptResult({ tags: ['Error contacting API'] });
  } finally {
    setIsTransLoading(false);
  }
};

  return (
    // Grid with 2 columns on medium screens, 1 on small
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* --- COLUMN 1: SENTIMENT ANALYZER --- */}
      <div className="bg-gray-700/50 p-4 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-3">
          Community Sentiment Analyzer
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Paste in a citizen email or social media post to analyze its sentiment.
        </p>
        <textarea
          className="w-full h-32 p-2 bg-gray-800 border border-gray-600 rounded-md text-gray-200"
          placeholder="e.g., 'Officer Kaur was incredibly helpful...'"
          value={sentimentText}
          onChange={(e) => setSentimentText(e.target.value)}
        />
        <button
          className="mt-3 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          onClick={handleSentimentSubmit}
          disabled={isSentLoading || sentimentText.length === 0}
        >
          {isSentLoading ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>
        
        {/* Sentiment Result Area */}
        <div className="mt-4 min-h-[50px]">
          {isSentLoading && <p className="text-gray-400">Loading...</p>}
          {sentimentResult && (
            <SentimentResult result={sentimentResult} />
          )}
        </div>
      </div>

      {/* --- COLUMN 2: TRANSCRIPT ANALYZER --- */}
      <div className="bg-gray-700/50 p-4 rounded-lg">
        <h3 className="text-xl font-semibold text-white mb-3">
          Transcript Professionalism Analyzer
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Paste in a body-cam audio transcript to flag positive indicators.
        </p>
        <textarea
          className="w-full h-32 p-2 bg-gray-800 border border-gray-600 rounded-md text-gray-200"
          placeholder="e.g., 'OFFICER: Are you okay? ... CITIZEN: Thank you...'"
          value={transcriptText}
          onChange={(e) => setTranscriptText(e.target.value)}
        />
        <button
          className="mt-3 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          onClick={handleTranscriptSubmit}
          disabled={isTransLoading || transcriptText.length === 0}
        >
          {isTransLoading ? 'Analyzing...' : 'Analyze Transcript'}
        </button>

        {/* Transcript Result Area */}
        <div className="mt-4 min-h-[50px]">
          {isTransLoading && <p className="text-gray-400">Loading...</p>}
          {transcriptResult && (
            <TranscriptResult result={transcriptResult} />
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub-component to render Sentiment results cleanly ---
const SentimentResult = ({ result }) => {
  const isPositive = result.label === 'POSITIVE';
  const colorClass = isPositive ? 'text-green-400' : 'text-red-400';
  const score = (result.score * 100).toFixed(0);

  return (
    <div className="bg-gray-800 p-3 rounded-md">
      <p className={`text-lg font-bold ${colorClass}`}>
        {result.label}
        <span className="text-sm text-gray-400 ml-2">({score}% confidence)</span>
      </p>
    </div>
  );
};

// --- Sub-component to render Transcript results cleanly ---
const TranscriptResult = ({ result }) => {
  return (
    <div className="bg-gray-800 p-3 rounded-md">
      <p className="text-gray-300 mb-2">AI-Detected Tags:</p>
      <div className="flex flex-wrap gap-2">
        {result.tags.length === 0 ? (
          <p className="text-sm text-gray-400">No specific indicators found.</p>
        ) : (
          result.tags.map(tag => (
            <span 
              key={tag}
              className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full"
            >
              {tag}
            </span>
          ))
        )}
      </div>
    </div>
  );
};

export default AIAnalyzer;