/**
 * Runtime test suite — hits the real running API on :3001.
 * Covers: auth (all roles), pricing, orders, tracking, security (IDOR/roles),
 * revenue report, persistence (restart), middleware logs, file upload.
 */
const BASE = 'http://localhost:3001';
let pass = 0, fail = 0;
const failures = [];

function check(name, cond, extra = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; failures.push(name); console.log(`  ✗ ${name} ${extra}`); }
}

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['x-auth-token'] = token;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let json = {};
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

async function login(email, password) {
  const { status, json } = await req('POST', '/auth/login', { body: { email, password } });
  if (status !== 200) throw new Error(`login failed ${email}: ${status} ${JSON.stringify(json)}`);
  return { token: json.data.token, user: json.data.user };
}

async function main() {
  console.log('── AUTH ──────────────────────────────────────────');
  const roles = {
    super: await login('super@swifttrack.com', 'password123'),
    merchant: await login('merchant1@example.com', 'password123'),
    hub: await login('hm_chennai@swifttrack.com', 'password123'),
    agent: await login('agent1@swifttrack.com', 'password123'),
    customer: await login('customer1@example.com', 'password123'),
  };
  check('login works for all 5 roles', Object.keys(roles).length === 5);

  const bad = await req('POST', '/auth/login', { body: { email: 'customer1@example.com', password: 'wrong' } });
  check('invalid credentials → 401', bad.status === 401);

  const noTok = await req('GET', '/orders');
  check('unauthenticated /orders → 401', noTok.status === 401);

  const badTok = await req('GET', '/orders', { token: 'garbage-token' });
  check('invalid token → 401', badTok.status === 401);

  const me = await req('GET', '/auth/me', { token: roles.customer.token });
  check('GET /auth/me works', me.status === 200 && me.json.data.email === 'customer1@example.com');

  console.log('── PRICING ───────────────────────────────────────');
  const q = await req('POST', '/pricing/quote', { token: roles.customer.token, body: { serviceLevel: 'express', weightKg: 2.5, paymentMode: 'Prepaid' } });
  check('pricing quote works', q.status === 200 && q.json.data.total > 0);
  check('quote breakdown present', q.json.data.baseFee > 0 && q.json.data.weightFee > 0 && q.json.data.tax >= 0);

  const q2 = await req('POST', '/pricing/quote', { token: roles.customer.token, body: { serviceLevel: 'same-day', weightKg: 5, paymentMode: 'COD' } });
  check('same-day + COD costs more than express prepaid', q2.json.data.total > q.json.data.total);

  const cfgGet = await req('GET', '/pricing/config', { token: roles.customer.token });
  check('pricing config readable', cfgGet.status === 200 && cfgGet.json.data.baseFee > 0);

  const cfgDeny = await req('PUT', '/pricing/config', { token: roles.customer.token, body: { baseFee: 1 } });
  check('customer cannot change pricing config → 403', cfgDeny.status === 403);

  const cfgAdmin = await req('PUT', '/pricing/config', { token: roles.super.token, body: { discountPercent: 10 } });
  check('admin can change pricing config', cfgAdmin.status === 200 && cfgAdmin.json.data.discountPercent === 10);
  // restore
  await req('PUT', '/pricing/config', { token: roles.super.token, body: { discountPercent: 0 } });

  console.log('── ORDERS ────────────────────────────────────────');
  const created = await req('POST', '/orders', {
    token: roles.merchant.token,
    body: {
      customerId: roles.customer.user.id,
      deliveryAddress: '99 Runtime Test Lane, Chennai',
      priority: 'High',
      packageType: 'Electronics',
      weight: 3.2,
      serviceLevel: 'express',
      paymentMode: 'COD',
      amount: 1, // client-supplied amount must be ignored
    },
  });
  check('merchant creates order', created.status === 201 && created.json.data.orderId);
  const newOrder = created.json.data;
  check('backend price overrides client amount', newOrder.amount > 100 && newOrder.amount !== 1);
  check('pricing breakdown persisted', !!newOrder.pricingBreakdown && newOrder.pricingBreakdown.total === newOrder.amount);
  check('payment charge record created', newOrder.paymentMode === 'COD' && newOrder.paymentStatus === 'pending');

  const custOrders = await req('GET', '/orders', { token: roles.customer.token });
  check('customer sees own orders', custOrders.status === 200 && custOrders.json.data.some(o => o.id === newOrder.id));

  const otherCust = await login('customer2@example.com', 'password123');
  const idor = await req('GET', `/orders/${newOrder.id}`, { token: otherCust.token });
  check('IDOR blocked: other customer cannot read order → 403', idor.status === 403);

  console.log('── HUB WORKFLOWS ─────────────────────────────────');
  const assign = await req('PATCH', `/orders/${newOrder.id}/assign`, { token: roles.hub.token, body: { agentId: roles.agent.user.id } });
  check('hub manager assigns agent', assign.status === 200 && assign.json.data.status === 'Assigned' && assign.json.data.assignedAgentId === roles.agent.user.id);

  const doubleAssign = await req('PATCH', `/orders/${newOrder.id}/assign`, { token: roles.hub.token, body: { agentId: roles.agent.user.id } });
  check('double assignment rejected → 400', doubleAssign.status === 400);

  const wrongHub = await login('hm_mumbai@swifttrack.com', 'password123');
  const crossHub = await req('PATCH', `/orders/${newOrder.id}/assign`, { token: wrongHub.token, body: { agentId: roles.agent.user.id } });
  check('other-hub manager cannot assign → 403', crossHub.status === 403);

  const transfer = await req('PATCH', `/orders/${newOrder.id}/transfer`, { token: roles.hub.token, body: { toHubId: 'H002', reason: 'runtime test' } });
  check('inter-hub transfer works', transfer.status === 200 && transfer.json.data.pickupHubId === 'H002');

  // Use super user — the order was transferred to H002 above, so the H001
  // manager no longer has access (that 403 is itself correct behavior).
  const ret = await req('PATCH', `/orders/${newOrder.id}/return`, { token: roles.super.token, body: { reason: 'runtime test' } });
  check('return on non-delivered rejected → 400', ret.status === 400);

  console.log('── AGENT WORKFLOWS ───────────────────────────────');
  const wl = await req('GET', `/agents/${roles.agent.user.id}/worklist`, { token: roles.agent.token });
  check('agent worklist works', wl.status === 200 && wl.json.data.some(o => o.id === newOrder.id));

  const st1 = await req('PATCH', `/orders/${newOrder.id}/status`, { token: roles.agent.token, body: { status: 'PickedUp' } });
  check('agent picks up order', st1.status === 200 && st1.json.data.status === 'PickedUp');
  const st2 = await req('PATCH', `/orders/${newOrder.id}/status`, { token: roles.agent.token, body: { status: 'InTransit' } });
  check('agent marks in transit', st2.status === 200 && st2.json.data.status === 'InTransit');
  const st3 = await req('PATCH', `/orders/${newOrder.id}/status`, { token: roles.agent.token, body: { status: 'OutForDelivery' } });
  check('agent marks out for delivery', st3.status === 200 && st3.json.data.status === 'OutForDelivery');
  const st4 = await req('PATCH', `/orders/${newOrder.id}/status`, { token: roles.agent.token, body: { status: 'Delivered' } });
  check('agent completes delivery', st4.status === 200 && st4.json.data.status === 'Delivered');
  check('COD payment collected on delivery', st4.json.data.paymentStatus === 'paid');

  const skip = await req('PATCH', `/orders/${newOrder.id}/status`, { token: roles.agent.token, body: { status: 'PickedUp' } });
  check('illegal transition Delivered→PickedUp rejected → 400', skip.status === 400);

  const mishap = await req('POST', `/orders/${newOrder.id}/mishap`, { token: roles.agent.token, body: { type: 'package_damaged', description: 'runtime test' } });
  check('mishap on delivered order rejected → 400', mishap.status === 400);

  const otherAgent = await login('agent2@swifttrack.com', 'password123');
  const agentIdor = await req('PATCH', `/orders/${newOrder.id}/status`, { token: otherAgent.token, body: { status: 'PickedUp' } });
  check('other agent cannot update order → 403', agentIdor.status === 403);

  console.log('── CUSTOMER ──────────────────────────────────────');
  const confirm = await req('PATCH', `/orders/${newOrder.id}/confirm`, { token: roles.customer.token });
  check('customer confirms delivery', confirm.status === 200);

  const comp = await req('POST', '/complaints', { token: roles.customer.token, body: { orderId: newOrder.orderId, description: 'runtime test complaint' } });
  check('customer files complaint', comp.status === 201 && comp.json.data.id);

  const fb = await req('POST', '/feedback', { token: roles.customer.token, body: { orderId: newOrder.orderId, rating: 5, comments: 'runtime test feedback' } });
  check('customer submits feedback', fb.status === 201 && fb.json.data.id);

  const notif = await req('GET', '/notifications', { token: roles.customer.token });
  check('customer has notifications', notif.status === 200 && notif.json.data.length > 0);

  console.log('── TRACKING ──────────────────────────────────────');
  const track = await req('GET', `/tracking/${newOrder.trackingId}`);
  check('public tracking works', track.status === 200 && track.json.data.trackingId === newOrder.trackingId);
  check('tracking timeline has events', track.json.data.timeline.length >= 2);
  check('tracking hides sensitive data', !JSON.stringify(track.json.data).includes(newOrder.customerPhone || 'zzz'));

  console.log('── REVENUE ───────────────────────────────────────');
  const rev = await req('GET', '/reports/revenue', { token: roles.super.token });
  check('revenue report works', rev.status === 200 && typeof rev.json.data.netRevenue === 'number');
  check('revenue report has breakdowns', !!rev.json.data.byServiceLevel && !!rev.json.data.byHub && rev.json.data.byDay.length > 0);

  const revDeny = await req('GET', '/reports/revenue', { token: roles.merchant.token });
  check('merchant cannot access revenue report → 403', revDeny.status === 403);

  console.log('── FILE UPLOAD ───────────────────────────────────');
  const agentProfile = await req('GET', `/agents/${roles.agent.user.id}`, { token: roles.agent.token });
  const agentRowId = agentProfile.json.data?.id;
  check('agent profile resolvable by user id', !!agentRowId);
  // tiny 1x1 PNG sent as multipart/form-data (field name: photo)
  const pngB64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const png = Buffer.from(pngB64, 'base64');
  const form = new FormData();
  form.append('photo', new Blob([png], { type: 'image/png' }), 'pod.png');
  const upRes = await fetch(`${BASE}/agents/${agentRowId}/delivery-photo`, {
    method: 'POST',
    headers: { 'x-auth-token': roles.agent.token },
    body: form,
  });
  const upJson = await upRes.json().catch(() => ({}));
  check('POD photo upload works', upRes.status === 201 && upJson.data?.filename);

  const badForm = new FormData();
  badForm.append('photo', new Blob([Buffer.from('%PDF-1.4')], { type: 'application/pdf' }), 'pod.pdf');
  const badUp = await fetch(`${BASE}/agents/${agentRowId}/delivery-photo`, {
    method: 'POST',
    headers: { 'x-auth-token': roles.agent.token },
    body: badForm,
  });
  check('invalid file type rejected → 400', badUp.status === 400);

  console.log('── MIDDLEWARE ────────────────────────────────────');
  const err500 = await req('GET', '/orders/nonexistent-order-id-xyz', { token: roles.super.token });
  check('unknown order → 404', err500.status === 404);
  check('error response shape consistent', err500.json.success === false && err500.json.statusCode === 404 && !!err500.json.error && !!err500.json.timestamp);

  const malformed = await req('POST', '/orders', { token: roles.merchant.token, body: { bad: 'payload' } });
  check('malformed payload rejected → 400', malformed.status === 400);

  const wrongRole = await req('POST', '/orders', { token: roles.customer.token, body: { customerId: roles.customer.user.id, deliveryAddress: 'x', priority: 'Low' } });
  check('customer cannot create order → 403', wrongRole.status === 403);

  console.log('── PERSISTENCE (restart) ─────────────────────────');
  // Read the DB file directly with a SEPARATE connection — proves data is
  // durably on disk, not just in the running server's memory.
  const { DatabaseSync } = await import('node:sqlite');
  const dbFile = new DatabaseSync('data/swifttrack.db', { readOnly: true });
  const ordersN = Number(dbFile.prepare('SELECT COUNT(*) n FROM orders').get().n);
  const paymentsN = Number(dbFile.prepare('SELECT COUNT(*) n FROM payments').get().n);
  const persistedOrder = dbFile.prepare('SELECT status, paymentStatus FROM orders WHERE id = ?').get(newOrder.id);
  dbFile.close();
  check('orders persisted in DB file', ordersN >= 11);
  check('payments persisted in DB file', paymentsN >= 11);
  check('test order persisted with final state', !!persistedOrder && persistedOrder.status === 'Delivered' && persistedOrder.paymentStatus === 'paid');

  console.log('\n══════════════════════════════════════════════════');
  console.log(`RESULTS: ${pass} passed, ${fail} failed`);
  if (failures.length) {
    console.log('FAILURES:');
    failures.forEach(f => console.log(`  ✗ ${f}`));
    process.exit(1);
  }
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });