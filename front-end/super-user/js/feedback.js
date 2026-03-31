/**
 * Feedback Review Logic — Super Admin
 * Mark reviewed, toast feedback, cross-page sync.
 */

document.addEventListener("DOMContentLoaded", function () {
    var tableBody = document.getElementById("feedbackTableBody");
    var searchInput = document.getElementById("searchInput");
    var ratingFilter = document.getElementById("ratingFilter");
    var statusFilter = document.getElementById("statusFilter");

    function renderTable() {
        var feedbackList = StorageAPI.getFeedback();
        var search = searchInput.value.toLowerCase();
        var fRating = ratingFilter.value;
        var fStatus = statusFilter.value;

        var filtered = feedbackList.filter(function(f) {
            var matchesSearch = f.id.toLowerCase().indexOf(search) !== -1 || 
                                 f.customer.toLowerCase().indexOf(search) !== -1 || 
                                 f.comment.toLowerCase().indexOf(search) !== -1;
            var matchesRating = fRating === "All" || String(f.rating) === fRating;
            var matchesStatus = fStatus === "All" || f.status === fStatus;
            return matchesSearch && matchesRating && matchesStatus;
        });

        if (filtered.length > 0) {
            tableBody.innerHTML = filtered.map(function(f) {
                var stars = "";
                for (var i = 0; i < 5; i++) {
                    stars += i < f.rating ? "★" : "☆";
                }

                var actionHtml = '';
                if (f.status === 'Pending') {
                    actionHtml = '<button class="btn btn-secondary review-btn" data-id="' + f.id + '" style="padding: 6px 12px; font-size: 0.75rem;">Mark Reviewed</button>';
                } else {
                    actionHtml = '<span style="font-size:0.75rem; color: var(--text-subtitle)">✓ Done</span>';
                }

                return '<tr>' +
                    '<td><span class="user-id-text">' + f.id + '</span></td>' +
                    '<td>' +
                        '<span class="user-name-text">' + f.customer + '</span>' +
                        '<span class="user-id-text">' + f.date + '</span>' +
                    '</td>' +
                    '<td>' +
                        '<span class="rating-stars ' + (f.rating < 3 ? 'low' : '') + '">' + stars + '</span>' +
                    '</td>' +
                    '<td><div class="comment-cell" title="' + f.comment.replace(/"/g, '&quot;') + '">' + f.comment + '</div></td>' +
                    '<td><span class="status-badge badge-' + f.status.toLowerCase() + '">' + f.status + '</span></td>' +
                    '<td class="actions-col">' + actionHtml + '</td>' +
                '</tr>';
            }).join("");
        } else {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:32px; color:var(--text-subtitle)">No feedback entries found.</td></tr>';
        }

        // Action handles
        document.querySelectorAll('.review-btn').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                var id = e.currentTarget.dataset.id;
                StorageAPI.updateFeedbackStatus(id, "Reviewed");
                renderTable();
                if (typeof showToast === 'function') {
                    showToast('Feedback ' + id + ' marked as reviewed.', 'success');
                }
            });
        });
    }

    searchInput.addEventListener("input", renderTable);
    ratingFilter.addEventListener("change", renderTable);
    statusFilter.addEventListener("change", renderTable);

    renderTable();

    window.addEventListener('appStateChanged', renderTable);
    window.addEventListener('storage', function(e) {
        if (e.key === 'swifttrack_central_state') renderTable();
    });
});
