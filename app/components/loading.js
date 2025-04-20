export function showLoading() {
    if (document.getElementById('loading-screen')) return;
    const el = document.createElement('div');
    el.id = 'loading-screen';
    el.innerHTML = `
      <div class="loader"></div>
      <p>Fetching data…</p>
    `;
    document.body.innerHTML = '';
    document.body.appendChild(el);
}

export function hideLoading() {
    const el = document.getElementById('loading-screen');
    if (el) el.remove();
}