
export function projectsProgress({ users, groups }) {

    /* ── cohorts (by join‑date) ───────────────────────────── */
    const joinDateByLogin = Object.create(null);            // login → date string
    for (const u of users) {
        const ev = u.events?.[0];
        if (ev) joinDateByLogin[u.login] =
            new Date(ev.createdAt).toLocaleDateString();
    }

    const joinDates = [...new Set(Object.values(joinDateByLogin))]
        .sort((a, b) => new Date(a) - new Date(b));

    const cohortIdxByDate = Object.create(null);            // date → 1‑based idx
    joinDates.forEach((d, i) => cohortIdxByDate[d] = i + 1);

    const cohortByLogin = Object.create(null);              // login → idx
    for (const [login, d] of Object.entries(joinDateByLogin))
        cohortByLogin[login] = cohortIdxByDate[d];

    const cohortSizes = Object.create(null);                // idx → size
    for (const idx of Object.values(cohortByLogin))
        cohortSizes[idx] = (cohortSizes[idx] ?? 0) + 1;

    /* ── aggregate projects ───────────────────────────────── */
    // name → { participants:[{login,dateNum,dateStr,cohort,team}], teamIds:Set }
    const projectsMap = Object.create(null);

    for (const g of groups) {
        const { members, captainLogin } = g;
        /* unique ID for this team (captain or member‑hash) */
        const teamKey = captainLogin ||
            JSON.stringify(members.map(m => m.userLogin).sort());

        for (const { userLogin, path, updatedAt, createdAt } of members) {
            if (path.startsWith('/oujda/module/piscine')) continue;
            const pname = path.split('/oujda/module/')[1] || '';
            if (!pname) continue;

            /* unified date handling (ignore bogus 2024‑10‑29) */
            const BAD = '2024-10-29';
            const rawDate =
                updatedAt && !updatedAt.startsWith(BAD) ? updatedAt : createdAt;

            const ts = rawDate ? Date.parse(rawDate) : 0;
            const dStr = ts ? new Date(ts).toLocaleDateString() : '—';
            const cohort = cohortByLogin[userLogin] ?? 0;

            if (!projectsMap[pname])
                projectsMap[pname] = { participants: [], teamIds: new Set() };

            projectsMap[pname].participants.push(
                { login: userLogin, dateNum: ts, dateStr: dStr, cohort, team: teamKey }
            );
            projectsMap[pname].teamIds.add(teamKey);
        }
    }

    /* map → array with derived props */
    const projects = Object.entries(projectsMap).map(([name, info]) => ({
        name,
        participants: info.participants,
        teams: info.teamIds.size
    }));

    const cohortFilterHTML = joinDates.map((d, i) => `
       <label class="dd-option">
         <input type="checkbox" value="${i + 1}" checked> C${i + 1}
       </label>`).join('');

    const rowHTML = p => `
       <li class="pp-item"
           data-part='${encodeURIComponent(JSON.stringify(p.participants))}'>
         <span class="pp-name">${p.name}</span>
         <span class="pp-count pp-count-click"></span>
         <span class="pp-teams">${p.teams}</span>
       </li>`;

    return `
     <div id="projects-progress" class="stat-card">
       <p class="stat-title">
         Projects Progress (<span id="pp-title-count">${projects.length}</span>)
       </p>
   
       <div id="pp-filter" class="dd-wrap"
            data-cohort='${encodeURIComponent(JSON.stringify(cohortSizes))}'>
         <button id="pp-dd-btn" class="dd-btn">Filter Cohorts ▾</button>
         <div id="pp-dd-menu" class="dd-menu">
           <label class="dd-option">
             <input type="checkbox" value="all" checked> All
           </label>
           ${cohortFilterHTML}
         </div>
       </div>
   
       <ul id="pp-body" class="pp-list">
         <li class="pp-item pp-header">
           <span class="pp-name">Project</span>
           <span class="pp-count">Peers</span>
           <span class="pp-teams">Teams</span>
         </li>
         ${projects.map(rowHTML).join('')}
       </ul>
     </div>
   
     <!-- modal -->
     <div id="pp-modal" class="ub-modal ub-hidden">
       <div class="ub-backdrop"></div>
       <div class="ub-box">
         <button class="ub-close">×</button>
         <h3 class="ub-title"></h3>
   
         <div class="ub-scroll">
           <table class="ub-table">
             <thead><tr><th>User</th><th>Date</th></tr></thead>
             <tbody></tbody>
           </table>
         </div>
       </div>
     </div>`;
}

/* ---------- behaviour binding ---------- */
export function bindProjectsProgress() {
    const filter = document.getElementById('pp-filter');
    const ddBtn = document.getElementById('pp-dd-btn');
    const ddMenu = document.getElementById('pp-dd-menu');
    const body = document.getElementById('pp-body');
    const modal = document.getElementById('pp-modal');
    const tbody = modal.querySelector('tbody');
    const titleEl = modal.querySelector('.ub-title');
    const countEl = document.getElementById('pp-title-count');

    /* cohort sizes & selection */
    const cohortSizes = JSON.parse(
        decodeURIComponent(filter.dataset.cohort)
    );
    let selected = new Set(Object.keys(cohortSizes).map(Number)); // all

    const totalSelected = () =>
        [...selected].reduce((s, c) => s + (cohortSizes[c] || 0), 0);

    /* ------------ helpers ------------- */
    const updateCountsSortAndTitle = () => {
        const total = totalSelected();
        const rows = [...body.querySelectorAll('.pp-item')].filter(
            li => li.dataset.part           // skip header
        );

        let projectWithData = 0;

        rows.forEach(li => {
            const parts = JSON.parse(decodeURIComponent(li.dataset.part));
            const selParts = parts.filter(p => selected.has(p.cohort));

            const n = selParts.length;
            const teamsSel = new Set(selParts.map(p => p.team)).size;

            if (n > 0) projectWithData++;

            li.dataset.count = n;
            li.querySelector('.pp-count').textContent = `${n}/${total}`;
            li.querySelector('.pp-teams').textContent = teamsSel;
        });

        /* update title */
        countEl.textContent = projectWithData;

        /* sort rows: ascending count, but 0 as Infinity */
        rows.sort((a, b) => {
            const na = Number(a.dataset.count) || 0;
            const nb = Number(b.dataset.count) || 0;
            const aa = na === 0 ? Infinity : na;
            const bb = nb === 0 ? Infinity : nb;
            return aa - bb;
        });
        rows.forEach(li => body.appendChild(li));
    };

    /* open / close modal */
    const openModal = () => {
        modal.classList.remove('ub-hidden');
        document.body.classList.add('modal-lock');
    };
    const hideModal = () => {
        modal.classList.add('ub-hidden');
        document.body.classList.remove('modal-lock');
    };

    /* initial draw */
    updateCountsSortAndTitle();

    /* dropdown toggle */
    ddBtn.addEventListener('click', () => ddMenu.classList.toggle('open'));

    /* filter logic */
    ddMenu.addEventListener('change', e => {
        const allBox = ddMenu.querySelector('input[value="all"]');
        if (e.target.value === 'all') {
            if (allBox.checked) {
                selected = new Set(Object.keys(cohortSizes).map(Number));
                ddMenu.querySelectorAll('input:not([value="all"])')
                    .forEach(cb => (cb.checked = true));
            } else {
                selected.clear();
                ddMenu.querySelectorAll('input:not([value="all"])')
                    .forEach(cb => (cb.checked = false));
            }
        } else {
            const val = Number(e.target.value);
            e.target.checked ? selected.add(val) : selected.delete(val);
            allBox.checked =
                selected.size === Object.keys(cohortSizes).length;
        }
        updateCountsSortAndTitle();
    });

    /* click outside dropdown closes it */
    document.addEventListener('click', e => {
        if (!filter.contains(e.target)) ddMenu.classList.remove('open');
    });

    /* modal close */
    modal.querySelector('.ub-close').addEventListener('click', hideModal);
    modal.querySelector('.ub-backdrop').addEventListener('click', hideModal);

    /* click “n/total” → modal */
    body.addEventListener('click', e => {
        if (!e.target.classList.contains('pp-count-click')) return;
        const li = e.target.closest('.pp-item');
        if (!li || !li.dataset.part) return;

        const parts = JSON.parse(decodeURIComponent(li.dataset.part))
            .filter(p => selected.has(p.cohort))
            .sort((a, b) => b.dateNum - a.dateNum);

        titleEl.textContent = li.querySelector('.pp-name').textContent;

        tbody.innerHTML = parts.map(p => `
         <tr>
           <td><a href="https://profile.zone01oujda.ma/profile/${p.login}"
                  target="_blank" rel="noopener noreferrer">${p.login}</a></td>
           <td>${p.dateStr}</td>
         </tr>`).join('');

        openModal();
    });
}
