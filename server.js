const http = require('http'); const fs = require('fs'); const path = require('path'); const root = __dirname;
const envPath = path.join(root, '.env'); if (fs.existsSync(envPath)) for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([^#=]+)\s*=\s*(.*?)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2]; }

async function searchWithOpenAI(query) {
  if (!process.env.OPENAI_API_KEY) return [];
  const prompt = `전국 카페 추천 서비스의 검색 결과를 만들어줘. 웹 검색으로 최신 정보를 확인하고, 다음 검색 조건에 맞는 카페 최대 10곳을 찾아줘: ${query}\n반드시 JSON 배열만 반환해. 각 항목은 name, address, phone, category, url, source, reason 필드를 포함해. 확인하지 못한 값은 빈 문자열로 둬. source는 "OPENAI WEB SEARCH"로 넣어.`;
  const response = await fetch('https://api.openai.com/v1/responses', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: 'gpt-5.6-luna', tools: [{ type: 'web_search' }], input: prompt }) });
  if (!response.ok) throw Error(`OpenAI API 오류: ${response.status}`);
  const data = await response.json(); const text = data.output_text || (data.output || []).flatMap(item => item.content || []).map(item => item.text || '').join('');
  const match = text.match(/\[[\s\S]*\]/); if (!match) throw Error('OpenAI가 구조화된 검색 결과를 반환하지 않았습니다.');
  const results = JSON.parse(match[0]); return Array.isArray(results) ? results : [];
}

const server = http.createServer(async (req, res) => { const u = new URL(req.url, 'http://localhost:8000'); res.setHeader('Access-Control-Allow-Origin', '*'); if (u.pathname === '/api/search') { try { const q = u.searchParams.get('query'); if (!q) throw Error('검색어가 필요합니다.'); const results = await searchWithOpenAI(q); if (!results.length) throw Error('OPENAI_API_KEY가 설정되지 않았거나 검색 결과가 없습니다.'); res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify({ results })); } catch (e) { res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' }); return res.end(JSON.stringify({ error: e.message })); } } const file = u.pathname === '/' ? '/index.html' : u.pathname; const filePath = path.join(root, file); if (!filePath.startsWith(root) || !fs.existsSync(filePath)) { res.writeHead(404); return res.end('Not found'); } const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' }; res.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' }); fs.createReadStream(filePath).pipe(res); });
server.listen(process.env.PORT || 8000, () => console.log(`Cafe Finder running on http://localhost:${process.env.PORT || 8000}`));
