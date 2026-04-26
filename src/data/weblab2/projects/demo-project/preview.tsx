export function DemoProjectPreview({ aiChangeLayout = false }: { aiChangeLayout?: boolean }) {
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
      {aiChangeLayout && (
        <style
          dangerouslySetInnerHTML={{
            __html: `.sa-app{grid-template-columns:160px 1fr 200px;grid-template-rows:40px 1fr;grid-template-areas:"sa-top sa-top sa-top" "sa-side sa-view sa-detail"}.sa-detail{border-top:none;border-left:1px solid rgba(255,255,255,0.06);overflow-y:auto}`,
          }}
        />
      )}
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
