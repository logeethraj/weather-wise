'use client';

import { useState, useEffect, useRef } from 'react';
import {
  getLocationSuggestions,
  getCurrentWeather,
  getForecast,
  searchWeatherByText,
  reverseGeocode,
} from '../lib/weather';
import WeatherRecords from './components/WeatherRecords';
import LocationExtras from './components/LocationExtras';
import WeatherChat from './components/WeatherChat';

export default function Home() {
  const [location, setLocation] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef(null);

  // Debounced autocomplete
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (location.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const results = await getLocationSuggestions(location);
      setSuggestions(results);
      setShowSuggestions(true);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [location]);

  async function loadWeatherByCoords(lat, lon, displayName, coordsLabel, lowAccuracy) {
    setLoading(true);
    setError('');
    setShowSuggestions(false);
    try {
      const current = await getCurrentWeather(lat, lon);
      const forecastData = await getForecast(lat, lon);
      setWeather({
        ...current,
        displayName: displayName || current.name,
        coordsLabel: coordsLabel || null,
        lowAccuracy: lowAccuracy || false,
      });
      setForecast(forecastData);
    } catch (err) {
      setError('Could not fetch weather. Please try again.');
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSuggestionClick(place) {
    const displayName = `${place.name}${place.state ? ', ' + place.state : ''}, ${place.country}`;
    setLocation(displayName);
    await loadWeatherByCoords(place.lat, place.lon, displayName);
  }

  async function handleSearch() {
    if (!location.trim()) return;
    setLoading(true);
    setError('');
    setShowSuggestions(false);
    try {
      const data = await searchWeatherByText(location);
      setWeather({ ...data, displayName: data.name });
      const forecastData = await getForecast(data.coord.lat, data.coord.lon);
      setForecast(forecastData);
    } catch (err) {
      if (err.message === 'NETWORK_ERROR') {
        setError('No internet connection. Please check your network and try again.');
      } else if (err.message === 'LOCATION_NOT_FOUND') {
        setError(
          `"${location}" not found. Try a nearby larger town, or check spelling.`
        );
      } else {
        setError('Something went wrong fetching weather data. Please try again.');
      }
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const result = await reverseGeocode(latitude, longitude);
        const displayName = result?.name || 'Your Location';

        let precisionNote = '';
        let isLowAccuracy = false;
        if (accuracy > 5000) {
          precisionNote = ' (approximate — based on network location)';
          isLowAccuracy = true;
        } else if (accuracy > 500) {
          precisionNote = ' (moderate accuracy)';
        } else {
          precisionNote = ' (high accuracy)';
        }

        const coordsLabel = `${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E${precisionNote}`;
        await loadWeatherByCoords(latitude, longitude, displayName, coordsLabel, isLowAccuracy);
      },
      () => {
        setError('Unable to retrieve your location. Please allow location access.');
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-700 flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-2xl text-center">
        <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
          AI Engineer Intern Technical Assessment
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
          🌤️ WeatherWise
        </h1>
        <p className="text-white/80 mb-1">
          Built by Logeeth Raj — Full Stack Submission (Tech Assessment 1 & 2)
        </p>
        <p className="text-white/80 mb-8">
          Real-time weather, anywhere in the world
        </p>

        <div className="relative">
          <div className="flex gap-2 bg-white/20 backdrop-blur-md rounded-2xl p-2 shadow-xl">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Enter city, town, or zip code..."
              className="flex-1 bg-transparent outline-none text-white placeholder-white/70 px-4 py-2 text-lg"
            />
            <button
              onClick={handleSearch}
              className="bg-white text-blue-600 font-semibold px-6 py-2 rounded-xl hover:bg-white/90 transition"
            >
              Search
            </button>
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-xl text-left overflow-hidden">
              {suggestions.map((place, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSuggestionClick(place)}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 text-gray-800"
                >
                  📍 {place.name}
                  {place.state ? `, ${place.state}` : ''}, {place.country}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={handleUseMyLocation}
          className="mt-4 text-white/90 underline hover:text-white text-sm"
        >
          📍 Use my current location
        </button>

        {loading && (
          <p className="text-white mt-6 animate-pulse">Loading weather...</p>
        )}

        {error && (
          <div className="mt-6 bg-red-500/90 text-white px-4 py-3 rounded-xl">
            ⚠️ {error}
          </div>
        )}

        {weather && !loading && (
          <div className="mt-8 bg-white/20 backdrop-blur-md rounded-3xl p-6 text-white shadow-xl">
            <h2 className="text-2xl font-semibold">{weather.displayName}</h2>
            {weather.coordsLabel && (
              <p className="text-white/60 text-xs mt-1">📍 {weather.coordsLabel}</p>
            )}
            {weather.lowAccuracy && (
              <p className="text-yellow-200 text-xs mt-1">
                ⚠️ Low location accuracy detected. For exact results, search your location by name above.
              </p>
            )}
            <div className="flex items-center justify-center gap-4 mt-2">
              <img
                src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt={weather.weather[0].description}
                className="w-20 h-20"
              />
              <div className="text-left">
                <p className="text-5xl font-bold">
                  {Math.round(weather.main.temp)}°C
                </p>
                <p className="capitalize text-white/90">
                  {weather.weather[0].description}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mt-6 text-sm">
              <div className="bg-white/10 rounded-xl py-3">
                <p className="text-white/70">Feels Like</p>
                <p className="font-semibold text-lg">
                  {Math.round(weather.main.feels_like)}°C
                </p>
              </div>
              <div className="bg-white/10 rounded-xl py-3">
                <p className="text-white/70">Humidity</p>
                <p className="font-semibold text-lg">{weather.main.humidity}%</p>
              </div>
              <div className="bg-white/10 rounded-xl py-3">
                <p className="text-white/70">Wind</p>
                <p className="font-semibold text-lg">{weather.wind.speed} m/s</p>
              </div>
              <div className="bg-white/10 rounded-xl py-3">
                <p className="text-white/70">Precipitation</p>
                <p className="font-semibold text-lg">{weather.precipitationChance ?? 0}%</p>
              </div>
            </div>
          </div>
        )}

        {weather && !loading && (
          <LocationExtras
            locationName={weather.displayName}
            lat={weather.coord.lat}
            lon={weather.coord.lon}
          />
        )}

        {forecast.length > 0 && !loading && (
          <div className="mt-8">
            <h3 className="text-white text-xl font-semibold mb-4 text-left">
              5-Day Forecast
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {forecast.map((day, idx) => {
                const date = new Date(day.dt_txt);
                const dayName = date.toLocaleDateString('en-US', {
                  weekday: 'short',
                });
                return (
                  <div
                    key={idx}
                    className="bg-white/20 backdrop-blur-md rounded-2xl p-4 text-white text-center shadow-lg"
                  >
                    <p className="font-semibold">{dayName}</p>
                    <img
                      src={`https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`}
                      alt={day.weather[0].description}
                      className="w-12 h-12 mx-auto"
                    />
                    <p className="text-lg font-bold">
                      {day.high}° <span className="text-white/60 font-normal">/ {day.low}°</span>
                    </p>
                    <p className="text-xs text-white/80 capitalize">
                      {day.weather[0].description}
                    </p>
                    <p className="text-xs text-blue-200 mt-1">
                      💧 {day.precipitationChance}%
                    </p>
                    <div className="flex justify-center gap-2 text-[10px] text-white/70 mt-1">
                      <span>💨 {day.avgWind}m/s</span>
                      <span>•</span>
                      <span>💦 {day.avgHumidity}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      {weather && !loading && (
          <WeatherChat weather={weather} forecast={forecast} />
        )}

        <WeatherRecords />

        <footer className="mt-10 bg-white/10 backdrop-blur-md rounded-3xl p-6 text-white/90 text-sm text-left">
          <h4 className="font-semibold text-base mb-2">About PM Accelerator</h4>
          <p className="text-white/70 leading-relaxed">
            The Product Manager Accelerator (PM Accelerator) is a career development program
            led by Dr. Nancy Li, helping aspiring and current product managers break into and
            grow within the field — including AI product management. PM Accelerator is known
            for its strong, engaged alumni network and high success rate in helping members
            land top-tier product roles through hands-on coaching, mentorship, and real-world
            project experience.
          </p>
          <p className="text-white/50 text-xs mt-3">
            WeatherWise — built for the PM Accelerator AI Engineer Intern Technical Assessment.
          </p>
        </footer>
      </div>
    </main>
  );
}