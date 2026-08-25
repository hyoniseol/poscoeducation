module.exports = async function handler(req, res) {
  const location = new URL(req.url, 'https://vercel.local').searchParams.get('location');
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return res.status(500).send('GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.');
  if (!location) return res.status(400).send('지도 위치가 필요합니다.');
  const params = new URLSearchParams({ center: location, zoom: '13', size: '700x420', scale: '2', maptype: 'roadmap', markers: `color:0x073b91|${location}`, key });
  const response = await fetch(`https://maps.googleapis.com/maps/api/staticmap?${params}`);
  if (!response.ok) return res.status(response.status).send('Google 지도 이미지를 불러오지 못했습니다.');
  res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png');
  res.status(200).send(Buffer.from(await response.arrayBuffer()));
};
