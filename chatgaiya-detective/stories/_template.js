/* =========================================================
   নতুন কেসের টেমপ্লেট
   ১. এই ফাইল কপি করে নাম দিন: case-02.js (বা case-03.js ...)
   ২. নিচের সব জায়গা পূরণ করুন
   ৩. series.js-এ ওই কেসের status "published" করে দিন
   ========================================================= */
CDS.registerCase({
  id: "case-02",                 // ফাইলের নামের সাথে হুবহু মিলতে হবে
  no: "০২",
  title: "গল্পের নাম",
  tagline: "এক-দুই লাইনের টিজার।",
  cover: "assets/img/case02-cover.jpg",   // ছবি না থাকলে case01-cover.jpg রেখে দিন

  days: ["প্রথম দিন", "দ্বিতীয় দিন"],      // দিন-রেখা; না চাইলে লাইনটা মুছে দিন

  cast: [
    { name: "আমি (কথক)", role: "এক লাইনের পরিচয়", from: "ch1" },
    { name: "নতুন চরিত্র", role: "এক লাইনের পরিচয় (খুনি হলে এখানে ইঙ্গিত দেবেন না)", from: "ch2" }
  ],

  chapters: [
    { id: "ch1", label: "অধ্যায় এক", title: "অধ্যায়ের নাম",
      place: "জায়গা", time: "সময়", day: 0,
      text: `
প্রথম অনুচ্ছেদ।

দ্বিতীয় অনুচ্ছেদ। এক লাইন ফাঁকা রাখলেই নতুন অনুচ্ছেদ।

“সংলাপ দিয়ে শুরু হলে বাঁ পাশে দাগসহ দেখাবে।”

[clue:firstclue]

***

দৃশ্য বদলের পরের অংশ।
` },

    { id: "ch2", label: "অধ্যায় দুই", title: "অধ্যায়ের নাম",
      place: "জায়গা", time: "সময়", day: 1,
      text: `
লেখা এখানে।
` }
    // ডায়েরি-ধাঁচের অংশ চাইলে অধ্যায়ে যোগ করুন:  style: "diary"
  ],

  clues: {
    firstclue: {
      type: "screen",
      title: "সূত্রের শিরোনাম",
      lines: ["LINE ONE", "LINE TWO (highlighted)", "LINE THREE"],
      hl: [1],
      caption: "<b>কীভাবে দেখবেন:</b> পাঠককে শুধু পড়ার নিয়ম বলুন, উত্তর না।"
    }
    /* অন্যান্য ধরন:
    message:  { type:"message", title:"...", from:"প্রেরক", image:"ছবির বর্ণনা", msgs:["..."], reply:"..." }
    ledger:   { type:"ledger", title:"...", tag:"ট্যাগের লেখা", rows:[["নং","সময়","বিবরণ","নাম"], ...], mark: 0, caption:"..." }
    versus:   { type:"versus", title:"...", rows:[["দাবি","প্রমাণ"], ...] }
    sketch:   { type:"sketch", title:"...", svg:`<svg viewBox="0 0 360 400">...</svg>`, caption:"..." }
    timeline: { type:"timeline", title:"...", svg:`<svg>...</svg>`, legend:[["#রং","লেখা"]], caption:"..." }
    html:     { type:"html", title:"...", html:"<p>যেকোনো HTML</p>" }
    */
  }
});
