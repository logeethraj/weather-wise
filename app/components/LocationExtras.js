'use client';

export default function LocationExtras({ locationName, lat, lon }) {
  if (!locationName) return null;

  const mapEmbedUrl = `https://maps.google.com/maps?q=${lat},${lon}&z=12&output=embed`;
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${locationName} travel guide`)}`;

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white/20 backdrop-blur-md rounded-3xl p-4 text-white shadow-xl">
        <h3 className="text-lg font-semibold mb-3">Map</h3>
        <div className="rounded-xl overflow-hidden aspect-video">
          <iframe src={mapEmbedUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy" title="Location map" />
        </div>
      </div>

      <div className="bg-white/20 backdrop-blur-md rounded-3xl p-4 text-white shadow-xl flex flex-col">
        <h3 className="text-lg font-semibold mb-3">Videos</h3>
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 bg-white/10 rounded-xl p-6">
          <p className="text-white/80 text-sm">Explore travel videos and guides for {locationName} on YouTube.</p>
          <a href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer" className="bg-red-600 hover:bg-red-700 transition px-5 py-2 rounded-xl font-semibold">Search on YouTube</a>
        </div>
      </div>
    </div>
  );
}