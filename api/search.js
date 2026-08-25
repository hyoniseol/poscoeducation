function loadKey() {
  return process.env.OPENAI_API_KEY;
}

const searchCache = globalThis.__cafeFinderSearchCache || (globalThis.__cafeFinderSearchCache = new Map());

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET 요청만 허용됩니다.' });
  const params = new URL(req.url, 'https://vercel.local').searchParams;
  if (params.get('map') === '1') {
    const location = params.get('location'); const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return res.status(500).send('GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.');
    const mapParams = new URLSearchParams({ center: location || '서울시청', zoom: '13', size: '700x420', scale: '2', maptype: 'roadmap', markers: `color:0x073b91|${location || '서울시청'}`, key });
    const mapResponse = await fetch(`https://maps.googleapis.com/maps/api/staticmap?${mapParams}`);
    if (!mapResponse.ok) return res.status(mapResponse.status).send('Google 지도 이미지를 불러오지 못했습니다.');
    res.setHeader('Content-Type', mapResponse.headers.get('content-type') || 'image/png'); return res.status(200).send(Buffer.from(await mapResponse.arrayBuffer()));
  }
  const query = params.get('query');
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });
  const cached = searchCache.get(query);
  if (cached && cached.expiresAt > Date.now()) return res.status(200).json({ results: cached.results, cached: true });
  if (!loadKey()) return res.status(500).json({ error: 'OPENAI_API_KEY가 Vercel에 설정되지 않았습니다.' });
  try {
    const prompt = `전국 카페 추천 서비스의 검색 결과를 만들어줘. 웹 검색으로 최신 정보를 확인하고, 다음 검색 조건에 맞는 일반 카페 정확히 3곳(Top 3)을 찾아줘. 스터디카페, 독서실, 스터디룸, 무인 스터디 공간, 학원형 스터디 공간은 반드시 제외해. 검색 결과가 부족해도 해당 지역의 일반 카페를 추가로 찾아 반드시 3곳을 반환해: ${query}\n반드시 JSON 배열만 반환해. 각 항목은 name, address, phone, category, url, source, reason, imageUrl, businessHours, crowdLevel, seatType, noiseLevel, outlet, signatureMenu 필드를 포함해. imageUrl은 실제 카페 외관·간판 사진의 직접 이미지 URL을 확인할 수 있을 때만 넣고, 아니면 빈 문자열로 둬. crowdLevel은 현재 시간대 혼잡도를 여유/보통/혼잡/정보 확인 필요 중 하나로 표시해. businessHours는 영업시간, seatType은 자리 유형, noiseLevel은 조용함/보통/시끌벅적 중 하나, outlet은 콘센트 있음/일부 있음/없음 중 하나, signatureMenu는 대표 메뉴를 넣어. 확인하지 못한 값은 "정보 확인 필요"로 둬. source는 "OPENAI WEB SEARCH"로 넣어.`;
    const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loadKey()}` }, body: JSON.stringify({ model: 'gpt-5.6-luna', tools: [{ type: 'web_search' }], input: prompt }) });
    if (!response.ok) return res.status(response.status).json({ error: `OpenAI API 오류: ${response.status}` });
    const data = await response.json();
    const text = data.output_text || (data.output || []).flatMap(item => item.content || []).map(item => item.text || '').join('');
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return res.status(502).json({ error: 'OpenAI가 구조화된 검색 결과를 반환하지 않았습니다.' });
    const results = JSON.parse(match[0]);
    searchCache.set(query, { results, expiresAt: Date.now() + 15 * 60 * 1000 });
    return res.status(200).json({ results, cached: false });
  } catch (error) { return res.status(500).json({ error: error.message }); }
};
