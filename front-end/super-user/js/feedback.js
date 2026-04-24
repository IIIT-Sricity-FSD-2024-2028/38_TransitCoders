/**
 * Feedback Review — wired to backend API
 * Falls back to StorageAPI if backend is offline.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody   = document.getElementById("feedbackTableBody");
  const searchInput = document.getElementById("searchInput");
  const ratingFilter = document.getElementById("ratingFilter");
  const statusFilter = document.getElementById("statusFilter");

  let feedbackList = [];

  async function loadFeedback() {
    try {
      const raw = await window.API.feedback.getAll();
      feedbackList = raw.map(f => ({
        id: f.id,
        customer: f.userId || 'Customer',
        rating: f.rating,
        comment: f.comments || '—',
        status: f.status || 'New',
        date: new Date(f.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' }),
        _raw: f,
      }));
    } catch (_) {
      feedbackList = StorageAPI?.getFeedback?.() || [];
    }
  }

  function renderTable() {
    const search  = searchInput.value.toLowerCase();
    const fRating = ratingFilter.value;
    const fStatus = statusFilter.value;

    const filtered = feedbackList.filter(f => {
      const matchSearch  = (f.id || '').toLowerCase().includes(search) ||
                           (f.customer || '').toLowerCase().includes(search) ||
                           (f.comment || '').toLowerCase().includes(search);
      const matchRating  = fRating === "All" || String(f.rating) === fRating;
      const matchStatus  = fStatus === "All" || f.status === fStatus;
      return matchSearch && matchRating && matchStatus;
    });

    tableBody.innerHTML = filtered.length > 0 ? filtered.map(f => {
      const stars = "★".repeat(f.rating) + "☆".repeat(5 - f.rating);
      return `
      <tr>
        <td><span class="user-id-text">${f.id}</span></td>
        <td>
          <span class="user-name-text">${f.customer}</span>
          <span class="user-id-text">${f.date}</span>
        </td>
        <td><span class="rating-stars ${f.rating < 3 ? 'low' : ''}">${stars}</span></td>
        <td><div class="comment-cell" title="${f.comment}">${f.comment}</div></td>
        <td><span class="status-badge badge-${(f.status || '').toLowerCase()}">${f.status}</span></td>
        <td class="actions-col">
          ${f.status !== 'Reviewed' && f.status !== 'Actioned' ? `
            <button class="btn btn-secondary review-btn" data-id="${f._raw?.id || f.id}" style="padding:6px 12px;font-size:0.75rem;">Mark Reviewed</button>
          ` : `<span style="font-size:0.75rem;color:var(--text-subtitle)">✓ Done</span>`}
        </td>
      </tr>`;
    }).join("") : `<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-subtitle)">No feedback found.</td></tr>`;

    document.querySelectorAll('.review-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        try {
          await window.API.feedback.update(id, { status: 'Reviewed' });
        } catch (_) {
          StorageAPI?.updateFeedbackStatus?.(id, 'Reviewed');
        }
        await loadFeedback();
        renderTable();
      });
    });
  }

  searchInput.addEventListener("input", renderTable);
  ratingFilter.addEventListener("change", renderTable);
  statusFilter.addEventListener("change", renderTable);

  await loadFeedback();
  renderTable();

  window.addEventListener('appStateChanged', async () => { await loadFeedback(); renderTable(); });
});
