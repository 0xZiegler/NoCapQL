import { graphQLRequest } from "../api.js";
import { QUERIES } from "../utils/query.js";
import { formatXP } from "../utils/utils.js";

/** Fetch the list of projects and checkpoints for the user **/
export async function userProjects(token) {
    const res = await graphQLRequest(QUERIES.USER_PROJECTS, token);
    const txs = res?.data?.user?.[0]?.transactions ?? [];

    /*separate normal projects and checkpoints */
    const normalProjects = [];             // each item = { rawDate, html }
    const checkpoints = new Map();         // key = dd/mm/yy → { rawDate, names[], xp }

    txs.forEach(tx => {
        const amount = tx?.amount ?? 0;
        const created = new Date(tx?.createdAt);
        const dateKey = created.toLocaleDateString();           // e.g. 04/01/2025
        const name = tx?.object?.name ?? "Untitled";
        const members = collectMemberLogins(tx?.object?.progresses);

        /* Checkpoints */
        if (amount < 1000) {
            const bucket = checkpoints.get(dateKey) ?? {
                rawDate: created,
                names: [],
                xp: 0,
            };
            bucket.names.push(name);
            bucket.xp += amount;
            checkpoints.set(dateKey, bucket);
            return;
        }

        /* Normal project → push its final HTML immediately */
        normalProjects.push({
            rawDate: created,
            html: projectItemHTML({ name, amount, dateKey, members }),
        });
    });

    /* turn the checkpoint buckets into list items as well */
    const checkpointItems = [...checkpoints.values()].map(b => ({
        rawDate: b.rawDate,
        html: checkpointItemHTML({
            count: b.names.length,
            amount: b.xp,
            dateKey: b.rawDate.toLocaleDateString(),
        }),
    }));

    /* merge, sort desc by date, and join into one big string */
    const listHTML = [...normalProjects, ...checkpointItems]
        .sort((a, b) => b.rawDate - a.rawDate)
        .map(item => item.html)
        .join("");

    /* wrap everything in the section container */
    return `
    <div class="project-section">
      <p class="stat-title">Transactions(${txs.length})</p>
      <ul class="project-list">${listHTML}</ul>
    </div>
  `;
}

/** Helpers **/
/** Extract the list of unique members that worked on the project **/
const collectMemberLogins = progresses =>
    [
        ...new Set(
            progresses
                ?.flatMap(p => p?.group?.members ?? [])
                .map(m => m.userLogin)
        ),
    ].join(", ") || "N/A";

/** Build the <li> representing a project row **/
const projectItemHTML = ({ name, amount, dateKey, members }) => `
    <li class="project-item">
        <span class="project-name">${name}</span>
        <span class="project-xp">${formatXP(amount)}</span>
        <span class="project-date">${dateKey}</span>
        <span class="project-members">${members}</span>
    </li>`;

/** Build the <li> representing a checkpoint row **/
const checkpointItemHTML = ({ count, amount, dateKey }) => `
    <li class="project-item checkpoint-item">
        <span class="project-name">Checkpoint (${count} / 10)</span>
        <span class="project-xp">${formatXP(amount)}</span>
        <span class="project-date">${dateKey}</span>
        <span class="project-members">N/A</span>
    </li>`;
