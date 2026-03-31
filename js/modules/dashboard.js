/* js/modules/dashboard.js – Dashboard view logic */

const Dashboard = (() => {

  const statusBadge = {
    'delivered':  '<span class="badge b-delivered">Delivered</span>',
    'in-transit': '<span class="badge b-in-transit">In Transit</span>',
    'pending':    '<span class="badge b-pending">Pending</span>',
    'cancelled':  '<span class="badge b-cancelled">Cancelled</span>',
    'processing': '<span class="badge b-processing">Processing</span>',
  };

  function renderKPIs() {
    const user  = Auth.currentUser();
    const mid   = Auth.isSuperUser() ? null : user?.user_id;
    const stats = MockDB.getStats(mid);

    const el = id => document.getElementById(id);
    if (el('kpi-total'))    el('kpi-total').textContent    = stats.total;
    if (el('kpi-delivered'))el('kpi-delivered').textContent = stats.delivered;
    if (el('kpi-transit'))  el('kpi-transit').textContent  = stats.inTransit;
    if (el('kpi-revenue'))  el('kpi-revenue').textContent  = '$' + parseFloat(stats.revenue).toLocaleString();
  }

  function renderTable() {
    const user = Auth.currentUser();
    const mid  = Auth.isSuperUser() ? null : user?.user_id;
    const data = MockDB.getShipments(mid).slice(0, 5);

    const tbody = document.getElementById('dash-table');
    if (!tbody) return;

    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No recent shipments found.</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(s => `
      <tr class="table-row" onclick="navigate('track');setTimeout(()=>{document.getElementById('track-input').value='${s.id}';Tracking.doTrack()},100)">
        <td><span class="tracking-id">${s.id}</span></td>
        <td>${escapeHtml(s.recipient)}</td>
        <td><span style="color:var(--mid)">${escapeHtml(s.origin)}</span></td>
        <td><span style="color:var(--mid)">${escapeHtml(s.dest)}</span></td>
        <td style="color:var(--mid)">${s.date}</td>
        <td>${statusBadge[s.status] || s.status}</td>
      </tr>`).join('');
  }

  let currentChartPeriod = 'This Week';

  function updateChart(period) {
    if (!period || period === currentChartPeriod) return;
    currentChartPeriod = period;
    renderBarChart();
  }

  function renderBarChart() {
    let days = [];
    let delivered = [];
    let transit = [];

    if (currentChartPeriod === 'This Week') {
      days      = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      delivered = [45, 62, 38, 71, 55, 80, 48];
      transit   = [30, 40, 55, 28, 62, 35, 70];
    } else {
      // "This Month"
      days      = ['Week 1','Week 2','Week 3','Week 4'];
      delivered = [210, 185, 240, 195];
      transit   = [80, 110, 95, 120];
    }

    const max = Math.max(...delivered, ...transit, 1);
    const h = 110;

    const chartEl  = document.getElementById('bar-chart');
    const labelsEl = document.getElementById('bar-labels');
    if (!chartEl || !labelsEl) return;

    // First render bars with height 0px
    const bars = days.map((d, i) => `
      <div class="bar-group" style="flex:1">
        <div class="bar" id="b-del-${i}" style="flex:1;height:0px;background:var(--orange);opacity:.85;transition:height 0.5s cubic-bezier(0.4, 0, 0.2, 1)" title="${delivered[i]} delivered"></div>
        <div class="bar" id="b-trn-${i}" style="flex:1;height:0px;background:#DBEAFE;border:1px solid #93C5FD;transition:height 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.05s" title="${transit[i]} in transit"></div>
      </div>`).join('');

    const labels = days.map(d =>
      `<div style="flex:1;text-align:center;font-size:10px;color:var(--mid);margin-top:4px">${d}</div>`
    ).join('');

    chartEl.innerHTML  = bars;
    labelsEl.innerHTML = labels;

    // Force reflow so the browser acknowledges the 0px height before animating
    void chartEl.offsetHeight;

    // Animate to target heights
    setTimeout(() => {
      days.forEach((d, i) => {
        const delEl = document.getElementById(`b-del-${i}`);
        const trnEl = document.getElementById(`b-trn-${i}`);
        if (delEl) delEl.style.height = Math.round((delivered[i]/max)*h) + 'px';
        if (trnEl) trnEl.style.height = Math.round((transit[i]/max)*h) + 'px';
      });
    }, 10);
  }

  function render() {
    renderKPIs();
    renderTable();
    renderBarChart();
  }

  // XSS-safe helper
  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Attach to window so event handlers can reach it easily
  window.Dashboard = { render, updateChart };

  return window.Dashboard;
})();
