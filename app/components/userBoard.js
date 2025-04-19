import { PROJECTS_XP } from '../utils/projects-xp.js';
import { formatXP } from '../utils/utils.js';
import { graphQLRequest } from '../api.js';
import { QUERIES } from '../utils/query.js';

export async function userBoard(token) {
    /* ----------------------------------- fetch --------------------------------- */
    const [userRes, groupRes] = await Promise.all([
        graphQLRequest(QUERIES.USERBOARD, token),
        graphQLRequest(QUERIES.FINISHED_MODULE_GROUPS, token)
    ]);

    const users = userRes?.data?.user_public_view ?? [];
    const groups = groupRes?.data?.group ?? [];

    /* --------------------------- accumulate XP & projects (skip piscine) -------------------- */
    const extra = Object.create(null);          // { login: { xp , projects:Set } }

    for (const { members } of groups) {
        for (const { userLogin, path } of members) {
            if (path.startsWith('/oujda/module/piscine')) continue;

            const pname = path.split('/oujda/module/')[1] || '';
            if (!pname) continue;

            const xp = PROJECTS_XP[pname] ?? 0;

            if (!extra[userLogin]) extra[userLogin] = { xp: 0, projects: new Set() };
            extra[userLogin].xp += xp;
            extra[userLogin].projects.add(pname);
        }
    }

    /* --------------------------- merge, format, default sort (by level ↓) ------------------- */
    const data = users
        .map(u => {
            const ev = u.events_aggregate?.nodes?.[0];
            if (!ev || !ev.userAuditRatio) return null;

            const ex = extra[u.login] ?? { xp: 0, projects: new Set() };

            return {
                login: u.login,
                canAccess: u.canAccessPlatform,
                level: ev.level ?? 0,
                audit: +ev.userAuditRatio,
                joined: new Date(ev.createdAt).toLocaleDateString(),
                name: ev.userName ?? 'Unknown',
                xpNum: ex.xp,
                xpStr: formatXP(ex.xp),
                projCount: ex.projects.size
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.level - a.level);

    /* --------------------------- Construct a row ------------------------------------------- */
    const rowHTML = (u, idx) => `
    <li class="project-item ${u.canAccess ? '' : 'inactive-user'}"
        data-name="${u.name.toLowerCase()}"
        data-level="${u.level}"
        data-audit="${u.audit}"
        data-xpnum="${u.xpNum}"
        data-projcount="${u.projCount}"
        data-login="${u.login.toLowerCase()}">

      <span class="project-rank">${idx + 1}</span>
      <span class="project-name">${u.name}</span>
      <span class="project-level">${u.level}</span>
      <span class="project-audit">${u.audit.toFixed(2)}</span>
      <span class="project-xp">${u.xpStr}</span>
      <span class="project-count">${u.projCount}</span>
      <span class="project-members">${u.login}</span>
      <span class="project-joined">${u.joined}</span>
    </li>`;

    /* ------------------------------------ HTML -------------------------------------------------- */
    return `
    <div id="user-board" class="project-section">
      <p class="stat-title">User Leaderboard (${data.length})</p>

      <ul id="board-body" class="project-list">
        <!-- header -->
        <li class="project-item project-header">
          <span class="project-rank">#</span>
          <span class="project-name  sortable" data-key="name"      >Name</span>
          <span class="project-level sortable" data-key="level"     >Level</span>
          <span class="project-audit sortable" data-key="audit"     >Audit</span>
          <span class="project-xp    sortable" data-key="xpnum"     >XP</span>
          <span class="project-count sortable" data-key="projcount" >Projects</span>
          <span class="project-members sortable" data-key="login"   >Username</span>
          <span class="project-joined">Joined</span>
        </li>

        ${data.map(rowHTML).join('')}
      </ul>
    </div>
  `;
}
