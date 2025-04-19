import { graphQLRequest } from '../api.js';
import { QUERIES } from '../query.js';

export async function userBoard(token) {
    const result = await graphQLRequest(QUERIES.USERBOARD, {}, token);
    const users = result?.data?.user_public_view || [];

    const filtered = users
        .map(user => {
            const event = user.events_aggregate?.nodes?.[0];
            if (!event || !event.userAuditRatio || event.userAuditRatio === 0) return null;

            return {
                login: user.login,
                canAccess: user.canAccessPlatform,
                level: event.level ?? 0,
                auditRatio: parseFloat(event.userAuditRatio).toFixed(2),
                joinedAt: new Date(event.createdAt).toLocaleDateString(),
                userName: event.userName ?? 'Unknown'
            };
        })
        .filter(Boolean)
        .sort((a, b) => b.level - a.level);

    const listItems = filtered.map((user, index) => `
        <li class="project-item ${!user.canAccess ? 'inactive-user' : ''}">
            <span class="project-rank">${index + 1}</span>
            <span class="project-name">${user.userName}</span>
            <span class="project-xp">Level: ${user.level}</span>
            <span class="project-date">Audit: ${user.auditRatio}</span>
            <span class="project-members">${user.login}</span>
            <span class="project-joined">${user.joinedAt}</span>
        </li>
    `).join('');

    return `
    <div class="project-section">
      <p class="stat-title">User Leaderboard (${filtered.length})</p>
      <ul class="project-list">
        ${listItems}
      </ul>
    </div>
  `;
}
