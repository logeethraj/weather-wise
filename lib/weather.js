const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY;

// Get location suggestions as user types (autocomplete)
export async function getLocationSuggestions(query) {
  if (!query || query.length < 2) return [];

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
    query
  )}&limit=5&appid=${API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((place) => ({
      name: place.name,
      state: place.state || '',
      country: place.country,
      lat: place.lat,
      lon: place.lon,
    }));
  } catch (error) {
    console.error('Suggestion fetch error:', error);
    return [];
  }
}

// Get current weather by lat/lon, plus precipitation chance from forecast
export async function getCurrentWeather(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch current weather');
  }
  const current = await res.json();

  // Get precipitation probability from the nearest forecast slot
  let pop = 0;
  try {
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    const forecastRes = await fetch(forecastUrl);
    if (forecastRes.ok) {
      const forecastData = await forecastRes.json();
      if (forecastData.list && forecastData.list.length > 0) {
        pop = forecastData.list[0].pop || 0;
      }
    }
  } catch (error) {
    console.error('Precipitation fetch error:', error);
  }

  return { ...current, precipitationChance: Math.round(pop * 100) };
}

// Get 5-day forecast by lat/lon, with daily high/low, precipitation, wind, humidity
export async function getForecast(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to fetch forecast');
  }
  const data = await res.json();

  // Group all 3-hour entries by date
  const groupedByDate = {};
  data.list.forEach((entry) => {
    const date = entry.dt_txt.split(' ')[0];
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(entry);
  });

  // Build a clean daily summary: midday snapshot + computed high/low + extras
  const dailySummaries = Object.entries(groupedByDate).map(([date, entries]) => {
    const middayEntry =
      entries.find((e) => e.dt_txt.includes('12:00:00')) || entries[0];

    const temps = entries.map((e) => e.main.temp);
    const high = Math.max(...temps);
    const low = Math.min(...temps);
    const maxPop = Math.max(...entries.map((e) => e.pop || 0));

    return {
      ...middayEntry,
      high: Math.round(high),
      low: Math.round(low),
      precipitationChance: Math.round(maxPop * 100),
      avgHumidity: Math.round(
        entries.reduce((sum, e) => sum + e.main.humidity, 0) / entries.length
      ),
      avgWind: (
        entries.reduce((sum, e) => sum + e.wind.speed, 0) / entries.length
      ).toFixed(1),
    };
  });

  return dailySummaries.slice(0, 5);
}

// Search by direct text (fallback if user just types and hits enter)
export async function searchWeatherByText(query) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    query
  )}&appid=${API_KEY}&units=metric`;

  let res;
  try {
    res = await fetch(url);
  } catch (networkError) {
    throw new Error('NETWORK_ERROR');
  }

  if (res.status === 404) {
    throw new Error('LOCATION_NOT_FOUND');
  }
  if (!res.ok) {
    throw new Error('API_ERROR');
  }
  return res.json();
}

// Reverse geocode: convert lat/lon into a sensible nearby place name
// Tries OpenWeatherMap first (tends to pick well-known nearby towns),
// falls back to BigDataCloud if that fails
export async function reverseGeocode(lat, lon) {
  // Primary: OpenWeatherMap
  try {
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        const place = data[0];
        return {
          name: `${place.name}${place.state ? ', ' + place.state : ''}, ${place.country}`,
        };
      }
    }
  } catch (error) {
    console.error('OpenWeatherMap reverse geocode error:', error);
  }

  // Fallback: BigDataCloud
  try {
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const place =
        data.locality ||
        data.city ||
        data.localityInfo?.administrative?.[3]?.name ||
        data.principalSubdivision;
      if (place) {
        const region = data.principalSubdivision || '';
        const country = data.countryName || '';
        return {
          name: `${place}${region && region !== place ? ', ' + region : ''}${country ? ', ' + country : ''}`,
        };
      }
    }
  } catch (error) {
    console.error('BigDataCloud reverse geocode error:', error);
  }

  return null;
}