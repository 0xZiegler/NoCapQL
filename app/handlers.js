import { hideShowPassword, removeError, capitalize } from './utils/utils.js';
import { loginAPI, graphQLRequest } from './api.js';
import { QUERIES } from './utils/query.js';
import { bindUserBoardSort } from './utils/userBoardSort.js';

// Components
import { showLoading, hideLoading } from './components/loading.js';
import { userLevel } from './components/level.js';
import { userXP } from './components/xp.js';
import { userProjects } from './components/projects.js';
import { userBoard, bindProjectsModal } from './components/userBoard.js';
import { userSkills } from './components/svg/skills.js';
import { userAudits } from './components/svg/audits.js';


// Render the login form and bind login API process
export function renderLogin() {
    document.body.innerHTML = `
    <form id="login-form" class="login-container">
        <h2>Login</h2>
        <p>Welcome Back!</p>

        <div class="input-group">
            <input type="text" id="username" name="username" placeholder="Username" required />
        </div>

        <div class="input-group">
            <input type="password" id="password" name="password" placeholder="Password" required />
            <img src="./assets/show.png" id="togglePassword" alt="Toggle password visibility" />
        </div>

        <button type="submit" id="loginBtn">Login</button>
        <div id="login-error" class="error-message"></div>
    </form>
    `;

    hideShowPassword();
    removeError();
    loginAPI();
}

// Render the user profile
export async function renderProfile() {
    const token = localStorage.getItem('JWT');
    if (!token) {
        localStorage.removeItem('JWT');
        renderLogin();
        return;
    }

    showLoading();

    const userName = await graphQLRequest(QUERIES.USER_PROFILE, token);
    const levelCard = await userLevel(token);
    const xpCard = await userXP(token);
    const projectList = await userProjects(token);
    const boardList = await userBoard(token);
    const skillBars = await userSkills(token);
    const auditChart = await userAudits(token);

    const { firstName = '', lastName = '' } = userName?.data?.user?.[0] || {};

    hideLoading();

    document.body.innerHTML = `
    <div class="navbar">
        <div class="navbar-left">
            <span>Hello, <strong>${capitalize(`${firstName} ${lastName}`)}</strong></span>
        </div>
        <div class="navbar-right">
            <button id="logoutBtn">Logout</button>
        </div>
    </div>
    <div class="main-content">
        <div class="stat-grid">
            ${levelCard}
            ${xpCard}
        </div>
        ${projectList}
        ${boardList}
        ${skillBars}
        ${auditChart}
    </div>
    `;

    bindUserBoardSort();
    bindProjectsModal();
    
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('JWT');
        renderLogin();
    });
};
