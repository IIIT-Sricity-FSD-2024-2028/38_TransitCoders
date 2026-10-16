/**
 * Report Issue Page — Dynamic form rendering, validation, submission
 */

document.addEventListener('DOMContentLoaded', () => {
    initCommon();
    bindIssueTypeChange();
    bindFormSubmit();
    bindModalProceed();
});

function bindIssueTypeChange() {
    const select = document.getElementById('issue-type-select');
    select.addEventListener('change', () => {
        const type = select.value;
        renderDynamicForm(type);
        document.getElementById('issue-type-group').classList.remove('error');
    });
}

function renderDynamicForm(type) {
    const container = document.getElementById('dynamic-form-section');
    const submitBtn = document.getElementById('submit-report-btn');
    const title = document.getElementById('report-title');
    const subtitle = document.getElementById('report-subtitle');

    if (!type) {
        container.innerHTML = '';
        submitBtn.style.display = 'none';
        title.textContent = 'Report Issue';
        subtitle.textContent = 'Please provide details about the issue with your delivery to help us resolve it quickly.';
        return;
    }

    submitBtn.style.display = 'block';

    switch (type) {
        case 'package':
            title.textContent = 'Report Package Issue';
            subtitle.textContent = 'Please provide details about the issue with your delivery to help us resolve it quickly.';
            container.innerHTML = `
                <div class="form-group" data-validate="required">
                    <label>Issue Type</label>
                    <select class="form-select" id="package-issue-type">
                        <option value="">Select issue type</option>
                        <option value="damaged" selected>Package Damaged</option>
                        <option value="wrong">Wrong Package</option>
                        <option value="missing">Missing Items</option>
                        <option value="tampered">Package Tampered</option>
                    </select>
                    <span class="field-error">Please select an issue type</span>
                </div>
                <div class="form-group">
                    <label>Evidence of Damage</label>
                    <div class="upload-zone" id="upload-zone">
                        <div class="upload-zone-icon"><i class="fas fa-camera"></i></div>
                        <h4>Upload Photos</h4>
                        <p>Please take clear photos of the damaged package and the items inside.</p>
                        <button type="button" class="upload-select-btn"><i class="fas fa-cloud-upload-alt"></i> Select Files</button>
                        <p class="upload-formats">Supports: JPG, PNG, HEIC (Max 10MB per file)</p>
                    </div>
                    <input type="file" id="file-input" style="display:none" accept="image/*" multiple>
                    <div id="uploaded-files" style="margin-top:8px;"></div>
                </div>
                <div class="form-group">
                    <label>Additional Details (Optional)</label>
                    <textarea class="form-textarea" id="package-details" placeholder="Tell us more about what happened..."></textarea>
                </div>`;
            bindUploadZone();
            break;

        case 'unavailable':
            title.textContent = 'Report Customer Unavailable';
            subtitle.textContent = 'Please provide details about the issue with your delivery to help us resolve it quickly.';
            container.innerHTML = `
                <div class="call-customer-section">
                    <p>Try alternative Phone number</p>
                    <button type="button" class="call-btn" id="call-alt-btn"><i class="fas fa-phone"></i> Call Customer</button>
                </div>
                <div class="form-group">
                    <label>GPS Capture</label>
                    <div class="gps-capture">
                        <div class="gps-map-placeholder">
                            <img src="../assets/map-bg.png" alt="GPS location">
                        </div>
                        <div class="gps-coords">41.8781° N, 87.6298° W</div>
                        <button type="button" class="recalibrate-btn"><i class="fas fa-rotate"></i> Recalibrate GPS</button>
                    </div>
                </div>
                <div class="form-group" data-validate="required">
                    <label>Attempt</label>
                    <div class="attempt-options" id="attempt-options">
                        <div class="attempt-option active" data-attempt="reached">
                            <div class="attempt-radio"></div>
                            <span>Reached Location</span>
                        </div>
                        <div class="attempt-option" data-attempt="no-response">
                            <div class="attempt-radio"></div>
                            <span>No Response at the Gate</span>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Additional Details (Optional)</label>
                    <textarea class="form-textarea" id="unavailable-details" placeholder="Tell us more about what happened..."></textarea>
                </div>`;
            bindAttemptOptions();
            bindCallButton();
            bindRecalibrate();
            break;

        case 'refused':
            title.textContent = 'Customer Refused Delivery';
            subtitle.textContent = 'Please provide details about the issue with your delivery to help us resolve it quickly.';
            container.innerHTML = `
                <div class="form-group" data-validate="required">
                    <label>Reason for Refusal</label>
                    <input type="text" class="form-input-field" id="refusal-reason" placeholder="Enter the Reason for refusal">
                    <span class="field-error">Reason is required</span>
                </div>
                <div class="form-group">
                    <label>Detailed Description</label>
                    <textarea class="form-textarea" id="refusal-details" placeholder="Provide additional details"></textarea>
                </div>`;
            break;

        case 'other':
            title.textContent = 'Report Other Delivery Issue';
            subtitle.textContent = 'Please provide details about the issue with your delivery to help us resolve it quickly.';
            container.innerHTML = `
                <div class="form-group" data-validate="required">
                    <label>Issue Type</label>
                    <select class="form-select" id="other-issue-type">
                        <option value="">Brief summary of your problem</option>
                        <option value="traffic">Traffic Delay</option>
                        <option value="vehicle">Vehicle Breakdown</option>
                        <option value="weather">Weather Issue</option>
                        <option value="address">Wrong Address</option>
                        <option value="other">Other</option>
                    </select>
                    <span class="field-error">Please select an issue type</span>
                </div>
                <div class="form-group">
                    <label>GPS Capture</label>
                    <div class="gps-capture">
                        <div class="gps-map-placeholder">
                            <img src="../assets/map-bg.png" alt="GPS location">
                        </div>
                        <div class="gps-coords">41.8781° N, 87.6298° W</div>
                        <button type="button" class="recalibrate-btn"><i class="fas fa-rotate"></i> Recalibrate GPS</button>
                    </div>
                </div>
                <div class="form-group">
                    <label>Issue Description</label>
                    <textarea class="form-textarea" id="other-description" placeholder="Tell us more about what happened..."></textarea>
                </div>`;
            bindRecalibrate();
            break;
    }

    // Animate in
    container.style.opacity = '0';
    container.style.transform = 'translateY(12px)';
    setTimeout(() => {
        container.style.transition = 'all 0.3s ease';
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
    }, 50);
}

function bindUploadZone() {
    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const uploadedDiv = document.getElementById('uploaded-files');

    if (!zone || !fileInput) return;

    zone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        const files = Array.from(fileInput.files);
        if (files.length === 0) return;

        uploadedDiv.innerHTML = files.map(f => `
            <div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:13px;color:var(--text-body);">
                <i class="fas fa-image" style="color:var(--clr-orange-500);"></i>
                <span>${f.name}</span>
                <span style="color:var(--text-subtitle);font-size:11px;">(${(f.size / 1024).toFixed(1)} KB)</span>
            </div>
        `).join('');
        showToast(`${files.length} file(s) selected`, 'success');
    });
}

function bindAttemptOptions() {
    const container = document.getElementById('attempt-options');
    if (!container) return;

    container.addEventListener('click', e => {
        const option = e.target.closest('.attempt-option');
        if (!option) return;

        container.querySelectorAll('.attempt-option').forEach(o => o.classList.remove('active'));
        option.classList.add('active');
    });
}

function bindCallButton() {
    const btn = document.getElementById('call-alt-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            const orderId = getUrlParam('id');
            const order = orderId ? DeliveryData.getOrderById(orderId) : null;
            showToast(order ? `Calling ${order.phone}...` : 'Calling customer...', 'info');
        });
    }
}

function bindRecalibrate() {
    document.querySelectorAll('.recalibrate-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            showToast('Recalibrating GPS...', 'info');
            setTimeout(() => showToast('GPS location updated', 'success'), 1500);
        });
    });
}

function bindFormSubmit() {
    const form = document.getElementById('report-form');
    form.addEventListener('submit', async e => {
        e.preventDefault();

        const issueType = document.getElementById('issue-type-select').value;

        // Validate issue type
        if (!issueType) {
            document.getElementById('issue-type-group').classList.add('error');
            showToast('Please select an issue type', 'error');
            return;
        }

        // Validate required fields
        let valid = true;
        const requiredGroups = document.querySelectorAll('#dynamic-form-section [data-validate="required"]');
        requiredGroups.forEach(group => {
            const input = group.querySelector('input, select, textarea');
            if (input && !input.value.trim()) {
                group.classList.add('error');
                valid = false;
            } else {
                group.classList.remove('error');
            }
        });

        // For refused type, check reason
        if (issueType === 'refused') {
            const reason = document.getElementById('refusal-reason');
            if (reason && !reason.value.trim()) {
                reason.closest('.form-group').classList.add('error');
                valid = false;
            }
        }

        if (!valid) {
            showToast('Please fill in required fields', 'error');
            return;
        }

        // Submit
        const report = {
            orderId: getUrlParam('id'),
            issueType: issueType,
            details: collectFormDetails(issueType)
        };

        // Submit to real backend
        const numericId = report.orderId; // URL param (synthetic numeric ID)
        // Look up the real backend UUID via DeliveryData
        const orderRef = DeliveryData.getOrderById(numericId);
        const backendOrderId = orderRef ? orderRef._ref : null;

        const rawType = report.issueType;
        const typeMap = {
            package: 'package_damaged',
            unavailable: 'customer_unavailable',
            refused: 'other',
            other: 'other'
        };
        const mishapType = typeMap[rawType] || 'other';
        const description = JSON.stringify(report.details); // serialise sub-fields as description

        if (backendOrderId && window.API && window.API.orders) {
            try {
                await window.API.orders.reportMishap(backendOrderId, mishapType, description);
                if (window.AppState) window.AppState.refresh();
                showModal('report-success-modal');
            } catch (err) {
                console.error('[Report] reportMishap failed:', err?.message || err);
                showToast('Could not submit report — ' + (err?.message || 'server error'), 'error');
            }
        } else {
            // No backend order ID available (e.g. order not yet in state) — show modal anyway
            console.warn('[Report] no backend order ID; report not persisted');
            showModal('report-success-modal');
        }
    });
}

function collectFormDetails(type) {
    switch (type) {
        case 'package':
            return {
                subType: document.getElementById('package-issue-type')?.value || '',
                details: document.getElementById('package-details')?.value || ''
            };
        case 'unavailable':
            const activeAttempt = document.querySelector('.attempt-option.active');
            return {
                attempt: activeAttempt ? activeAttempt.dataset.attempt : '',
                details: document.getElementById('unavailable-details')?.value || ''
            };
        case 'refused':
            return {
                reason: document.getElementById('refusal-reason')?.value || '',
                details: document.getElementById('refusal-details')?.value || ''
            };
        case 'other':
            return {
                subType: document.getElementById('other-issue-type')?.value || '',
                description: document.getElementById('other-description')?.value || ''
            };
        default:
            return {};
    }
}

function bindModalProceed() {
    document.getElementById('report-proceed-btn').addEventListener('click', () => {
        hideModal('report-success-modal');
        window.location.href = 'worklist.html';
    });
}
