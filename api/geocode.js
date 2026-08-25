module.exports = async function handler(req, res) {
  try {
    const params = new URL(req.url, 'https://vercel.local').searchParams;
    const address = params.get('address') || '';
    const location = params.get('location') || '';
    const name = params.get('name') || '';
    const queries = [...new Set([
      [address, location].filter(Boolean).join(', '),
      address,
      [name, location].filter(Boolean).join(', '),
      location
    ].filter(Boolean))];
    if (!queries.length) return res.status(400).json({ error: '주소가 필요합니다.' });
    let place;
    for (const query of queries) {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&countrycodes=kr&addressdetails=1&q=${encodeURIComponent(query)}`, { headers: { 'User-Agent': 'CafeFinder/1.0 contact@cafefinder.local', Accept: 'application/json' } });
      if (!response.ok) continue;
      const candidates = await response.json();
      if (candidates.length) { place = candidates.find((item) => item.type === 'cafe' || item.class === 'amenity') || candidates[0]; break; }
    }
    return res.status(200).json(place ? { lat: place.lat, lon: place.lon, display_name: place.display_name } : {});
  } catch (error) { return res.status(500).json({ error: error.message }); }
};
