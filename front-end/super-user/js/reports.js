/**
 * Reports & Analytics — Super Admin
 * Pure CSS/JS charts: bar charts, donut charts, mini-graphs from live data.
 */
document.addEventListener("DOMContentLoaded", function () {
    function renderCharts() {
        var orders = StorageAPI.getOrders();
        var users = StorageAPI.getUsers();
        var complaints = StorageAPI.getComplaints();

        // --- User Growth Trends (line chart as bars by role) ---
        var userGrowth = document.querySelector('[data-type="line"]');
        if (userGrowth) {
            var roleCounts = {};
            users.forEach(function(u) {
                var r = u.role || 'Other';
                roleCounts[r] = (roleCounts[r] || 0) + 1;
            });
            var maxCount = Math.max.apply(null, Object.values(roleCounts).concat([1]));
            var html = '<div class="chart-bars">';
            Object.keys(roleCounts).forEach(function(role) {
                var pct = Math.round((roleCounts[role] / maxCount) * 100);
                html += '<div class="chart-bar-item">' +
                    '<div class="chart-bar-track">' +
                        '<div class="chart-bar-fill" style="height:' + pct + '%; background: linear-gradient(to top, #6366f1, #8b5cf6);"></div>' +
                    '</div>' +
                    '<span class="chart-bar-label">' + role + '</span>' +
                    '<span class="chart-bar-value">' + roleCounts[role] + '</span>' +
                '</div>';
            });
            html += '</div>';
            userGrowth.innerHTML = html;
        }

        // --- Complaint Volume (bar chart by status) ---
        var complaintChart = document.querySelector('[data-type="bar"]');
        if (complaintChart) {
            var statusCounts = { Open: 0, Escalated: 0, Resolved: 0 };
            complaints.forEach(function(c) {
                if (statusCounts.hasOwnProperty(c.status)) statusCounts[c.status]++;
            });
            var colorMap = { Open: '#ef4444', Escalated: '#f59e0b', Resolved: '#22c55e' };
            var maxC = Math.max.apply(null, Object.values(statusCounts).concat([1]));
            var html2 = '<div class="chart-bars">';
            Object.keys(statusCounts).forEach(function(status) {
                var pct = Math.round((statusCounts[status] / maxC) * 100);
                html2 += '<div class="chart-bar-item">' +
                    '<div class="chart-bar-track">' +
                        '<div class="chart-bar-fill" style="height:' + pct + '%; background:' + colorMap[status] + ';"></div>' +
                    '</div>' +
                    '<span class="chart-bar-label">' + status + '</span>' +
                    '<span class="chart-bar-value">' + statusCounts[status] + '</span>' +
                '</div>';
            });
            html2 += '</div>';
            complaintChart.innerHTML = html2;
        }

        // --- Platform Usage Donut ---
        var donut = document.querySelector('[data-type="donut"]');
        if (donut) {
            var total = orders.length || 1;
            var delivered = orders.filter(function(o) { return (o.status || '').toLowerCase().indexOf('deliver') !== -1; }).length;
            var inTransit = orders.filter(function(o) { var s = (o.status || '').toLowerCase(); return s.indexOf('transit') !== -1 || s.indexOf('delivery') !== -1; }).length;
            var pending = orders.filter(function(o) { return (o.status || '').toLowerCase() === 'pending'; }).length;
            var other = total - delivered - inTransit - pending;

            var segments = [
                { label: 'Delivered', value: delivered, color: '#22c55e' },
                { label: 'In Transit', value: inTransit, color: '#3b82f6' },
                { label: 'Pending', value: pending, color: '#f59e0b' },
                { label: 'Other', value: other, color: '#6366f1' }
            ];

            var conic = '';
            var cumulative = 0;
            segments.forEach(function(seg) {
                var pct = (seg.value / total) * 100;
                if (pct > 0) {
                    conic += seg.color + ' ' + cumulative + '% ' + (cumulative + pct) + '%, ';
                    cumulative += pct;
                }
            });
            conic = conic.slice(0, -2);

            donut.style.borderRadius = '50%';
            donut.style.background = 'conic-gradient(' + conic + ')';
            donut.style.position = 'relative';
            donut.innerHTML = '<div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:70%; height:70%; border-radius:50%; background:var(--bg-secondary, #1a1a2e); display:flex; align-items:center; justify-content:center; flex-direction:column;">' +
                '<span style="font-size:1.25rem; font-weight:700; color:var(--text-primary, #fff)">' + total + '</span>' +
                '<span style="font-size:0.65rem; color:var(--text-subtitle, #aaa)">Orders</span>' +
            '</div>';

            // Legend after donut
            var legendContainer = donut.parentElement.querySelector('.chart-legend');
            if (!legendContainer) {
                legendContainer = document.createElement('div');
                legendContainer.className = 'chart-legend';
                legendContainer.style.cssText = 'display:flex; gap:12px; flex-wrap:wrap; justify-content:center; margin-top:12px; font-size:0.75rem;';
                donut.parentElement.appendChild(legendContainer);
            }
            legendContainer.innerHTML = segments.map(function(seg) {
                return '<span style="display:flex; align-items:center; gap:4px;">' +
                    '<span style="width:10px; height:10px; border-radius:2px; background:' + seg.color + '"></span>' +
                    seg.label + ' (' + seg.value + ')' +
                '</span>';
            }).join('');
        }

        // --- Daily Order Volume (mini sparkline) ---
        var uptimeChart = document.querySelector('[data-type="line-mini"]');
        if (uptimeChart) {
            var days = [0,0,0,0,0,0,0,0,0,0,0,0];
            orders.forEach(function(o) {
                var d = new Date(o.created_at || new Date());
                var diff = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
                if(diff >= 0 && diff < 12) { days[11 - diff]++; }
            });
            var sparkHtml = '<div class="mini-sparkline">';
            var maxV = Math.max.apply(null, days.concat([1]));
            days.forEach(function(v, i) {
                var h = Math.round((v / maxV) * 100);
                sparkHtml += '<div class="spark-bar" style="height:' + Math.max(h, 5) + '%; background: linear-gradient(to top, #22c55e, #4ade80); animation-delay:' + (i * 0.05) + 's"></div>';
            });
            sparkHtml += '</div>';
            sparkHtml += '<div style="text-align:center; margin-top:8px; font-size:0.8rem; color:var(--text-subtitle)">Avg: ' + Math.round(orders.length / 12) + ' orders / day (12 days)</div>';
            uptimeChart.innerHTML = sparkHtml;
        }

        // --- Total Revenue (mini bars) ---
        var dbChart = document.querySelector('[data-type="bar-mini"]');
        if (dbChart) {
            var revDays = [0,0,0,0,0,0,0,0,0,0,0,0];
            var deliveredOrders = orders.filter(function(o) { return (o.status || '').toLowerCase().indexOf('deliver') !== -1; });
            var totalRev = deliveredOrders.reduce(function(acc, o) { 
                var amt = parseFloat(o.amount || 0);
                var d = new Date(o.created_at || new Date());
                var diff = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
                if(diff >= 0 && diff < 12) { revDays[11 - diff] += amt; }
                return acc + amt;
            }, 0);
            var dbMax = Math.max.apply(null, revDays.concat([1]));
            var dbHtml = '<div class="mini-sparkline">';
            revDays.forEach(function(v, i) {
                var h = Math.round((v / dbMax) * 100);
                var color = v > (dbMax * 0.75) ? '#22c55e' : v > (dbMax * 0.4) ? '#3b82f6' : '#6366f1';
                dbHtml += '<div class="spark-bar" style="height:' + Math.max(h, 5) + '%; background:' + color + '; animation-delay:' + (i * 0.05) + 's"></div>';
            });
            dbHtml += '</div>';
            dbHtml += '<div style="text-align:center; margin-top:8px; font-size:0.8rem; color:var(--text-subtitle)">Total Rev: ₹' + totalRev.toLocaleString('en-IN') + '</div>';
            dbChart.innerHTML = dbHtml;
        }
    }

    renderCharts();

    window.addEventListener('appStateChanged', renderCharts);
    window.addEventListener('storage', function(e) {
        if (e.key === 'swifttrack_central_state') renderCharts();
    });
});
