export function bindUserBoardSort() {
    const board = document.querySelector("#user-board");
    if (!board) return;

    const body = board.querySelector('#board-body');
    const header = body.querySelector('.project-header');
    const rows = [...body.querySelectorAll('.project-item:not(.project-header)')];

    /* keep descending / ascending state per column */
    const order = Object.create(null);

    /* helper - update the visible rank numbers */
    const updateRanks = () => {
        let rank = 1;
        body.querySelectorAll('.project-item:not(.project-header)')
            .forEach(li => (li.querySelector('.project-rank').textContent = rank++));
    };

    /* actual sorter */
    const sortBy = key => {
        order[key] = order[key] === 'asc' ? 'desc' : 'asc';
        const dir = order[key] === 'asc' ? 1 : -1;

        rows.sort((a, b) => {
            const A = a.dataset[key];
            const B = b.dataset[key];

            /* numeric vs string compare */
            const aVal = Number.isNaN(+A) ? A : +A;
            const bVal = Number.isNaN(+B) ? B : +B;

            return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
        });

        /* re‑insert in new order */
        rows.forEach(li => body.appendChild(li));
        updateRanks();
    };

    /* bind clicks */
    header.querySelectorAll('.sortable').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => sortBy(el.dataset.key));
    });
}
