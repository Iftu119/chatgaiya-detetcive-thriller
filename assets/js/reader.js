/* চাটগাঁইয়া ডিটেকটিভ সিরিজ : রিডার
   গল্পের লেখা থাকে stories/<case-id>/story.js ফাইলে। এই ফাইলে হাত দেওয়ার দরকার নেই। */
(function () {
  "use strict";
  const BN = n => String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- shared settings (also used on home page) ---------- */
  const prefs = Object.assign({ fs: 18, paper: false }, store.get("cds-prefs", {}));
  function applyPrefs() {
    document.documentElement.style.setProperty("--fs", prefs.fs + "px");
    document.body.classList.toggle("paper", !!prefs.paper);
  }
  applyPrefs();

  let LIB = [];
  window.LIBRARY = list => { LIB = list; };

  const app = $("#app");
  if (!app) return; // not the reader page

  const id = new URLSearchParams(location.search).get("case") || "case-01";
  if (!/^case-\d{2,3}$/.test(id)) { app.innerHTML = '<p class="empty">কেসটা পাওয়া যায়নি।</p>'; return; }

  window.STORY = data => start(data);
  const sc = document.createElement("script");
  sc.src = "stories/" + id + "/story.js";
  sc.onerror = () => { app.innerHTML = '<div class="page"><p class="empty">এই কেস এখনো প্রকাশ হয়নি।<br><br><a class="btn" href="index.html">মূল পাতায় ফিরুন</a></p></div>'; };
  document.head.appendChild(sc);

  function start(S) {
    const N = S.chapters.length;
    const KEY = "cds-" + S.id;
    let st = Object.assign({ cur: -1, max: -1 }, store.get(KEY, {}));
    let cur = -1;
    const base = "stories/" + S.id + "/";
    document.title = S.title + " | " + (window.SITE ? SITE.name : "");
    $("#topTitle").textContent = "কেস " + S.number + " · " + S.title;

    /* clue → chapter index */
    const clueAt = {};
    S.chapters.forEach((c, i) => c.body.forEach(b => { if (b && b.clue) clueAt[b.clue] = i; }));

    /* ---------- render helpers ---------- */
    function clueHTML(key, inSheet) {
      const c = S.clues[key]; if (!c) return "";
      let body = "";
      if (c.type === "screen") {
        body = '<div class="screen">' + c.lines.join("\n") + "</div>";
        if (c.legend) body += '<div class="legend">' + c.legend.map(l => "<code>" + esc(l[0]) + "</code><span>" + esc(l[1]) + "</span>").join("") + "</div>";
      } else if (c.type === "svg") {
        body = c.svg;
      } else if (c.type === "table") {
        const two = c.head.length === 2 ? " two" : "";
        body = (c.caption ? '<div class="cap">' + esc(c.caption) + "</div>" : "") +
          '<div class="tscroll"><table class="stack' + two + '"><thead><tr>' + c.head.map(h => "<th>" + esc(h) + "</th>").join("") + "</tr></thead><tbody>" +
          c.rows.map((r, i) => '<tr class="' + (i === c.highlight ? "hl" : "") + '">' + r.map((d, j) => '<td data-h="' + esc(c.head[j]) + '">' + esc(d) + "</td>").join("") + "</tr>").join("") +
          "</tbody></table></div>";
      } else if (c.type === "timeline") {
        const span = c.end - c.start, pct = t => ((t - c.start) / span * 100).toFixed(2) + "%";
        body = '<div class="tl"><div class="tl-wrap">' +
          c.rows.map(r => '<div class="tl-row"><span>' + esc(r.name) + '</span><div class="tl-bar"><div class="off" style="left:' + pct(r.off[0]) + ";width:" + ((r.off[1] - r.off[0]) / span * 100) + '%"></div></div></div>').join("") +
          '<div style="position:absolute;left:94px;right:0;top:0;bottom:0;pointer-events:none">' +
          (c.marks || []).map(m => '<div class="tl-mark" style="left:' + pct(m.at) + ";background:" + m.color + '"></div>').join("") + "</div>" +
          '<div class="tl-axis">' + c.ticks.map((t, i) => '<span style="left:' + (i / (c.ticks.length - 1) * 100) + '%">' + esc(t) + "</span>").join("") + "</div></div>" +
          '<div class="tl-keys"><div><i style="background:#4d8a5c"></i>রেকর্ডিং চলছে</div><div><i style="background:repeating-linear-gradient(45deg,#1b1b1b 0 4px,#444 4px 8px)"></i>রেকর্ডিং বন্ধ</div>' +
          (c.marks || []).map(m => '<div><i style="background:' + m.color + '"></i>' + esc(m.label) + "</div>").join("") + "</div></div>";
      } else if (c.type === "html") {
        body = c.html;
      }
      if (c.spoiler) body = '<p class="spoil-tip">উত্তর দেখতে চাপুন</p><div class="spoil" onclick="this.classList.add(\'open\')">' + body + "</div>";
      const pin = inSheet ? '<span class="pin">' + esc(S.chapters[clueAt[key]].label) + "</span>" : '<span class="pin">📌 জমা হলো</span>';
      return '<figure class="clue" id="clue-' + key + '"><div class="clue-h"><span class="ic">' + (c.icon || "🔎") + "</span><b>" + esc(c.title) + "</b>" + pin + '</div><div class="clue-b">' + body + "</div>" +
        (c.look ? '<p class="look">' + esc(c.look) + "</p>" : "") + "</figure>";
    }

    function chapterHTML(i) {
      const ch = S.chapters[i];
      let out = '<div class="ch-head"><div class="ch-label">' + esc(ch.label) + "</div><h1>" + esc(ch.title) + '</h1><div class="ctx">' +
        (ch.day ? '<span class="day">' + esc(ch.day) + "</span>" : "") +
        (ch.where ? "<span>📍 " + esc(ch.where) + "</span>" : "") +
        (ch.when ? "<span>🕰️ " + esc(ch.when) + "</span>" : "") + "</div></div>";
      let buf = [];
      const flush = () => { if (buf.length) { out += '<div class="text' + (ch.diary ? " diary" : "") + '">' + buf.join("") + "</div>"; buf = []; } };
      ch.body.forEach(b => {
        if (typeof b === "string") buf.push("<p>" + b + "</p>");
        else if (b.clue) { flush(); out += clueHTML(b.clue); }
        else if (b.sms) buf.push('<div class="sms"><small>' + esc(b.from || "") + "</small><div>" + esc(b.sms) + "</div></div>");
        else if (b.pause) { flush(); out += '<div class="pause"><span>⏸</span><span>' + esc(b.pause) + "</span></div>"; }
      });
      flush();
      const nx = i + 1 < N ? S.chapters[i + 1] : null;
      out += '<div class="ch-end">· · ·</div>' +
        '<button class="next-big" data-go="' + (i + 1) + '"><small>' + (nx ? "পরের অংশ · " + esc(nx.label) : "শেষ") + "</small><b>" + (nx ? esc(nx.title) : "কেস ফাইল " + S.number + " সমাপ্ত") + " ›</b></button>";
      return '<article class="page">' + out + "</article>";
    }

    function coverHTML() {
      const meta = LIB.find(x => x.id === S.id) || {};
      const canResume = st.cur >= 0 && st.cur < N;
      return '<div class="page"><div class="cover" style="background-image:url(\'' + base + S.cover + '\')"><div class="in">' +
        '<div class="kicker">' + esc(SITE.name) + " · কেস ফাইল " + S.number + "</div><h1>" + esc(S.title) + "</h1><p>" + esc(S.tagline) + "</p><p>" + esc(S.subline || "") + "</p>" +
        '<div class="code">' + esc(S.coverCode || "") + "</div></div></div>" +
        '<div class="cover-meta">' + [meta.chapters, meta.minutes, meta.place ? "📍 " + meta.place : "", "✍️ " + SITE.pen].filter(Boolean).map(x => '<span class="chip">' + esc(x) + "</span>").join("") + "</div>" +
        '<div class="resume-card' + (canResume ? " show" : "") + '"><span>যেখানে থেমেছিলেন: <b>' + (canResume ? esc(S.chapters[st.cur].title) : "") + '</b></span><button data-go="' + st.cur + '">চালিয়ে যান</button></div>' +
        '<button class="btn full" data-go="0">' + (canResume ? "শুরু থেকে পড়ুন" : "পড়া শুরু করুন") + "</button></div>";
    }

    function endHTML() {
      const idx = LIB.findIndex(x => x.id === S.id), nx = LIB[idx + 1];
      const found = Object.keys(clueAt).length;
      return '<div class="page"><div class="ch-head" style="text-align:center"><div class="ch-label">কেস ফাইল ' + S.number + '</div><h1>সমাপ্ত</h1></div>' +
        '<p style="text-align:center;color:var(--soft)">আপনি ' + BN(found) + "টা সূত্রের সবগুলো দেখেছেন।</p>" +
        '<div class="btns" style="justify-content:center;margin:16px 0 28px"><button class="btn ghost" data-sheet="clues">📌 সূত্রগুলো আবার দেখুন</button>' +
        (navigator.share ? '<button class="btn ghost" id="shareBtn">↗ শেয়ার করুন</button>' : "") + "</div>" +
        (nx ? '<div class="case' + (nx.status === "soon" ? " soon" : "") + '" style="margin-bottom:18px"><div class="body"><div class="kicker">পরের কেস · ' + nx.number + "</div><h3>" + esc(nx.title) + "</h3><p>" + esc(nx.blurb || "") + "</p>" +
          (nx.status === "published" ? '<a class="btn" href="read.html?case=' + nx.id + '">পড়ুন ›</a>' : '<span class="chip">শীঘ্রই আসছে</span>') + "</div></div>" : "") +
        '<div class="sub-box"><h3>✉️ নতুন কেস এলে জানতে চান?</h3><p>ইমেইল দিয়ে রাখুন। নতুন কেস প্রকাশ হলেই একটা ছোট মেইল যাবে।</p><a class="btn" href="subscribe.html">সাবস্ক্রাইব করুন</a></div>' +
        '<p style="text-align:center;margin-top:26px"><a href="index.html">← সব কেস ফাইল</a></p></div>';
    }

    /* ---------- navigation ---------- */
    function go(i, fromHash) {
      closeSheet();
      i = Math.max(-1, Math.min(N, i));
      cur = i;
      if (i >= 0 && i < N) { st.cur = i; if (i > st.max) st.max = i; }
      if (i === N) { st.max = N - 1; st.cur = -1; }
      store.set(KEY, st);
      app.innerHTML = i === -1 ? coverHTML() : i === N ? endHTML() : chapterHTML(i);
      if (!fromHash) history.replaceState(null, "", i === -1 ? location.pathname + location.search : "#p" + (i + 1));
      window.scrollTo(0, 0);
      updateBar(); onScroll();
      const sb = $("#shareBtn"); if (sb) sb.onclick = () => navigator.share({ title: S.title, url: location.href.split("#")[0] }).catch(() => {});
    }
    function updateBar() {
      $("#prevBtn").disabled = cur <= -1;
      $("#nextBtn").disabled = cur >= N;
      $("#posLabel").textContent = cur === -1 ? "প্রচ্ছদ" : cur === N ? "শেষ" : BN(cur + 1) + "/" + BN(N);
      const n = Object.values(clueAt).filter(ci => ci <= st.max).length;
      const b = $("#clueBadge"); b.textContent = BN(n); b.style.display = n ? "grid" : "none";
    }
    document.addEventListener("click", e => {
      const g = e.target.closest("[data-go]"); if (g) { closeSheet(); go(+g.dataset.go); return; }
      const s = e.target.closest("[data-sheet]"); if (s) openSheet(s.dataset.sheet);
    });
    $("#prevBtn").onclick = () => go(cur - 1);
    $("#nextBtn").onclick = () => go(cur + 1);
    document.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") go(cur + 1);
      if (e.key === "ArrowLeft") go(cur - 1);
      if (e.key === "Escape") closeSheet();
    });
    window.addEventListener("hashchange", () => { const m = location.hash.match(/^#p(\d+)$/); if (m) go(+m[1] - 1, true); });

    /* progress within the current page */
    const bar = $("#prog");
    function onScroll() {
      const h = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, scrollY / h * 100) : 100) + "%";
    }
    addEventListener("scroll", onScroll, { passive: true });

    /* ---------- sheets ---------- */
    const sheet = $("#sheet"), scrim = $("#scrim");
    function openSheet(kind) {
      let title = "", html = "";
      if (kind === "toc") {
        title = "সূচি";
        html = '<ul class="toc-list">' + S.chapters.map((c, i) =>
          '<li class="' + (i <= st.max ? "read " : "") + (i === cur ? "cur" : "") + '"><button data-go="' + i + '"><span class="dot">' + (i <= st.max && i !== cur ? "✓" : BN(i + 1)) + "</span><span><small>" + esc(c.label) + "</small>" + esc(c.title) + "</span></button></li>").join("") + "</ul>";
      } else if (kind === "clues") {
        title = "📌 জমানো সূত্র";
        const keys = Object.keys(clueAt).filter(k => clueAt[k] <= st.max);
        html = keys.length ? keys.map(k => clueHTML(k, true)).join("") : '<p class="empty">এখনো কোনো সূত্র পাওয়া যায়নি।<br>গল্প পড়তে থাকুন, সূত্র এলে এখানে জমা হবে।</p>';
      } else if (kind === "people") {
        title = "👥 চরিত্র";
        const upto = Math.max(st.max, cur);
        const list = S.people.filter(p => p.from <= upto);
        html = '<p style="color:var(--muted);font-size:14px;margin:0 0 12px">যতটুকু পড়েছেন, ততটুকু পর্যন্ত। আগে থেকে কিছু ফাঁস হবে না।</p><div class="ppl">' +
          list.map(p => '<div class="p"><div class="av">' + (p.icon || "👤") + "</div><div><b>" + esc(p.name) + "</b><small>" + esc(p.role || "") + "</small><p>" + esc(p.text) + "</p>" +
            (p.reveal && p.reveal.at <= upto ? '<p class="rv">' + esc(p.reveal.text) + "</p>" : "") + "</div></div>").join("") + "</div>";
      } else if (kind === "settings") {
        title = "পড়ার সেটিং";
        html = '<div class="set-row"><span>লেখার আকার</span><div class="seg"><button id="fsDown">অ−</button><button id="fsUp">অ+</button></div></div>' +
          '<div class="set-row"><span>রং</span><div class="seg"><button id="mDark" class="' + (prefs.paper ? "" : "on") + '">🌙 রাত</button><button id="mPaper" class="' + (prefs.paper ? "on" : "") + '">📄 কাগজ</button></div></div>';
      }
      $("#sheetTitle").textContent = title;
      $("#sheetBody").innerHTML = html;
      sheet.classList.add("on"); scrim.classList.add("on");
      $("#sheetBody").scrollTop = 0;
      if (kind === "settings") {
        $("#fsDown").onclick = () => { prefs.fs = Math.max(15, prefs.fs - 1); store.set("cds-prefs", prefs); applyPrefs(); };
        $("#fsUp").onclick = () => { prefs.fs = Math.min(25, prefs.fs + 1); store.set("cds-prefs", prefs); applyPrefs(); };
        $("#mDark").onclick = () => { prefs.paper = false; store.set("cds-prefs", prefs); applyPrefs(); openSheet("settings"); };
        $("#mPaper").onclick = () => { prefs.paper = true; store.set("cds-prefs", prefs); applyPrefs(); openSheet("settings"); };
      }
    }
    function closeSheet() { sheet.classList.remove("on"); scrim.classList.remove("on"); }
    scrim.onclick = closeSheet; $("#sheetClose").onclick = closeSheet;

    const m = location.hash.match(/^#p(\d+)$/);
    go(m ? +m[1] - 1 : -1, true);
  }
})();
