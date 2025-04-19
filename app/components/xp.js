import { graphQLRequest } from '../api.js';
import { formatXP } from '../utils/utils.js';
import { QUERIES } from '../utils/query.js';

export async function userXP(token) {
    const xpResult = await graphQLRequest(QUERIES.USER_XP, {}, token);
    const totalXP = xpResult?.data?.transaction_aggregate?.aggregate?.sum?.amount ?? 0;

    return `
        <div class="stat-card">
            <p class="stat-title">Total XP</p>
            <div class="xp-value">${formatXP(totalXP, "amountPurple")}</div>
        </div>
    `;
}