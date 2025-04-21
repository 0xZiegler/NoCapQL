import { PROJECTS_XP } from '../utils/projects-xp.js';
import { formatXP } from '../utils/utils.js';
import { graphQLRequest } from '../api.js';
import { QUERIES } from '../utils/query.js';

/* ---------- public builder ---------- */
export async function userBoard(token) {
    /* fetch data */
    const [userRes, groupRes] = await Promise.all([
        graphQLRequest(QUERIES.USERBOARD, token),
        graphQLRequest(QUERIES.GROUPS, token),
    ]);

    const users = userRes?.data?.user_public_view ?? [];
    const groups = groupRes?.data?.group ?? [];

    /* aggregate project info */
    const extra = Object.create(null);          // { login -> { xp, details[] } }

    for (const { members } of groups) {
        const team = members.map(m => m.userLogin);   // teammates for current project

        for (const { userLogin, path, createdAt } of members) {
            if (path.startsWith('/oujda/module/piscine')) continue;
            const pname = path.split('/oujda/module/')[1] || '';
            if (!pname) continue;

            if (!extra[userLogin])
                extra[userLogin] = { xp: 0, details: [] };
            
            /* add XP once per project */
            if (!extra[userLogin].details.some(d => d.name === pname))
                extra[userLogin].xp += PROJECTS_XP[pname] ?? 0;

            if (!PROJECTS_XP[pname]) {
                console.log(pname);
            }

            /* unified date handling (timestamp + display string) */
            const ts = createdAt ? Date.parse(createdAt) : 0;
            const dStr = ts
                ? new Date(ts).toLocaleDateString()
                : '—';

            extra[userLogin].details.push({
                name: pname,
                dateNum: ts,
                dateStr: dStr,
                team: team.join(', ')
            });
        }
    }

    /* merge core stats */
    const data = users
        .map(u => {
            const ev = u.events?.[0];
            if (!ev || !ev.userAuditRatio) return null;

            const ex = extra[u.login] ?? { xp: 0, details: [] };

            return {
                login: u.login,
                canAccess: u.canAccessPlatform,
                level: ev.level ?? 0,
                audit: ev.userAuditRatio,
                joined: new Date(ev.createdAt)
                    .toLocaleDateString(),
                name: ev.userName ?? 'Unknown',
                xpNum: ex.xp,
                xpStr: formatXP(ex.xp),
                projCount: ex.details.length,
                projects: ex.details
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.xpNum - a.xpNum);      // XP ↓

    /* join‑date filter */
    const joinDates = [...new Set(data.map(u => u.joined))]
        .sort((a, b) => new Date(a) - new Date(b));

    const joinSelect = [
        '<option value="all">All</option>',
        ...joinDates.map(d => `<option value="${d}">${d}</option>`),
    ].join('');

    /* row factory */
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

    <span class="project-count project-count-click"
          data-projects='${encodeURIComponent(JSON.stringify(u.projects))}'>
      ${u.projCount}
    </span>

    <span class="project-members">${u.login}</span>
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

      ${data.map(rowHTML).join('')}
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
    const board = document.getElementById('board-body');
    const modal = document.getElementById('proj-modal');
    const tbody = modal.querySelector('tbody');
    const close = modal.querySelector('.ub-close');
    const back = modal.querySelector('.ub-backdrop');

    const hide = () => modal.classList.add('ub-hidden');
    close.addEventListener('click', hide);
    back.addEventListener('click', hide);

    board.addEventListener('click', e => {
        const el = e.target;
        if (!el.classList.contains('project-count-click')) return;

        /* decode + sort by newest first */
        const projects = JSON.parse(decodeURIComponent(el.dataset.projects))
            .sort((a, b) => b.dateNum - a.dateNum);

        tbody.innerHTML = projects.map(p => `
        <tr>
            <td>${p.name}</td>
            <td>${p.dateStr}</td>
            <td>${p.team}</td>
        </tr>
        `).join('');

        modal.classList.remove('ub-hidden');
    });
}
