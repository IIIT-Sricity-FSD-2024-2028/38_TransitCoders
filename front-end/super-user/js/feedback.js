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
      feedbackList = raw.map((f, index) => ({
        id: f.id,
        reference: f.reference || buildReference("FDBK", index),
        customer: f.customerName || usersById.get(f.userId)?.name || f.userId || 'Customer',
        rating: f.rating,
        comment: f.comments || f.comment || '—',
        status: f.status || 'New',
        date: new Date(f.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' }),
        _raw: f,
      }));
    } catch (_) {
      // fallback: normalize StorageAPI feedback shape
      try {
        const usersById = getUsersById();
        const raw = StorageAPI?.getFeedback?.() || [];
        feedbackList = raw.map((c, index) => ({
          id: c.id || c._id || ('FB-' + Date.now().toString().slice(-6)),
          reference: c.reference || buildReference('FDBK', index),
          customer: c.customerName || c.customer || usersById.get(c.userId)?.name || c.userId || 'Customer',
          rating: c.rating || c.value || 0,
          comment: c.comments || c.comment || '—',
          status: c.status || 'New',
          date: c.date ? new Date(c.date).toLocaleDateString('en-US', { month:'short', day:'numeric' }) : (c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' }) : ''),
          _raw: c,
        }));
      } catch (e) {
        feedbackList = StorageAPI?.getFeedback?.() || [];
      }
    }
      const usersById = getUsersById();
      const safe = (v, fallback) => {
        if (v === undefined || v === null) return fallback;
        if (typeof v === 'string' && v.trim().toLowerCase() === 'undefined') return fallback;
        return v;
      };

      // Try backend then merge with local storage entries
      let backendList = [];
      try {
        backendList = await window.API.feedback.getAll() || [];
      } catch (e) { backendList = []; }

      const localList = (StorageAPI?.getFeedback?.() || []);
      const merged = [...backendList];
      for (const l of localList) {
        if (!merged.find(b => b && (b.id === l.id || b.id === l._id))) merged.push(l);
      }

      feedbackList = merged.map((c, index) => ({
        id: safe(c.id || c._id, 'FB-' + Date.now().toString().slice(-6)),
        reference: safe(c.reference, buildReference('FDBK', index)),
        customer: safe(c.customerName, safe(c.customer, usersById.get(c.userId)?.name || c.userId || 'Customer')),
        rating: safe(c.rating, c.value || 0),
        comment: safe(c.comments, c.comment || '—'),
        status: safe(c.status, 'New'),
        date: c.date ? new Date(c.date).toLocaleDateString('en-US', { month:'short', day:'numeric' }) : (c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', { month:'short', day:'numeric' }) : ''),
        _raw: c,
      }));
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
