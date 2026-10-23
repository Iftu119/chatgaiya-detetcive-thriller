/* মূল পাতা আর সাবস্ক্রাইব পাতার জন্য */
(function () {
  const get = (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const prefs = get("cds-prefs", {});
  if (prefs.paper) document.body.classList.add("paper");
  const BN = n => String(n).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d]);
  document.querySelectorAll(".yr").forEach(e => e.textContent = BN(new Date().getFullYear()));
  if (window.SITE && SITE.facebook) { const f = document.getElementById("fbLink"); if (f) f.innerHTML = ' · <a href="' + SITE.facebook + '">ফেসবুক</a>'; }

  let LIB = [];
  window.LIBRARY = l => { LIB = l; };
  const esc = s => String(s || "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  window.renderHome = function () {
    const box = document.getElementById("caseList"); if (!box) return;
    box.innerHTML = LIB.map(c => {
      if (c.status !== "published") return '<div class="case soon"><div class="thumb"><span>শীঘ্রই আসছে</span><span class="num">CASE ' + c.number + '</span></div><div class="body"><h3>' + esc(c.title) + "</h3><p>" + esc(c.blurb) + '</p><div class="chips"><span class="chip">লেখা চলছে</span></div></div></div>';
      const st = get("cds-" + c.id, null);
      const prog = st && st.max >= 0 ? '<div class="resume-line">● ' + (st.cur >= 0 ? "পড়া চলছে · পর্ব " + BN(st.cur + 1) : "পড়া শেষ ✓") + "</div>" : "";
      return '<a class="case" href="read.html?case=' + c.id + '"><div class="thumb" style="background-image:url(\'stories/' + c.id + '/card.jpg\')"><span class="num">CASE ' + c.number + '</span></div><div class="body"><h3>' + esc(c.title) + "</h3><p>" + esc(c.blurb) + '</p><div class="chips">' +
        [c.chapters, c.minutes, c.place && "📍 " + c.place].filter(Boolean).map(x => '<span class="chip">' + esc(x) + "</span>").join("") + "</div>" + prog +
        '<div class="go"><span class="btn" style="min-height:44px">' + (st && st.cur >= 0 ? "চালিয়ে যান ›" : "পড়ুন ›") + "</span></div></div></a>";
    }).join("");
  };
})();
