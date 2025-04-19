import { graphQLRequest } from '../../api.js';
import { QUERIES } from '../../utils/query.js';

export async function userAudits(token) {
    const result = await graphQLRequest(QUERIES.USER_AUDITS, token);
    const user = result?.data?.user?.[0];

    const success = user?.sucess?.aggregate?.count || 0;
    const failed = user?.failed?.aggregate?.count || 0;
    const total = success + failed;

    if (total === 0) return ''; // nothing to render

    const successPercent = ((success / total) * 100).toFixed(1);
    const failedPercent = ((failed / total) * 100).toFixed(1);

    // Calculate stroke lengths for circle chart
    const r = 70;
    const c = 2 * Math.PI * r;
    const successOffset = 0;
    const failedOffset = (c * successPercent) / 100;

    return `
    <div class="project-section audit-chart-section">
      <p class="stat-title">Audit Results</p>
      <div class="audit-chart-wrapper">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle r="${r}" cx="90" cy="90" fill="transparent" stroke="#e5e7eb" stroke-width="30" />
          <circle
            r="${r}"
            cx="90"
            cy="90"
            fill="transparent"
            stroke="#22c55e"
            stroke-width="30"
            stroke-dasharray="${(c * successPercent) / 100} ${c}"
            stroke-dashoffset="${successOffset}"
            transform="rotate(-90 90 90)"
          />
          <circle
            r="${r}"
            cx="90"
            cy="90"
            fill="transparent"
            stroke="#ef4444"
            stroke-width="30"
            stroke-dasharray="${(c * failedPercent) / 100} ${c}"
            stroke-dashoffset="${-failedOffset}"
            transform="rotate(-90 90 90)"
          />
          <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-size="20px">
            ${total} Audits
          </text>
        </svg>
        <div class="legend">
          <div><span class="legend-box" style="background:#22c55e;"></span> Success (${success} - ${successPercent}%)</div>
          <div><span class="legend-box" style="background:#ef4444;"></span> Failed (${failed} - ${failedPercent}%)</div>
        </div>
      </div>
    </div>
  `;
}