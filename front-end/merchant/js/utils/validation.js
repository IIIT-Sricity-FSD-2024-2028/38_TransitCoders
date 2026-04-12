/* js/utils/validation.js – Client-side validation utilities */

const Validator = {

  /* ── RULES ── */
  required(val)        { return val !== null && val !== undefined && String(val).trim() !== ''; },
  email(val)           { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()); },
  phone(val)           { 
    const cleanNum = val.replace(/[\s\-\(\)]/g, ''); 
    return /^(?:\+91|91|0)?[6-9]\d{9}$/.test(cleanNum); 
  },
  minLength(val, n)    { return String(val).trim().length >= n; },
  maxLength(val, n)    { return String(val).trim().length <= n; },
  positiveNumber(val)  { return !isNaN(val) && parseFloat(val) > 0; },
  zip(val)             { return /^\d{6}$/.test(val.trim()); },
  trackingId(val)      { return /^SWT-\d{4}-\d{5,}$/.test(val.trim()); },
  noSpecialChars(val)  { return /^[a-zA-Z0-9\s\-\.,]+$/.test(val.trim()); },

  /* ── SHOW / CLEAR FIELD ERROR ── */
  showError(fieldEl, msg) {
    fieldEl.classList.add('error');
    let errEl = fieldEl.parentElement.querySelector('.field-error');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'field-error';
      fieldEl.parentElement.appendChild(errEl);
    }
    errEl.textContent = msg;
    errEl.classList.add('visible');
  },
  clearError(fieldEl) {
    fieldEl.classList.remove('error');
    const errEl = fieldEl.parentElement.querySelector('.field-error');
    if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
  },
  clearAllErrors(formEl) {
    formEl.querySelectorAll('.form-input.error').forEach(el => this.clearError(el));
  },

  /* ── VALIDATE A SINGLE FIELD ── */
  validateField(el) {
    const val = el.value;
    const rules = (el.dataset.validate || '').split('|').filter(Boolean);
    for (const rule of rules) {
      if (rule === 'required'       && !this.required(val))       { this.showError(el, 'This field is required.'); return false; }
      if (rule === 'email'          && val && !this.email(val))    { this.showError(el, 'Enter a valid email address.'); return false; }
      if (rule === 'phone'          && val && !this.phone(val))    { this.showError(el, 'Enter a valid phone number.'); return false; }
      if (rule === 'positiveNumber' && val && !this.positiveNumber(val)) { this.showError(el, 'Must be a positive number.'); return false; }
      if (rule === 'zip'            && val && !this.zip(val))      { this.showError(el, 'Enter a valid ZIP/postal code.'); return false; }
      if (rule.startsWith('min:')) {
        const n = parseInt(rule.split(':')[1]);
        if (!this.minLength(val, n)) { this.showError(el, `Minimum ${n} characters required.`); return false; }
      }
      if (rule.startsWith('max:')) {
        const n = parseInt(rule.split(':')[1]);
        if (!this.maxLength(val, n)) { this.showError(el, `Maximum ${n} characters allowed.`); return false; }
      }
    }
    this.clearError(el);
    return true;
  },

  /* ── VALIDATE ENTIRE FORM ── */
  validateForm(formEl) {
    let valid = true;
    formEl.querySelectorAll('.form-input[data-validate]').forEach(el => {
      if (!this.validateField(el)) valid = false;
    });
    return valid;
  },

  /* ── LIVE VALIDATION ON BLUR ── */
  attachLiveValidation(formEl) {
    formEl.querySelectorAll('.form-input[data-validate]').forEach(el => {
      el.addEventListener('blur',  () => this.validateField(el));
      el.addEventListener('input', () => { if (el.classList.contains('error')) this.validateField(el); });
    });
  }
};
