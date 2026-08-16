/* ==========================================================================
   GAURAV NEPAL — PORTFOLIO — behaviour
   ========================================================================== */
(function(){
  'use strict';

  /* ---------------------------------------------------------- THEME ---- */
  const root = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');
  const toggleIcon = document.getElementById('toggle-icon');
  const SUN = 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1';
  const MOON = 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z';

  function applyTheme(t){
    root.setAttribute('data-theme', t);
    toggleIcon.setAttribute('d', t === 'light' ? SUN : MOON);
    try{ localStorage.setItem('gn-theme', t); }catch(e){}
  }
  let saved = null;
  try{ saved = localStorage.getItem('gn-theme'); }catch(e){}
  if(!saved){
    saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
  }
  applyTheme(saved);
  themeToggle.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ------------------------------------------------------ BLOCK ZOOM ---- */
  document.addEventListener('wheel', (e) => { if(e.ctrlKey) e.preventDefault(); }, { passive: false });
  document.addEventListener('keydown', (e) => {
    if((e.ctrlKey || e.metaKey) && ['+','-','=','0'].includes(e.key)) e.preventDefault();
  });
  document.addEventListener('gesturestart', (e) => e.preventDefault());
  document.addEventListener('touchmove', (e) => { if(e.scale && e.scale !== 1) e.preventDefault(); }, { passive: false });
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if(now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, false);

  /* ------------------------------------------------------- COSMOS BG ---- */
  const canvas = document.getElementById('cosmos');
  const ctx = canvas.getContext('2d');
  let stars = [], shootingStars = [], w, h, dpr;

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.floor((w * h) / 6000);
    stars = Array.from({length: count}, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.25,
      base: Math.random() * 0.5 + 0.35,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.015 + 0.005,
      drift: (Math.random() - 0.5) * 0.02
    }));
  }
  window.addEventListener('resize', resize);
  resize();

  function maybeSpawnShootingStar(){
    if(Math.random() < 0.0028 && shootingStars.length < 2){
      const startX = Math.random() * w * 0.6 + w * 0.2;
      shootingStars.push({ x: startX, y: -10, vx: 4.2, vy: 2.6, life: 1 });
    }
  }

  let t0 = performance.now();
  function drawCosmos(now){
    const dt = now - t0; t0 = now;
    ctx.clearRect(0, 0, w, h);
    const starRGB = getComputedStyle(root).getPropertyValue('--star').trim() || '255,255,255';

    for(const s of stars){
      s.phase += s.speed * (dt / 16);
      s.x += s.drift * (dt / 16);
      if(s.x < 0) s.x = w; if(s.x > w) s.x = 0;
      const tw = s.base + Math.sin(s.phase) * 0.35;
      ctx.beginPath();
      ctx.fillStyle = `rgba(${starRGB}, ${Math.max(0, tw)})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    maybeSpawnShootingStar();
    shootingStars.forEach((s) => {
      s.x += s.vx * (dt / 16); s.y += s.vy * (dt / 16); s.life -= 0.012 * (dt / 16);
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - 60, s.y - 36);
      grad.addColorStop(0, `rgba(${starRGB}, ${Math.max(0, s.life)})`);
      grad.addColorStop(1, `rgba(${starRGB}, 0)`);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(s.x - 60, s.y - 36);
      ctx.stroke();
    });
    shootingStars = shootingStars.filter(s => s.life > 0 && s.y < h + 50);

    requestAnimationFrame(drawCosmos);
  }
  requestAnimationFrame(drawCosmos);

  /* --------------------------------------------------- SCROLL SECTIONS -- */
  const scroller = document.getElementById('scroller');
  const panels = Array.from(document.querySelectorAll('section.panel'));
  const rail = document.getElementById('rail');

  panels.forEach((p, i) => {
    const dot = document.createElement('button');
    dot.className = 'rail-dot';
    dot.setAttribute('aria-label', 'Go to section ' + (i + 1));
    dot.addEventListener('click', () => p.scrollIntoView({ behavior: 'smooth' }));
    rail.appendChild(dot);
  });
  const dots = Array.from(rail.children);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const idx = panels.indexOf(entry.target);
      if(entry.isIntersecting){
        dots.forEach(d => d.classList.remove('active'));
        if(dots[idx]) dots[idx].classList.add('active');
        entry.target.querySelector('.reveal')?.classList.add('in');
      }
    });
  }, { root: scroller, threshold: 0.5 });
  panels.forEach(p => io.observe(p));

  document.querySelectorAll('[data-nav]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if(id && id.startsWith('#')){
        e.preventDefault();
        document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  /* ---------------------------------------------------- READOUT TOGGLE -- */
  const readout = document.getElementById('readout');
  document.getElementById('readout-toggle').addEventListener('click', () => {
    readout.classList.toggle('open');
  });

  /* --------------------------------------------------------- EMAIL POP -- */
  const emailBtn = document.getElementById('email-btn');
  const emailMenu = document.getElementById('email-menu');
  emailBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    emailMenu.classList.toggle('show');
  });
  document.addEventListener('click', () => emailMenu.classList.remove('show'));

  /* -------------------------------------------------------- ANALOG CLOCK -- */
  const clockSvg = document.getElementById('clock');
  const NS = 'http://www.w3.org/2000/svg';
  function makeClockFace(){
    clockSvg.innerHTML = '';
    const defs = document.createElementNS(NS, 'defs');
    defs.innerHTML = `
      <radialGradient id="faceGrad" cx="35%" cy="30%" r="75%">
        <stop offset="0%" stop-color="var(--bg-2)"/>
        <stop offset="100%" stop-color="var(--bg-0)"/>
      </radialGradient>`;
    clockSvg.appendChild(defs);

    const face = document.createElementNS(NS, 'circle');
    face.setAttribute('cx', 100); face.setAttribute('cy', 100); face.setAttribute('r', 96);
    face.setAttribute('fill', 'url(#faceGrad)');
    face.setAttribute('stroke', 'var(--border-strong)');
    face.setAttribute('stroke-width', 1.2);
    clockSvg.appendChild(face);

    for(let i = 0; i < 60; i++){
      const angle = (i / 60) * 2 * Math.PI;
      const isHour = i % 5 === 0;
      const r1 = isHour ? 80 : 88;
      const r2 = 92;
      const x1 = 100 + r1 * Math.sin(angle), y1 = 100 - r1 * Math.cos(angle);
      const x2 = 100 + r2 * Math.sin(angle), y2 = 100 - r2 * Math.cos(angle);
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', x1); line.setAttribute('y1', y1);
      line.setAttribute('x2', x2); line.setAttribute('y2', y2);
      line.setAttribute('stroke', isHour ? 'var(--accent)' : 'var(--fg-3)');
      line.setAttribute('stroke-width', isHour ? 2 : 0.75);
      line.setAttribute('opacity', isHour ? 0.9 : 0.4);
      clockSvg.appendChild(line);
    }

    ['hand-hour','hand-min','hand-sec'].forEach((id, idx) => {
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('id', id);
      line.setAttribute('x1', 100); line.setAttribute('y1', 100);
      line.setAttribute('x2', 100); line.setAttribute('y2', idx === 0 ? 55 : idx === 1 ? 34 : 24);
      line.setAttribute('stroke', idx === 2 ? 'var(--accent-warm)' : 'var(--fg-0)');
      line.setAttribute('stroke-width', idx === 0 ? 4 : idx === 1 ? 2.6 : 1.3);
      line.setAttribute('stroke-linecap', 'round');
      clockSvg.appendChild(line);
    });
    const pin = document.createElementNS(NS, 'circle');
    pin.setAttribute('cx', 100); pin.setAttribute('cy', 100); pin.setAttribute('r', 3.4);
    pin.setAttribute('fill', 'var(--accent-warm)');
    clockSvg.appendChild(pin);
  }
  makeClockFace();

  let tzOffsetMinutes = null; // minutes offset from UTC for visitor's locale, from IP lookup
  let cityLabel = null;

  function tick(){
    const now = new Date();
    let visitorTime = now;
    if(tzOffsetMinutes !== null){
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      visitorTime = new Date(utcMs + tzOffsetMinutes * 60000);
    }
    const h = visitorTime.getHours() % 12;
    const m = visitorTime.getMinutes();
    const s = visitorTime.getSeconds();
    const ms = visitorTime.getMilliseconds();

    const secDeg = ((s + ms / 1000) / 60) * 360;
    const minDeg = ((m + s / 60) / 60) * 360;
    const hourDeg = ((h + m / 60) / 12) * 360;

    const hh = document.getElementById('hand-hour');
    const hm = document.getElementById('hand-min');
    const hs = document.getElementById('hand-sec');
    if(hh) hh.setAttribute('transform', `rotate(${hourDeg} 100 100)`);
    if(hm) hm.setAttribute('transform', `rotate(${minDeg} 100 100)`);
    if(hs) hs.setAttribute('transform', `rotate(${secDeg} 100 100)`);

    const digital = document.getElementById('clock-digital');
    if(digital){
      const pad = n => String(n).padStart(2, '0');
      const displayH = visitorTime.getHours();
      const ampm = displayH >= 12 ? 'PM' : 'AM';
      const h12 = displayH % 12 === 0 ? 12 : displayH % 12;
      digital.innerHTML = `${pad(h12)}:${pad(m)}:${pad(s)} <b>${ampm}${cityLabel ? ' · ' + cityLabel : ''}</b>`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  /* ------------------------------------------------- IP LOCATION (no ---- 
     browser permission prompt) — feeds both the clock's timezone and
     the weather widget's coordinates. Falls back to system locale /
     device timezone if the lookup is unreachable. ------------------- */
  async function locateVisitor(){
    // primary: ipapi.co
    try{
      const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
      if(!res.ok) throw new Error('lookup failed');
      const data = await res.json();
      if(data.error) throw new Error('lookup error');
      if(typeof data.utc_offset === 'string'){
        const m = data.utc_offset.match(/^([+-])(\d{2})(\d{2})$/);
        if(m) tzOffsetMinutes = (m[1] === '-' ? -1 : 1) * (parseInt(m[2],10) * 60 + parseInt(m[3],10));
      }
      cityLabel = data.city || data.region || data.country_name || null;
      return loadWeather(data.latitude, data.longitude, cityLabel);
    }catch(err){ /* fall through to backup provider */ }

    // backup: ipwho.is
    try{
      const res = await fetch('https://ipwho.is/', { cache: 'no-store' });
      const data = await res.json();
      if(data.success === false) throw new Error('lookup error');
      if(data.timezone && typeof data.timezone.utc === 'string'){
        const m = data.timezone.utc.match(/^UTC([+-])(\d{2}):(\d{2})$/);
        if(m) tzOffsetMinutes = (m[1] === '-' ? -1 : 1) * (parseInt(m[2],10) * 60 + parseInt(m[3],10));
      }
      cityLabel = data.city || data.region || data.country || null;
      return loadWeather(data.latitude, data.longitude, cityLabel);
    }catch(err){ /* fall through to device fallback */ }

    // last resort: device timezone offset, no precise coordinates for weather
    tzOffsetMinutes = -new Date().getTimezoneOffset();
    cityLabel = Intl.DateTimeFormat().resolvedOptions().timeZone?.split('/').pop()?.replace('_',' ') || null;
    loadWeatherFallback();
  }
  locateVisitor();

  /* ------------------------------------------------------------ WEATHER -- */
  const WMO = {
    0:['Clear sky', sunIcon], 1:['Mainly clear', sunIcon], 2:['Partly cloudy', cloudIcon], 3:['Overcast', cloudIcon],
    45:['Fog', cloudIcon], 48:['Fog', cloudIcon],
    51:['Light drizzle', rainIcon], 53:['Drizzle', rainIcon], 55:['Dense drizzle', rainIcon],
    61:['Light rain', rainIcon], 63:['Rain', rainIcon], 65:['Heavy rain', rainIcon],
    71:['Light snow', snowIcon], 73:['Snow', snowIcon], 75:['Heavy snow', snowIcon],
    80:['Rain showers', rainIcon], 81:['Rain showers', rainIcon], 82:['Violent showers', rainIcon],
    95:['Thunderstorm', stormIcon], 96:['Thunderstorm', stormIcon], 99:['Thunderstorm', stormIcon]
  };
  function sunIcon(){ return '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>'; }
  function cloudIcon(){ return '<path d="M6.5 19a4.5 4.5 0 1 1 .82-8.93A6 6 0 0 1 19 12.5 3.5 3.5 0 0 1 18.5 19h-12z"/>'; }
  function rainIcon(){ return '<path d="M6.5 15a4.5 4.5 0 1 1 .82-8.93A6 6 0 0 1 19 8.5 3.5 3.5 0 0 1 18.5 15h-12z"/><path d="M8 18l-1 3M12 18l-1 3M16 18l-1 3"/>'; }
  function snowIcon(){ return '<path d="M6.5 15a4.5 4.5 0 1 1 .82-8.93A6 6 0 0 1 19 8.5 3.5 3.5 0 0 1 18.5 15h-12z"/><path d="M9 19l.01.01M12 20l.01.01M15 19l.01.01"/>'; }
  function stormIcon(){ return '<path d="M6.5 15a4.5 4.5 0 1 1 .82-8.93A6 6 0 0 1 19 8.5 3.5 3.5 0 0 1 18.5 15h-12z"/><path d="M13 15l-3 5h3l-2 4"/>'; }

  function paintWeather(temp, code, place){
    const icon = document.getElementById('weather-icon');
    const t = document.getElementById('weather-temp');
    const d = document.getElementById('weather-desc');
    const l = document.getElementById('weather-loc');
    const [desc, iconFn] = WMO[code] || ['—', cloudIcon];
    icon.innerHTML = iconFn();
    t.textContent = (temp !== null && temp !== undefined) ? Math.round(temp) + '°' : '--°';
    d.textContent = desc;
    l.textContent = place || '';
  }

  async function loadWeather(lat, lon, place){
    if(lat == null || lon == null) return loadWeatherFallback();
    try{
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
      const data = await res.json();
      const cw = data.current_weather;
      paintWeather(cw?.temperature, cw?.weathercode, place);
    }catch(err){
      loadWeatherFallback();
    }
  }
  function loadWeatherFallback(){
    const d = document.getElementById('weather-desc');
    const l = document.getElementById('weather-loc');
    if(d) d.textContent = 'Unavailable';
    if(l) l.textContent = '';
  }

  /* ------------------------------------------------------------ SPOTIFY -- */
  async function loadSpotify(){
    const statusEl = document.getElementById('spotify-status');
    const trackEl = document.getElementById('spotify-track');
    const artistEl = document.getElementById('spotify-artist');
    const artWrap = document.querySelector('.spotify-art');
    const spotifyCard = document.querySelector('.spotify-card');
    try{
      const res = await fetch('/api/now-playing', { cache: 'no-store' });
      if(!res.ok) throw new Error('offline');
      const data = await res.json();
      if(data && data.status === 'playing' && data.isPlaying){
	spotifyCard?.setAttribute('data-spotify-state', 'playing');
        statusEl.textContent = 'NOW PLAYING';
        trackEl.textContent = `Gaurav's listening to "${data.title}"`;
        artistEl.textContent = `${data.artist} — ${data.album || ''}`;
        if(artWrap) artWrap.innerHTML = '<div class="spotify-bars"><span></span><span></span><span></span></div>';
      }else if(data && data.status === 'paused'){
	spotifyCard?.setAttribute('data-spotify-state', 'paused');
        statusEl.textContent = 'PAUSED';
        trackEl.textContent = `Gaurav paused "${data.title}"`;
        artistEl.textContent = `${data.artist} — ${data.album || ''}`;
        if(artWrap) artWrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/></svg>';
      }else{ setOffline(); }
    }catch(err){ setOffline(); }
    function setOffline(){
	spotifyCard?.setAttribute('data-spotify-state', 'offline');
      statusEl.textContent = 'SPOTIFY';
      trackEl.textContent = 'Gaurav is offline on Spotify';
      artistEl.textContent = '';
      if(artWrap) artWrap.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9.5"/><path d="M7 10.2c3-1 7-.6 9.4.9M7.6 13.4c2.4-.8 5.6-.5 7.6.8M8.2 16.4c2-.6 4.4-.4 6 .6"/></svg>';
    }
  }
  loadSpotify();
  setInterval(loadSpotify, 3000);

  /* -------------------------------------------------------- DNA GRID ---- */
  const tools = [
    { name: 'ETABS', mark: 'ET', url: 'https://www.csiamerica.com/products/etabs' },
    { name: 'Revit', mark: 'RV', url: 'https://www.autodesk.com/products/revit/overview' },
    { name: 'AutoCAD', mark: 'AC', url: 'https://www.autodesk.com/products/autocad/overview' },
    { name: 'Python', mark: 'PY', url: 'https://www.python.org/downloads/' },
    { name: 'OpenSees', mark: 'OS', url: 'https://opensees.berkeley.edu/' },
    { name: 'Abaqus', mark: 'AB', url: 'https://www.3ds.com/products/simulia/abaqus' }
  ];
  const dnaGrid = document.getElementById('dna-grid');
  tools.forEach(tool => {
    const a = document.createElement('a');
    a.className = 'dna-tile';
    a.href = tool.url; a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML = `<div class="dna-mark">${tool.mark}</div><div class="dna-name">${tool.name}</div>`;
    dnaGrid.appendChild(a);
  });

  /* --------------------------------------------------------- TIMELINE --- */
  const experience = [
    {
      role: 'Quality and EHS Manager', meta: 'ZTE Nepal Pvt. Ltd. · Feb 2026 — Jul 2026',
      items: [
        'Formulated comprehensive quality and health & safety (EHS) planning schemes, including demonstration-site photo documentation for site standards.',
        'Organized pre-engineering training programs for subcontractors and led post-training evaluations.',
        'Directed overall project quality control and ensured EHS practices met the highest safety standards.',
        'Led and managed the quality and subcontractor teams, driving accountability and performance.',
        'Supervised construction, installation, commissioning, and acceptance of telecommunication sites.',
        'Produced regular quality/EHS problem classification reports and reviewed spot-check findings for accuracy.'
      ]
    },
    {
      role: 'EHS and QC Engineer', meta: 'ZTE Nepal Pvt. Ltd. · Aug 2025 — Feb 2026',
      items: [
        'Conducted quality control checks and EHS inspections across active telecom site installations.',
        'Assisted in developing site safety protocols and quality checklists aligned with company standards.',
        'Reported on-site non-conformances and coordinated corrective actions with subcontractor teams.'
      ]
    },
    {
      role: 'Civil Engineer', meta: 'Joshi Nirman Private Limited · Jan 2023 — Jul 2024',
      items: [
        'Carried out structural analysis and design of RCC buildings using ETABS, optimizing member sizing and reinforcement detailing.',
        'Prepared structural drawings, BOQs, and cost estimates for multiple residential and commercial projects.',
        'Coordinated with architects and site teams to resolve structural design conflicts during construction.',
        'Supervised site execution to ensure structural work met design specifications and quality standards.'
      ]
    },
    {
      role: 'Civil Engineer (Intern)', meta: 'Engic Group of Company Pvt. Ltd. · Oct 2022 — Jan 2023',
      items: [
        'Assisted in structural analysis and design of RCC building elements using ETABS, ensuring compliance with relevant design codes.',
        'Prepared and reviewed structural drawings and detailing in AutoCAD and Revit under senior engineer supervision.',
        'Supported quantity take-offs and material estimation for ongoing structural projects.',
        'Conducted site visits to verify structural work against approved drawings.'
      ]
    }
  ];
  const timelineEl = document.getElementById('timeline');
  experience.forEach((job, i) => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <button class="timeline-head">
        <span>
          <span class="timeline-role">${job.role}</span>
          <div class="timeline-meta">${job.meta}</div>
        </span>
        <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div class="timeline-body"><ul>${job.items.map(li => `<li>${li}</li>`).join('')}</ul></div>`;
    item.querySelector('.timeline-head').addEventListener('click', () => {

  const wasOpen = item.classList.contains('open');

  document.querySelectorAll('.timeline-item.open').forEach(openItem => {
    openItem.classList.remove('open');
  });

  if (!wasOpen) {
    item.classList.add('open');
  }

});
    timelineEl.appendChild(item);
  });

  /* ------------------------------------------------------ FRAGILITY VIZ -- */
  const fragilitySvg = document.getElementById('fragility-svg');
  const topics = [
    { label: 'Fragility curves', mu: 0.35, beta: 0.35 },
    { label: 'Seismic engineering', mu: 0.45, beta: 0.28 },
    { label: 'Non-linear analysis', mu: 0.55, beta: 0.32 },
    { label: 'Computational engineering', mu: 0.4, beta: 0.4 },
    { label: 'Structural data visualization', mu: 0.5, beta: 0.22 }
  ];
  function erf(x){
    const sign = x < 0 ? -1 : 1; x = Math.abs(x);
    const a1=0.254829592,a2=-0.284496736,a3=1.421413741,a4=-1.453152027,a5=1.061405429,p=0.3275911;
    const t = 1/(1+p*x);
    const y = 1-((((a5*t+a4)*t+a3)*t+a2)*t+a1)*t*Math.exp(-x*x);
    return sign*y;
  }
  function lognormalCdf(x, mu, beta){
    if(x <= 0) return 0;
    return 0.5 * (1 + erf((Math.log(x) - Math.log(mu)) / (beta * Math.SQRT2)));
  }
  function pathFor(mu, beta){
    const W = 400, H = 300, pad = 34;
    let d = '';
    for(let i = 0; i <= 100; i++){
      const x = i / 100;
      const y = lognormalCdf(x * 1.4, mu, beta);
      const px = pad + x * (W - pad * 2);
      const py = (H - pad) - y * (H - pad * 2);
      d += (i === 0 ? 'M' : 'L') + px.toFixed(1) + ',' + py.toFixed(1) + ' ';
    }
    return d;
  }
  function renderFragility(activeIdx){
    let inner = `<g stroke="var(--grid-line-strong)" stroke-width="1">`;
    for(let i = 1; i < 4; i++){
      const y = 34 + i * ((300 - 68) / 4);
      inner += `<line x1="34" y1="${y}" x2="366" y2="${y}"/>`;
    }
    inner += `</g>`;
    topics.forEach((t, i) => {
      const active = i === activeIdx;
      inner += `<path d="${pathFor(t.mu, t.beta)}" fill="none"
        stroke="${active ? 'var(--accent)' : 'var(--fg-3)'}"
        stroke-width="${active ? 2.6 : 1.2}"
        opacity="${active ? 1 : 0.35}"
        stroke-linecap="round"
        style="transition: all .4s ease;"/>`;
    });
    inner += `<line x1="34" y1="266" x2="366" y2="266" stroke="var(--border-strong)" stroke-width="1"/>`;
    inner += `<line x1="34" y1="34" x2="34" y2="266" stroke="var(--border-strong)" stroke-width="1"/>`;
    inner += `<text x="34" y="284" fill="var(--fg-3)" font-family="JetBrains Mono, monospace" font-size="9">DEMAND</text>`;
    inner += `<text x="8" y="40" fill="var(--fg-3)" font-family="JetBrains Mono, monospace" font-size="9" transform="rotate(-90 8 40)">P(FAILURE)</text>`;
    fragilitySvg.innerHTML = inner;
  }
  let activeTopic = 0;
  renderFragility(activeTopic);
  const chips = Array.from(document.querySelectorAll('.chip'));
  chips[0].classList.add('active');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeTopic = parseInt(chip.dataset.idx, 10);
      renderFragility(activeTopic);
    });
  });
  setInterval(() => {
    activeTopic = (activeTopic + 1) % topics.length;
    chips.forEach(c => c.classList.remove('active'));
    chips[activeTopic].classList.add('active');
    renderFragility(activeTopic);
  }, 4500);

})();
