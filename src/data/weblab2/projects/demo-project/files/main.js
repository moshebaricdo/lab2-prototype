// ─────────────────────────────────────────────────────────────────────────────
//  Planet data
// ─────────────────────────────────────────────────────────────────────────────
const PLANETS = [
  {
    name: 'Mercury',
    type: 'Terrestrial Planet',
    color: '#b0afaf',
    glowColor: 'rgba(176,175,175,0.5)',
    orbitFrac: 0.135,
    radius: 3.5,
    speed: 0.0042,
    startAngle: 0.8,
    distFromEarth: '77M – 222M km',
    distFromSun: '57.9M km',
    avgTemp: '167°C (mean)',
    moons: 0,
    orbitalPeriod: '88 Earth days',
    desc: 'The smallest planet and closest to the Sun, Mercury endures brutal temperature extremes — from −180 °C at night to 430 °C under its midday sun. With almost no atmosphere to hold heat, its surface is a barren, heavily cratered landscape shaped by billions of years of impacts and contraction cracks called rupes.'
  },
  {
    name: 'Venus',
    type: 'Terrestrial Planet',
    color: '#e8c96d',
    glowColor: 'rgba(232,201,109,0.5)',
    orbitFrac: 0.215,
    radius: 5.5,
    speed: 0.003,
    startAngle: 2.1,
    distFromEarth: '38M – 261M km',
    distFromSun: '108.2M km',
    avgTemp: '464°C',
    moons: 0,
    orbitalPeriod: '225 Earth days',
    desc: 'Earth\'s near-twin in size, Venus is the hottest planet — hotter even than Mercury. A runaway greenhouse effect beneath 96% CO₂ atmosphere and clouds of sulfuric acid pushes surface pressure to 90× Earth\'s. Venus rotates so slowly that one day lasts longer than its year, and backwards relative to most planets.'
  },
  {
    name: 'Earth',
    type: 'Terrestrial Planet',
    color: '#4fa3e0',
    glowColor: 'rgba(79,163,224,0.5)',
    orbitFrac: 0.295,
    radius: 6,
    speed: 0.00235,
    startAngle: 4.5,
    distFromEarth: '—',
    distFromSun: '149.6M km',
    avgTemp: '15°C (mean)',
    moons: 1,
    orbitalPeriod: '365.25 days',
    desc: 'The only world confirmed to harbor life, Earth is a pale blue dot of liquid oceans, active plate tectonics, and a nitrogen–oxygen atmosphere sheltered by a global magnetic field. Its single large Moon stabilizes the axial tilt that gives Earth its seasons and moderates its climate over geological time.'
  },
  {
    name: 'Mars',
    type: 'Terrestrial Planet',
    color: '#c1440e',
    glowColor: 'rgba(193,68,14,0.5)',
    orbitFrac: 0.375,
    radius: 4.5,
    speed: 0.00175,
    startAngle: 1.3,
    distFromEarth: '56M – 401M km',
    distFromSun: '227.9M km',
    avgTemp: '−65°C (mean)',
    moons: 2,
    orbitalPeriod: '687 Earth days',
    desc: 'The Red Planet owes its hue to iron oxide dust blanketing a world of dramatic extremes — Olympus Mons, the solar system\'s tallest volcano, and Valles Marineris, a canyon system that would stretch across an entire continent. Seasonal dust storms can engulf the planet for months, and ancient river valleys hint at a warmer, wetter past.'
  },
  {
    name: 'Jupiter',
    type: 'Gas Giant',
    color: '#c88b3a',
    glowColor: 'rgba(200,139,58,0.4)',
    orbitFrac: 0.47,
    radius: 16,
    speed: 0.00095,
    startAngle: 5.8,
    distFromEarth: '588M – 968M km',
    distFromSun: '778.5M km',
    avgTemp: '−110°C (cloud tops)',
    moons: 95,
    orbitalPeriod: '11.9 Earth years',
    desc: 'The colossus of the solar system — more than twice the mass of all other planets combined. Jupiter\'s Great Red Spot is an anticyclonic storm wider than Earth that has raged for centuries. Its immense gravity deflects countless asteroids, shielding the inner planets. Galilean moons Io, Europa, Ganymede, and Callisto are worlds unto themselves.'
  },
  {
    name: 'Saturn',
    type: 'Gas Giant',
    color: '#e4d191',
    glowColor: 'rgba(228,209,145,0.4)',
    orbitFrac: 0.575,
    radius: 13,
    speed: 0.00065,
    startAngle: 3.3,
    distFromEarth: '1.2B – 1.67B km',
    distFromSun: '1.43B km',
    avgTemp: '−140°C (cloud tops)',
    moons: 146,
    orbitalPeriod: '29.5 Earth years',
    hasSaturnRings: true,
    desc: 'Saturn\'s iconic ring system — spanning 282,000 km but less than 1 km thick — is composed of billions of ice and rock fragments. The least dense planet, Saturn would float in water. Its moon Titan is the only moon with a dense atmosphere and hosts lakes of liquid methane, while Enceladus shoots geysers of water into space.'
  },
  {
    name: 'Uranus',
    type: 'Ice Giant',
    color: '#7de8e8',
    glowColor: 'rgba(125,232,232,0.4)',
    orbitFrac: 0.68,
    radius: 9.5,
    speed: 0.00042,
    startAngle: 2.7,
    distFromEarth: '2.57B – 3.15B km',
    distFromSun: '2.87B km',
    avgTemp: '−195°C',
    moons: 28,
    orbitalPeriod: '84 Earth years',
    desc: 'Uranus rolls around the Sun almost on its side with a 98° axial tilt, likely the result of a giant ancient collision. This gives it extreme 21-year seasons where one pole faces the Sun continuously. Its faint ring system was only discovered in 1977. Uranus radiates almost no internal heat — an enduring mystery among planetary scientists.'
  },
  {
    name: 'Neptune',
    type: 'Ice Giant',
    color: '#4466cc',
    glowColor: 'rgba(68,102,204,0.4)',
    orbitFrac: 0.785,
    radius: 9,
    speed: 0.00025,
    startAngle: 5.0,
    distFromEarth: '4.3B – 4.7B km',
    distFromSun: '4.5B km',
    avgTemp: '−200°C',
    moons: 16,
    orbitalPeriod: '165 Earth years',
    desc: 'The windiest planet in the solar system, with supersonic jet streams reaching 2,100 km/h. Neptune was the first planet discovered through mathematical prediction rather than direct observation. Its largest moon Triton orbits in a retrograde direction and is slowly spiralling inward, expected to be torn apart by Neptune\'s gravity in about 3.6 billion years.'
  }
];

// ─────────────────────────────────────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────────────────────────────────────
let selectedPlanet = null;
let hoveredPlanet  = null;
let time = 0;
let stars = [];
let animId = null;

// ─────────────────────────────────────────────────────────────────────────────
//  Canvas setup
// ─────────────────────────────────────────────────────────────────────────────
const canvas = document.getElementById('solar-canvas');
const ctx    = canvas.getContext('2d');
let W, H, cx, cy, maxR;

function resize() {
  const wrap = document.getElementById('canvas-wrap');
  const size = Math.min(wrap.clientWidth, wrap.clientHeight) * 0.96;
  canvas.width  = size;
  canvas.height = size;
  W = H = size;
  cx = cy = size / 2;
  maxR = size / 2 * 0.88;
  makeStars();
}

function makeStars() {
  stars = [];
  const count = Math.floor(W * H / 2800);
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.1 + 0.2,
      a: Math.random() * 0.65 + 0.2,
      twinkle: Math.random() * Math.PI * 2
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Draw helpers
// ─────────────────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function shadeColor(hex, pct) {
  const { r, g, b } = hexToRgb(hex);
  const f = 1 + pct / 100;
  return `rgb(${Math.min(255, r * f | 0)},${Math.min(255, g * f | 0)},${Math.min(255, b * f | 0)})`;
}

function drawStars() {
  stars.forEach(s => {
    const a = s.a * (0.7 + 0.3 * Math.sin(s.twinkle + time * 0.02));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200,215,255,${a})`;
    ctx.fill();
  });
}

function drawSun() {
  const g1 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 72);
  g1.addColorStop(0,    'rgba(255,210,60,0.22)');
  g1.addColorStop(0.35, 'rgba(255,140,20,0.10)');
  g1.addColorStop(0.65, 'rgba(255,80,0,0.04)');
  g1.addColorStop(1,    'rgba(255,40,0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, 72, 0, Math.PI * 2);
  ctx.fillStyle = g1;
  ctx.fill();

  const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, 34);
  g2.addColorStop(0,   'rgba(255,240,120,0.5)');
  g2.addColorStop(0.5, 'rgba(255,170,30,0.25)');
  g2.addColorStop(1,   'rgba(255,90,0,0)');
  ctx.beginPath();
  ctx.arc(cx, cy, 34, 0, Math.PI * 2);
  ctx.fillStyle = g2;
  ctx.fill();

  const gs = ctx.createRadialGradient(cx - 5, cy - 5, 0, cx, cy, 20);
  gs.addColorStop(0,   '#fff5b0');
  gs.addColorStop(0.4, '#ffc527');
  gs.addColorStop(1,   '#e06000');
  ctx.beginPath();
  ctx.arc(cx, cy, 20, 0, Math.PI * 2);
  ctx.fillStyle = gs;
  ctx.fill();
}

function drawOrbits() {
  PLANETS.forEach(p => {
    const r = p.orbitFrac * maxR;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.055)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

function getPlanetXY(p) {
  const r = p.orbitFrac * maxR;
  const a = p.startAngle + time * p.speed;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function drawSaturnRings(x, y, pr) {
  const rx = pr * 2.3;
  const ry = pr * 0.55;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2);
  ctx.strokeStyle = 'rgba(220,200,120,0.45)';
  ctx.lineWidth = pr * 0.82;
  ctx.stroke();
  ctx.restore();
}

function drawSaturnRingsFront(x, y, pr) {
  const rx = pr * 2.3;
  const ry = pr * 0.55;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
  ctx.strokeStyle = 'rgba(220,200,120,0.65)';
  ctx.lineWidth = pr * 0.82;
  ctx.stroke();
  ctx.restore();
}

function drawPlanet(p, pos) {
  const { x, y } = pos;
  const pr = p.radius;
  const isHov = hoveredPlanet  === p;
  const isSel = selectedPlanet === p;
  const { r, g, b } = hexToRgb(p.color);

  if (isHov || isSel) {
    const glowR = pr * (isSel ? 4 : 3.2);
    const glow  = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    glow.addColorStop(0,   `rgba(${r},${g},${b},0.28)`);
    glow.addColorStop(0.5, `rgba(${r},${g},${b},0.10)`);
    glow.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
  }

  if (isSel) {
    const pulse = 1 + 0.12 * Math.sin(time * 0.06);
    ctx.beginPath();
    ctx.arc(x, y, (pr + 6) * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(${r},${g},${b},0.7)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  if (p.hasSaturnRings) drawSaturnRings(x, y, pr);

  const grad = ctx.createRadialGradient(x - pr * 0.32, y - pr * 0.32, 0, x, y, pr);
  grad.addColorStop(0,   shadeColor(p.color, 35));
  grad.addColorStop(0.6, p.color);
  grad.addColorStop(1,   shadeColor(p.color, -40));
  ctx.beginPath();
  ctx.arc(x, y, pr, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(x, y, pr, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(${r},${g},${b},0.35)`;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  if (p.hasSaturnRings) drawSaturnRingsFront(x, y, pr);

  if (isHov || isSel) {
    ctx.font = `500 11px 'Space Grotesk', system-ui`;
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(220,235,255,0.88)';
    ctx.fillText(p.name, x, y - pr - 9);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  Animation loop
// ─────────────────────────────────────────────────────────────────────────────
function draw() {
  ctx.clearRect(0, 0, W, H);
  drawStars();
  drawOrbits();
  drawSun();

  PLANETS.forEach(p => {
    const pos = getPlanetXY(p);
    p._pos = pos;
    drawPlanet(p, pos);
  });

  time++;
  animId = requestAnimationFrame(draw);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Interaction
// ─────────────────────────────────────────────────────────────────────────────
function hitTest(mx, my) {
  for (let i = PLANETS.length - 1; i >= 0; i--) {
    const p = PLANETS[i];
    if (!p._pos) continue;
    const dx = mx - p._pos.x;
    const dy = my - p._pos.y;
    const hitR = Math.max(p.radius + 8, 14);
    if (dx * dx + dy * dy <= hitR * hitR) return p;
  }
  return null;
}

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (W / rect.width);
  const my = (e.clientY - rect.top)  * (H / rect.height);
  const hit = hitTest(mx, my);
  hoveredPlanet = hit;
  canvas.style.cursor = hit ? 'pointer' : 'default';
});

canvas.addEventListener('mouseleave', () => {
  hoveredPlanet = null;
  canvas.style.cursor = 'default';
});

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (W / rect.width);
  const my = (e.clientY - rect.top)  * (H / rect.height);
  const hit = hitTest(mx, my);
  if (hit) selectPlanet(hit);
});

function selectPlanet(planet) {
  selectedPlanet = planet;
  renderInfoPanel(planet);
  document.querySelectorAll('.planet-item').forEach(el => {
    el.classList.toggle('active', el.dataset.name === planet.name);
  });
  document.getElementById('info-panel').classList.add('open');
}

function deselectPlanet() {
  selectedPlanet = null;
  document.querySelectorAll('.planet-item').forEach(el => el.classList.remove('active'));
  document.getElementById('info-panel').classList.remove('open');
}

// ─────────────────────────────────────────────────────────────────────────────
//  Sidebar planet list
// ─────────────────────────────────────────────────────────────────────────────
function buildSidebar() {
  const list = document.getElementById('planet-list');
  PLANETS.forEach(p => {
    const item = document.createElement('div');
    item.className = 'planet-item';
    item.dataset.name = p.name;
    item.innerHTML = `
      <div class="planet-dot" style="background:${p.color}; color:${p.color};"></div>
      <div class="planet-item-text">
        <div class="planet-item-name">${p.name}</div>
        <div class="planet-item-dist">${p.distFromEarth}</div>
      </div>
    `;
    item.addEventListener('click', () => selectPlanet(p));
    list.appendChild(item);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  Info panel renderer
// ─────────────────────────────────────────────────────────────────────────────
function renderInfoPanel(p) {
  const inner = document.getElementById('info-inner');
  inner.innerHTML = `
    <div class="info-top">
      <div class="info-planet-swatch" style="background:${p.color}; box-shadow: 0 0 18px 4px ${p.glowColor};"></div>
      <div class="info-titles">
        <div class="info-planet-name">${p.name}</div>
        <div class="info-planet-type">${p.type}</div>
      </div>
      <button class="close-btn" id="info-close">×</button>
    </div>
    <div class="info-body">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Avg Temperature</div>
          <div class="stat-value">${p.avgTemp}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Moons</div>
          <div class="stat-value">${p.moons === 0 ? 'None' : p.moons}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Orbital Period</div>
          <div class="stat-value">${p.orbitalPeriod}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Distance from Sun</div>
          <div class="stat-value">${p.distFromSun}</div>
        </div>
        <div class="stat-card" style="grid-column: 1 / -1;">
          <div class="stat-label">Distance from Earth</div>
          <div class="stat-value">${p.distFromEarth}</div>
        </div>
      </div>
      <div class="info-desc-label">About</div>
      <div class="info-desc">${p.desc}</div>
    </div>
  `;
  document.getElementById('info-close').addEventListener('click', deselectPlanet);
}

// ─────────────────────────────────────────────────────────────────────────────
//  Responsive resize
// ─────────────────────────────────────────────────────────────────────────────
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resize, 60);
});

// ─────────────────────────────────────────────────────────────────────────────
//  Boot
// ─────────────────────────────────────────────────────────────────────────────
buildSidebar();
resize();
draw();
