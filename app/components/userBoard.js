import { PROJECTS_XP } from "../utils/projects-xp.js";
import { formatXP } from "../utils/utils.js";

/* ---------- public builder ---------- */
export function userBoard({ users, groups }) {
  /* aggregate project info */
  const extra = Object.create(null); // { login -> { xp, details[] } }

  for (const { members, captainLogin } of groups) {
    const teamStr = [
      captainLogin,
      ...members // [{ userLogin, … }]
        .map((m) => m.userLogin)
        .filter((u) => u !== captainLogin), // drop duplicate captain
    ].join(", "); // teammates for current project

    for (const { userLogin, path, updatedAt, createdAt } of members) {
      if (path.startsWith("/oujda/module/piscine")) continue;
      const pname = path.split("/oujda/module/")[1] || "";
      if (!pname) continue;

      if (!extra[userLogin]) extra[userLogin] = { xp: 0, details: [] };

      /* add XP once per project */
      if (!extra[userLogin].details.some((d) => d.name === pname))
        extra[userLogin].xp += PROJECTS_XP[pname] ?? 0;

      if (!PROJECTS_XP[pname]) {
        console.log(pname); // log projects that doesn't exit in my list, to be added
      }

      /* unified date handling (timestamp + display string) */
      const why_date = "2024-10-29"; // ignore this updatedAt
      const rawDate =
        updatedAt && !updatedAt.startsWith(why_date) // use updatedAt unless it's idk why that date appear in updatedAt
          ? updatedAt
          : createdAt;

      const ts = rawDate ? Date.parse(rawDate) : 0;
      const dStr = ts ? new Date(ts).toLocaleDateString() : "—";

      extra[userLogin].details.push({
        name: pname,
        dateNum: ts,
        dateStr: dStr,
        team: teamStr,
        captain: captainLogin,
      });
    }
  }

  /* merge core stats */
  const data = users
    .map((u) => {
      const ev = u.events?.[0];

      if (!ev || ev.userAuditRatio == null) return null;

      // normalize audit to a Number
      const auditNum =
        typeof ev.userAuditRatio === "number" ? ev.userAuditRatio : parseFloat(ev.userAuditRatio);

      const ex = extra[u.login] ?? { xp: 0, details: [] };

      return {
        login: u.login,
        canAccess: u.canAccessPlatform,
        level: ev.level ?? 0,
        audit: Number.isFinite(auditNum) ? auditNum : 0, // fallback
        joined: new Date(ev.createdAt).toLocaleDateString(),
        name: ev.userName ?? "Unknown",
        xpNum: ex.xp,
        xpStr: formatXP(ex.xp),
        projCount: ex.details.length,
        projects: ex.details,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.xpNum - a.xpNum); // XP ↓

  /* join‑date filter */
  const joinDates = [...new Set(data.map((u) => u.joined))].sort(
    (a, b) => new Date(a) - new Date(b)
  );

  const joinSelect = [
    '<option value="all">All</option>',
    ...joinDates.map((d) => `<option value="${d}">${d}</option>`),
  ].join("");

  /* row factory */
  const rowHTML = (u, idx) => `
    <li class="project-item ${u.canAccess ? "" : "inactive-user"}"
      data-name="${u.name.toLowerCase()}"
      data-level="${u.level}"
      data-audit="${u.audit}"
      data-xpnum="${u.xpNum}"
      data-projcount="${u.projCount}"
      data-login="${u.login.toLowerCase()}"
      data-joined="${u.joined}">

    <span class="project-rank">${idx + 1}</span>
    <span class="project-name">${u.name}</span>
    <span class="project-level">${u.level}</span>
    <span class="project-audit">${u.audit.toFixed(2)}</span>
    <span class="project-xp">${u.xpStr}</span>

    <span class="project-count project-count-click"
          data-projects='${encodeURIComponent(JSON.stringify(u.projects))}'>
      ${u.projCount}
    </span>

    <span class="project-members">
        <a href="https://profile.zone01oujda.ma/profile/${
          u.login
        }" target="_blank" rel="noopener noreferrer">${u.login}</a>
    </span>
    <span class="project-joined">${u.joined}</span>
  </li>`;

  /* full HTML (modal skeleton included) */
  return `
    <div id="user-board" class="project-section">
    <div class="board-header">
      <p class="stat-title">Talents Leaderboard (${data.length})</p>
      <select id="join-filter" class="join-filter">${joinSelect}</select>
    </div>

    <ul id="board-body" class="project-list">
      <li class="project-item project-header">
        <span class="project-rank">#</span>

        <!-- data-key restored on each sortable header -->
        <span class="project-name   sortable" data-key="name"      >Name</span>
        <span class="project-level  sortable" data-key="level"     >Level</span>
        <span class="project-audit  sortable" data-key="audit"     >Audit</span>
        <span class="project-xp     sortable" data-key="xpnum"     >≈ XP</span>
        <span class="project-count  sortable" data-key="projcount" >Projects</span>
        <span class="project-members sortable" data-key="login"    >Username</span>

        <span class="project-joined">Joined</span>
      </li>

      ${data.map(rowHTML).join("")}
    </ul>
  </div>

    <!-- modal -->
    <div id="proj-modal" class="ub-modal ub-hidden">
      <div class="ub-backdrop"></div>
      <div class="ub-box">
        <button class="ub-close">×</button>
        <h3 class="ub-title">Projects</h3>

        <div class="ub-scroll">
          <table class="ub-table">
            <thead>
              <tr><th>Project</th><th>Date</th><th>Team‑members</th></tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/* ---------- activate modal clicks ---------- */
export function bindProjectsModal() {
  const board = document.getElementById("board-body");
  const modal = document.getElementById("proj-modal");
  const tbody = modal.querySelector("tbody");

  /* helpers */
  const open = () => {
    modal.classList.remove("ub-hidden");
    document.body.classList.add("modal-lock"); // lock background scroll
  };

  const hide = () => {
    modal.classList.add("ub-hidden");
    document.body.classList.remove("modal-lock"); // unlock background scroll
  };

  /* close buttons */
  modal.querySelector(".ub-close").addEventListener("click", hide);
  modal.querySelector(".ub-backdrop").addEventListener("click", hide);

  /* board click → open modal */
  board.addEventListener("click", (e) => {
    const el = e.target;
    if (!el.classList.contains("project-count-click")) return;

    /* decode + sort by newest first */
    const projects = JSON.parse(decodeURIComponent(el.dataset.projects)).sort(
      (a, b) => b.dateNum - a.dateNum
    );

    tbody.innerHTML = projects
      .map((p) => {
        const teamLinks = p.team
          .split(/,\s*/)
          .map(
            (u) =>
              `<a class="team-link" href="https://profile.zone01oujda.ma/profile/${u}"
              target="_blank" rel="noopener noreferrer">${u}</a>`
          )
          .join(", ");

        return `
        <tr>
          <td>${p.name}</td>
          <td>${p.dateStr}</td>
          <td>${teamLinks}</td>
        </tr>`;
      })
      .join("");

    open();
  });
}
