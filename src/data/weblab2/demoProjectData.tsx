import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";
import type { RubricData } from "../../components/lab2/resource-panel/views/RubricPanel";

/* ================================================================== */
/*  File structure                                                     */
/* ================================================================== */

const INDEX_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stellar Atlas</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <div class="app">

    <!-- ===== TOP BAR ===== -->
    <header class="topbar">
      <div class="topbar-left">
        <span class="app-logo">&#x2728;</span>
        <span class="app-name">Stellar Atlas</span>
      </div>
      <div class="topbar-right">
        <span class="status-dot"></span>
        <span class="status-label">Live Orbits</span>
      </div>
    </header>

    <!-- ===== SIDEBAR: PLANET LIST ===== -->
    <nav class="sidebar">
      <div class="sidebar-heading">Planets</div>

      <button class="planet-item">
        <span class="planet-dot" style="background: #b5b5b5"></span>
        <span class="planet-label">Mercury</span>
        <span class="planet-dist">57.9M km</span>
      </button>
      <button class="planet-item">
        <span class="planet-dot" style="background: #e8cda0"></span>
        <span class="planet-label">Venus</span>
        <span class="planet-dist">108.2M km</span>
      </button>
      <button class="planet-item active">
        <span class="planet-dot" style="background: #4da6ff"></span>
        <span class="planet-label">Earth</span>
        <span class="planet-dist">149.6M km</span>
      </button>
      <button class="planet-item">
        <span class="planet-dot" style="background: #e85d3a"></span>
        <span class="planet-label">Mars</span>
        <span class="planet-dist">227.9M km</span>
      </button>
      <button class="planet-item">
        <span class="planet-dot" style="background: #c4956a"></span>
        <span class="planet-label">Jupiter</span>
        <span class="planet-dist">778.5M km</span>
      </button>
      <button class="planet-item">
        <span class="planet-dot" style="background: #e8d374"></span>
        <span class="planet-label">Saturn</span>
        <span class="planet-dist">1.43B km</span>
      </button>
      <button class="planet-item">
        <span class="planet-dot" style="background: #7ec8e3"></span>
        <span class="planet-label">Uranus</span>
        <span class="planet-dist">2.87B km</span>
      </button>
      <button class="planet-item">
        <span class="planet-dot" style="background: #3f54ba"></span>
        <span class="planet-label">Neptune</span>
        <span class="planet-dist">4.5B km</span>
      </button>

      <div class="sidebar-footer">
        <p>Built by Aaliyah M.</p>
        <p>AP CS Principles — Period 3</p>
      </div>
    </nav>

    <!-- ===== MAIN VIEWPORT ===== -->
    <main class="viewport">
      <div class="stars"></div>
      <div class="stars stars-2"></div>

      <div class="solar-system">
        <div class="sun"></div>

        <div class="orbit orbit-1">
          <div class="planet mercury" title="Mercury"></div>
        </div>
        <div class="orbit orbit-2">
          <div class="planet venus" title="Venus"></div>
        </div>
        <div class="orbit orbit-3">
          <div class="planet earth" title="Earth">
            <div class="moon"></div>
          </div>
        </div>
        <div class="orbit orbit-4">
          <div class="planet mars" title="Mars"></div>
        </div>
        <div class="orbit orbit-5">
          <div class="planet jupiter" title="Jupiter"></div>
        </div>
        <div class="orbit orbit-6">
          <div class="planet saturn" title="Saturn">
            <div class="saturn-ring"></div>
          </div>
        </div>
      </div>
    </main>

    <!-- ===== DETAIL PANEL ===== -->
    <aside class="detail-panel">
      <div class="detail-header">
        <div class="detail-planet-dot" style="background: #4da6ff; box-shadow: 0 0 8px rgba(77,166,255,0.5)"></div>
        <div>
          <h2 class="detail-name">Earth</h2>
          <p class="detail-type">Terrestrial Planet</p>
        </div>
      </div>

      <div class="detail-stats">
        <div class="stat">
          <span class="stat-value">12,756 km</span>
          <span class="stat-label">Diameter</span>
        </div>
        <div class="stat">
          <span class="stat-value">1</span>
          <span class="stat-label">Moons</span>
        </div>
        <div class="stat">
          <span class="stat-value">365.25 d</span>
          <span class="stat-label">Orbit</span>
        </div>
        <div class="stat">
          <span class="stat-value">15 °C</span>
          <span class="stat-label">Avg Temp</span>
        </div>
      </div>

      <div class="detail-body">
        <p>
          The only planet known to support life. Earth's atmosphere
          and magnetic field protect us from solar radiation. 71% of
          the surface is covered by water.
        </p>
      </div>

      <div class="detail-tags">
        <span class="tag">Habitable Zone</span>
        <span class="tag">Atmosphere</span>
        <span class="tag">Water</span>
        <span class="tag">Magnetic Field</span>
      </div>
    </aside>

  </div>

</body>
</html>`;

const STYLE_CSS = `/* ==============================================
   Stellar Atlas — App Stylesheet
   by Aaliyah M.
   ============================================== */

@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

/* ---------- Reset & Base ---------- */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Space Grotesk', system-ui, sans-serif;
  background: #08090e;
  color: #e0e0e0;
  height: 100vh;
  overflow: hidden;
}

/* ---------- App Layout ---------- */
/* Using CSS Grid for the whole app — 3 areas!
   topbar spans the full width,
   sidebar is the left column,
   viewport is the main area,
   detail-panel sits at the bottom of the viewport */

.app {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: 48px 1fr 180px;
  grid-template-areas:
    "topbar  topbar"
    "sidebar viewport"
    "sidebar detail";
  height: 100vh;
  overflow: hidden;
}

/* ---------- Top Bar ---------- */

.topbar {
  grid-area: topbar;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.app-logo {
  font-size: 1.1rem;
}

.app-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.status-dot {
  width: 6px;
  height: 6px;
  background: #34d399;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.35);
  font-weight: 500;
}

/* ---------- Sidebar ---------- */

.sidebar {
  grid-area: sidebar;
  background: rgba(255, 255, 255, 0.02);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-heading {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.3);
  padding: 0 1rem;
  margin-bottom: 0.5rem;
}

.planet-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 1rem;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.55);
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  text-align: left;
  width: 100%;
}

.planet-item:hover {
  background: rgba(255, 255, 255, 0.04);
  color: #ffffff;
}

.planet-item.active {
  background: rgba(77, 166, 255, 0.08);
  color: #ffffff;
}

.planet-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.planet-label {
  flex: 1;
}

.planet-dist {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.2);
  font-weight: 400;
}

.sidebar-footer {
  margin-top: auto;
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-footer p {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.2);
  line-height: 1.5;
}

/* ---------- Main Viewport ---------- */

.viewport {
  grid-area: viewport;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at center, #0d1020 0%, #08090e 70%);
}

/* ---------- Starfield ---------- */

.stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow:
    40px 20px #fff, 130px 80px #fff, 250px 45px #fff,
    380px 120px #fff, 500px 30px #fff, 620px 90px #fff,
    80px 160px #fff, 200px 200px #fff, 340px 170px #fff,
    460px 210px #fff, 560px 155px #fff, 690px 50px #fff,
    50px 280px #fff, 180px 310px #fff, 310px 260px #fff,
    440px 300px #fff, 580px 270px #fff, 700px 130px #fff,
    110px 370px #fff, 240px 400px #fff, 360px 350px #fff,
    500px 390px #fff, 640px 360px #fff, 30px 430px #fff,
    750px 210px #fff, 800px 70px #fff, 850px 310px #fff;
  animation: twinkle 4s ease-in-out infinite alternate;
}

.stars-2 {
  width: 1px;
  height: 1px;
  box-shadow:
    70px 55px rgba(255,255,255,0.4), 190px 130px rgba(255,255,255,0.4),
    310px 75px rgba(255,255,255,0.4), 440px 180px rgba(255,255,255,0.4),
    570px 95px rgba(255,255,255,0.4), 100px 230px rgba(255,255,255,0.4),
    230px 270px rgba(255,255,255,0.4), 370px 220px rgba(255,255,255,0.4);
  animation: twinkle 6s ease-in-out infinite alternate-reverse;
}

@keyframes twinkle {
  from { opacity: 0.5; }
  to { opacity: 1; }
}

/* ---------- Solar System ---------- */

.solar-system {
  position: relative;
  width: 520px;
  height: 520px;
}

.sun {
  position: absolute;
  width: 44px;
  height: 44px;
  background: radial-gradient(circle, #fff7a8, #ffd700, #ff8c00);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow:
    0 0 20px #ffd700,
    0 0 40px rgba(255, 215, 0, 0.5),
    0 0 80px rgba(255, 140, 0, 0.25),
    0 0 120px rgba(255, 100, 0, 0.1);
  z-index: 10;
}

.orbit {
  position: absolute;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  animation: spin linear infinite;
}

.orbit-1 { width: 100px;  height: 100px;  margin: -50px  0 0 -50px;  animation-duration: 6s; }
.orbit-2 { width: 150px;  height: 150px;  margin: -75px  0 0 -75px;  animation-duration: 10s; }
.orbit-3 { width: 210px;  height: 210px;  margin: -105px 0 0 -105px; animation-duration: 16s; }
.orbit-4 { width: 275px;  height: 275px;  margin: -137px 0 0 -137px; animation-duration: 22s; }
.orbit-5 { width: 370px;  height: 370px;  margin: -185px 0 0 -185px; animation-duration: 30s; }
.orbit-6 { width: 460px;  height: 460px;  margin: -230px 0 0 -230px; animation-duration: 40s; }

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ---------- Planets ---------- */

.planet {
  position: absolute;
  border-radius: 50%;
  top: -5px;
  left: 50%;
  margin-left: -5px;
}

.mercury {
  width: 6px; height: 6px;
  background: #b5b5b5;
  top: -3px; margin-left: -3px;
  animation: counter-spin 6s linear infinite;
}

.venus {
  width: 9px; height: 9px;
  background: #e8cda0;
  top: -4px; margin-left: -4px;
  animation: counter-spin 10s linear infinite;
}

.earth {
  width: 10px; height: 10px;
  background: #4da6ff;
  animation: counter-spin 16s linear infinite;
  box-shadow: 0 0 8px rgba(77, 166, 255, 0.6);
}

.moon {
  width: 3px; height: 3px;
  background: #aaa;
  border-radius: 50%;
  position: absolute;
  top: -6px; left: 50%; margin-left: -1.5px;
  animation: spin 3s linear infinite;
}

.mars {
  width: 8px; height: 8px;
  background: #e85d3a;
  top: -4px; margin-left: -4px;
  animation: counter-spin 22s linear infinite;
}

.jupiter {
  width: 18px; height: 18px;
  background: radial-gradient(circle at 40% 40%, #d4a574, #a67c52);
  top: -9px; margin-left: -9px;
  animation: counter-spin 30s linear infinite;
  box-shadow: 0 0 10px rgba(212, 165, 116, 0.25);
}

.saturn {
  width: 14px; height: 14px;
  background: #e8d374;
  top: -7px; margin-left: -7px;
  animation: counter-spin 40s linear infinite;
}

.saturn-ring {
  position: absolute;
  width: 26px; height: 8px;
  border: 1.5px solid rgba(232, 211, 116, 0.5);
  border-radius: 50%;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%) rotateX(65deg);
}

@keyframes counter-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
}

/* ---------- Detail Panel ---------- */

.detail-panel {
  grid-area: detail;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.detail-planet-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.detail-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.2;
}

.detail-type {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.3);
  font-weight: 500;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #ffffff;
}

.stat-label {
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.25);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-body p {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.45);
  line-height: 1.6;
}

.detail-tags {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.tag {
  font-size: 0.65rem;
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  border-radius: 100px;
  background: rgba(77, 166, 255, 0.08);
  color: rgba(77, 166, 255, 0.7);
  border: 1px solid rgba(77, 166, 255, 0.12);
}`;

const FACTS_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Planet Data — Stellar Atlas</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <div class="app" style="grid-template-rows: 48px 1fr; grid-template-areas: 'topbar topbar' 'sidebar main';">

    <header class="topbar">
      <div class="topbar-left">
        <span class="app-logo">&#x2728;</span>
        <span class="app-name">Stellar Atlas</span>
      </div>
    </header>

    <nav class="sidebar">
      <div class="sidebar-heading">Navigation</div>
      <a href="index.html" class="planet-item">
        <span class="planet-label">&#x1F30D; Solar System</span>
      </a>
      <a href="facts.html" class="planet-item active" style="text-decoration:none">
        <span class="planet-label">&#x1F4CA; Planet Data</span>
      </a>
    </nav>

    <main class="data-view" style="grid-area: main; padding: 2rem; overflow: auto;">
      <h1 style="font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem;">Planet Comparison</h1>
      <p style="color: rgba(255,255,255,0.35); font-size: 0.85rem; margin-bottom: 2rem;">Key metrics for all eight planets in our solar system.</p>

      <table class="planet-table" style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
        <thead>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left;">
            <th style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.35); font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">Planet</th>
            <th style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.35); font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">Diameter</th>
            <th style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.35); font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">Day Length</th>
            <th style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.35); font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">Year</th>
            <th style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.35); font-weight: 600; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;">Moons</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 0.6rem 1rem;"><span class="planet-dot" style="background:#b5b5b5; display:inline-block; vertical-align:middle; margin-right:0.4rem;"></span>Mercury</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">4,879 km</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">59 days</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">88 days</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">0</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 0.6rem 1rem;"><span class="planet-dot" style="background:#e8cda0; display:inline-block; vertical-align:middle; margin-right:0.4rem;"></span>Venus</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">12,104 km</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">243 days</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">225 days</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">0</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04); background: rgba(77,166,255,0.04);">
            <td style="padding: 0.6rem 1rem; color: #4da6ff;"><span class="planet-dot" style="background:#4da6ff; display:inline-block; vertical-align:middle; margin-right:0.4rem;"></span>Earth</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">12,756 km</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">24 hours</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">365 days</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">1</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 0.6rem 1rem;"><span class="planet-dot" style="background:#e85d3a; display:inline-block; vertical-align:middle; margin-right:0.4rem;"></span>Mars</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">6,792 km</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">24.6 hrs</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">687 days</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">2</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 0.6rem 1rem;"><span class="planet-dot" style="background:#c4956a; display:inline-block; vertical-align:middle; margin-right:0.4rem;"></span>Jupiter</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">142,984 km</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">9.9 hrs</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">11.9 yrs</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">95</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 0.6rem 1rem;"><span class="planet-dot" style="background:#e8d374; display:inline-block; vertical-align:middle; margin-right:0.4rem;"></span>Saturn</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">120,536 km</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">10.7 hrs</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">29.5 yrs</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">146</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
            <td style="padding: 0.6rem 1rem;"><span class="planet-dot" style="background:#7ec8e3; display:inline-block; vertical-align:middle; margin-right:0.4rem;"></span>Uranus</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">51,118 km</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">17.2 hrs</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">84 yrs</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">28</td>
          </tr>
          <tr>
            <td style="padding: 0.6rem 1rem;"><span class="planet-dot" style="background:#3f54ba; display:inline-block; vertical-align:middle; margin-right:0.4rem;"></span>Neptune</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">49,528 km</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">16.1 hrs</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">165 yrs</td>
            <td style="padding: 0.6rem 1rem; color: rgba(255,255,255,0.5);">16</td>
          </tr>
        </tbody>
      </table>

      <!-- TODO: add a size comparison visual when we learn JavaScript -->
    </main>

  </div>

</body>
</html>`;

export const demoFileStructure: FileItem[] = [
  {
    name: "Stellar Atlas",
    type: "folder",
    children: [
      { name: "index.html", type: "html", content: INDEX_HTML },
      { name: "style.css", type: "css", content: STYLE_CSS },
      { name: "facts.html", type: "html", content: FACTS_HTML },
      {
        name: "images",
        type: "folder",
        children: [
          { name: "nebula-bg.jpg", type: "image" },
          { name: "earth-closeup.png", type: "image" },
          { name: "saturn-rings.png", type: "image" },
        ],
      },
    ],
  },
];

/* ================================================================== */
/*  Chat history                                                       */
/* ================================================================== */

export const demoChatMessages: ChatMessage[] = [
  {
    role: "user",
    content:
      "I want my solar system app to have a sidebar on the left with the planet list, a big main area for the animation, and a panel at the bottom showing info about whichever planet is selected. Is there a way to do that layout with CSS?",
  },
  {
    role: "assistant",
    content:
      "Yes! CSS Grid is perfect for this. I set up a grid layout with named areas — a topbar spanning the full width, a fixed 200px sidebar, a flexible main viewport, and a 180px detail panel at the bottom right. I also added semantic HTML elements (`<header>`, `<nav>`, `<main>`, `<aside>`) for each section.\n\nThe `1fr` value means \"take whatever space is left,\" so the viewport grows and shrinks with the window while the sidebar and detail panel stay fixed.",
    fileChanges: [
      { fileName: "style.css", status: "new", linesAdded: 14 },
      { fileName: "index.html", status: "modified", linesAdded: 8, linesRemoved: 2 },
    ],
  },
  {
    role: "assistant",
    content: "Aaliyah accepted this suggestion",
    isAlert: true,
    alertVariant: "accepted",
  },
  {
    role: "user",
    content:
      "That's exactly what I needed! Okay next question — I want the sun in the center of the viewport and I want it to look like it's actually glowing. Right now it's just a yellow circle.",
  },
  {
    role: "assistant",
    content:
      "I updated the `.sun` class with a `radial-gradient` that creates a hot white center fading to orange, and stacked four `box-shadow` layers that go from tight and bright to wide and dim — this simulates real light falloff and gives the sun a 3D glow effect.",
    fileChanges: [
      { fileName: "style.css", status: "modified", linesAdded: 9, linesRemoved: 3 },
    ],
  },
  {
    role: "assistant",
    content: "Aaliyah accepted this suggestion",
    isAlert: true,
    alertVariant: "accepted",
  },
  {
    role: "user",
    content:
      "OKAY that looks incredible. Now the big one — how do I make the planets actually orbit around the sun? Like, move in a circle path?",
  },
  {
    role: "assistant",
    content:
      "Instead of moving the planets directly, I added invisible orbit containers — each one is a circle centered on the sun that rotates using a `spin` keyframe animation. The planet sits on the edge and gets carried along.\n\nI also added `counter-spin` animations so the planets stay upright while orbiting. The counter-spin duration has to match the orbit duration exactly, otherwise you'll get a weird wobble.",
    fileChanges: [
      { fileName: "style.css", status: "modified", linesAdded: 38, linesRemoved: 1 },
      { fileName: "index.html", status: "modified", linesAdded: 24 },
      { fileName: "old-layout.css", status: "deleted" },
    ],
  },
  {
    role: "assistant",
    content: "Aaliyah dismissed this suggestion",
    isAlert: true,
    alertVariant: "rejected",
  },
  {
    role: "user",
    content:
      "I actually figured it out on my own!! But I'm stuck on one thing — can I add Saturn's rings with just CSS?",
  },
  {
    role: "assistant",
    content:
      "Nice work getting the orbits going yourself! For Saturn's ring I added a child `<span>` element and styled it as a wide, short ellipse tilted in 3D using `rotateX(65deg)`. The semi-transparent border gives it that classic ring look with visible gaps.\n\nYour app is looking really polished, Aaliyah. The grid layout with the orbiting planets is impressive — this goes well beyond what most students attempt.",
    fileChanges: [
      { fileName: "style.css", status: "modified", linesAdded: 11 },
      { fileName: "index.html", status: "modified", linesAdded: 1 },
    ],
  },
  {
    role: "assistant",
    content: "Aaliyah accepted this suggestion",
    isAlert: true,
    alertVariant: "accepted",
  },
  {
    role: "user",
    content:
      "This is so cool!! One more idea — could I make it so clicking a planet in the sidebar updates the detail panel to show that planet's info?",
  },
  {
    role: "assistant",
    content:
      "Love that idea! That would require JavaScript, which is outside what I can edit for you right now — but I can show you the pattern. You'd add a click listener to each sidebar button and use it to swap the content in the detail panel:\n\n```js\nconst buttons = document.querySelectorAll('.planet-btn');\nconst detail = document.querySelector('.detail');\n\nbuttons.forEach(btn => {\n  btn.addEventListener('click', () => {\n    const name = btn.dataset.planet;\n    detail.querySelector('.planet-name').textContent = name;\n    detail.querySelector('.planet-desc').textContent = planetData[name];\n  });\n});\n```\n\nYou'd store your planet facts in a JavaScript object like `planetData` and reference them by name. Try creating a `script.js` file and linking it at the bottom of your `index.html` with a `<script>` tag — I'm happy to help you debug once you give it a shot!",
  },
];

/* ================================================================== */
/*  Rubric                                                             */
/* ================================================================== */

const evidenceLevels = [
  {
    id: "extensive",
    label: "Extensive Evidence",
    description:
      "All stated requirements are fully met; layout and styling are intentional, consistent, and accessible. Code is organized and easy to follow.",
  },
  {
    id: "convincing",
    label: "Convincing Evidence",
    description:
      "Most requirements are met with minor gaps; design is mostly consistent. Small issues don't block understanding.",
  },
  {
    id: "limited",
    label: "Limited Evidence",
    description:
      "Some requirements are partially addressed; several gaps remain or the page is hard to use on common screen sizes.",
  },
  {
    id: "none",
    label: "No Evidence",
    description:
      "The submission does not show meaningful progress toward the stated requirements.",
  },
] as const;

export const demoRubrics: RubricData[] = [
  {
    name: "HTML Structure & Content",
    feedback:
      "Really impressive, Aaliyah. Using CSS Grid template areas to build a full app layout with a sidebar, viewport, and detail panel goes well beyond the project requirements. Your HTML is clean and semantic — the nav, main, aside, and header elements are all used correctly. The facts page with the data table is well-structured too. Add alt text to your images folder assets for accessibility and this category is airtight.",
    submissionStatus: "complete",
    categories: [...evidenceLevels],
    selectedCategoryId: "extensive",
  },
  {
    name: "CSS Visual Design & Animation",
    feedback:
      "This is the most ambitious CSS work I've seen this semester. The solar system with orbiting planets, counter-rotation, Saturn's 3D ring, and the layered sun glow all demonstrate a deep understanding of transforms and keyframe animations. The starfield box-shadow trick is clever, and your use of rgba() for layered transparency shows real sophistication. The app-style layout with the detail panel feels polished and intentional. Excellent work.",
    submissionStatus: "complete",
    categories: [...evidenceLevels],
    selectedCategoryId: "extensive",
  },
  {
    name: "Responsiveness & Accessibility",
    feedback:
      "The fixed grid layout works perfectly at desktop sizes, and the app-style design makes sense as a non-responsive tool. However, on narrower screens the sidebar overlaps the viewport — consider either adding a media query to collapse the sidebar below 768px or adding min-width to the body so it scrolls gracefully. Also, the planet buttons in the sidebar need visible focus states for keyboard navigation. Small tweaks away from perfect.",
    submissionStatus: "needs-revisions",
    categories: [...evidenceLevels],
    selectedCategoryId: "convincing",
  },
];

/* ================================================================== */
/*  Preview (React JSX)                                                */
/* ================================================================== */

export function DemoProjectPreview() {
  return (
    <div style={{ width: "100%", height: "100%", overflow: "hidden", background: "#08090e" }}>
      <style
        dangerouslySetInnerHTML={{
          __html: `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');

.sa-app{font-family:'Space Grotesk',system-ui,sans-serif;color:#e0e0e0;background:#08090e;margin:0;padding:0;display:grid;grid-template-columns:160px 1fr;grid-template-rows:40px 1fr 140px;grid-template-areas:"sa-top sa-top" "sa-side sa-view" "sa-side sa-detail";height:100%;overflow:hidden}

.sa-topbar{grid-area:sa-top;display:flex;justify-content:space-between;align-items:center;padding:0 1rem;background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06)}
.sa-topbar-left{display:flex;align-items:center;gap:0.4rem}
.sa-app-logo{font-size:0.95rem}
.sa-app-name{font-size:0.8rem;font-weight:600;color:#fff;letter-spacing:-0.01em}
.sa-topbar-right{display:flex;align-items:center;gap:0.4rem}
.sa-status-dot{width:5px;height:5px;background:#34d399;border-radius:50%;animation:sa-pulse 2s ease-in-out infinite}
@keyframes sa-pulse{0%,100%{opacity:1}50%{opacity:0.4}}
.sa-status-label{font-size:0.65rem;color:rgba(255,255,255,0.3);font-weight:500}

.sa-sidebar{grid-area:sa-side;background:rgba(255,255,255,0.02);border-right:1px solid rgba(255,255,255,0.06);padding:0.75rem 0;display:flex;flex-direction:column;overflow-y:auto}
.sa-side-heading{font-size:0.6rem;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.25);padding:0 0.75rem;margin-bottom:0.35rem}
.sa-planet-item{display:flex;align-items:center;gap:0.45rem;padding:0.35rem 0.75rem;border:none;background:transparent;color:rgba(255,255,255,0.5);font-family:'Space Grotesk',system-ui,sans-serif;font-size:0.75rem;font-weight:500;cursor:pointer;text-align:left;width:100%;transition:background 0.15s}
.sa-planet-item:hover{background:rgba(255,255,255,0.04);color:#fff}
.sa-planet-item.sa-active{background:rgba(77,166,255,0.08);color:#fff}
.sa-pdot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.sa-plabel{flex:1}
.sa-pdist{font-size:0.6rem;color:rgba(255,255,255,0.18);font-weight:400}
.sa-side-foot{margin-top:auto;padding:0.75rem;border-top:1px solid rgba(255,255,255,0.06)}
.sa-side-foot p{font-size:0.6rem;color:rgba(255,255,255,0.18);line-height:1.4}

.sa-viewport{grid-area:sa-view;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,#0d1020 0%,#08090e 70%)}

.sa-stars{position:absolute;top:0;left:0;width:2px;height:2px;background:transparent;box-shadow:40px 20px #fff,130px 80px #fff,250px 45px #fff,380px 120px #fff,500px 30px #fff,80px 160px #fff,200px 200px #fff,340px 170px #fff,460px 210px #fff,50px 280px #fff,180px 310px #fff,310px 260px #fff,440px 300px #fff,110px 370px #fff,240px 400px #fff,360px 350px #fff,500px 390px #fff;animation:sa-twinkle 4s ease-in-out infinite alternate}
.sa-stars2{position:absolute;top:0;left:0;width:1px;height:1px;background:transparent;box-shadow:70px 55px rgba(255,255,255,0.4),190px 130px rgba(255,255,255,0.4),310px 75px rgba(255,255,255,0.4),440px 180px rgba(255,255,255,0.4),100px 230px rgba(255,255,255,0.4),230px 270px rgba(255,255,255,0.4);animation:sa-twinkle 6s ease-in-out infinite alternate-reverse}
@keyframes sa-twinkle{from{opacity:0.5}to{opacity:1}}

.sa-solar{position:relative;width:100%;height:100%;max-width:460px;max-height:460px;aspect-ratio:1}
.sa-sun{position:absolute;width:36px;height:36px;background:radial-gradient(circle,#fff7a8,#ffd700,#ff8c00);border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%);box-shadow:0 0 15px #ffd700,0 0 30px rgba(255,215,0,0.5),0 0 60px rgba(255,140,0,0.25),0 0 100px rgba(255,100,0,0.1);z-index:10}

.sa-orb{position:absolute;border:1px solid rgba(255,255,255,0.055);border-radius:50%;top:50%;left:50%;animation:sa-spin linear infinite}
.sa-o1{width:80px;height:80px;margin:-40px 0 0 -40px;animation-duration:6s}
.sa-o2{width:118px;height:118px;margin:-59px 0 0 -59px;animation-duration:10s}
.sa-o3{width:166px;height:166px;margin:-83px 0 0 -83px;animation-duration:16s}
.sa-o4{width:218px;height:218px;margin:-109px 0 0 -109px;animation-duration:22s}
.sa-o5{width:296px;height:296px;margin:-148px 0 0 -148px;animation-duration:30s}
.sa-o6{width:380px;height:380px;margin:-190px 0 0 -190px;animation-duration:40s}
@keyframes sa-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes sa-cspin{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}

.sa-p{position:absolute;border-radius:50%;top:-4px;left:50%;margin-left:-4px}
.sa-mercury{width:5px;height:5px;background:#b5b5b5;top:-2px;margin-left:-2px;animation:sa-cspin 6s linear infinite}
.sa-venus{width:7px;height:7px;background:#e8cda0;top:-3px;margin-left:-3px;animation:sa-cspin 10s linear infinite}
.sa-earth{width:8px;height:8px;background:#4da6ff;animation:sa-cspin 16s linear infinite;box-shadow:0 0 6px rgba(77,166,255,0.6)}
.sa-moon{width:3px;height:3px;background:#aaa;border-radius:50%;position:absolute;top:-5px;left:50%;margin-left:-1px;animation:sa-spin 3s linear infinite}
.sa-mars{width:6px;height:6px;background:#e85d3a;top:-3px;margin-left:-3px;animation:sa-cspin 22s linear infinite}
.sa-jupiter{width:14px;height:14px;background:radial-gradient(circle at 40% 40%,#d4a574,#a67c52);top:-7px;margin-left:-7px;animation:sa-cspin 30s linear infinite;box-shadow:0 0 8px rgba(212,165,116,0.2)}
.sa-saturn{width:11px;height:11px;background:#e8d374;top:-5px;margin-left:-5px;animation:sa-cspin 40s linear infinite}
.sa-saturn-ring{position:absolute;width:22px;height:7px;border:1px solid rgba(232,211,116,0.45);border-radius:50%;top:50%;left:50%;transform:translate(-50%,-50%) rotateX(65deg)}

.sa-detail{grid-area:sa-detail;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.06);padding:0.85rem 1.1rem;display:flex;flex-direction:column;gap:0.6rem;overflow:hidden}
.sa-detail-header{display:flex;align-items:center;gap:0.6rem}
.sa-detail-dot{width:11px;height:11px;border-radius:50%;flex-shrink:0}
.sa-detail-name{font-size:0.95rem;font-weight:700;color:#fff;line-height:1.2}
.sa-detail-type{font-size:0.65rem;color:rgba(255,255,255,0.25);font-weight:500}
.sa-detail-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem}
.sa-stat-val{font-size:0.8rem;font-weight:600;color:#fff;display:block}
.sa-stat-lbl{font-size:0.55rem;color:rgba(255,255,255,0.22);font-weight:500;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-top:0.1rem}
.sa-detail-body{font-size:0.72rem;color:rgba(255,255,255,0.4);line-height:1.55}
.sa-tags{display:flex;gap:0.3rem;flex-wrap:wrap}
.sa-tag{font-size:0.58rem;font-weight:500;padding:0.15rem 0.5rem;border-radius:100px;background:rgba(77,166,255,0.07);color:rgba(77,166,255,0.65);border:1px solid rgba(77,166,255,0.1)}
          `,
        }}
      />
      <div className="sa-app">

        {/* Top bar */}
        <header className="sa-topbar">
          <div className="sa-topbar-left">
            <span className="sa-app-name">Stellar Atlas</span>
          </div>
          <div className="sa-topbar-right">
            <span className="sa-status-dot" />
            <span className="sa-status-label">Live Orbits</span>
          </div>
        </header>

        {/* Sidebar */}
        <nav className="sa-sidebar">
          <div className="sa-side-heading">Planets</div>
          {[
            { c: "#b5b5b5", n: "Mercury",  d: "57.9M km" },
            { c: "#e8cda0", n: "Venus",    d: "108.2M km" },
            { c: "#4da6ff", n: "Earth",    d: "149.6M km", active: true },
            { c: "#e85d3a", n: "Mars",     d: "227.9M km" },
            { c: "#c4956a", n: "Jupiter",  d: "778.5M km" },
            { c: "#e8d374", n: "Saturn",   d: "1.43B km" },
            { c: "#7ec8e3", n: "Uranus",   d: "2.87B km" },
            { c: "#3f54ba", n: "Neptune",  d: "4.5B km" },
          ].map((p) => (
            <button
              key={p.n}
              className={`sa-planet-item${p.active ? " sa-active" : ""}`}
            >
              <span className="sa-pdot" style={{ background: p.c }} />
              <span className="sa-plabel">{p.n}</span>
              <span className="sa-pdist">{p.d}</span>
            </button>
          ))}
          <div className="sa-side-foot">
            <p>Built by Aaliyah M.</p>
            <p>AP CS Principles — Per. 3</p>
          </div>
        </nav>

        {/* Viewport */}
        <main className="sa-viewport">
          <div className="sa-stars" />
          <div className="sa-stars2" />
          <div className="sa-solar">
            <div className="sa-sun" />
            <div className="sa-orb sa-o1"><div className="sa-p sa-mercury" /></div>
            <div className="sa-orb sa-o2"><div className="sa-p sa-venus" /></div>
            <div className="sa-orb sa-o3">
              <div className="sa-p sa-earth"><div className="sa-moon" /></div>
            </div>
            <div className="sa-orb sa-o4"><div className="sa-p sa-mars" /></div>
            <div className="sa-orb sa-o5"><div className="sa-p sa-jupiter" /></div>
            <div className="sa-orb sa-o6">
              <div className="sa-p sa-saturn"><div className="sa-saturn-ring" /></div>
            </div>
          </div>
        </main>

        {/* Detail panel */}
        <aside className="sa-detail">
          <div className="sa-detail-header">
            <div
              className="sa-detail-dot"
              style={{ background: "#4da6ff", boxShadow: "0 0 6px rgba(77,166,255,0.5)" }}
            />
            <div>
              <div className="sa-detail-name">Earth</div>
              <div className="sa-detail-type">Terrestrial Planet</div>
            </div>
          </div>
          <div className="sa-detail-stats">
            <div><span className="sa-stat-val">12,756 km</span><span className="sa-stat-lbl">Diameter</span></div>
            <div><span className="sa-stat-val">1</span><span className="sa-stat-lbl">Moons</span></div>
            <div><span className="sa-stat-val">365.25 d</span><span className="sa-stat-lbl">Orbit</span></div>
            <div><span className="sa-stat-val">15 °C</span><span className="sa-stat-lbl">Avg Temp</span></div>
          </div>
          <div className="sa-detail-body">
            The only planet known to support life. Earth's atmosphere and magnetic field
            protect us from solar radiation. 71% of the surface is covered by water.
          </div>
          <div className="sa-tags">
            <span className="sa-tag">Habitable Zone</span>
            <span className="sa-tag">Atmosphere</span>
            <span className="sa-tag">Water</span>
            <span className="sa-tag">Magnetic Field</span>
          </div>
        </aside>

      </div>
    </div>
  );
}
