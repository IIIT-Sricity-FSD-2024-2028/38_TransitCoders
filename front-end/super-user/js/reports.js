/**
 * Reports & Analytics — Data-Driven Charts
 * Bug Fix F6: Replaced StorageAPI with window.AppState.getState() which is
 * hydrated from the NestJS backend. All chart data now comes from live API data.
 */
document.addEventListener("DOMContentLoaded", async () => {
    // Ensure state is hydrated before rendering
    if (window.AppState && typeof window.AppState.hydrate === 'function') {
        await window.AppState.hydrate();
    }

    const state      = window.AppState ? window.AppState.getState() : {};
    const users      = state.users      || [];
    const complaints = state.complaints || [];
    const feedback   = state.feedback   || [];

    // === 0. Financial Dashboard & Expenses ===
    async function loadFinancials() {
        try {
            const rev = await window.API.reports.getRevenue();
            if (document.getElementById('val-gross-collections')) {
                document.getElementById('val-gross-collections').textContent = `₹${rev.grossCollections.toFixed(2)}`;
                document.getElementById('val-refunds').textContent = `₹${rev.refunds.toFixed(2)}`;
                document.getElementById('val-net-collections').textContent = `₹${rev.netCollections.toFixed(2)}`;
                document.getElementById('val-total-tax').textContent = `₹${rev.totalTax.toFixed(2)}`;
                document.getElementById('val-net-revenue').textContent = `₹${rev.netRevenue.toFixed(2)}`;
                document.getElementById('val-agent-payouts').textContent = `₹${rev.totalAgentPayouts.toFixed(2)}`;
                document.getElementById('val-op-expenses').textContent = `₹${rev.totalOperatingExpenses.toFixed(2)}`;
                document.getElementById('val-op-profit').textContent = `₹${rev.operatingProfit.toFixed(2)}`;
                document.getElementById('val-profit-margin').textContent = `${rev.profitMargin.toFixed(2)}%`;
            }
        } catch (err) {
            console.error("Failed to load revenue:", err);
            if(window.showToast) window.showToast('Failed to load financial data', 'error');
        }
    }
    
    async function loadExpenses() {
        try {
            const expenses = await window.API.expenses.getAll();
            window.allExpenses = expenses;
            const tbody = document.getElementById('expenses-table-body');
            if (tbody) {
                if (!expenses.length) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No expenses found.</td></tr>';
                    return;
                }
                tbody.innerHTML = expenses.map(e => `
                    <tr>
                        <td>${new Date(e.date).toLocaleDateString()}</td>
                        <td><span class="status-badge blue">${e.category}</span></td>
                        <td>${e.description}</td>
                        <td style="text-align: right;">₹${e.amount.toFixed(2)}</td>
                        <td style="text-align: right;">
                            <button class="btn btn-sm btn-outline" onclick="editExpense('${e.id}')">Edit</button>
                            <button class="btn btn-sm btn-outline" style="color:var(--clr-red-500);border-color:var(--clr-red-500);" onclick="deleteExpense('${e.id}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
        } catch (err) {
            console.error("Failed to load expenses:", err);
        }
    }

    loadFinancials();
    loadExpenses();

    // Export functions to window for onclick handlers
    window.loadFinancials = loadFinancials;
    window.loadExpenses = loadExpenses;

    // === 1. User Growth Trends — Bar chart by role ===
    const userChart = document.querySelector('[data-type="line"]');
    if (userChart) {
        const roleCounts = {};
        users.forEach(u => {
            const role = u.role || 'Unknown';
            roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
        const maxCount = Math.max(...Object.values(roleCounts), 1);
        const colors = {
            'super_user': 'var(--clr-orange-500)', 'admin': 'var(--clr-blue-700)', 'hub_manager': 'var(--clr-blue-500)',
            'merchant': 'var(--clr-green-500)', 'delivery_agent': 'var(--clr-amber-500)', 'customer': 'var(--clr-neutral-500)',
            'support_staff': 'var(--clr-red-500)'
        };
        const roleLabels = {
            'super_user': 'Super User', 'admin': 'Admin', 'hub_manager': 'Hub Manager',
            'merchant': 'Merchant', 'delivery_agent': 'Delivery Agent', 'customer': 'Customer',
            'support_staff': 'Support'
        };

        userChart.innerHTML = `
            <div class="report-chart-bars">
                ${Object.entries(roleCounts).map(([role, count]) => `
                    <div class="report-bar-group">
                        <div class="report-bar-value">${count}</div>
                        <div class="report-bar" style="height:${Math.max((count / maxCount) * 140, 8)}px; background:${colors[role] || 'var(--clr-neutral-400)'}"></div>
                        <div class="report-bar-label">${roleLabels[role] || role}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // === 2. Complaint Volume — Horizontal chart by status ===
    const complaintChart = document.querySelector('[data-type="bar"]');
    if (complaintChart) {
        const typeCounts = {};
        complaints.forEach(c => {
            const key = c.status || 'Open';
            typeCounts[key] = (typeCounts[key] || 0) + 1;
        });
        const maxType = Math.max(...Object.values(typeCounts), 1);
        const typeColors = ['var(--clr-red-500)', 'var(--clr-orange-500)', 'var(--clr-amber-500)', 'var(--clr-blue-500)', 'var(--clr-blue-700)', 'var(--clr-green-300)', 'var(--clr-green-500)'];

        complaintChart.innerHTML = `
            <div class="report-h-bars">
                ${Object.entries(typeCounts).map(([type, count], i) => `
                    <div class="report-h-bar-row">
                        <span class="report-h-label">${type}</span>
                        <div class="report-h-track">
                            <div class="report-h-fill" style="width:${(count / maxType) * 100}%; background:${typeColors[i % typeColors.length]}"></div>
                        </div>
                        <span class="report-h-count">${count}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // === 3. Platform Usage — Active vs Total Users donut ===
    const donutChart = document.querySelector('[data-type="donut"]');
    if (donutChart) {
        const totalUsers  = users.length;
        const activeUsers = users.filter(u => u.isActive !== false && u.active !== false).length;
        const pct = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0;
        donutChart.style.background = `conic-gradient(var(--clr-orange-500) 0% ${pct}%, var(--clr-neutral-200) ${pct}% 100%)`;
        donutChart.style.border = 'none';
        donutChart.innerHTML = `
            <div class="report-donut-inner">
                <div class="report-donut-pct">${pct}%</div>
                <div class="report-donut-label">Active Users</div>
            </div>
        `;
    }

    // === 4. Complaint Status Mini Stats ===
    const uptimeChart = document.querySelector('[data-type="line-mini"]');
    if (uptimeChart) {
        const openComplaints = complaints.filter(c => (c.status || '').toLowerCase() === 'open').length;
        const escalated      = complaints.filter(c => (c.status || '').toLowerCase() === 'escalated').length;
        const resolved       = complaints.filter(c => (c.status || '').toLowerCase() === 'resolved').length;
        uptimeChart.innerHTML = `
            <div class="report-mini-stats">
                <div class="report-mini-stat">
                    <div class="report-mini-num" style="color:var(--clr-red-500)">${openComplaints}</div>
                    <div class="report-mini-label">Open</div>
                </div>
                <div class="report-mini-stat">
                    <div class="report-mini-num" style="color:var(--clr-amber-500)">${escalated}</div>
                    <div class="report-mini-label">Escalated</div>
                </div>
                <div class="report-mini-stat">
                    <div class="report-mini-num" style="color:var(--clr-green-500)">${resolved}</div>
                    <div class="report-mini-label">Resolved</div>
                </div>
            </div>
        `;
    }

    // === 5. Feedback Rating Distribution ===
    const dbChart = document.querySelector('[data-type="bar-mini"]');
    if (dbChart) {
        const ratingDist = [0, 0, 0, 0, 0];
        feedback.forEach(f => {
            const r = Number(f.rating);
            if (r >= 1 && r <= 5) ratingDist[r - 1]++;
        });
        const maxR = Math.max(...ratingDist, 1);
        const starColors = ['var(--clr-red-500)', 'var(--clr-orange-500)', 'var(--clr-amber-500)', 'var(--clr-green-300)', 'var(--clr-green-500)'];
        dbChart.innerHTML = `
            <div class="report-chart-bars" style="gap:16px">
                ${ratingDist.map((count, i) => `
                    <div class="report-bar-group">
                        <div class="report-bar-value">${count}</div>
                        <div class="report-bar" style="height:${Math.max((count / maxR) * 100, 6)}px; background:${starColors[i]}"></div>
                        <div class="report-bar-label">${'★'.repeat(i + 1)}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }
});

// Expense Modal Logic
window.openExpenseModal = function() {
    document.getElementById('expense-modal-title').textContent = 'Add Expense';
    document.getElementById('expense-id').value = '';
    document.getElementById('expense-form').reset();
    document.getElementById('expense-date').valueAsDate = new Date();
    document.getElementById('expense-modal').classList.add('active');
};

window.closeExpenseModal = function() {
    document.getElementById('expense-modal').classList.remove('active');
};

window.editExpense = function(id) {
    const expense = (window.allExpenses || []).find(e => e.id === id);
    if (!expense) return;
    
    document.getElementById('expense-modal-title').textContent = 'Edit Expense';
    document.getElementById('expense-id').value = expense.id;
    document.getElementById('expense-date').value = expense.date.substring(0, 10);
    document.getElementById('expense-category').value = expense.category;
    document.getElementById('expense-description').value = expense.description;
    document.getElementById('expense-amount').value = expense.amount;
    
    document.getElementById('expense-modal').classList.add('active');
};

window.deleteExpense = async function(id) {
    if (!confirm('Are you sure you want to delete this expense?')) return;
    try {
        await window.API.expenses.remove(id);
        if (window.showToast) window.showToast('Expense deleted successfully', 'success');
        if (window.loadExpenses) window.loadExpenses();
        if (window.loadFinancials) window.loadFinancials();
    } catch (err) {
        console.error(err);
        if (window.showToast) window.showToast(err.message || 'Failed to delete expense', 'error');
    }
};

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('expense-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('expense-id').value;
        const data = {
            date: document.getElementById('expense-date').value,
            category: document.getElementById('expense-category').value,
            description: document.getElementById('expense-description').value,
            amount: parseFloat(document.getElementById('expense-amount').value)
        };
        
        try {
            if (id) {
                await window.API.expenses.update(id, data);
                if (window.showToast) window.showToast('Expense updated successfully', 'success');
            } else {
                await window.API.expenses.create(data);
                if (window.showToast) window.showToast('Expense created successfully', 'success');
            }
            window.closeExpenseModal();
            if (window.loadExpenses) window.loadExpenses();
            if (window.loadFinancials) window.loadFinancials();
        } catch (err) {
            console.error(err);
            if (window.showToast) window.showToast(err.message || 'Failed to save expense', 'error');
        }
    });
});
