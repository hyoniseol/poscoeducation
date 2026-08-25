module.exports = async function handler(req, res) {
  try {
    const address = new URL(req.url, 'https://vercel.local').searchParams.get('address');
    if (!address) return res.status(400).json({ error: '주소가 필요합니다.' });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=kr&q=${encodeURIComponent(address)}`, { headers: { 'User-Agent': 'CafeFinder/1.0', Accept: 'application/json' } });
    if (!response.ok) return res.status(response.status).json({ error: '주소 검색 오류' });
    const place = (await response.json())[0];
    return res.status(200).json(place ? { lat: place.lat, lon: place.lon, display_name: place.display_name } : {});
  } catch (error) { return res.status(500).json({ error: error.message }); }
};
