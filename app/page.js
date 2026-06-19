'use client';

import { useState } from 'react';

export default function Home() {
  const [location, setLocation] = useState('');

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
          🌤️ WeatherWise
        </h1>
        <p className="text-white/80 mb-8">
          Real-time weather, anywhere in the world
        </p>

        <div className="flex gap-2 bg-white/20 backdrop-blur-md rounded-2xl p-2 shadow-xl">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter city, town, or zip code..."
            className="flex-1 bg-transparent outline-none text-white placeholder-white/70 px-4 py-2 text-lg"
          />
          <button className="bg-white text-blue-600 font-semibold px-6 py-2 rounded-xl hover:bg-white/90 transition">
            Search
          </button>
        </div>
      </div>
    </main>
  );
}