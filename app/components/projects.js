import { graphQLRequest } from "../api.js";
import { QUERIES } from "../utils/query.js";
import { formatXP } from "../utils/utils.js";

export async function userProjects(token) {
    const result = await graphQLRequest(QUERIES.USER_PROJECTS, {}, token);
    const transactions = result?.data?.user?.[0]?.transactions || [];

    const { project, checkpoints } = transactions.reduce(
        (acc, tx) => {
            const amount = tx?.amount ?? 0;
            const createdAt = new Date(tx?.createdAt);
            const dateKey = createdAt.toLocaleDateString();
            const name = tx?.object?.name ?? "Untitled";

            const members =
                [
                    ...new Set(
                        tx?.object?.progresses
                            ?.flatMap(p => p?.group?.members ?? [])
                            .map(m => m.userLogin)
                    ),
                ].join(", ") || "N/A";

            if (amount < 1000) {
                const cp = acc.checkpoints.get(dateKey) ?? {
                    rawDate: createdAt,
                    names: [],
                    xp: 0,
                };
                cp.names.push(name);
                cp.xp += amount;
                acc.checkpoints.set(dateKey, cp);
            } else {
                acc.project.push({
                    rawDate: createdAt,
                    html: `
            <li class="project-item">
              <span class="project-name">${name}</span>
              <span class="project-xp">${formatXP(amount)}</span>
              <span class="project-date">${dateKey}</span>
              <span class="project-members">${members}</span>
            </li>`,
                });
            }
            return acc;
        },
        { project: [], checkpoints: new Map() }
    );

    // Convert checkpoints → items
    const ckItems = [...checkpoints.values()].map(({ rawDate, names, xp }) => ({
        rawDate,
        html: `
      <li class="project-item checkpoint-item">
        <span class="project-name">Checkpoint (${names.length} / 10)</span>
        <span class="project-xp">${formatXP(xp)}</span>
        <span class="project-date">${rawDate.toLocaleDateString()}</span>
        <span class="project-members">N/A</span>
      </li>`,
    }));

    const listItems = [...project, ...ckItems]
        .sort((a, b) => b.rawDate - a.rawDate)
        .map(i => i.html)
        .join("");

    return `
    <div class="project-section">
      <p class="stat-title">Projects Done (${transactions.length})</p>
      <ul class="project-list">${listItems}</ul>
    </div>
    `;
}
