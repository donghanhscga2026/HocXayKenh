/**
 *  vinhdanh.gs  —  1 file hoàn chỉnh (sửa lỗi: giữ mã '0' không bị bỏ qua)
 *  Hiển thị bảng vinh danh toàn bộ người có >=1 lượt giới thiệu
 *  + modal xem chi tiết đa tầng (chỉ hiện nút xem nếu count > 0)
 */

function showVinhDanhPage() {
  const defaultStart = new Date("2025-09-25T00:00:00");
  const defaultEnd = new Date();
  const ds = formatDateInput(defaultStart);
  const de = formatDateInput(defaultEnd);

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bảng Vinh Danh</title>
<style>
  :root {
    --text-color: #1F2937;
    --label-color: #6B7280;
    --border-color: #E5E7EB;
    --accent-color: #F59E0B; /* Vàng hổ phách */
    --accent-hover-color: #D97706; /* Vàng đậm hơn */
    --accent-soft-bg: #FFFBEB;
    --button-text-color: #1F2937;
    --card-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    --background-color: #F8F9FA;
    --card-bg-color: #FFFFFF;
    --table-header-bg: #F9FAFB;
  }

  body {
    font-family: 'Inter', sans-serif;
    background-color: var(--background-color);
    color: var(--text-color);
    margin: 0;
    padding: 28px;
  }

  .wrap {
    max-width: 1100px;
    margin: 0 auto;
    background: var(--card-bg-color);
    padding: 32px 40px;
    border-radius: 24px;
    box-shadow: var(--card-shadow);
    border: 1px solid var(--border-color);
  }

  h1 {
    text-align: center;
    margin: 0 0 12px;
    font-size: 30px;
    font-weight: 700;
    background: linear-gradient(90deg, #FBBF24, #F59E0B);
    -webkit-background-clip: text;
    -webkit-text-fill-color: #F59E0B;
    background-clip: text;
    text-fill-color: #9ca3af;
  }

  .meta {
    text-align: center;
    color: var(--label-color);
    margin-bottom: 24px;
  }

  .controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding: 16px;
    background-color: #F9FAFB;
    border-radius: 12px;
    border: 1px solid var(--border-color);
  }

  input[type=date] {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    transition: all 0.2s ease;
  }
  input[type=date]:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
    outline: none;
  }

  button.filterBtn {
    background: var(--accent-color);
    color: #f9fafb;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.2s ease;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
  }
  button.filterBtn:hover {
    background: var(--accent-hover-color);
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(217, 119, 6, 0.3);
  }

  .ranking-table {
    width: 100%;
    border-collapse: collapse;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid var(--border-color);
  }

  .ranking-table thead th {
    background-color: var(--accent-color);
    color: var(--background-color);
    padding: 14px;
    text-align: left;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--accent-hover-color);
  }

  .ranking-table tbody td {
    padding: 16px 14px;
    border-bottom: 1px solid var(--border-color);
    vertical-align: middle;
    transition: background-color 0.2s ease;
  }
  
  .ranking-table tbody tr:last-child td {
      border-bottom: none;
  }

  .ranking-table tbody tr:hover td {
    background-color: var(--accent-soft-bg);
  }

  .rankCell {
    width: 84px;
    text-align: center;
    font-weight: 700;
    font-size: 1.2em;
    color: var(--accent-hover-color);
  }
  .view-btn {
    background: #F3F4F6;
    color: #4B5563;
    border: none;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    transition: all 0.2s ease;
    margin-left: 12px;
  }
  .view-btn:hover {
    background-color: var(--accent-color);
    color: var(--button-text-color);
  }
  
  .no-data { text-align: center; padding: 40px; color: var(--label-color); }
  .summary { margin: 12px 0; text-align: right; font-weight: 600; color: var(--text-color); }
  .summary .highlight {
    color: var(--accent-hover-color);
    font-size: 1.1em;
  }
  /* --- [NÂNG CẤP] Modal --- */
  .modal {
    display: none;
    position: fixed;
    z-index: 1200;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(17, 24, 39, 0.6);
    backdrop-filter: blur(4px);
    padding: 20px;
    box-sizing: border-box;
    overflow-y: auto; /* Cho phép cuộn toàn bộ modal nếu cần */
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .modal-content {
    background: var(--card-bg-color);
    padding: 24px;
    border-radius: 16px;
    width: 100%;
    max-width: 780px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    position: relative;
    max-height: 90vh; /* Giới hạn chiều cao */
    display: flex;
    flex-direction: column;
  }
  .close {
    position: absolute;
    top: 16px;
    right: 20px;
    font-size: 28px;
    font-weight: 700;
    cursor: pointer;
    color: #9CA3AF;
    transition: color 0.2s ease;
  }
  .close:hover { color: var(--text-color); }
  
  .modal-title { color: var(--accent-hover-color); font-weight: 600; margin-bottom: 16px; }
  
  .modal-body {
      overflow-y: auto; /* Cho phép cuộn nội dung bên trong modal */
  }

  .detail-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
  }
  .detail-table th, .detail-table td { border: 1px solid var(--border-color); padding: 10px; text-align: left; }
  .detail-table th { background-color: #F9FAFB; font-weight: 600; }
  
  @media (max-width:720px){ 
    body { padding: 16px 8px; }
    .wrap { padding: 24px 16px; }
    .controls { flex-direction: column; gap: 10px; }
    .modal-content { padding: 20px; }
    h1 { font-size: 24px; }
    .ranking-table thead th,.ranking-table tbody td{padding:10px;font-size:13px}
  }
</style>
</head>
<body>
  <div class="wrap">
    <h1>🏆 BẢNG GHI NHẬN TOP KẾT NỐI NHÂN MẠCH </h1>
    <div class="meta">Thống kê mặc định từ <strong>25/09/2025</strong> → hôm nay. Chọn khoảng ngày để lọc.</div>

    <div class="controls">
      <label>Từ: <input type="date" id="startDate" value="${ds}"></label>
      <label>Đến: <input type="date" id="endDate" value="${de}"></label>
      <button class="filterBtn" id="btnFilter">📊 Xem bảng</button>
    </div>

    <div id="summary" class="summary"></div>
    <div id="resultArea" class="resultArea"></div>
  </div>

<script>
  document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('btnFilter').addEventListener('click', loadData);
    loadData();
  });

  function loadData(){
    const s = document.getElementById('startDate').value;
    const t = document.getElementById('endDate').value;
    document.querySelectorAll('.modal').forEach(m => m.remove());
    document.getElementById('resultArea').innerHTML = '<div class="no-data">Đang tải dữ liệu...</div>';
    google.script.run.withSuccessHandler(renderTable).withFailureHandler(err=>{
      document.getElementById('resultArea').innerHTML = '<div class="no-data">Lỗi: '+escapeHtml(String(err))+'</div>';
    }).getTopReferrals(s,t);
  }

  function renderTable(payload){
    const { data, total } = payload || {data:[], total:0};
    const summaryEl = document.getElementById('summary');
    const container = document.getElementById('resultArea');
    summaryEl.innerHTML = "Tổng số học viên được giới thiệu: <span class='highlight'>" + (total||0) + "</span>";
    container.innerHTML = '';

    if (!data || !data.length) {
      container.innerHTML = '<div class="no-data">Không có dữ liệu trong khoảng thời gian này.</div>';
      return;
    }

    // [NÂNG CẤP] Thêm wrapper cho bảng
    const tableWrapper = document.createElement('div');
    tableWrapper.className = 'table-wrapper';
    
    const table = document.createElement('table');
    table.className = 'ranking-table';
    const thead = document.createElement('thead');
    thead.innerHTML = '<tr><th class="rankCell">Hạng</th><th>Họ và tên</th><th>Mã học tập</th><th style="text-align:right;padding-right:18px">Số lượt giới thiệu</th></tr>';
    table.appendChild(thead);
    const tbody = document.createElement('tbody');

    let lastCount = null, lastRank = 0, processed = 0;

    data.forEach((item) => {
      processed++;
      if (item.count !== lastCount) {
        lastRank = processed;
        lastCount = item.count;
      }
      let rankHtml = ''+lastRank;
      if (lastRank===1) rankHtml='🏆'; else if(lastRank===2) rankHtml='🥈'; else if(lastRank===3) rankHtml='🥉';

      const tr=document.createElement('tr');
      tr.innerHTML = '<td class="rankCell">'+rankHtml+'</td>'+
                     '<td>'+escapeHtml(item.name||"")+'</td>'+
                      '<td>'+escapeHtml(item.code||"")+'</td>';
      const tdCount=document.createElement('td');
      tdCount.style.textAlign='right';tdCount.style.paddingRight='18px';
      const span=document.createElement('span');span.style.fontWeight='700';span.textContent=item.count;
      tdCount.appendChild(span);

      if(item.count>0){
        const btn=document.createElement('button');btn.className='view-btn';btn.textContent='Xem';btn.onclick=function(){ openDetail(item.code); };
        tdCount.appendChild(btn);
      }

      tr.appendChild(tdCount);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    tableWrapper.appendChild(table);
    container.appendChild(tableWrapper);
  }

  function openDetail(code){
    const s=document.getElementById('startDate').value;
    const t=document.getElementById('endDate').value;
    google.script.run.withSuccessHandler(showDetailModal).withFailureHandler(err=>{
      alert('Lỗi: '+err);
    }).getReferralDetails(code,s,t);
  }

  function showDetailModal(obj){
    if(!obj) { alert('Không có dữ liệu.'); return; }
    const modal=document.createElement('div');modal.className='modal';modal.style.display='flex';
    const mc=document.createElement('div');mc.className='modal-content';
    const close=document.createElement('span');close.className='close';close.innerHTML='&times;';close.onclick=function(){modal.remove();};
    mc.appendChild(close);

    const title=document.createElement('h3');
    title.className = 'modal-title';
    title.textContent='📜 Học viên do '+(obj.name||obj.code)+' giới thiệu ('+obj.count+')';
    mc.appendChild(title);
    
    // [NÂNG CẤP] Thêm wrapper cho nội dung modal để cuộn
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';

    const dtable=document.createElement('table');dtable.className='detail-table';
    dtable.innerHTML='<thead><tr><th>Mã học tập</th><th>Họ Tên</th><th>Ngày đăng ký</th><th style="text-align:center">Số giới thiệu</th><th>Xem tiếp</th></tr></thead>';
    const dtbody=document.createElement('tbody');

    if(obj.details && obj.details.length){
      obj.details.forEach(d=>{
        const dr=document.createElement('tr');
        dr.innerHTML = '<td>'+escapeHtml(d.code)+'</td><td>'+escapeHtml(d.name)+'</td><td>'+formatDateDisplayClient(d.date)+'</td><td style="text-align:center;font-weight:600">'+(d.count||0)+'</td>';
        const td = document.createElement('td');
        if((d.count||0) > 0){
          const b=document.createElement('button');b.className='view-btn';b.textContent='👁️';b.onclick=function(){ modal.remove(); openDetail(d.code); };
          td.appendChild(b);
        }
        dr.appendChild(td);
        dtbody.appendChild(dr);
      });
    } else {
      dtbody.innerHTML='<tr><td colspan=5 style="text-align:center;color:#667">Không có chi tiết.</td></tr>';
    }

    dtable.appendChild(dtbody); 
    modalBody.appendChild(dtable);
    mc.appendChild(modalBody);
    modal.appendChild(mc);
    
    modal.onclick = function(e){ if(e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
  }

  function formatDateDisplayClient(iso){
    try {
      const d = new Date(iso);
      if (isNaN(d)) return iso;
      return d.toLocaleString('vi-VN');
    } catch(e) { return iso; }
  }
  function escapeHtml(s){ if(s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
</script>`;

  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL).setTitle("Bảng Vinh Danh");
}


/** SERVER: tính toán dữ liệu — trả toàn bộ người có >=1 lượt giới thiệu (không cắt TopN) */
function getTopReferrals(startStr, endStr){
  const SHEET_NAME="Dky";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME);
  if(!sh) return {data:[], total:0};

  const all = sh.getDataRange().getValues();
  if(!all || all.length <= 1) return {data:[], total:0};

  const headers = all[0].map(h => String(h||'').trim());
  const rows = all.slice(1);

  // xác định cột — nếu không tìm thấy header tương ứng thì dùng fallback (A,B,C,D)
  const colCode = getColIndex(headers, ['mã code','mã học viên','mã','code'], 0);
  const colTime = getColIndex(headers, ['dấu thời gian','timestamp','thời gian','ngày đăng ký','ngày'], 1);
  const colName = getColIndex(headers, ['họ và tên','họ tên','tên','name'], 2);
  const colRef  = getColIndex(headers, ['mã người giới thiệu','mã giới thiệu','ref','mã referrer'], 3);

  // parse date window
  const defaultStart = new Date("2025-09-25T00:00:00");
  const defaultEnd = new Date();
  let start = defaultStart;
  let end = defaultEnd;
  if (startStr && String(startStr).trim()) start = new Date(String(startStr) + "T00:00:00");
  if (endStr && String(endStr).trim()) end = new Date(String(endStr) + "T23:59:59");

  // build code -> name map (for display)
  const codeToName = {};
  rows.forEach(r => {
    const code = (r[colCode] !== undefined && r[colCode] !== null) ? String(r[colCode]).trim() : '';
    const name = (r[colName] !== undefined && r[colName] !== null) ? String(r[colName]).trim() : '';
    if (code && name && !codeToName[code]) codeToName[code] = name;
  });

  // collect referrals: map referrerCode -> array of students (with date)
  const referrals = {};
  let total = 0; // total number of referred students in range

  rows.forEach(r => {
    const rawDate = r[colTime];
    const d = parseDateSafe(rawDate);
    if (!d || isNaN(d) || d < start || d > end) return;

    const ref = (r[colRef] !== undefined && r[colRef] !== null) ? String(r[colRef]).trim() : '';
    // now '0' (or numeric 0) will become "0" (not empty) and will be counted
    if (ref === '') return;

    const student = {
      code: (r[colCode] !== undefined && r[colCode] !== null) ? String(r[colCode]).trim() : '',
      name: (r[colName] !== undefined && r[colName] !== null) ? String(r[colName]).trim() : '',
      date: d.toISOString()
    };
    if (!referrals[ref]) referrals[ref] = [];
    referrals[ref].push(student);
    total++;
  });

  // build result array: for every referrer that has at least one referred
  const result = [];
  for (const code in referrals) {
    result.push({
      code: code,
      name: codeToName[code] || (referrals[code].length && referrals[code][0].name) || "(Không rõ)",
      count: referrals[code].length
    });
  }

  // filter to ensure >=1 (defensive)
  const filtered = result.filter(x => x.count > 0);

  // sort by count desc, then by code
  filtered.sort((a,b) => {
    if (b.count !== a.count) return b.count - a.count;
    return (''+a.code).localeCompare(b.code);
  });

  return { data: filtered, total: total };
}

/** SERVER: lấy chi tiết theo mã code (trả count cho từng học viên trong details) */
function getReferralDetails(code, startStr, endStr){
  const SHEET_NAME="Dky";
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(SHEET_NAME);
  if(!sh) return null;

  const all = sh.getDataRange().getValues();
  if(!all || all.length <= 1) return null;
  const headers = all[0].map(h=>String(h||'').trim());
  const rows = all.slice(1);

  const colCode = getColIndex(headers, ['mã code','mã học viên','mã','code'], 0);
  const colTime = getColIndex(headers, ['dấu thời gian','timestamp','thời gian','ngày đăng ký','ngày'], 1);
  const colName = getColIndex(headers, ['họ và tên','họ tên','tên','name'], 2);
  const colRef  = getColIndex(headers, ['mã người giới thiệu','mã giới thiệu','ref','mã referrer'], 3);

  // parse date window
  const defaultStart = new Date("2025-09-25T00:00:00");
  const defaultEnd = new Date();
  let start = defaultStart;
  let end = defaultEnd;
  if (startStr && String(startStr).trim()) start = new Date(String(startStr) + "T00:00:00");
  if (endStr && String(endStr).trim()) end = new Date(String(endStr) + "T23:59:59");

  // build code->name for convenience
  const codeToName = {};
  rows.forEach(r => {
    const c = (r[colCode] !== undefined && r[colCode] !== null) ? String(r[colCode]).trim() : '';
    const n = (r[colName] !== undefined && r[colName] !== null) ? String(r[colName]).trim() : '';
    if (c && n && !codeToName[c]) codeToName[c] = n;
  });

  // first compute how many people each code has referred (within date window)
  const referralCounts = {};
  rows.forEach(r => {
    const d = parseDateSafe(r[colTime]);
    if (!d || isNaN(d) || d < start || d > end) return;
    const ref = (r[colRef] !== undefined && r[colRef] !== null) ? String(r[colRef]).trim() : '';
    if (ref) referralCounts[ref] = (referralCounts[ref] || 0) + 1;
  });

  // now collect details for given code (who this code referred)
  const details = [];
  rows.forEach(r => {
    const d = parseDateSafe(r[colTime]);
    if (!d || isNaN(d) || d < start || d > end) return;
    const ref = (r[colRef] !== undefined && r[colRef] !== null) ? String(r[colRef]).trim() : '';
    if (ref !== String(code)) return;
    const studentCode = (r[colCode] !== undefined && r[colCode] !== null) ? String(r[colCode]).trim() : '';
    details.push({
      code: studentCode,
      name: (r[colName] !== undefined && r[colName] !== null) ? String(r[colName]).trim() : '',
      date: d.toISOString(),
      count: referralCounts[studentCode] || 0  // how many this student referred
    });
  });

  const name = codeToName[code] || "(Không rõ)";
  return { code: code, name: name, count: details.length, details: details };
}

/* ---------- helper ---------- */

function getColIndex(headers, candidates, fallbackIndex){
  const idx = findHeader(headers, candidates);
  return (idx !== -1) ? idx : (typeof fallbackIndex === 'number' ? fallbackIndex : -1);
}

// try parsing many common date types: Date object, ISO string, dd/mm/yyyy etc.
// returns Date object or null
function parseDateSafe(v){
  if (v instanceof Date) return v;
  if (v == null) return null;
  // if it's a number (Excel serial or ms timestamp), new Date(number) may work — handle numeric
  if (typeof v === 'number' && !isNaN(v)) {
    // Sheets usually returns Date objects for real dates; if it's a numeric Excel serial it's complicated.
    // But if it's a unix ms timestamp:
    const dnum = new Date(v);
    if (!isNaN(dnum)) return dnum;
  }
  const s = String(v).trim();
  if (!s) return null;
  // try ISO/normal Date parse
  const d1 = new Date(s);
  if (!isNaN(d1)) return d1;
  // try dd/mm/yyyy or dd-mm-yyyy
  const m = s.match(/^(\\d{1,2})[\\/\\-](\\d{1,2})[\\/\\-](\\d{2,4})$/);
  if (m){
    const day = Number(m[1]), mon = Number(m[2])-1, yr = Number(m[3]) + (m[3].length === 2 ? 2000 : 0);
    const d2 = new Date(yr, mon, day);
    if (!isNaN(d2)) return d2;
  }
  return null;
}

function findHeader(headers,cands){
  if(!headers || !cands) return -1;
  const cs = cands.map(x => String(x||'').toLowerCase());
  for (let i = 0; i < headers.length; i++){
    const h = String(headers[i]||'').toLowerCase();
    for (let j = 0; j < cs.length; j++){
      if (h.indexOf(cs[j]) !== -1) return i;
    }
  }
  return -1;
}

function formatDateInput(d){
  const y = d.getFullYear(),
        m = ('0' + (d.getMonth() + 1)).slice(-2),
        dd = ('0' + d.getDate()).slice(-2);
  return `${y}-${m}-${dd}`;
}
