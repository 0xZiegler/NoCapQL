import { graphQLRequest } from '../api.js';
import { QUERIES } from '../query.js';

export async function userLevel(token) {
    const levelResult = await graphQLRequest(QUERIES.USER_LEVEL, {}, token);
    const currentLevel = levelResult?.data?.transaction?.[0]?.amount ?? 0;

    return `
        <div class="stat-card">
            <p class="stat-title">Current Level</p>
            <div class="stat-circle">${currentLevel}</div>
        </div>
    `;
}