const $ = (s) => document.querySelector(s);
const toast = (message) => { const el = $('#toast'); el.textContent = message; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2200); };
document.querySelectorAll('.purpose').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.purpose').forEach((item) => item.classList.remove('selected')); button.classList.add('selected'); }));
document.querySelectorAll('.chip').forEach((button) => button.addEventListener('click', () => button.classList.toggle('selected')));

function renderCards(cafes) {
  $('#cards').innerHTML = cafes.length ? cafes.map((cafe, index) => `<article class="cafe-card"><div class="cafe-photo">☕</div><div><h3>${index + 1}. ${cafe.name}<span class="match">${cafe.source}</span></h3><div class="meta">${cafe.address || '주소 정보 없음'}${cafe.phone ? ` · ${cafe.phone}` : ''}</div><div class="details"><span>${cafe.category || '카페'}</span>${cafe.distance ? `<span>${cafe.distance}m</span>` : ''}</div><div class="tags">외부 장소 데이터 · 상세 정보 확인 가능</div></div><a class="save" href="${cafe.url || '#'}" target="_blank" rel="noreferrer" title="장소 상세 보기">↗</a></article>`).join('') : '<div class="empty">검색 결과가 없습니다. 장소명이나 지역을 조금 더 구체적으로 입력해보세요.</div>';
}
async function renderResults() {
  const purpose = $('.purpose.selected').dataset.purpose, location = $('#location').value.trim(), people = $('#people').value, stay = $('#stay').value;
  const selected = [...document.querySelectorAll('.chip.selected')].map((item) => item.textContent.trim());
  $('#resultSummary').textContent = `${location} · ${purpose} · ${people} · ${stay} · ${selected.length}개 조건`;
  $('#cards').innerHTML = '<div class="empty">OpenAI 웹 검색으로 최신 카페 정보를 찾고 있습니다...</div>'; $('#results').classList.remove('hidden'); $('#results').scrollIntoView({ behavior: 'smooth' });
  try { const response = await fetch(`/api/search?query=${encodeURIComponent(`${location} 카페 ${purpose} ${$('#date').value || ''}`)}`); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || 'API 연결에 실패했습니다.'); renderCards(payload.results || []); }
  catch (error) { $('#cards').innerHTML = `<div class="empty">${error.message}<br><small>서버의 .env 설정에 외부 API 키를 등록한 뒤 다시 검색해주세요.</small></div>`; }
}
function renderHistory() { const history = JSON.parse(localStorage.getItem('cafeHistory') || '[]'); $('#historyList').innerHTML = history.length ? history.map((item) => `<div class="history-item"><div class="cafe-photo">☕</div><div><h3>${item.name}</h3><small>${item.date} · ${item.purpose}</small></div></div>`).join('') : '<div class="empty">외부 검색 결과에서 장소를 확인한 뒤 방문 이력을 저장할 수 있습니다.</div>'; }
function analyzePrompt() {
  const text = $('#prompt').value.trim();
  const purposeMap = [['집중 작업',['작업','업무','노트북']],['공부',['공부','스터디','시험']],['데이트',['데이트','연인']],['대화',['대화','친구']],['휴식',['휴식','힐링']],['모임',['모임','단체']]];
  const purpose = purposeMap.find(([, words]) => words.some((word) => text.includes(word)));
  if (purpose) document.querySelector(`[data-purpose="${purpose[0]}"]`).click();
  const place = text.match(/(.+?)(?:에서| 근처|의 카페)/);
  if (place) $('#location').value = place[1].replace(/^(오늘|내일|지금)\s+/, '').trim();
  const time = text.match(/(오늘|내일|지금)?\s*(오전|오후|저녁|밤)?\s*(\d{1,2})\s*시/);
  if (time) $('#date').value = `${time[1] || '오늘'} ${time[2] || ''}${time[2] ? ' ' : ''}${time[3]}시`.trim();
  const people = text.match(/(혼자|\d+명|\d+\s*~\s*\d+명)/);
  if (people) { const value = people[1] === '혼자' ? '1명' : people[1].replace(/\s/g, ''); const option = [...$('#people').options].find((item) => item.textContent === value); if (option) $('#people').value = option.value; }
  toast(`조건 반영 완료 · ${purpose ? purpose[0] : '방문 목적 확인 필요'} · ${$('#location').value}`);
}
$('#recommendBtn').addEventListener('click', renderResults); $('#parseBtn').addEventListener('click', analyzePrompt); $('#editBtn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
document.querySelectorAll('.nav-link').forEach((button) => button.addEventListener('click', () => { document.querySelectorAll('.nav-link').forEach((item) => item.classList.remove('active')); button.classList.add('active'); document.querySelectorAll('.view').forEach((item) => item.classList.remove('active-view')); $(`#${button.dataset.view}View`).classList.add('active-view'); if (button.dataset.view === 'history') renderHistory(); })); renderHistory();
