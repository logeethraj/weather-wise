'use client';

import { useState, useEffect } from 'react';
import {
  createWeatherQuery,
  getAllWeatherQueries,
  updateWeatherQuery,
  deleteWeatherQuery,
  validateDateRange,
  exportAsJSON,
  exportAsCSV,
} from '../../lib/weatherQueries';
import { searchWeatherByText } from '../../lib/weather';

export default function WeatherRecords() {
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [formLocation, setFormLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoadingRecords(true);
    try {
      const data = await getAllWeatherQueries();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load records:', err);
    } finally {
      setLoadingRecords(false);
    }
  }

  function resetForm() {
    setFormLocation('');
    setStartDate('');
    setEndDate('');
    setNotes('');
    setEditingId(null);
    setFormError('');
  }

  async function handleSaveRecord() {
    setFormError('');

    if (!formLocation.trim()) {
      setFormError('Please enter a location.');
      return;
    }

    const dateError = validateDateRange(startDate, endDate);
    if (dateError) {
      setFormError(dateError);
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // UPDATE existing record
        await updateWeatherQuery(editingId, {
          location_name: formLocation,
          start_date: startDate,
          end_date: endDate,
          notes: notes || null,
        });
      } else {
        // CREATE new record — validate location exists by fetching real weather
        let weatherData;
        try {
          weatherData = await searchWeatherByText(formLocation);
        } catch (err) {
          setFormError(
            `Location "${formLocation}" could not be verified. Please check spelling.`
          );
          setSaving(false);
          return;
        }

        await createWeatherQuery({
          locationName: weatherData.name,
          latitude: weatherData.coord.lat,
          longitude: weatherData.coord.lon,
          startDate,
          endDate,
          temperature: weatherData.main.temp,
          weatherDescription: weatherData.weather[0].description,
          weatherIcon: weatherData.weather[0].icon,
          humidity: weatherData.main.humidity,
          windSpeed: weatherData.wind.speed,
          notes,
        });
      }

      resetForm();
      await loadRecords();
    } catch (err) {
      setFormError('Failed to save record. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  function handleEditClick(record) {
    setEditingId(record.id);
    setFormLocation(record.location_name);
    setStartDate(record.start_date);
    setEndDate(record.end_date);
    setNotes(record.notes || '');
    setFormError('');
  }

  async function handleDelete(id) {
    if (!confirm('Delete this record?')) return;
    try {
      await deleteWeatherQuery(id);
      await loadRecords();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  return (
    <div className="mt-10 bg-white/20 backdrop-blur-md rounded-3xl p-6 text-white shadow-xl">
      <h3 className="text-xl font-semibold mb-1">📋 Saved Weather Records</h3>
      <p className="text-white/70 text-sm mb-4">
        Create records with date ranges, then read, update, delete, or export stored data.
      </p>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Location (e.g. Tokyo)"
          value={formLocation}
          onChange={(e) => setFormLocation(e.target.value)}
          className="bg-white/20 rounded-xl px-4 py-2 outline-none placeholder-white/60"
        />
        <input
          type="text"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="bg-white/20 rounded-xl px-4 py-2 outline-none placeholder-white/60"
        />
        <div>
          <label className="text-xs text-white/70">Start date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-white/20 rounded-xl px-4 py-2 outline-none"
          />
        </div>
        <div>
          <label className="text-xs text-white/70">End date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-white/20 rounded-xl px-4 py-2 outline-none"
          />
        </div>
      </div>

      {formError && (
        <p className="text-red-200 text-sm mt-2">⚠️ {formError}</p>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSaveRecord}
          disabled={saving}
          className="bg-white text-blue-600 font-semibold px-5 py-2 rounded-xl hover:bg-white/90 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : editingId ? 'Update Record' : 'Save Record'}
        </button>
        {editingId && (
          <button
            onClick={resetForm}
            className="bg-white/20 px-5 py-2 rounded-xl hover:bg-white/30 transition"
          >
            Cancel Edit
          </button>
        )}
        <button
          onClick={() => exportAsJSON(records)}
          disabled={records.length === 0}
          className="bg-white/20 px-5 py-2 rounded-xl hover:bg-white/30 transition disabled:opacity-40"
        >
          Export JSON
        </button>
        <button
          onClick={() => exportAsCSV(records)}
          disabled={records.length === 0}
          className="bg-white/20 px-5 py-2 rounded-xl hover:bg-white/30 transition disabled:opacity-40"
        >
          Export CSV
        </button>
      </div>

      {/* Records list */}
      <div className="mt-6 space-y-3">
        {loadingRecords ? (
          <p className="text-white/70 text-sm">Loading records...</p>
        ) : records.length === 0 ? (
          <p className="text-white/70 text-sm">
            No saved records yet. Create one above to demonstrate persistence.
          </p>
        ) : (
          records.map((record) => (
            <div
              key={record.id}
              className="bg-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2"
            >
              <div>
                <p className="font-semibold">{record.location_name}</p>
                <p className="text-white/70 text-xs">
                  {record.start_date} → {record.end_date}
                  {record.notes ? ` · ${record.notes}` : ''}
                </p>
                <p className="text-white/60 text-xs">
                  {record.temperature !== null
                    ? `${Math.round(record.temperature)}°C, ${record.weather_description}`
                    : ''}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(record)}
                  className="bg-white/20 px-3 py-1 rounded-lg text-sm hover:bg-white/30 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(record.id)}
                  className="bg-red-500/80 px-3 py-1 rounded-lg text-sm hover:bg-red-500 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}