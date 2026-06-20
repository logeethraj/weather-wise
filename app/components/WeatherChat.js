'use client';

import { useState } from 'react';

export default function WeatherChat({ weather, forecast }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [asking, setAsking] = useState(false);
  const [chatError, setChatError] = useState('');

  async function handleAsk() {
    if (!question.trim()) return;
    if (!weather) {
      setChatError('Please search for a location first so I have weather data to work with.');
      return;
    }

    setAsking(true);
    setChatError('');
    setAnswer('');

    try {
      const weatherContext = {
        location: weather.displayName,
        currentTemp: weather.main.temp,
        feelsLike: weather.main.feels_like,
        condition: weather.weather[0].description,
        humidity: weather.main.humidity,
        windSpeed: weather.wind.speed,
        precipitationChance: weather.precipitationChance,
        fiveDayForecast: forecast.map((day) => ({
          date: day.dt_txt.split(' ')[0],
          high: day.high,
          low: day.low,
          condition: day.weather[0].description,
          precipitationChance: day.precipitationChance,
        })),
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, weatherContext }),
      });

      const data = await res.json();

      if (!res.ok) {
        setChatError(data.error || 'Something went wrong.');
        return;
      }

      setAnswer(data.answer);
    } catch (err) {
      setChatError('Failed to reach AI service. Please try again.');
      console.error(err);
    } finally {
      setAsking(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleAsk();
    }
  }

  return (
    <div className="mt-8 bg-white/20 backdrop-blur-md rounded-3xl p-6 text-white shadow-xl">
      <h3 className="text-xl font-semibold mb-1">AI Weather Assistant</h3>
      <p className="text-white/70 text-sm mb-4">
        Ask questions about the current forecast — e.g. &quot;Should I carry an umbrella today?&quot;
      </p>

      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about the weather..."
          className="flex-1 bg-white/20 rounded-xl px-4 py-2 outline-none placeholder-white/60"
        />
        <button
          onClick={handleAsk}
          disabled={asking}
          className="bg-white text-blue-600 font-semibold px-5 py-2 rounded-xl hover:bg-white/90 transition disabled:opacity-50"
        >
          {asking ? 'Thinking...' : 'Ask AI'}
        </button>
      </div>

      {chatError && <p className="text-red-200 text-sm mt-3">{chatError}</p>}

      {answer && (
        <div className="mt-4 bg-white/10 rounded-xl p-4 text-sm leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}