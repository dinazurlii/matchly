const app = document.querySelector("#app");
const quitDialog = document.querySelector("#quit-dialog");
const toast = document.querySelector("#toast");
const routes = new Set([
  "dashboard",
  "tracker",
  "calendar",
  "guest",
  "login",
  "signup",
  "guest-score",
  "profile",
  "settings",
  "requirement",
]);
const nav = [
  ["dashboard", "Home", "home.png"],
  ["calendar", "Calendar", "calendar.png"],
  ["tracker", "Tracker", "tracker.png"],
  ["settings", "Settings", "settings.png"],
];
const trackerJobs = [
  ["Backend Developer", "PT Karya Anak Bangsa", "Glints", "Screening", "15 Jan 2026"],
  ["AI Engineer", "PT Digital Talenta International", "JobStreet", "Offering", "20 Feb 2026"],
  ...Array.from({ length: 7 }, (_, i) => ["Web Developer", "PT Indonesia Maju Bersama", "LinkedIn", "Interview User", `${20 + i} Jul 2026`]),
];
const productivityHeatmapRows = [
  "000000040000",
  "000400000040",
  "012000002000",
  "040000000320",
  "000400100200",
  "003000304000",
  "000010000004",
];
const productivityHeatmapColors = ["#d9d9d9", "#f7ff4a", "#eaf245", "#d5db42", "#b5ba38"];
const backgroundBubbleSets = {
  dashboard: [
    ["dashboard", "bubble-dashboard.svg", 843, 683, 337, 333, 44.51, 45.05],
  ],
  calendar: [
    ["calendar-top", "bubble-calendar-top.svg", 801, 110, 265, 273, 56.6, 54.95],
    ["calendar-middle", "bubble-calendar-middle.svg", 729, 441, 265, 273, 56.6, 54.95],
    ["calendar-bottom", "bubble-dashboard.svg", 870, 534, 337, 333, 44.51, 45.05],
  ],
  profile: [
    ["profile-top", "bubble-calendar-top.svg", 801, 110, 265, 273, 56.6, 54.95],
    ["profile-middle", "bubble-calendar-middle.svg", 470, 383, 265, 273, 56.6, 54.95],
    ["profile-bottom", "bubble-dashboard.svg", 870, 534, 337, 333, 44.51, 45.05],
  ],
  settings: [
    ["settings-top", "bubble-calendar-top.svg", 801, 110, 265, 273, 56.6, 54.95],
    ["settings-middle", "bubble-calendar-middle.svg", 470, 383, 265, 273, 56.6, 54.95],
    ["settings-bottom", "bubble-dashboard.svg", 870, 534, 337, 333, 44.51, 45.05],
  ],
  tracker: [
    ["tracker-right", "bubble-dashboard.svg", 572, 264, 337, 333, 44.51, 45.05],
    ["tracker-left", "bubble-dashboard.svg", -67, 507, 337, 333, 44.51, 45.05],
  ],
  requirement: [
    ["requirement-right", "bubble-dashboard.svg", 572, 264, 337, 333, 44.51, 45.05],
    ["requirement-left", "bubble-dashboard.svg", -67, 507, 337, 333, 44.51, 45.05],
  ],
  auth: [
    ["auth-large-top", "bubble-guest-large.svg", 197, 165, 476, 468, 31.51, 32.05],
    ["auth-small-bottom", "bubble-guest-small.svg", 640, 639, 205, 186, 73.17, 80.65],
    ["auth-medium-middle", "bubble-guest-medium.svg", 495, 470, 205, 186, 73.17, 80.65],
    ["auth-large-right", "bubble-guest-right.svg", 998, 292, 337, 333, 44.51, 45.05],
    ["auth-large-left", "bubble-guest-large.svg", -111, 413, 476, 468, 31.51, 32.05],
    ["auth-small-top", "bubble-guest-left.svg", 28, 54, 337, 333, 44.51, 45.05],
  ],
};
const trackerColors = {
  portal: { Glints: "portal-glints", JobStreet: "portal-jobstreet", LinkedIn: "portal-linkedin", Other: "portal-other" },
  progress: { Applied: "progress-applied", Screening: "progress-screening", "Interview User": "progress-interview", Offering: "progress-offering", Rejected: "progress-rejected" },
};
let toastTimeout;
let currentMonth = new Date(2025, 8, 1);
let timerInterval;
let todoProgressPercent = 50;
const completedTodos = new Set();
let activeScheduleTrigger = null;

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function localDateInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function route() {
  const current = location.hash.replace(/^#\/?/, "").split(/[/?]/)[0];
  return routes.has(current) ? current : "dashboard";
}

function go(to) {
  location.hash = `/${to}`;
}

function notify(message) {
  window.clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add("visible");
  toastTimeout = window.setTimeout(() => toast.classList.remove("visible"), 2800);
}

function openScheduleMenu(trigger) {
  const menu = document.querySelector("#email-schedule-menu");
  if (!menu) return;
  const width = Math.min(324, window.innerWidth - 24);
  const rect = trigger.getBoundingClientRect();
  menu.style.width = `${width}px`;
  menu.style.left = `${Math.max(12, Math.min(rect.left, window.innerWidth - width - 12))}px`;
  menu.style.top = `${Math.max(12, Math.min(rect.top - 210, window.innerHeight - 214))}px`;
  menu.hidden = false;
  document.querySelectorAll("[data-toggle-schedule-menu]").forEach((button) => button.setAttribute("aria-expanded", String(button === trigger)));
  activeScheduleTrigger = trigger;
}

function closeScheduleMenu(restoreFocus = false) {
  const menu = document.querySelector("#email-schedule-menu");
  if (!menu || menu.hidden) return;
  menu.hidden = true;
  document.querySelectorAll("[data-toggle-schedule-menu]").forEach((button) => button.setAttribute("aria-expanded", "false"));
  if (restoreFocus && activeScheduleTrigger?.isConnected) activeScheduleTrigger.focus();
  activeScheduleTrigger = null;
}

function icon(file, alt = "") {
  return `<img src="/assets/icons/${file}" alt="${alt}" />`;
}

function header(title = "matchly,", subtitle = "Match your job search, at a glance.") {
  const activeTheme = document.body.dataset.theme ?? "dark";
  return `
    <header class="workspace-header">
      <div class="heading-copy"><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ""}</div>
      <div class="account-controls">
        <div class="theme-toggle" role="group" aria-label="Color theme">
          <button type="button" class="${activeTheme === "dark" ? "active" : ""}" data-theme="dark" aria-pressed="${activeTheme === "dark"}">${icon("moon.png")} Dark</button>
          <button type="button" class="${activeTheme === "light" ? "active" : ""}" data-theme="light" aria-pressed="${activeTheme === "light"}">Light ${icon("sun.png")}</button>
        </div>
        <button class="profile-link" type="button" data-go="profile">Hello, <strong>Dina</strong>${icon("profile.png", "Dina's profile")}</button>
      </div>
    </header>`;
}

function sidebar(active) {
  return `
    <aside class="sidebar">
      <nav aria-label="Main navigation">
        ${nav.map(([id, label, file]) => `<a class="${active === id || (active === "requirement" && id === "tracker") ? "selected" : ""}" href="#/${id}" ${active === id ? 'aria-current="page"' : ""}>${icon(file)}<span>${label}</span></a>`).join("")}
      </nav>
      <button class="logout" type="button" data-open-quit aria-label="Log out">${icon("logout.png")}<span>Log out</span></button>
    </aside>`;
}

function backgroundBubbles(screen, layerClass) {
  const bubbles = backgroundBubbleSets[screen] ?? [];
  return `<div class="${layerClass}" aria-hidden="true">${bubbles.map(([name, file, x, y, width, height, bleedX, bleedY]) => {
    const imageLeft = x - width * bleedX / 100;
    const imageTop = y - height * bleedY / 100;
    const imageWidth = width * (1 + 2 * bleedX / 100);
    const imageHeight = height * (1 + 2 * bleedY / 100);
    return `<img class="background-bubble background-bubble-${name}" src="/assets/images/background-bubbles/${file}" alt="" style="--bubble-left: ${imageLeft}px; --bubble-top: ${imageTop}px; --bubble-width: ${imageWidth}px; --bubble-height: ${imageHeight}px" />`;
  }).join("")}</div>`;
}

function shell(active, title, content, options = {}) {
  const { subtitle = "", tabs = false } = options;
  return `<div class="app-shell screen-${active}">${sidebar(active)}<main class="workspace">${header(title, subtitle)}
    ${tabs ? `<nav class="page-tabs"><a class="${active === "dashboard" ? "selected" : ""}" href="#/dashboard">Upload/Paste CV</a><a class="${active === "requirement" ? "selected" : ""}" href="#/requirement">Add New Requirement</a></nav>` : ""}
    ${content}</main>${backgroundBubbles(active, `ambient ambient-${active}`)}</div>`;
}

function uploadCard(guest = false) {
  return `<section class="upload-card">
    <h2>MATCH YOUR CV</h2>
    <div class="upload-inner">
      <div class="segmented"><button class="active" role="tab" aria-selected="true" data-mode="upload">UPLOAD CV</button><button role="tab" aria-selected="false" data-mode="paste">PASTE CV</button></div>
      <div class="upload-panel" data-panel="upload">
        <label class="drop-zone"><input type="file" class="visually-hidden" data-file accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" />${icon("upload.png")}<strong>Drag and Drop your CV here</strong><span>in PDF or DOCX format · Max<br />5MB</span></label>
        <button type="button" class="button primary choose-file">CHOOSE FILE</button>
      </div>
      <div class="upload-panel paste-panel" data-panel="paste" hidden><label class="visually-hidden" for="paste-cv">Paste your CV</label><textarea id="paste-cv" placeholder="Paste your CV here..." maxlength="12000"></textarea><button class="button primary" type="button" data-paste>${guest ? "CONTINUE" : "SAVE CV"}</button></div>
      <p class="upload-status" aria-live="polite"></p>
    </div>
  </section>`;
}

function dashboard() {
  const skillData = [
    ["01", "Docker", "Appears in 78% of the roles you're targeting — you don't have it yet.", 78],
    ["02", "Unit Testing", "Common at mid-level — you're already close.", 62],
    ["03", "CI/CD Basics", "Common at mid-level — you're already close.", 63],
  ];
  const skills = [["Docker", "68%"], ["Kubernetes", "32%"], ["TypeScript", "32%"], ["AWS", "68%"]];
  const jobs = [["AI/ML Engineer", "32%"], ["DevOps Engineer", "30%"], ["Backend Developer", "32%"], ["Data Engineer", "15%"]];
  const trendPills = (list) => list.map(([name, percent]) => `<li>${name} <strong>↑${percent}</strong></li>`).join("");
  return shell("dashboard", "Matchly,", `
    <section class="dashboard-grid">
      <article class="match-card"><span class="tag">Your Latest Match</span><h2>Backend Developer — Fintech Startup</h2><p>82% match with your CV</p><div class="match-ring"><strong>82%</strong></div><ul class="match-tags"><li>Node.js</li><li>PostgreSQL</li><li>Docker</li><li>Unit Testing</li></ul></article>
      ${uploadCard()}
    </section>
    <section class="skills-overview"><div class="skills-panel"><h2 class="chip">Skills to Strengthen</h2><ol>${skillData.map(([number, name, text, progress]) => `<li><b>${number}</b><div><h3>${name}</h3><p>${text}</p><div class="progress"><span style="width:${progress}%"></span></div></div></li>`).join("")}</ol></div><aside class="learning"><strong>3</strong><b>Skills worth<br />learning next</b></aside></section>
    <section class="salary"><div><span class="chip">Salary Insight</span><strong>Rp10–18jt</strong></div><div class="salary-bar"><span></span></div><small>14 Jobstreet listings · estimated</small></section>
    <section class="trending"><h2 class="chip">What's Trending</h2><div><article><h3>Hot Skills Right Now</h3><ul>${trendPills(skills)}</ul></article><article><h3>Trending Roles</h3><ul>${trendPills(jobs)}</ul></article></div><p>Based on postings across LinkedIn, Jobstreet, and community submissions in the last 30 days. Add New Requirement to support the data</p></section>`, { tabs: true, subtitle: "Match your job search, at a glance." });
}

function tracker() {
  const select = (kind, position, value, options) => `<select class="tracker-select ${trackerColors[kind][value] ?? ""}" data-tracker-color="${kind}" aria-label="${kind === "portal" ? "Job portal" : "Progress"} for ${escapeHTML(position)}">${options.map((option) => `<option class="${trackerColors[kind][option]}" value="${option}" ${value === option ? "selected" : ""}>${option}</option>`).join("")}</select>`;
  const portalOptions = ["Glints", "JobStreet", "LinkedIn", "Other"];
  const progressOptions = ["Applied", "Screening", "Interview User", "Offering", "Rejected"];
  return shell("tracker", "Tracker", `
    <section class="tracker-summary"><article><span>Summarize</span><strong>16</strong><p><em>12% Lower</em><br />than previous week</p></article><article><strong>24%</strong><p>Your application<br />response rate</p></article></section>
    <div class="tracker-tools"><button class="button muted" type="button" data-open-add-job>+ Add job</button><div class="tracker-search-tools"><span class="tracker-date-filter" aria-hidden="true"><img src="/assets/icons/tracker-date-filter.png" alt="" /></span><label class="tracker-search-field"><svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="10.8" cy="10.8" r="6.3"></circle><path d="m15.5 15.5 4.2 4.2"></path></svg><input id="tracker-search" type="search" aria-label="Search tracker" placeholder="Search" /></label></div></div>
    <section class="table-card"><div class="table-scroll"><table><thead><tr><th>No</th><th>Position</th><th>Company</th><th>Job Portal</th><th>Progress</th><th>Apply Date</th></tr></thead><tbody>${trackerJobs.map(([position, company, portal, progress, date], i) => `<tr><td>${i + 1}</td><td>${escapeHTML(position)}</td><td>${escapeHTML(company)}</td><td>${select("portal", position, portal, portalOptions)}</td><td>${select("progress", position, progress, progressOptions)}</td><td>${escapeHTML(date)}</td></tr>`).join("")}</tbody></table></div><nav class="pagination" aria-label="Tracker pages">${[1, 2, 3].map((page) => `<button class="${page === 1 ? "active" : ""}" data-page="${page}" aria-label="Page ${page}">${page}</button>`).join("")}</nav></section>
    <dialog class="add-job-dialog" id="add-job-dialog" aria-labelledby="add-job-title"><form id="add-job-form"><h2 id="add-job-title">Add applied job</h2><p>Add a job you have already applied for to your tracker.</p><label>Position<input name="position" required maxlength="100" placeholder="e.g. Backend Developer" /></label><label>Company<input name="company" required maxlength="100" placeholder="e.g. Company name" /></label><label>Job portal<select name="portal" required><option>LinkedIn</option><option>JobStreet</option><option>Glints</option><option>Other</option></select></label><label>Apply date<input name="date" type="date" required value="${localDateInputValue()}" /></label><div class="add-job-actions"><button class="button muted" type="button" data-close-add-job>Cancel</button><button class="button primary" type="submit">Add to tracker</button></div></form></dialog>`);
}

function calendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();
  const days = Array.from({ length: 42 }, (_, index) => {
    let day;
    let outside = false;
    if (index < firstWeekday) {
      day = previousMonthDays - firstWeekday + index + 1;
      outside = true;
    } else if (index >= firstWeekday + daysInMonth) {
      day = index - firstWeekday - daysInMonth + 1;
      outside = true;
    } else day = index - firstWeekday + 1;
    return `<button type="button" class="calendar-day ${outside ? "muted-day" : ""} ${!outside && [9, 13].includes(day) ? "marked" : ""}" data-day="${day}">${day}</button>`;
  }).join("");
  const todoPercent = todoProgressPercent;
  const heatmapCells = productivityHeatmapRows.flatMap((row) => [...row].map((level) => `<i class="heatmap-cell level-${level}"></i>`)).join("");
  const tomorrowMorning = new Date();
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  tomorrowMorning.setHours(8, 0, 0, 0);
  const tomorrowAfternoon = new Date(tomorrowMorning);
  tomorrowAfternoon.setHours(13, 0, 0, 0);
  const mondayMorning = new Date();
  const daysToMonday = (8 - mondayMorning.getDay()) % 7 || 7;
  mondayMorning.setDate(mondayMorning.getDate() + daysToMonday);
  mondayMorning.setHours(8, 0, 0, 0);
  const scheduleOptions = [
    ["Tomorrow morning", tomorrowMorning],
    ["Tomorrow afternoon", tomorrowAfternoon],
    ["Monday’s Morning", mondayMorning],
  ].map(([label, date]) => {
    const time = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
    const displayTime = `${time.slice(0, 2)}.${time.slice(3)}`;
    const displayDate = `${date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}, ${displayTime}`;
    return `<button type="button" class="email-schedule-option" data-schedule-date="${localDateInputValue(date)}" data-schedule-time="${time}"><span>${label}</span><time>${displayDate}</time></button>`;
  }).join("");
  const emailIcon = (file, label, command = "", actionClass = "") => `<button type="button" class="email-icon-button ${actionClass}" aria-label="${label}" title="${label}" ${command ? `data-editor-command="${command}"` : `data-notice="${label} is not available in this preview."`}><img src="/assets/icons/${file}" alt="" /></button>`;
  const emailDropdownIcon = (file, label, command = "") => `<span class="email-icon-dropdown">${emailIcon(file, label, command)}<img class="email-dropdown-arrow" src="/assets/icons/email-chevron.png" alt="" /></span>`;
  const emailToolbar = `<div class="email-toolbar" role="toolbar" aria-label="Email formatting">${emailIcon("email-reply.png", "Reply")}${emailIcon("email-forward.png", "Forward")}<span class="email-toolbar-divider"></span><span class="email-font">Poppins <img src="/assets/icons/email-chevron.png" alt="" /></span><span class="email-font-size"><img src="/assets/icons/email-lowercase.png" alt="" /><img src="/assets/icons/email-chevron.png" alt="" /></span><span class="email-toolbar-divider"></span>${emailIcon("email-bold.png", "Bold", "bold")}${emailIcon("email-italic.png", "Italic", "italic")}${emailIcon("email-underline.png", "Underline", "underline")}${emailDropdownIcon("email-text-color.png", "Text color")}<span class="email-toolbar-divider"></span>${emailDropdownIcon("email-align-left.png", "Align left", "justifyLeft")}${emailDropdownIcon("email-numbered-list.png", "Numbered list", "insertOrderedList")}${emailIcon("email-bulleted-list.png", "Bulleted list", "insertUnorderedList")}${emailDropdownIcon("email-indent.png", "Indent")}</div>`;
  return shell("calendar", "My Calendar", `
    <section class="calendar-layout">
      <div class="calendar-main">
        <div class="stats-row"><article><h2>Focus Timer</h2><div class="timer-ring"><strong data-timer>00:30</strong></div><button class="button muted" data-timer-toggle>START</button></article><article><h2>Completion</h2><div class="stat-circle">67%</div><small>The data showing compared<br />with previous day's data</small></article><article class="productivity-stat"><h2>Productivity</h2><div class="heatmap-chart" role="img" aria-label="Productivity activity from July through September"><div class="heatmap-months" aria-hidden="true"><span>Jul</span><span>Aug</span><span>Sep</span></div><div class="heatmap-body"><div class="heatmap-weekdays" aria-hidden="true"><span>Mon</span><span>Wed</span><span>Fri</span></div><div class="heatmap-grid">${heatmapCells}</div></div><div class="heatmap-legend" aria-hidden="true"><span>Less</span><div class="heatmap-legend-swatches">${productivityHeatmapColors.map((color) => `<i style="--heatmap-color: ${color}"></i>`).join("")}</div><span>More</span></div></div></article></div>
        <section class="email-card"><h2>Email</h2><form id="email-form"><div class="email-fields"><input type="email" placeholder="To:" aria-label="To" required /><input type="email" placeholder="CC:" aria-label="CC" /><input type="email" placeholder="BCC:" aria-label="BCC" /></div><input placeholder="Subject" aria-label="Subject" required /><div class="email-body" contenteditable="true" role="textbox" aria-label="Email body" data-email-body data-placeholder="Write here"></div>${emailToolbar}<div class="email-actions"><div class="email-send-group"><button type="submit" class="button muted">SEND</button><button type="button" class="email-send-options" aria-label="Schedule send" title="Schedule send" aria-haspopup="dialog" aria-controls="email-schedule-menu" aria-expanded="false" data-toggle-schedule-menu><img src="/assets/icons/email-chevron.png" alt="" /></button></div>${emailIcon("email-font-size.png", "Font size")}${emailIcon("email-attach.png", "Attach")}${emailIcon("email-link.png", "Insert link", "", "email-action-link")}${emailIcon("email-emoji.png", "Emoji", "", "email-action-emoji")}${emailIcon("email-picture.png", "Insert picture", "", "email-action-picture")}<button type="button" class="email-delete-draft" aria-label="Clear email draft" title="Clear email draft" data-clear-email><img src="/assets/icons/email-remove.png" alt="" /></button></div><div class="email-schedule-menu" id="email-schedule-menu" role="dialog" aria-label="Schedule delivery" hidden><div class="email-schedule-menu-header"><div><strong>schedule delivery</strong><span>Indonesia Time</span></div><button type="button" class="email-schedule-menu-close" aria-label="Close schedule options" data-close-schedule-menu><img src="/assets/icons/schedule-close.png" alt="" /></button></div><div class="email-schedule-options">${scheduleOptions}</div><div class="email-schedule-divider"><img src="/assets/icons/schedule-divider.svg" alt="" width="324" height="1" /></div><button type="button" class="email-pick-date" data-open-email-schedule-picker><img src="/assets/icons/schedule-calendar.png" alt="" /><span>Pick date and time</span></button></div></form></section>
      </div>
      <aside class="calendar-side"><div class="month-controls"><button data-month="previous" aria-label="Previous month">‹</button><select id="month-select" aria-label="Month">${Array.from({ length: 12 }, (_, i) => `<option value="${i}" ${i === month ? "selected" : ""}>${new Date(2025, i, 1).toLocaleString("en", { month: "short" })}</option>`).join("")}</select><select id="year-select" aria-label="Year">${[2025, 2026, 2027].map((value) => `<option ${year === value ? "selected" : ""}>${value}</option>`).join("")}</select><button data-month="next" aria-label="Next month">›</button></div><div class="weekdays">${["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => `<span>${d}</span>`).join("")}</div><div class="calendar-days">${days}</div><div class="todo-heading"><h2>DAILY TO DO</h2><button class="button muted" data-notice="Add a task using your calendar service.">+ Add new</button></div><div class="todo-progress" role="progressbar" aria-label="Daily tasks completed" aria-valuemin="0" aria-valuemax="2" aria-valuenow="${Math.round(todoPercent / 50)}" style="--todo-progress: ${todoPercent}%"><span style="width: ${todoPercent}%"></span><span class="todo-progress-value">${todoPercent}%</span><img class="todo-cat" src="/assets/icons/cat-progress.png" alt="" /></div><label class="todo"><input type="checkbox" data-todo-index="0" ${completedTodos.has(0) ? "checked" : ""} /> Apply 10 Job</label><label class="todo"><input type="checkbox" data-todo-index="1" ${completedTodos.has(1) ? "checked" : ""} /> Refining LinkedIn</label></aside>
    </section>`);
}

function profile() {
  return shell("profile", "My Profile", `
    <div class="profile-toolbar"><button class="button primary" data-notice="Profile changes saved for this session.">SAVE</button></div>
    <section class="profile-layout"><aside class="profile-column"><article class="profile-card"><div class="avatar">D</div><strong>Dina Amalia Zurli</strong><span>Backend Developer</span><div class="progress"><span style="width:65%"></span></div><small>Profile 65% complete</small></article><article class="profile-card"><h2>Completion Checklist</h2><p>☑ Basic info</p><p>☑ 1 work experience added</p><p>◯ Education not added yet</p><p>☑ 4 skills added</p></article><article class="profile-card"><h2>Connected Account</h2><p>☑ Google Calendar</p><p>◯ Gmail (For sending application)</p></article></aside>
      <div class="profile-details"><article class="profile-card experience"><header><h2>Work Experience</h2><button data-notice="Experience editor is ready for your profile service.">+ Add Experience</button></header><strong>Backend Developer</strong><p>PT Teknologi Nusantara · 2023–present</p><button class="button disabled" data-notice="Editing requires a profile service.">EDIT</button></article><article class="profile-card"><header><h2>Education</h2><button data-notice="Education editor is ready for your profile service.">+ Add Education</button></header><p class="empty-copy">No education added yet.</p></article><article class="profile-card"><header><h2>Skill</h2><button data-notice="Skill editor is ready for your profile service.">+ Add Skill</button></header><div class="skill-chips"><span>JavaScript</span><span>Node.js</span><span>PostgreSQL</span><span>Git</span></div></article></div></section>`);
}

function settings() {
  return shell("settings", "Settings", `
    <section class="settings-grid">
      <div><article class="settings-card account-card"><h2 class="chip chip-lime">Account</h2><div class="account-identity"><div class="settings-avatar"><img src="/assets/icons/settings-account-avatar.svg" alt="" /><span>D</span></div><div><strong>Dina Amalia Zurli</strong><a href="mailto:dinaamaliazrl@gmail.com">dinaamaliazrl@gmail.com</a></div></div><form class="settings-form account-form"><label>Full Name<input value="Dina Amalia Zurli" /></label><label>Email<input type="email" value="dinaamaliazrl@gmail.com" /></label><div class="account-actions"><button class="button primary">SAVE CHANGES</button><button class="button settings-cancel" type="reset">CANCEL</button></div></form></article>
      <article class="settings-card security-card"><h2 class="chip chip-lime">Security</h2><h3>Change Password</h3><p>Use at least 8 characters.</p><form class="settings-form security-form"><label>Current Password<input type="password" placeholder="***************" minlength="8" /></label><label>New Password<input type="password" placeholder="***************" minlength="8" /></label><button class="button primary">SAVE CHANGES</button></form></article></div>
      <div><article class="settings-card integration-card"><h2 class="chip chip-neutral">Integrations</h2><div class="integration"><span class="connected">Connected</span><div class="integration-details"><div class="integration-icon"><img src="/assets/icons/settings-google-calendar.png" alt="" /></div><div><strong>Google Calendar</strong><p>Interviews and follow-ups sync to your calendar</p></div></div><button class="button danger" data-notice="Google Calendar requires an integration service.">DISCONNECT</button></div></article>
      <article class="settings-card notifications-card"><h2 class="chip chip-neutral">Notifications</h2>${[["Follow-up reminders", "Nudge me when it's time to follow up", false], ["Interview reminders", "Alert me the day before", true], ["Weekly market digest", "Hot skills and trending roles, every Monday", true]].map(([title, text, checked]) => `<label class="setting-toggle"><span><strong>${title}</strong><small>${text}</small></span><input type="checkbox" ${checked ? "checked" : ""} /></label>`).join("")}</article>
      <article class="settings-card privacy"><h2 class="chip chip-neutral">Data &amp; Privacy</h2><strong>Your data, your call</strong><p>Download a copy of your CVs, skills, and tracker history, or remove your account entirely.</p><button class="button outline" data-export>Export my data</button><div class="delete-area"><span><strong>Delete account</strong><small>Permanently removes your data. This can't be undone</small></span><button class="button danger" data-notice="Account deletion is not connected to an account service.">Delete</button></div></article></div>
    </section>`);
}

function requirement() {
  return shell("requirement", "Add New Requirement", `
    <section class="requirement-card"><h2>ADD NEW REQUIREMENT</h2><form id="requirement-form"><p>Found a listing elsewhere? Paste the position and requirements here — we’ll match it against your CV and add it to our database.</p>
      <label>Position<input name="position" value="Backend Developer" required /></label><div class="form-row"><label>Company Name<input placeholder="e.g PT Fintech Maju" /></label><label>Location<input placeholder="e.g Jakarta Selatan" /></label></div>
      <div class="form-row"><label>Industry<input value="E-Commerce" /></label><fieldset><legend>Work mode</legend><label><input type="radio" name="mode" /><span>Hybrid</span></label><label><input type="radio" name="mode" checked /><span>Remote</span></label><label><input type="radio" name="mode" /><span>On Site</span></label></fieldset></div>
      <label>Job Description<textarea rows="3">Responsible for building and maintaining REST APIs for a payments platform, collaborating with frontend and product teams...</textarea></label>
      <label>Qualifications<textarea rows="3">Minimum 2 years as a Backend Developer, proficient in Node.js and PostgreSQL, familiar with Docker and CI/CD practices...</textarea></label>
      <div class="form-row"><label>Min Salary <small>Optional</small><input placeholder="e.g 10,000,000" /></label><label>Max Salary <small>Optional</small><input placeholder="e.g 15,000,000" /></label></div>
      <div class="form-actions"><button class="button primary" value="match">Save &amp; Match with My CV</button><button class="button bright" value="save">Save Only</button><a class="button disabled" href="#/dashboard">Cancel</a></div>
    </form></section>`, { tabs: true });
}

function authPromo(title, description) {
  return `<section class="auth-promo"><div class="promo-copy"><h1>${title}</h1><p>${description}</p></div></section>`;
}

function auth(routeName) {
  const guest = routeName === "guest";
  const score = routeName === "guest-score";
  const signup = routeName === "signup";
  const login = routeName === "login";
  const promoTitle = guest || score ? "Try a match, no account needed." : signup ? "Your CV, matched against the real market." : "Find your next IT role, faster.";
  const promoText = guest || score ? "Paste your CV and a job listing to get an instant match score. Sign up anytime to unlock the full skill breakdown and save your results." : signup ? "Only email, password, and your name are required. Everything else — profile, experience, skills — you can add anytime." : "Match your CV against real job requirements, track every application, and know exactly what skill to learn next.";
  let panel;
  if (guest) {
    panel = `<p class="guest-intro"><strong>Try as a guest.</strong><br />No login required — nothing you paste here is saved.</p>${uploadCard(true)}<a class="text-link" href="#/guest-score">Paste your CV and job requirements instead</a>`;
  } else if (score) {
    panel = `<p class="guest-intro"><strong>Try as a guest.</strong><br />No login required — nothing you paste here is saved.</p><form class="guest-score-form"><label>Paste your CV<textarea required>Backend Developer, 2 years experience with Node.js, Express, PostgreSQL...</textarea></label><label>Paste the job requirements<textarea required>Looking for a Backend Developer with 2+ years experience, Node.js, PostgreSQL, Docker...</textarea></label><button class="button muted">Check My Match</button></form><div class="match-result"><strong>Match Result</strong><b>76%</b></div><div class="signup-note">Sign up to see which skills are missing &amp; save this result.<a class="button bright" href="#/signup">Sign Up Free</a></div>`;
  } else {
    panel = `<h2>${signup ? "Create your account" : "Welcome back"}</h2><p class="form-intro">${signup ? "Just the basics for now — you can complete your profile later." : "Log in to see your latest matches and application progress."}</p><form class="account-form">${signup ? `<label>Full Name<input autocomplete="name" placeholder="Dina Amalia Zurli" required /></label>` : ""}<label>Email<input type="email" autocomplete="email" placeholder="you@email" required /></label><label>Password<input type="password" minlength="8" placeholder="*********" required /></label>${login ? `<button type="button" class="forgot" data-notice="Password reset needs an email service.">Forgot password?</button>` : ""}<button class="button primary form-submit">${signup ? "Create Account" : "Log In"}</button></form><div class="or"><span>or</span></div><a class="button guest-button" href="#/guest">Continue as Guest</a><p class="account-prompt">${signup ? `Already have an account? <a href="#/login">Log In</a>` : `Don't have an account? <a href="#/signup">Sign up</a>`}</p>`;
  }
  return `<div class="auth-page auth-${routeName}">${backgroundBubbles("auth", "auth-bubbles")}<div class="auth-top">${login ? `<a href="#/login">Log In</a><a href="#/signup">Sign Up</a>` : guest || score ? `<a href="#/login">Log In</a><a href="#/signup">Sign Up</a>` : ""}</div><div class="auth-columns">${authPromo(promoTitle, promoText)}<section class="auth-panel ${guest ? "guest-panel" : ""} ${score ? "score-panel" : ""} ${login || signup ? "account-panel" : ""}">${panel}</section></div></div>`;
}

function render() {
  const current = route();
  document.body.classList.toggle("auth-route", ["guest", "guest-score", "login", "signup"].includes(current));
  if (current === "dashboard") app.innerHTML = dashboard();
  else if (current === "tracker") app.innerHTML = tracker();
  else if (current === "calendar") app.innerHTML = calendar();
  else if (current === "profile") app.innerHTML = profile();
  else if (current === "settings") app.innerHTML = settings();
  else if (current === "requirement") app.innerHTML = requirement();
  else app.innerHTML = auth(current);
  bind();
}

function bind() {
  document.querySelectorAll("[data-open-quit]").forEach((button) => button.addEventListener("click", () => quitDialog.showModal()));
  document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => go(button.dataset.go)));
  document.querySelectorAll(".theme-toggle [data-theme]").forEach((button) => button.addEventListener("click", () => {
    document.body.dataset.theme = button.dataset.theme;
    document.querySelectorAll(".theme-toggle [data-theme]").forEach((item) => {
      const active = item === button;
      item.classList.toggle("active", active);
      item.setAttribute("aria-pressed", String(active));
    });
  }));
  document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => {
    const selected = button.dataset.mode;
    document.querySelectorAll("[data-mode]").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-selected", String(item === button));
    });
    document.querySelectorAll("[data-panel]").forEach((panel) => { panel.hidden = panel.dataset.panel !== selected; });
  }));
  document.querySelectorAll(".choose-file").forEach((button) => button.addEventListener("click", () => button.closest(".upload-card").querySelector("[data-file]").click()));
  const validateUpload = (file, card) => {
    if (!file) return;
    const status = card.querySelector(".upload-status");
    if (!/\.(pdf|docx)$/i.test(file.name)) status.textContent = "Choose a PDF or DOCX file.";
    else if (file.size > 5 * 1024 * 1024) status.textContent = "That file is over the 5MB limit.";
    else {
      status.textContent = `${file.name} is ready.`;
      if (route() === "guest") notify("CV ready — continue to add job requirements.");
    }
  };
  document.querySelectorAll("[data-file]").forEach((input) => input.addEventListener("change", () => {
    validateUpload(input.files?.[0], input.closest(".upload-card"));
  }));
  document.querySelectorAll(".drop-zone").forEach((zone) => {
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("dragging");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("dragging"));
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("dragging");
      validateUpload(event.dataTransfer.files?.[0], zone.closest(".upload-card"));
    });
  });
  document.querySelectorAll("[data-paste]").forEach((button) => button.addEventListener("click", () => {
    const value = button.closest(".upload-card").querySelector("textarea").value.trim();
    if (!value) button.closest(".upload-card").querySelector(".upload-status").textContent = "Paste your CV before continuing.";
    else if (route() === "guest") go("guest-score");
    else notify("CV text saved for this session.");
  }));
  document.querySelectorAll(".guest-score-form").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.reportValidity()) notify("Your match score is ready.");
  }));
  document.querySelectorAll(".account-form").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.reportValidity()) notify("This preview is not connected to an account service.");
  }));
  document.querySelectorAll("[data-notice]").forEach((button) => button.addEventListener("click", () => notify(button.dataset.notice)));
  document.querySelector("#requirement-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    if (event.submitter?.value === "save") go("tracker");
    else notify("Requirement saved. Matching needs a matching service.");
  });
  document.querySelectorAll(".settings-form").forEach((form) => form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.reportValidity()) notify("Changes saved for this session.");
  }));
  document.querySelector("#tracker-search")?.addEventListener("input", (event) => {
    const search = event.currentTarget.value.toLowerCase();
    document.querySelectorAll("tbody tr").forEach((row) => { row.hidden = !row.textContent.toLowerCase().includes(search); });
  });
  document.querySelectorAll("[data-page]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-page]").forEach((item) => item.classList.toggle("active", item === button));
  }));
  document.querySelector("[data-open-add-job]")?.addEventListener("click", () => document.querySelector("#add-job-dialog").showModal());
  document.querySelector("[data-close-add-job]")?.addEventListener("click", () => document.querySelector("#add-job-dialog").close());
  document.querySelector("#add-job-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const formData = new FormData(form);
    const applyDate = new Date(`${formData.get("date")}T00:00:00`);
    trackerJobs.unshift([
      String(formData.get("position")).trim(),
      String(formData.get("company")).trim(),
      String(formData.get("portal")),
      "Applied",
      applyDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    ]);
    document.querySelector("#add-job-dialog").close();
    render();
    notify("Applied job added to your tracker.");
  });
  document.querySelectorAll("[data-tracker-color]").forEach((select) => select.addEventListener("change", () => {
    const kind = select.dataset.trackerColor;
    select.className = `tracker-select ${trackerColors[kind][select.value] ?? ""}`;
  }));
  document.querySelector("[data-timer-toggle]")?.addEventListener("click", (event) => {
    const button = event.currentTarget;
    if (button.dataset.running === "true") {
      clearInterval(timerInterval);
      timerInterval = undefined;
      button.dataset.running = "false";
      button.textContent = "START";
      return;
    }
    let seconds = 30 * 60;
    button.dataset.running = "true";
    button.textContent = "PAUSE";
    timerInterval = window.setInterval(() => {
      seconds -= 1;
      const timer = document.querySelector("[data-timer]");
      if (seconds % 60 === 0) timer.textContent = `00:${String(Math.ceil(seconds / 60)).padStart(2, "0")}`;
      if (seconds <= 0) {
        clearInterval(timerInterval);
        timerInterval = undefined;
        button.textContent = "START";
        button.dataset.running = "false";
        notify("Focus timer complete.");
      }
    }, 1000);
  });
  document.querySelector("#email-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    notify("Email sending needs an email service.");
  });
  const scheduleDialog = document.querySelector("#email-schedule-dialog");
  document.querySelectorAll("[data-toggle-schedule-menu]").forEach((button) => button.addEventListener("click", () => {
    const menu = document.querySelector("#email-schedule-menu");
    if (!menu.hidden && activeScheduleTrigger === button) closeScheduleMenu();
    else openScheduleMenu(button);
  }));
  document.querySelector("[data-close-schedule-menu]")?.addEventListener("click", () => closeScheduleMenu(true));
  document.querySelectorAll("[data-schedule-date]").forEach((button) => button.addEventListener("click", () => {
    const emailForm = document.querySelector("#email-form");
    closeScheduleMenu(false);
    if (!emailForm.checkValidity()) {
      emailForm.reportValidity();
      return;
    }
    const scheduledFor = new Date(`${button.dataset.scheduleDate}T${button.dataset.scheduleTime}`);
    const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(scheduledFor);
    notify(`Email scheduled for ${dateTime}. Sending requires an email service.`);
  }));
  document.querySelectorAll("[data-open-email-schedule-picker]").forEach((button) => button.addEventListener("click", () => {
    closeScheduleMenu(false);
    const dateInput = document.querySelector("#email-schedule-date");
    const timeInput = document.querySelector("#email-schedule-time");
    const minimumDate = localDateInputValue();
    const defaultSchedule = new Date(Date.now() + 60 * 60 * 1000);
    defaultSchedule.setMinutes(Math.ceil(defaultSchedule.getMinutes() / 15) * 15, 0, 0);
    dateInput.min = minimumDate;
    dateInput.value = localDateInputValue(defaultSchedule);
    timeInput.value = `${String(defaultSchedule.getHours()).padStart(2, "0")}:${String(defaultSchedule.getMinutes()).padStart(2, "0")}`;
    document.querySelector(".schedule-error").hidden = true;
    scheduleDialog.showModal();
  }));
  document.querySelector("[data-close-email-schedule]")?.addEventListener("click", () => scheduleDialog.close());
  document.querySelectorAll("#email-schedule-date, #email-schedule-time").forEach((input) => input.addEventListener("input", () => {
    document.querySelector(".schedule-error").hidden = true;
  }));
  document.querySelector("#email-schedule-form")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const emailForm = document.querySelector("#email-form");
    if (!emailForm.checkValidity()) {
      scheduleDialog.close();
      emailForm.reportValidity();
      return;
    }
    const formData = new FormData(event.currentTarget);
    const scheduledFor = new Date(`${formData.get("date")}T${formData.get("time")}`);
    if (Number.isNaN(scheduledFor.getTime()) || scheduledFor <= new Date()) {
      const error = document.querySelector(".schedule-error");
      error.textContent = "Choose a date and time in the future.";
      error.hidden = false;
      return;
    }
    scheduleDialog.close();
    const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(scheduledFor);
    notify(`Email scheduled for ${dateTime}. Sending requires an email service.`);
  });
  document.querySelector("[data-clear-email]")?.addEventListener("click", () => {
    const emailForm = document.querySelector("#email-form");
    emailForm.reset();
    emailForm.querySelector("[data-email-body]").innerHTML = "";
    notify("Email draft cleared.");
  });
  document.querySelectorAll("[data-editor-command]").forEach((button) => button.addEventListener("click", () => {
    document.querySelector("[data-email-body]").focus();
    document.execCommand(button.dataset.editorCommand, false);
  }));
  document.querySelectorAll("[data-todo-index]").forEach((checkbox) => checkbox.addEventListener("change", () => {
    const index = Number(checkbox.dataset.todoIndex);
    if (checkbox.checked) completedTodos.add(index);
    else completedTodos.delete(index);
    const percent = Math.round((completedTodos.size / 2) * 100);
    todoProgressPercent = percent;
    const progress = document.querySelector(".todo-progress");
    progress.style.setProperty("--todo-progress", `${percent}%`);
    progress.setAttribute("aria-valuenow", String(completedTodos.size));
    progress.querySelector("span").style.width = `${percent}%`;
    progress.querySelector(".todo-progress-value").textContent = `${percent}%`;
  }));
  document.querySelectorAll(".calendar-day").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll(".calendar-day").forEach((day) => day.classList.toggle("current", day === button));
  }));
  document.querySelectorAll("[data-month]").forEach((button) => button.addEventListener("click", () => {
    currentMonth.setMonth(currentMonth.getMonth() + (button.dataset.month === "next" ? 1 : -1));
    render();
  }));
  document.querySelector("#month-select")?.addEventListener("change", (event) => {
    currentMonth.setMonth(Number(event.currentTarget.value));
    render();
  });
  document.querySelector("#year-select")?.addEventListener("change", (event) => {
    currentMonth.setFullYear(Number(event.currentTarget.value));
    render();
  });
  document.querySelectorAll("[data-export]").forEach((button) => button.addEventListener("click", () => {
    const file = new Blob([JSON.stringify({ profile: "Dina Amalia Zurli", skills: ["JavaScript", "Node.js", "PostgreSQL", "Git"], applications: [] }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "matchly-data.json";
    link.click();
    URL.revokeObjectURL(url);
  }));
}

document.querySelector("#quit-no").addEventListener("click", () => quitDialog.close());
document.querySelector("#quit-yes").addEventListener("click", () => {
  quitDialog.close();
  go("guest");
});
quitDialog.addEventListener("click", (event) => {
  if (event.target === quitDialog) quitDialog.close();
});
window.addEventListener("hashchange", () => {
  closeScheduleMenu(false);
  clearInterval(timerInterval);
  timerInterval = undefined;
  render();
});
document.addEventListener("click", (event) => {
  const menu = document.querySelector("#email-schedule-menu");
  if (menu && !menu.hidden && event.target instanceof Element && !event.target.closest("#email-schedule-menu, [data-toggle-schedule-menu]")) closeScheduleMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeScheduleMenu(true);
});
window.addEventListener("resize", () => closeScheduleMenu(false));
if (!location.hash) history.replaceState(null, "", "#/dashboard");
render();
