/**
 * Delivery History Page — Table rendering, time filters, pagination
 */

document.addEventListener('DOMContentLoaded', () => {
    initCommon();
    initHistory();
});

let currentPeriod = 'today';
let currentPage = 1;
const perPage = 5;

function initHistory() {
    renderTable();
    bindHistoryFilters();
}

function renderTable() {
    const data = DeliveryData.getHistory(currentPeriod);
    const totalPages = Math.ceil(data.length / perPage);
    const start = (currentPage - 1) * perPage;
    const pageData = data.slice(start, start + perPage);

    const tbody = document.getElementById('history-body');

    if (pageData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;padding:40px;color:var(--text-subtitle);">
                    <i class="fas fa-inbox" style="font-size:32px;margin-bottom:12px;display:block;"></i>
                    No delivery history found for this period.
                </td>
            </tr>`;
        document.getElementById('pagination-info').textContent = 'No deliveries found';
        document.getElementById('pagination-controls').innerHTML = '';
        return;
    }

    tbody.innerHTML = pageData.map(row => {
        const stars = renderStars(row.rating);
        return `
        <tr>
            <td><span class="order-link">${row.orderId}</span></td>
            <td>${row.customer}</td>
            <td>${row.location}</td>
            <td>${row.date}</td>
            <td>${row.time}</td>
            <td><span class="completed-badge">${row.status}</span></td>
            <td><span class="star-display">${stars}</span></td>
        </tr>`;
    }).join('');

    // Pagination info
    document.getElementById('pagination-info').textContent =
        `Showing ${start + 1}-${Math.min(start + perPage, data.length)} of ${data.length} deliveries`;

    // Pagination buttons
    const controls = document.getElementById('pagination-controls');
    let pagesHTML = '';

    if (currentPage > 1) {
        pagesHTML += `<button class="page-btn" data-page="${currentPage - 1}"><i class="fas fa-chevron-left"></i></button>`;
    }

    for (let i = 1; i <= totalPages; i++) {
        pagesHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (currentPage < totalPages) {
        pagesHTML += `<button class="page-btn" data-page="${currentPage + 1}"><i class="fas fa-chevron-right"></i></button>`;
    }

    controls.innerHTML = pagesHTML;

    // Bind page buttons
    controls.querySelectorAll('.page-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            renderTable();
        });
    });

    // Animate rows
    tbody.querySelectorAll('tr').forEach((row, i) => {
        row.style.opacity = '0';
        row.style.transform = 'translateY(8px)';
        setTimeout(() => {
            row.style.transition = 'all 0.25s ease';
            row.style.opacity = '1';
            row.style.transform = 'translateY(0)';
        }, i * 50);
    });
}

function renderStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            html += '<i class="fas fa-star"></i>';
        } else {
            html += '<i class="fas fa-star star-empty"></i>';
        }
    }
    return html;
}

function bindHistoryFilters() {
    document.getElementById('history-filters').addEventListener('click', e => {
        const btn = e.target.closest('.history-filter-btn');
        if (!btn) return;

        document.querySelectorAll('.history-filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        currentPeriod = btn.dataset.period;
        currentPage = 1;
        renderTable();
    });
}
