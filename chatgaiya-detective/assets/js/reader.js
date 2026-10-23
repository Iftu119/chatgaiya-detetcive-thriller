/* =========================================================
   চাটগাঁইয়া ডিটেকটিভ সিরিজ · reader engine
   এই ফাইল সাধারণত বদলাতে হবে না।
   ========================================================= */
(function () {
  const S = window.CDS_SERIES;
  const $ = (q, el = document) => el.querySelector(q);
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  const bn = n => String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);

  /* ---------- settings (shared with home) ---------- */
  function applySettings() {
    document.body.classList.toggle("paper", store.get("cds-theme", "dark") === "paper");
    document.documentElement.style.setProperty("--fs", store.get("cds-fs", 18) + "px");
  }
  applySettings();

  /* ---------- load case ---------- */
  const params = new URLSearchParams(location.search);
  const caseId = params.get("case") || "case-01";
  const meta = S.cases.find(c => c.id === caseId);
  if (!meta || meta.status !== "published") { location.replace("index.html"); return; }

  window.CDS = { registerCase: c => start(c) };
  const sc = document.createElement("script");
  sc.src = "stories/" + caseId + ".js";
  sc.onerror = () => { $("#view").innerHTML = "<p style='padding:40px 0'>গল্পের ফাইল পাওয়া যায়নি: stories/" + caseId + ".js</p>"; };
  document.body.appendChild(sc);

  function start(C) {
    document.title = C.title + " · " + S.title;
    $("#caseName").textContent = "কেস ফাইল " + C.no;
    const K = "cds:" + C.id + ":";
    const chapters = C.chapters;
    const ids = chapters.map(c => c.id);

    // number clues in order of appearance
    const clueOrder = [];
    chapters.forEach(ch => (ch.text.match(/\[clue:([\w-]+)\]/g) || []).forEach(m => {
      const id = m.slice(6, -1); if (!clueOrder.includes(id)) clueOrder.push(id);
    }));
    const clueNo = id => clueOrder.indexOf(id) + 1;
    const clueChapter = {};
    chapters.forEach(ch => clueOrder.forEach(id => { if (ch.text.includes("[clue:" + id + "]") && !clueChapter[id]) clueChapter[id] = ch.id; }));

    let found = store.get(K + "clues", []);
    let maxRead = store.get(K + "max", -1);

    /* ---------- clue renderers ---------- */
    function renderClue(id) {
      const c = C.clues[id]; if (!c) return "";
      let body = "";
      if (c.type === "screen") {
        body = `<div class="screen">${c.lines.map((l, i) => (c.hl || []).includes(i) ? `<span class="hl">${esc(l)}</span>` : esc(l)).join("\n")}</div>`;
      } else if (c.type === "sketch" || c.type === "html") {
        body = c.svg || c.html;
      } else if (c.type === "timeline") {
        body = c.svg + (c.legend ? `<div class="legend-row">${c.legend.map(([col, t]) => `<span><i style="background:${col}"></i>${t}</span>`).join("")}</div>` : "");
      } else if (c.type === "message") {
        body = `<div class="phone"><div class="who">${c.from}</div>${c.image ? `<div class="ph-img">${c.image}</div>` : ""}${c.msgs.map(m => `<div class="bubble">${m}</div>`).join("")}${c.reply ? `<div class="bubble me">${c.reply}</div>` : ""}</div>`;
      } else if (c.type === "ledger") {
        body = `<div class="ledger">${c.tag ? `<div><span class="tagline">🏷️ ${c.tag}</span></div>` : ""}${c.rows.map((r, i) =>
          `<div class="entry${i === c.mark ? " hit" : ""}"><span class="no">${r[0]}</span><span class="t">${r[1]}</span><span class="w">${r[2]}</span><span class="c">${r[3]}</span></div>`).join("")}</div>`;
      } else if (c.type === "versus") {
        body = `<div class="versus">${c.rows.map(r => `<div class="vs"><div class="a">${r[0]}</div><div class="b">${r[1]}</div></div>`).join("")}</div>`;
      }
      return `<figure class="clue" data-clue="${id}" id="clue-${id}">
        <figcaption class="clue-h"><span class="clue-n">সূত্র ${bn(clueNo(id))}</span><span class="clue-t">${c.title}</span></figcaption>
        <div class="clue-b">${body}${c.caption ? `<p class="cap">${c.caption}</p>` : ""}</div></figure>`;
    }
    function esc(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

    function renderText(t) {
      return t.trim().split(/\n\s*\n/).map(b => {
        b = b.trim();
        const m = b.match(/^\[clue:([\w-]+)\]$/);
        if (m) return renderClue(m[1]);
        if (b === "***") return `<div class="scene-break">✦ ✦ ✦</div>`;
        const dlg = /^[“"]/.test(b) ? ' class="dlg"' : "";
        return `<p${dlg}>${b}</p>`;
      }).join("");
    }

    /* ---------- views ---------- */
    const view = $("#view");

    function renderCover() {
      const last = store.get(K + "last", null);
      const lastIdx = ids.indexOf(last);
      const resume = lastIdx > 0
        ? `<a class="btn block" href="#${last}">যেখানে থেমেছিলেন: ${chapters[lastIdx].title} →</a><a class="btn ghost block" href="#${ids[0]}" style="margin-top:10px">শুরু থেকে পড়ুন</a>`
        : `<a class="btn block" href="#${ids[0]}">পড়া শুরু করুন →</a>`;
      view.innerHTML = `
      <section class="cover" style="background-image:url('${C.cover}')"><div class="in">
        <div class="kicker">${S.title} · কেস ফাইল ${C.no}</div>
        <h1>${C.title}</h1>
        <p class="tag">${C.tagline}</p>
        <div class="meta"><span class="chip">✍️ ${S.pen}</span><span class="chip">📖 ${bn(chapters.length)} অংশ</span><span class="chip">📌 ${bn(clueOrder.length)}টি সূত্র</span></div>
        ${resume}
      </div></section>
      <div class="intro-box">
        <h3>পড়ার সময় যা দেখবেন</h3>
        <ul class="legend">
          <li><span class="sw c">১</span><span><b>সূত্র-কার্ড।</b> গল্পের প্রমাণ ছবি আর টেবিলে। দেখা মাত্র নিচের 📌 সূত্র তালিকায় জমা হবে, পরে আবার মিলিয়ে দেখতে পারবেন।</span></li>
          <li><span class="sw s">📍</span><span><b>দৃশ্য-চিহ্ন।</b> প্রতিটা অধ্যায়ের শুরুতে জায়গা, সময় আর কোন দিনের ঘটনা।</span></li>
          <li><span class="sw d"></span><span><b>নীল খাতা।</b> নীল দাগের অংশ কথকের ডায়েরি, বর্তমান সময়ে লেখা।</span></li>
          <li><span class="sw p">👥</span><span><b>চরিত্র।</b> কে কে আছে, ভুলে গেলে নিচের বারে চাপুন। যতটুকু পড়েছেন, ততটুকুই দেখাবে।</span></li>
        </ul>
      </div>
      <p style="color:var(--muted);font-size:14px;text-align:center;margin:0 0 30px">সব সূত্র গল্পের ভেতরেই আছে। চাইলে কথকের আগেই ধরে ফেলতে পারেন।</p>`;
      setBar(-1);
    }

    function renderChapter(i) {
      const ch = chapters[i];
      const days = C.days ? `<div class="days" aria-label="ঘটনার দিন">${C.days.map((d, k) => `<div class="day${k === ch.day ? " on" : ""}"><i></i>${d}</div>`).join("")}</div>` : "";
      const body = renderText(ch.text);
      const next = chapters[i + 1];
      const end = next
        ? `<a class="next-card go" href="#${next.id}"><small>পরের অংশ · ${next.label}</small><b>${next.title} →</b></a>`
        : `<div class="fin"><span class="stamp">কেস ফাইল ${C.no} সমাপ্ত</span><p style="color:var(--muted)">${S.title} চলবে।</p><a class="btn" href="index.html">সব কেস ফাইল</a></div>`;
      view.innerHTML = `
      <article class="ch">
        <div class="ch-top"><span class="ch-no">${ch.label}</span><span class="ch-count">${bn(i + 1)} / ${bn(chapters.length)}</span></div>
        <h2>${ch.title}</h2>
        <div class="scene">${ch.place ? `<span>📍 ${ch.place}</span>` : ""}${ch.time ? `<span>🕒 ${ch.time}</span>` : ""}</div>
        ${days}
        <div class="prose">${ch.style === "diary" ? `<div class="diary"><p class="dtag">📘 নীল ডায়েরি</p>${body}</div>` : body}</div>
        <div class="ch-end">${end}</div>
      </article>`;
      if (i > maxRead) { maxRead = i; store.set(K + "max", maxRead); }
      store.set(K + "last", ch.id);
      setBar(i);
      watchClues();
    }

    function route() {
      const h = location.hash.slice(1);
      const clueJump = h.startsWith("clue-") ? h.slice(5) : null;
      const target = clueJump ? clueChapter[clueJump] : h;
      const i = ids.indexOf(target);
      closeSheets();
      if (i < 0) renderCover(); else renderChapter(i);
      if (clueJump) { const el = document.getElementById("clue-" + clueJump); if (el) setTimeout(() => el.scrollIntoView({ block: "start" }), 30); }
      else window.scrollTo(0, 0);
      onScroll();
    }

    /* ---------- clue discovery ---------- */
    let io;
    function watchClues() {
      if (io) io.disconnect();
      io = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return;
        const id = e.target.dataset.clue;
        if (!found.includes(id)) {
          found.push(id); store.set(K + "clues", found);
          toast(`📌 নতুন সূত্র যোগ হলো: ${C.clues[id].title}`);
          updateBadge(true);
        }
        io.unobserve(e.target);
      }), { threshold: .35 });
      document.querySelectorAll("[data-clue]").forEach(el => io.observe(el));
    }

    /* ---------- bottom bar ---------- */
    let cur = -1;
    function setBar(i) {
      cur = i;
      $("#prevBtn").disabled = i < 0;
      $("#nextBtn").disabled = i >= chapters.length - 1;
      $("#tocLbl").textContent = i < 0 ? "সূচি" : `${bn(i + 1)}/${bn(chapters.length)}`;
      updateBadge(false);
    }
    function updateBadge(pop) {
      const b = $("#clueBadge");
      b.textContent = bn(found.length);
      b.style.display = found.length ? "" : "none";
      if (pop) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
    }
    $("#prevBtn").onclick = () => { location.hash = cur <= 0 ? "cover" : ids[cur - 1]; };
    $("#nextBtn").onclick = () => { location.hash = ids[cur + 1]; };

    /* ---------- sheets ---------- */
    function openSheet(id) {
      closeSheets();
      if (id === "toc") fillToc(); if (id === "clues") fillClues(); if (id === "cast") fillCast(); if (id === "set") fillSet();
      $("#" + id + "Sheet").classList.add("on"); $("#veil").classList.add("on");
    }
    function closeSheets() { document.querySelectorAll(".sheet.on").forEach(s => s.classList.remove("on")); $("#veil").classList.remove("on"); }
    $("#veil").onclick = closeSheets;
    document.querySelectorAll(".sheet").forEach(sh => { const x = document.createElement("button"); x.className = "x"; x.setAttribute("aria-label", "বন্ধ"); x.textContent = "✕"; x.onclick = closeSheets; sh.prepend(x); });
    $("#tocBtn").onclick = () => openSheet("toc");
    $("#clueBtn").onclick = () => openSheet("clues");
    $("#castBtn").onclick = () => openSheet("cast");
    $("#setBtn").onclick = () => openSheet("set");

    function fillToc() {
      $("#tocList").innerHTML = `<li><a href="#cover" class="${cur < 0 ? "cur" : ""}"><span class="n">⌂</span><span>প্রচ্ছদ</span></a></li>` +
        chapters.map((c, i) => `<li><a href="#${c.id}" class="${i === cur ? "cur" : i <= maxRead ? "read" : ""}"><span class="n">${i <= maxRead && i !== cur ? "✓" : bn(i + 1)}</span><span><small>${c.label}</small>${c.title}</span></a></li>`).join("");
    }
    function fillClues() {
      const items = clueOrder.map(id => found.includes(id)
        ? `<a href="#clue-${id}"><span class="clue-n">সূত্র ${bn(clueNo(id))}</span><span>${C.clues[id].title}<small>${chapters.find(c => c.id === clueChapter[id]).label}</small></span></a>`
        : `<a class="locked" aria-disabled="true"><span class="clue-n" style="background:#3a424b">সূত্র ${bn(clueNo(id))}</span><span>এখনো পাওয়া যায়নি</span></a>`);
      $("#clueList").innerHTML = items.join("");
      $("#clueHint").textContent = `${bn(clueOrder.length)}টির মধ্যে ${bn(found.length)}টি পেয়েছেন। চাপ দিলে সূত্রটার কাছে চলে যাবে।`;
    }
    function fillCast() {
      const reach = Math.max(maxRead, cur);
      const vis = (C.cast || []).filter(p => ids.indexOf(p.from) <= reach);
      const hidden = (C.cast || []).length - vis.length;
      $("#castList").innerHTML = vis.map(p => `<div><b>${p.name}</b><p>${p.role}</p></div>`).join("") +
        (hidden > 0 ? `<div class="hid">আরও ${bn(hidden)} জন সামনে আসবেন।</div>` : "") +
        (!vis.length ? `<div class="hid">পড়া শুরু করলে চরিত্রগুলো এখানে দেখা যাবে।</div>` : "");
    }
    function fillSet() {
      const fs = store.get("cds-fs", 18), th = store.get("cds-theme", "dark");
      $("#fsVal").textContent = bn(fs);
      $("#thDark").classList.toggle("on", th === "dark"); $("#thPaper").classList.toggle("on", th === "paper");
    }
    $("#fsDown").onclick = () => { store.set("cds-fs", Math.max(15, store.get("cds-fs", 18) - 1)); applySettings(); fillSet(); };
    $("#fsUp").onclick = () => { store.set("cds-fs", Math.min(26, store.get("cds-fs", 18) + 1)); applySettings(); fillSet(); };
    $("#thDark").onclick = () => { store.set("cds-theme", "dark"); applySettings(); fillSet(); };
    $("#thPaper").onclick = () => { store.set("cds-theme", "paper"); applySettings(); fillSet(); };
    $("#resetBtn").onclick = () => { if (confirm("এই কেসের পড়ার অগ্রগতি আর সূত্র মুছে ফেলবেন?")) { ["clues", "max", "last"].forEach(k => localStorage.removeItem(K + k)); found = []; maxRead = -1; location.hash = "cover"; route(); } };

    /* ---------- misc ---------- */
    let tt;
    function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("on"), 2600); }
    function onScroll() {
      const h = document.documentElement.scrollHeight - innerHeight;
      $("#pbar").style.width = (h > 0 ? Math.min(100, scrollY / h * 100) : 0) + "%";
    }
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("hashchange", route);
    document.addEventListener("keydown", e => {
      if (e.key === "ArrowRight" && !$("#nextBtn").disabled) $("#nextBtn").click();
      if (e.key === "ArrowLeft" && !$("#prevBtn").disabled) $("#prevBtn").click();
      if (e.key === "Escape") closeSheets();
    });
    route();
  }
})();
