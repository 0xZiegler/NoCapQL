export function openAuditors() {
    return `
      <div class="stat-card" id="open-auditors">
        <p class="stat-title">Open Auditors</p>
  
        <textarea id="auditors-input"
                  placeholder="Paste auditors as usual, make sure you are logged into 01profile and please allow website pop-ups"
                  rows="8"></textarea>
  
        <button id="auditors-open-btn" class="aud-open-btn">Open</button>
      </div>`;
}

/* call this once after renderProfile() paints the DOM */
export function bindOpenAuditors() {
    const input = document.getElementById('auditors-input');
    const btn = document.getElementById('auditors-open-btn');
    if (!input || !btn) return;                      // safety

    btn.addEventListener('click', e => {
        e.preventDefault();                         // stay on this page

        const usernames = input.value
            .split(/\r?\n/)
            .map(s => s.trim().replace(/^@/, ''))
            .filter(Boolean)
            .slice(0, 15);

        usernames.forEach(u => {
            const a = document.createElement('a');
            a.href = `https://profile.zone01oujda.ma/profile/${u}`;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            a.style.display = 'none';                 // never visible
            document.body.appendChild(a);
            a.click();                                // opens tab under same gesture
            document.body.removeChild(a);
        });

        /* replace textarea with the ready‑to‑share template */
        const template =
            `Project : name
  Team Members : @user @user @user
  Available : 10:30 to 19:00
  Auditors:
  ${usernames.map(u => '@' + u).join('\n')}`;

        input.value = template;
    });
}
