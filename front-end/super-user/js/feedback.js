/**
 * Feedback Review — wired to backend API exclusively.
 * Bug Fix F10: Removed StorageAPI fallback. All data now comes from the
 * NestJS backend via window.API.feedback.*. Network errors are logged and
 * shown to the user instead of silently falling back to stale localStorage.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const tableBody    = document.getElementById("feedbackTableBody");
  const searchInput  = document.getElementById("searchInput");
  const ratingFilter = document.getElementById("ratingFilter");
  const statusFilter = document.getElementById("statusFilter");

  let feedbackList = [];

  function getUsersById() {
    const users = window.AppState?.getState?.().users || [];
    return new Map(users.map((user) => [user.user_id || user.id, user]));
  }

  function buildReference(prefix, index) {
    return `${prefix}-${String(index + 1).padStart(4, "0")}`;
  }

  async function loadFeedback() {
    try {
      const usersById = getUsersById();
      const raw = await window.API.feedback.getAll();
      feedbackList = (raw || []).map((f, index) => ({
        id: f.id,
        reference: f.reference || buildReference("FDBK", index),
        customer: f.customerName || usersById.get(f.userId)?.name || f.userId || 'Customer',
        rating: Number(f.rating) || 0,
        comment: f.comments || f.comment || '—',
        status: f.status || 'New',
        date: f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' }) : '—',
        _raw: f,
      }));
    } catch (err) {
      console.error('[feedback.js] Failed to fetch feedback from backend:', err?.message || err);
      if (typeof window.showToast === 'function') {
        window.showToast('Failed to load feedback. Is the backend running?', 'error');
      }
      feedbackList = [];
    }
  }

  function renderTable() {
    const search  = searchInput.value.toLowerCase();
    const fRating = ratingFilter.value;
    const fStatus = statusFilter.value;

    const filtered = feedbackList.filter(f => {
      const matchSearch  = (f.reference || '').toLowerCase().includes(search) ||
                           (f.id || '').toLowerCase().includes(search) ||
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
        <td><span class="user-name-text">${f.reference || ''}</span><span class="user-id-text">${f.id || ''}</span></td>
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
        } catch (err) {
          console.error('[feedback.js] Failed to update feedback status:', err?.message || err);
          if (typeof window.showToast === 'function') window.showToast('Failed to update feedback.', 'error');
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
