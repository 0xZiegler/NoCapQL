// userBoard.js
import { PROJECTS_XP } from '../utils/projects-xp.js';
import { formatXP } from '../utils/utils.js';
import { graphQLRequest } from '../api.js';
import { QUERIES } from '../utils/query.js';

export async function userBoard(token) {
    /* --------------------------- fetch both datasets --------------------------- */
    const [userRes, groupRes] = await Promise.all([
        graphQLRequest(QUERIES.USERBOARD, token),
        graphQLRequest(QUERIES.FINISHED_MODULE_GROUPS, token),
    ]);

    const users = userRes?.data?.user_public_view ?? [];
    const groups = groupRes?.data?.group ?? [];

    /* --------------------------- xp / project aggregation --------------------------- */
    const extra = Object.create(null);                 // { login → { xp, projects:Set } }

    for (const { members } of groups) {
        for (const { userLogin, path } of members) {
            if (path.startsWith('/oujda/module/piscine')) continue; // skip piscine‑projects
            const pname = path.split('/oujda/module/')[1] || '';
            if (!pname) continue;

            const xp = PROJECTS_XP[pname] ?? 0;

            if (!extra[userLogin]) extra[userLogin] = { xp: 0, projects: new Set() };
            extra[userLogin].xp += xp;
            extra[userLogin].projects.add(pname);
        }
    }

    /* ----------------------- merge core stats with extras ---------------------- */
    const data = users
        .map(u => {
            const ev = u.events?.[0];
            if (!ev || !ev.userAuditRatio) return null;

            const ex = extra[u.login] ?? { xp: 0, projects: new Set() };

            return {
                login: u.login,
                canAccess: u.canAccessPlatform,
                level: ev.level ?? 0,
                audit: ev.userAuditRatio,
                joined: new Date(ev.createdAt).toLocaleDateString(), // "12/22/2024"
                name: ev.userName ?? 'Unknown',
                xpNum: ex.xp,
                xpStr: formatXP(ex.xp),
                projCount: ex.projects.size,
            };
        })
        .filter(Boolean) // filter(item => item != null/undefined/false)
        .sort((a, b) => b.xpNum - a.xpNum); // default order = XP ↓

    /* --------------------------- build <li> --------------------------- */
    const rowHTML = (u, idx) => `
    <li class="project-item ${u.canAccess ? '' : 'inactive-user'}"
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
      <span class="project-count">${u.projCount}</span>
      <span class="project-members">${u.login}</span>
      <span class="project-joined">${u.joined}</span>
    </li>`;

    /* --------------------- create join‑date filter --------------------- */
    const joinDates = [...new Set(data.map(u => u.joined))]   // unique
        .sort((a, b) => new Date(a) - new Date(b));           // ascending

    const optionsHTML = [
        '<option value="all">All</option>',
        ...joinDates.map(d => `<option value="${d}">${d}</option>`),
    ].join('');

    /* --------------------------- final HTML --------------------------- */
    return `
    <div id="user-board" class="project-section">
      <!-- header line with title & filter -->
      <div class="board-header">
        <p class="stat-title">Talents Leaderboard (${data.length})</p>
        <select id="join-filter" class="join-filter">
          ${optionsHTML}
        </select>
      </div>

      <ul id="board-body" class="project-list">
        <li class="project-item project-header">
          <span class="project-rank">#</span>
          <span class="project-name  sortable" data-key="name"      >Name</span>
          <span class="project-level sortable" data-key="level"     >Level</span>
          <span class="project-audit sortable" data-key="audit"     >Audit</span>
          <span class="project-xp    sortable" data-key="xpnum"     >≈ XP</span>
          <span class="project-count sortable" data-key="projcount" >Projects</span>
          <span class="project-members sortable" data-key="login"   >Username</span>
          <span class="project-joined">Joined</span>
        </li>

        ${data.map(rowHTML).join('')}
      </ul>
    </div>
  `;
}
