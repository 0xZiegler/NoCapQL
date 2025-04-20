// bindUserBoardSort.js
export function bindUserBoardSort() {
    const board = document.querySelector('#user-board');
    if (!board) return;

    const body = board.querySelector('#board-body');
    const header = body.querySelector('.project-header');
    const rows = [...body.querySelectorAll('.project-item:not(.project-header)')];
    const joinSel = board.querySelector('#join-filter');

    /* keep ascending / descending state per column */
    const order = Object.create(null);

    /* helper → recount visible ranks */
    const updateRanks = () => {
        let rank = 1;
        rows
            .filter(li => li.style.display !== 'none')
            .forEach(li => (li.querySelector('.project-rank').textContent = rank++));
    };

    /* column sorter */
    const sortBy = key => {
        order[key] = order[key] === 'asc' ? 'desc' : 'asc';
        const dir = order[key] === 'asc' ? 1 : -1;

        rows.sort((a, b) => {
            const A = a.dataset[key];
            const B = b.dataset[key];
            const av = isNaN(+A) ? A : +A;
            const bv = isNaN(+B) ? B : +B;
            return av < bv ? -dir : av > bv ? dir : 0;
        });

        rows.forEach(li => body.appendChild(li));   // put back in new order
        updateRanks();
    };

    /* join‑date filter */
    const filterByJoin = value => {
        rows.forEach(li => {
            const match = value === 'all' || li.dataset.joined === value;
            li.style.display = match ? 'flex' : 'none';
        });
        updateRanks();
    };

    /* click‑binding for column headers */
    header.querySelectorAll('.sortable').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => sortBy(el.dataset.key));
    });

    /* change‑binding for dropdown */
    joinSel.addEventListener('change', e => filterByJoin(e.target.value));
}
