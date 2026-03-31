/* js/modules/bookShipment.js – Book Shipment wizard with full validation */

const BookShipment = (() => {
  let currentStep = 0;
  const TOTAL_STEPS = 6;

  /* ── STEP UI ── */
  function updateStepUI() {
    document.querySelectorAll('.step-panel').forEach((p, i) => p.classList.toggle('active', i === currentStep));
    document.querySelectorAll('.step-item').forEach((s, i) => {
      s.classList.toggle('active', i === currentStep);
      s.classList.toggle('done', i < currentStep);
    });
  }

  /* ── VALIDATE CURRENT STEP ── */
  function validateCurrentStep() {
    const panel = document.getElementById('panel-' + currentStep);
    if (!panel) return true;
    return Validator.validateForm(panel);
  }

  /* ── NAVIGATION ── */
  function nextStep() {
    if (!validateCurrentStep()) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }
    if (currentStep < TOTAL_STEPS - 1) {
      currentStep++;
      updateStepUI();
      if (currentStep === 4) buildSummary(); // Summary step
    }
  }

  function prevStep() {
    if (currentStep > 0) { currentStep--; updateStepUI(); }
  }

  function reset() {
    currentStep = 0;
    updateStepUI();
    // Clear all form inputs in wizard
    document.querySelectorAll('.step-panel input, .step-panel textarea').forEach(el => {
      el.value = '';
      Validator.clearError(el);
    });
    // Reset service selection
    document.querySelectorAll('.service-opt').forEach(o => o.classList.remove('active'));
    document.querySelector('.service-opt[data-val="express"]')?.classList.add('active');
  }

  /* ── SERVICE SELECTION ── */
  function selectService(el) {
    document.querySelectorAll('.service-opt').forEach(o => o.classList.remove('active'));
    el.classList.add('active');
  }

  /* ── BUILD ORDER SUMMARY ── */
  function buildSummary() {
    const get = id => document.getElementById(id)?.value?.trim() || '—';

    // Pickup
    document.getElementById('sum-pickup-name')?.innerHTML  && (document.getElementById('sum-pickup-name').textContent  = get('pickup-name'));
    document.getElementById('sum-pickup-addr')?.innerHTML  && (document.getElementById('sum-pickup-addr').textContent  = get('pickup-address') + ', ' + get('pickup-city') + ', ' + get('pickup-state'));
    document.getElementById('sum-pickup-phone')?.innerHTML && (document.getElementById('sum-pickup-phone').textContent = get('pickup-phone'));

    // Receiver
    document.getElementById('sum-recv-name')?.innerHTML  && (document.getElementById('sum-recv-name').textContent  = get('recv-name'));
    document.getElementById('sum-recv-addr')?.innerHTML  && (document.getElementById('sum-recv-addr').textContent  = get('recv-address') + ', ' + get('recv-city'));
    document.getElementById('sum-recv-phone')?.innerHTML && (document.getElementById('sum-recv-phone').textContent = get('recv-phone'));

    // Package & service
    const serviceEl = document.querySelector('.service-opt.active');
    const service   = serviceEl?.dataset.val || 'express';
    const prices    = { standard: 499, express: 999, overnight: 1999 };
    const baseRate  = prices[service] || 999;
    const insurance = document.getElementById('insurance-check')?.checked ? 150 : 0;
    const tax       = ((baseRate + insurance) * 0.09).toFixed(2);
    const total     = (baseRate + insurance + parseFloat(tax)).toFixed(2);

    const setT = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    setT('sum-pkg-type',    get('pkg-type'));
    setT('sum-pkg-weight',  get('pkg-weight') + ' kg');
    setT('sum-service',     service.charAt(0).toUpperCase() + service.slice(1));
    setT('sum-pickup-date', get('pickup-date'));
    setT('sum-base-rate',   '₹' + baseRate.toFixed(2));
    setT('sum-insurance',   insurance ? '₹' + insurance.toFixed(2) : '₹0.00');
    setT('sum-tax',         '₹' + tax);
    setT('sum-total',       '₹' + total);
  }

  /* ── CONFIRM & SUBMIT ── */
  function confirmOrder() {
    // Generate tracking ID
    const newShipment = MockDB.addShipment({
      recipient: document.getElementById('recv-name')?.value.trim() || 'Customer',
      origin:    document.getElementById('pickup-city')?.value.trim() + ', ' + document.getElementById('pickup-state')?.value.trim(),
      dest:      document.getElementById('recv-city')?.value.trim(),
      service:   (s => s.charAt(0).toUpperCase() + s.slice(1))(document.querySelector('.service-opt.active')?.dataset.val || 'express'),
      weight:    (document.getElementById('pkg-weight')?.value || '1') + ' kg',
      amount:    document.getElementById('sum-total')?.textContent || '₹0.00',
      status:    'pending',
    });

    // Show tracking ID on final step
    const tidEl = document.getElementById('confirmed-tracking-id');
    if (tidEl) tidEl.textContent = newShipment.id;

    const dateEl = document.getElementById('confirmed-date');
    if (dateEl) dateEl.textContent = document.getElementById('pickup-date')?.value || 'TBD';

    nextStep();
    showToast('Shipment booked successfully! 🎉');
    Dashboard.render();
  }

  /* ── INIT ── */
  function init() {
    // Attach live validation to all wizard panels
    document.querySelectorAll('.step-panel').forEach(panel => {
      Validator.attachLiveValidation(panel);
    });
  }

  return { nextStep, prevStep, reset, selectService, confirmOrder, init };
})();

// Convenience aliases for inline onclick
function nextStep()      { BookShipment.nextStep(); }
function prevStep()      { BookShipment.prevStep(); }
function resetWizard()   { BookShipment.reset(); }
function selectService(el){ BookShipment.selectService(el); }
function confirmOrder()  { BookShipment.confirmOrder(); }
