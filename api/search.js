function loadKey() {
  return process.env.OPENAI_API_KEY;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET 요청만 허용됩니다.' });
  const query = new URL(req.url, 'https://vercel.local').searchParams.get('query');
  if (!query) return res.status(400).json({ error: '검색어가 필요합니다.' });
  if (!loadKey()) return res.status(500).json({ error: 'OPENAI_API_KEY가 Vercel에 설정되지 않았습니다.' });
  try {
    const prompt = `전국 카페 추천 서비스의 검색 결과를 만들어줘. 웹 검색으로 최신 정보를 확인하고, 다음 검색 조건에 맞는 카페 최대 10곳을 찾아줘: ${query}\n반드시 JSON 배열만 반환해. 각 항목은 name, address, phone, category, url, source, reason 필드를 포함해. 확인하지 못한 값은 빈 문자열로 둬. source는 "OPENAI WEB SEARCH"로 넣어.`;
    const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${loadKey()}` }, body: JSON.stringify({ model: 'gpt-5.6-luna', tools: [{ type: 'web_search' }], input: prompt }) });
    if (!response.ok) return res.status(response.status).json({ error: `OpenAI API 오류: ${response.status}` });
    const data = await response.json();
    const text = data.output_text || (data.output || []).flatMap(item => item.content || []).map(item => item.text || '').join('');
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return res.status(502).json({ error: 'OpenAI가 구조화된 검색 결과를 반환하지 않았습니다.' });
    return res.status(200).json({ results: JSON.parse(match[0]) });
  } catch (error) { return res.status(500).json({ error: error.message }); }
};
