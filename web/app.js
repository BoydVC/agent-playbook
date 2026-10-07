(function(){
"use strict";
const SHORT = {"front-door":"Front door","specialists":"Specialists","memory":"Memory","routines-listeners":"Listeners","skills":"Skills","healthchecks":"Healthchecks","verification":"Verification","arena":"Arena","cost":"Cost","scripts":"Scripts","briefs":"Briefs"};
const $ = s => document.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt = n => n == null ? "" : n >= 1e6 ? (n/1e6).toFixed(1).replace(/\.0$/,"")+"M" : n >= 1e3 ? (n/1e3).toFixed(1).replace(/\.0$/,"")+"K" : String(n);
const scoreTxt = s => (Math.round(s*2)/2).toFixed(1).replace(/\.0$/,"");

function load(){
  if (window.PLAYBOOK) return Promise.resolve(window.PLAYBOOK);
  return fetch("data/playbook.json").then(r => r.json());
}

function radar(d){
  const svg = $("#radar"), P = d.patterns, n = P.length, cx = 280, cy = 280, R = 190, max = d.max_score;
  const ang = i => -Math.PI/2 + i*2*Math.PI/n;
  const pt = (i, v) => [cx + Math.cos(ang(i))*R*v/max, cy + Math.sin(ang(i))*R*v/max];
  let h = "";
  for (let l = 1; l <= max; l++){
    const pts = P.map((_, i) => pt(i, l).join(",")).join(" ");
    h += `<polygon class="r-grid" points="${pts}"/>`;
    h += `<text class="r-ring" x="${cx+4}" y="${cy - R*l/max - 3}">${l}</text>`;
  }
  P.forEach((_, i) => { const [x, y] = pt(i, max); h += `<line class="r-axis" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`; });
  h += `<polygon class="r-area" points="${P.map((p, i) => pt(i, p.score).join(",")).join(" ")}"/>`;
  P.forEach((p, i) => {
    const [x, y] = pt(i, p.score), [lx, ly] = pt(i, max*1.17), a = ang(i);
    const anchor = Math.abs(Math.cos(a)) < .25 ? "middle" : Math.cos(a) > 0 ? "start" : "end";
    h += `<g class="r-spoke" data-id="${p.id}" tabindex="0" role="link" aria-label="${esc(p.name)} ${p.score} of ${max}">
      <title>${esc(p.name)}: ${p.score}/${max}</title>
      <circle class="r-hit" cx="${lx}" cy="${ly}" r="34"/>
      <circle class="r-dot" cx="${x}" cy="${y}" r="5.5"/>
      <text class="r-label" x="${lx}" y="${ly}" text-anchor="${anchor}">${p.icon} ${esc(SHORT[p.id] || p.name)}</text>
      <text class="r-score" x="${lx}" y="${ly+15}" text-anchor="${anchor}">${scoreTxt(p.score)} / ${max}</text></g>`;
  });
  svg.innerHTML = h;
  svg.querySelectorAll(".r-spoke").forEach(g => {
    const go = () => jump(g.dataset.id);
    g.addEventListener("click", go);
    g.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
  });
}

function jump(id){
  const el = document.getElementById(id); if (!el) return;
  el.scrollIntoView({behavior:"smooth"});
  el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  history.replaceState(null, "", "#" + id);
}

function gauge(score, max){
  let pips = "";
  for (let i = 0; i < max; i++){ const f = Math.max(0, Math.min(1, score - i)); pips += `<span class="pip"><i style="width:${f*100}%"></i></span>`; }
  return `<div class="gauge"><div class="pips">${pips}</div><div class="num">${scoreTxt(score)}<small> / ${max}</small></div></div>`;
}

function evidence(e){
  const path = `<span class="path">${esc(e.source)}</span>`;
  if (e.kind === "fact") return `<div class="ev"><div>${esc(e.text)}</div><div class="src"><span class="chip fact">computed</span><span class="how">${esc(e.how)}</span> · ${path}</div></div>`;
  const who = e.kind === "profile" ? `<span class="bot">${esc(e.bot)}</span>` : e.kind === "skill" ? `<span class="bot">${esc(e.skill)}</span>` : (e.label ? `<span class="bot">${esc(e.label)}:</span>` : "");
  const lab = {profile:"persona", skill:"skill", doctor:"fleet doctor"}[e.kind];
  return `<div class="ev">${who}<q>${esc(e.quote)}</q><div class="src"><span class="chip ${e.kind}">${lab}</span>${path}</div></div>`;
}

function post(t){
  const views = t.views != null ? ` · ${t.approx ? "≈" : ""}${fmt(t.views)} views` : "";
  const note = t.is_note ? `<span class="tag note" title="This line is Jim's journal summary of the post, not the author's own words">journal note</span>` : "";
  return `<article class="post${t.is_note ? " note" : ""}" data-post="${esc(t.post)}">
    <blockquote>${esc(t.quote)}</blockquote>
    <div class="meta"><span class="who">${esc(t.name)}</span><span>@${esc(t.handle)}</span><span>${esc(t.date || "")}${views}</span>${note}
    <a class="open" href="${esc(t.url)}" target="_blank" rel="noopener">open post ↗</a></div></article>`;
}

function chapter(p, i, max){
  const rub = p.rubric.map(r => `<li><span class="mark ${r.status}">${r.status === "yes" ? "✓" : r.status === "partial" ? "½" : "✕"}</span><span>${esc(r.text)}<span class="because">${esc(r.because)}</span></span></li>`).join("");
  return `<section class="chapter" id="${p.id}" data-score="${p.score}">
    <div class="ch-head">
      <div class="ch-icon">${p.icon}</div>
      <div><div class="ch-num">PATTERN ${String(i+1).padStart(2,"0")}</div><h2>${esc(p.name)}</h2></div>
      ${gauge(p.score, max)}
    </div>
    <div class="ch-body">
      <div class="col">
        <h3><span class="k">What it is</span></h3>
        <p class="what">${esc(p.what)}</p>
        <h3><span class="k">Bookmarks that teach it</span></h3>
        <div class="posts">${p.teach.map(post).join("")}</div>
      </div>
      <div class="col">
        <h3><span class="k">How your fleet does it today</span></h3>
        <div class="evidence">${p.fleet.map(evidence).join("")}</div>
        <h3><span class="k">Scorecard · ${scoreTxt(p.score)} / ${max}</span></h3>
        <ul class="rubric">${rub}</ul>
        <div class="next"><h4>Try this next</h4><p>${esc(p.next)}</p><button class="copy" data-copy="${esc(p.next)}">Copy</button></div>
      </div>
    </div></section>`;
}

function render(d){
  const P = d.patterns, max = d.max_score, f = d.facts;
  const overall = P.reduce((a, p) => a + p.score, 0) / P.length;
  const hi = Math.max(...P.map(p => p.score)), lo = Math.min(...P.map(p => p.score));
  const names = arr => arr.map(p => `<b>${esc(p.name)}</b>`).join(", ");
  const best = P.filter(p => p.score === hi), worst = P.filter(p => p.score === lo);
  $("#heroStats").innerHTML = `
    <div class="stat big"><b>${overall.toFixed(1)}</b><span>overall maturity / ${max}</span></div>
    <div class="stat"><b>${P.length}</b><span>patterns</span></div>
    <div class="stat"><b>${P.reduce((a, p) => a + p.teach.length, 0)}</b><span>teaching quotes</span></div>
    <div class="stat"><b>${f.configured}</b><span>configured bots</span></div>
    <div class="stat"><b>${f.routines}</b><span>routines (${f.enabled} on)</span></div>
    <div class="stat"><b>${f.skills}</b><span>workflow skills</span></div>`;
  radar(d);
  $("#toc").innerHTML = P.map(p => `<a href="#${p.id}" data-id="${p.id}">${p.icon} ${esc(SHORT[p.id] || p.name)} <span class="badge">${scoreTxt(p.score)}</span></a>`).join("") + `<a href="#upgrades">🚀 Next 10</a><a href="#roster">👥 Roster</a><a href="#sources">📎 Sources</a>`;
  $("#caveat").innerHTML = `<b>Read this first.</b> Strongest (${scoreTxt(hi)}/${max}): ${names(best)}. Weakest (${scoreTxt(lo)}/${max}): ${names(worst)}. Fleet activity numbers come from Bot Island's snapshot of local logs, which end <b>${esc(d.sources.logs_end)}</b>, so recent weeks aren't counted. Persona and skill quotes reflect the files as of this build. Lines marked <span class="tag note">journal note</span> are Jim's summaries of a post, not the author's words.`;
  $("#chapters").innerHTML = P.map((p, i) => chapter(p, i, max)).join("");
  const byId = Object.fromEntries(P.map(p => [p.id, p]));
  $("#upgradeList").innerHTML = d.upgrades.map(u => `<li class="up" data-rank="${u.rank}">
    <div class="rank">${u.rank}</div>
    <h3>${esc(u.title)}</h3>
    <div class="row"><span class="eff ${u.effort}">${u.effort}</span><span>${esc(u.minutes)}</span><span>·</span>${u.pattern.map(id => `<span class="pl" data-id="${id}">${byId[id] ? byId[id].icon : ""} ${esc(SHORT[id] || id)}</span>`).join("")}</div>
    <div class="impact"><b>Payoff:</b> ${esc(u.impact)}</div>
    <div class="how"><b>How:</b> ${esc(u.how)} <span class="path">(${esc(u.evidence)})</span></div></li>`).join("");
  document.querySelectorAll(".pl").forEach(x => x.addEventListener("click", () => jump(x.dataset.id)));
  const yes = b => b ? `<span class="ok">●</span>` : `<span class="nope">○</span>`;
  $("#rosterTable").innerHTML = `<tr><th>Bot</th><th>Title</th><th class="c">States an "ONLY job"</th><th class="c">Has anti-jobs</th><th class="c">Quiet rule</th><th>Routines</th></tr>` +
    d.fleet.map(b => `<tr><td><b>${esc(b.name)}</b></td><td>${esc(b.title || "—")}</td><td class="c">${yes(b.only)}</td><td class="c">${yes(b.anti)}</td><td class="c">${yes(b.quiet)}</td><td class="rt">${b.routines.length ? b.routines.map(esc).join("<br>") : "—"}</td></tr>`).join("");
  const S = d.sources;
  $("#sourceList").innerHTML = [
    ["Bookmarks", S.atlas, "Bookmark Atlas build (Boyd's saved X bookmarks, Jim's journals, research files). Each quote is re-verified against its original saved file."],
    ["Bot personas", S.profiles, "Read-only. Persona quotes are verbatim text from the bot's profile.json."],
    ["Workflow skills", S.skills, "Read-only. Skill quotes are verbatim substrings of SKILL.md."],
    ["Bot Island data", S.fleet, `Routines, runs, bot-to-bot messages and computer-use sessions. Local logs end ${S.logs_end}.`],
    ["Fleet Doctor report", S.doctor, "Findings and agent-minute estimates quoted from the HTML report."],
    ["Scoring", "build/build.py", "Each pattern has 5 rubric checks: yes = 1, partial = ½, no = 0. The pattern score is the sum. Overall is the mean."]
  ].map(([t, p, w]) => `<div class="srcbox"><b>${esc(t)}</b><span class="path">${esc(p)}</span><div>${esc(w)}</div></div>`).join("");
  $("#gen").textContent = d.generated;

  document.addEventListener("click", e => {
    const b = e.target.closest(".copy"); if (!b) return;
    const t = b.dataset.copy, done = () => { const x = $("#toast"); x.classList.add("show"); setTimeout(() => x.classList.remove("show"), 1200); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, done);
    else { const ta = document.createElement("textarea"); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (_) {} ta.remove(); done(); }
  });
  const links = [...document.querySelectorAll(".toc a[data-id]")];
  if ("IntersectionObserver" in window){
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) links.forEach(a => a.classList.toggle("on", a.dataset.id === en.target.id)); }), {rootMargin:"-40% 0px -55% 0px"});
    document.querySelectorAll(".chapter").forEach(c => io.observe(c));
  }
  // Screenshot mode (?shot=<id>): hide everything above the target so headless captures start there.
  const shot = new URLSearchParams(location.search).get("shot");
  if (shot && document.getElementById(shot)){
    const tgt = document.getElementById(shot);
    for (const el of document.querySelectorAll(".hero, .caveat, .chapter, .block")){ if (el === tgt) break; el.style.display = "none"; }
    tgt.style.marginTop = "18px";
  } else if (location.hash && document.getElementById(location.hash.slice(1))) setTimeout(() => document.getElementById(location.hash.slice(1)).scrollIntoView({behavior:"instant"}), 50);
  document.body.dataset.ready = "1";
}

load().then(render).catch(err => { document.body.insertAdjacentHTML("afterbegin", `<pre style="color:#e57a7a;padding:20px">Failed to load playbook data: ${esc(err)}</pre>`); });
})();
