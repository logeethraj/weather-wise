import { supabase } from './supabase';

// CREATE - save a new weather query record
export async function createWeatherQuery({
  locationName,
  latitude,
  longitude,
  startDate,
  endDate,
  temperature,
  weatherDescription,
  weatherIcon,
  humidity,
  windSpeed,
  notes,
}) {
  const { data, error } = await supabase
    .from('weather_queries')
    .insert([
      {
        location_name: locationName,
        latitude,
        longitude,
        start_date: startDate,
        end_date: endDate,
        temperature,
        weather_description: weatherDescription,
        weather_icon: weatherIcon,
        humidity,
        wind_speed: windSpeed,
        notes: notes || null,
      },
    ])
    .select();

  if (error) throw error;
  return data[0];
}

// READ - get all saved weather queries, most recent first
export async function getAllWeatherQueries() {
  const { data, error } = await supabase
    .from('weather_queries')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// UPDATE - edit an existing record
export async function updateWeatherQuery(id, updates) {
  const { data, error } = await supabase
    .from('weather_queries')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
}

// DELETE - remove a record
export async function deleteWeatherQuery(id) {
  const { error } = await supabase.from('weather_queries').delete().eq('id', id);

  if (error) throw error;
  return true;
}

// Validate date range
export function validateDateRange(startDate, endDate) {
  if (!startDate || !endDate) {
    return 'Both start and end dates are required.';
  }
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid date format.';
  }
  if (start > end) {
    return 'Start date must be before end date.';
  }
  return null; // valid
}