import { graphQLRequest } from '../../api.js';
import { QUERIES } from '../../query.js';

export async function userSkills(token) {
    const result = await graphQLRequest(QUERIES.USER_SKILLS, {}, token);
    const transactions = result?.data?.user?.[0]?.transactions || [];

    const maxMap = new Map();

    for (const tx of transactions) {
        const { type, amount } = tx;
        if (!maxMap.has(type) || amount > maxMap.get(type)) {
            maxMap.set(type, amount);
        }
    }

    const sortedSkills = [...maxMap.entries()]
        .map(([type, amount]) => ({ type: type.replace("skill_", ""), amount }))
        .sort((a, b) => b.amount - a.amount);

    const barSVGs = sortedSkills.map(skill => {
        const percent = Math.min(skill.amount, 100); // max 100 for visual
        const color = getSkillColor(skill.type);

        return `
            <div class="skill-bar">
                <p class="skill-name">${capitalize(skill.type)}</p>
                <svg width="100%" height="24">
                    <rect width="100%" height="24" fill="#e5e7eb" rx="12" />
                    <rect width="${percent}%" height="24" fill="${color}" rx="12" />
                </svg>
                <span class="skill-percent">${skill.amount}</span>
            </div>
        `;
    }).join('');

    return `
        <div class="project-section skill-bar-wrapper">
            <p class="stat-title">Skill Levels</p>
            <div class="skill-bar-container">
                ${barSVGs}
            </div>
        </div>
    `;
}

// Helper to pick a color per skill
function getSkillColor(skill) {
    const colors = {
        html: '#FF6F61',    
        css: '#1E90FF',      
        js: '#FFD700',       
        front: '#FF7F50',
        back: '#20B2AA',    
        sql: '#9370DB',   
        docker: '#4682B4',   
        unix: '#708090',     
        go: '#00CED1',     
        algo: '#FF4500',     
        prog: '#9ACD32',     
        tcp: '#40E0D0',     
        stats: '#8A2BE2',   
        sys: '#c5ae6f',   
        ai: '#FF6347',
        game: '#FF1493',
        default: '#DA70D6'
    };

    const key = skill.split("-")[0]; // "front-end" → "front"
    return colors[key] || colors.default;
}

function capitalize(text) {
    return text.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}
