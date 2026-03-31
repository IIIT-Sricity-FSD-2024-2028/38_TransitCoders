/**
 * Feedback Review Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    // StorageAPI.init() no longer needed; state managed centrally
    const tableBody = document.getElementById("feedbackTableBody");
    const searchInput = document.getElementById("searchInput");
    const ratingFilter = document.getElementById("ratingFilter");
    const statusFilter = document.getElementById("statusFilter");

    function renderTable() {
        const feedbackList = StorageAPI.getFeedback();
        const search = searchInput.value.toLowerCase();
        const fRating = ratingFilter.value;
        const fStatus = statusFilter.value;

        let filtered = feedbackList.filter(f => {
            const matchesSearch = f.id.toLowerCase().includes(search) || 
                                 f.customer.toLowerCase().includes(search) || 
                                 f.comment.toLowerCase().includes(search);
            const matchesRating = fRating === "All" || f.rating == fRating;
            const matchesStatus = fStatus === "All" || f.status === fStatus;
            return matchesSearch && matchesRating && matchesStatus;
        });

        tableBody.innerHTML = filtered.length > 0 ? filtered.map(f => {
            let stars = "★".repeat(f.rating) + "☆".repeat(5 - f.rating);
            
            return `
            <tr>
                <td><span class="user-id-text">${f.id}</span></td>
                <td>
                    <span class="user-name-text">${f.customer}</span>
                    <span class="user-id-text">${f.date}</span>
                </td>
                <td>
                    <span class="rating-stars ${f.rating < 3 ? 'low' : ''}">${stars}</span>
                </td>
                <td><div class="comment-cell" title="${f.comment}">${f.comment}</div></td>
                <td><span class="status-badge badge-${f.status.toLowerCase()}">${f.status}</span></td>
                <td class="actions-col">
                    ${f.status === 'Pending' ? `
                        <button class="btn btn-secondary review-btn" data-id="${f.id}" style="padding: 6px 12px; font-size: 0.75rem;">Mark Reviewed</button>
                    ` : `
                        <span style="font-size:0.75rem; color: var(--text-subtitle)">✓ Done</span>
                    `}
                </td>
            </tr>
        `}).join("") : `<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-subtitle)">No feedback entries found.</td></tr>`;

        // Action handles
        document.querySelectorAll('.review-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                StorageAPI.updateFeedbackStatus(id, "Reviewed");
                renderTable();
            });
        });
    }

    searchInput.addEventListener("input", renderTable);
    ratingFilter.addEventListener("change", renderTable);
    statusFilter.addEventListener("change", renderTable);

    renderTable();

    window.addEventListener('appStateChanged', () => {
        renderTable();
    });
});
