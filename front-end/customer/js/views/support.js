/**
 * Support & Feedback View Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  setupTabs();
  setupStarRating();
  setupForms();
  
  loadComplaints();
  loadFeedback();

  // Prefill order ID if passed in URL (e.g. from Orders page "Report Issue")
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  if (orderId) {
    document.getElementById('cmp-order-id').value = orderId;
  }
});

function setupTabs() {
  const btnComplaint = document.getElementById('btn-show-complaint');
  const btnFeedback = document.getElementById('btn-show-feedback');
  
  const formComplaint = document.getElementById('form-container-complaint');
  const formFeedback = document.getElementById('form-container-feedback');

  btnComplaint.addEventListener('click', () => {
    formFeedback.style.display = 'none';
    formComplaint.style.display = 'block';
  });

  btnFeedback.addEventListener('click', () => {
    formComplaint.style.display = 'none';
    formFeedback.style.display = 'block';
  });
}

function setupStarRating() {
  const stars = document.querySelectorAll('#star-rating i');
  const input = document.getElementById('fb-rating');

  stars.forEach(star => {
    star.addEventListener('click', (e) => {
      const val = parseInt(e.target.dataset.val);
      input.value = val;
      
      stars.forEach(s => {
        if (parseInt(s.dataset.val) <= val) {
          s.style.color = 'var(--yellow)';
        } else {
          s.style.color = 'var(--border)';
        }
      });
    });
  });
}

function setupForms() {
  const cmpForm = document.getElementById('complaint-form');
  const fbForm = document.getElementById('feedback-form');

  cmpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = cmpForm.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const payload = {
      order_id: document.getElementById('cmp-order-id').value,
      type: document.getElementById('cmp-type').value,
      details: document.getElementById('cmp-details').value,
      priority: 'Medium'
    };

    try {
      await window.CustomerAPI.submitComplaint(payload);
      window.showToast("Complaint submitted successfully!", "success");
      cmpForm.reset();
      loadComplaints();
    } catch (err) {
      window.showToast("Failed to submit complaint.", "danger");
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit Complaint';
    }
  });

  fbForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const rating = parseInt(document.getElementById('fb-rating').value);
    if (rating === 0) {
      window.showToast("Please provide a star rating.", "warning");
      return;
    }

    const btn = fbForm.querySelector('button');
    btn.disabled = true;
    btn.textContent = 'Submitting...';

    const payload = {
      order_id: document.getElementById('fb-order-id').value,
      rating: rating,
      comment: document.getElementById('fb-comments').value
    };

    try {
      await window.CustomerAPI.submitFeedback(payload);
      window.showToast("Feedback submitted successfully!", "success");
      fbForm.reset();
      
      // Reset stars visually
      document.getElementById('fb-rating').value = 0;
      document.querySelectorAll('#star-rating i').forEach(s => s.style.color = 'var(--border)');
      
      loadFeedback();
    } catch (err) {
      window.showToast("Failed to submit feedback.", "danger");
    } finally {
      btn.disabled = false;
      btn.textContent = 'Submit Feedback';
    }
  });
}

async function loadComplaints() {
  try {
    const data = await window.CustomerAPI.getComplaints();
    const container = document.getElementById('complaints-list');
    container.innerHTML = '';

    if (!data || data.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--light); font-size: 13px;">No complaints history.</div>`;
      return;
    }

    data.forEach(item => {
      let badgeClass = 'pending';
      if (item.status === 'Resolved' || item.status === 'Closed') badgeClass = 'delivered';
      if (item.status === 'In Progress') badgeClass = 'intransit';

      const dateStr = item.date ? new Date(item.date).toLocaleDateString() : 'Recent';

      container.innerHTML += `
        <div style="padding: 16px; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--bg);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div style="font-weight: 600; color: var(--dark);">${item.id} &bull; <span style="font-size: 0.85rem; color: var(--mid);">${item.type || 'General'}</span></div>
            <span class="badge ${badgeClass}">${item.status}</span>
          </div>
          <div style="font-size: 0.9rem; color: var(--mid);">${item.details || 'No details provided.'}</div>
          <div style="font-size: 0.8rem; color: var(--light); margin-top: 8px;">${dateStr}</div>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}

async function loadFeedback() {
  try {
    const data = await window.CustomerAPI.getFeedback();
    const container = document.getElementById('feedback-list');
    container.innerHTML = '';

    if (!data || data.length === 0) {
      container.innerHTML = `<div style="text-align: center; color: var(--light); font-size: 13px;">No feedback history.</div>`;
      return;
    }

    data.forEach(item => {
      const dateStr = new Date(item.date || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      let badgeClass = 'pending';
      if (item.status === 'Reviewed') badgeClass = 'delivered';

      let stars = '';
      for (let i = 0; i < 5; i++) {
        if (i < item.rating) stars += `<i class="fa-solid fa-star" style="color: var(--yellow); font-size: 0.85rem;"></i>`;
        else stars += `<i class="fa-regular fa-star" style="color: var(--border); font-size: 0.85rem;"></i>`;
      }

      container.innerHTML += `
        <div style="padding: 16px; border: 1px solid var(--border); border-radius: var(--r-lg); background: var(--bg);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <div>${stars}</div>
            <span class="badge ${badgeClass}">${item.status}</span>
          </div>
          <div style="font-size: 0.9rem; color: var(--mid);">${item.comment || 'No comments provided.'}</div>
          <div style="font-size: 0.8rem; color: var(--light); margin-top: 8px;">${dateStr}</div>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
  }
}
