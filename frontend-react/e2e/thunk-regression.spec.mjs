import { expect, test } from '@playwright/test';

// Covers screens whose data flows were rewritten from RTK Query to thunks and that the other
// suites do not exercise: edit/delete mutations, list filters, single notification actions and
// chart rendering. Run it as its own process (`playwright test e2e/thunk-regression.spec.mjs`)
// so the backend's auth throttle window is not shared with the other suites.

const credentials = {
  admin: 'super@swifttrack.com',
  hub: 'hm_chennai@swifttrack.com',
  merchant: 'merchant1@example.com',
  agent: 'agent1@swifttrack.com',
  customer: 'customer2@example.com',
};
const apiUrl = 'http://127.0.0.1:43001';
const stamp = Date.now();

async function signIn(page, role) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(credentials[role]);
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}/dashboard$`));
}

async function apiLogin(request, email) {
  const res = await request.post(`${apiUrl}/auth/login`, { data: { email, password: 'password123' } });
  expect(res.status()).toBe(200);
  return (await res.json()).data;
}

const authHeaders = (auth) => ({ 'x-auth-token': auth.token });

async function createOrder(request, merchantAuth, label) {
  const quote = await request.post(`${apiUrl}/pricing/quote`, {
    headers: authHeaders(merchantAuth),
    data: { serviceLevel: 'express', weightKg: 2, paymentMode: 'Prepaid' },
  });
  const res = await request.post(`${apiUrl}/orders`, {
    headers: authHeaders(merchantAuth),
    data: {
      customerEmail: credentials.customer,
      recipientName: label,
      recipientPhone: '9876543210',
      deliveryAddress: `10 ${label} Ave, Chennai, 600001`,
      pickupAddress: 'Anna Salai Hub, Chennai',
      pickupHubId: 'H001',
      deliveryHubId: 'H001',
      weight: 2,
      serviceLevel: 'express',
      paymentMode: 'Prepaid',
      packageType: 'Box',
      priority: 'Medium',
      quotedTotal: (await quote.json()).data.total,
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).data;
}

async function deliver(request, order, hubAuth, agentAuth) {
  await request.patch(`${apiUrl}/orders/${order.trackingId}/warehouse`, {
    headers: authHeaders(hubAuth),
    data: { action: 'check-in', autoAssign: false },
  });
  await request.patch(`${apiUrl}/orders/${order.id}/assign`, {
    headers: authHeaders(hubAuth),
    data: { agentId: agentAuth.user.id },
  });
  await request.patch(`${apiUrl}/orders/${order.trackingId}/warehouse`, {
    headers: authHeaders(hubAuth),
    data: { action: 'check-out' },
  });
  for (const status of ['PickedUp', 'InTransit', 'OutForDelivery']) {
    const res = await request.patch(`${apiUrl}/orders/${order.id}/status`, {
      headers: authHeaders(agentAuth),
      data: { status },
    });
    expect(res.status()).toBe(200);
  }
  const res = await request.patch(`${apiUrl}/orders/${order.id}/delivery`, { headers: authHeaders(agentAuth) });
  expect(res.status()).toBe(200);
}

function trackErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  return errors;
}

test('notifications: single Mark read lowers the unread count and View shipment opens the order', async ({ page, request }) => {
  const errors = trackErrors(page);
  const merchant = await apiLogin(request, credentials.merchant);
  const hub = await apiLogin(request, credentials.hub);
  const agent = await apiLogin(request, credentials.agent);
  const order = await createOrder(request, merchant, `Notify${stamp}`);
  await deliver(request, order, hub, agent);

  await signIn(page, 'customer');
  const bell = page.getByRole('button', { name: 'Notifications', exact: true });
  const badge = bell.locator('span');
  await expect(badge).toBeVisible();
  const before = Number((await badge.innerText()).replace('+', ''));

  await bell.click();
  const feed = page.getByRole('region', { name: 'Notification feed' });
  await expect(feed.getByRole('button', { name: 'Mark read' }).first()).toBeVisible();
  const unreadBefore = await feed.getByRole('button', { name: 'Mark read' }).count();

  await feed.getByRole('button', { name: 'Mark read' }).first().click();
  await expect(feed.getByRole('button', { name: 'Mark read' })).toHaveCount(unreadBefore - 1);
  if (before > 1) await expect(badge).toHaveText(String(before - 1));

  await feed.getByRole('link', { name: 'View shipment' }).first().click();
  await expect(page).toHaveURL(/\/customer\/tracking\?id=/);
  expect(errors).toEqual([]);
});

test('customer orders: search box and status tabs filter the list', async ({ page, request }) => {
  const errors = trackErrors(page);
  const merchant = await apiLogin(request, credentials.merchant);
  const hub = await apiLogin(request, credentials.hub);
  const agent = await apiLogin(request, credentials.agent);
  const delivered = await createOrder(request, merchant, `Done${stamp}`);
  await deliver(request, delivered, hub, agent);
  const pending = await createOrder(request, merchant, `Wait${stamp}`);

  await signIn(page, 'customer');
  await page.goto('/customer/orders');
  await expect(page.getByText(delivered.trackingId).first()).toBeVisible();
  await expect(page.getByText(pending.trackingId).first()).toBeVisible();

  await page.getByRole('button', { name: 'DELIVERED', exact: true }).click();
  await expect(page.getByText(delivered.trackingId).first()).toBeVisible();
  await expect(page.getByText(pending.trackingId)).toHaveCount(0);

  await page.getByRole('button', { name: 'PENDING', exact: true }).click();
  await expect(page.getByText(pending.trackingId).first()).toBeVisible();
  await expect(page.getByText(delivered.trackingId)).toHaveCount(0);

  await page.getByRole('button', { name: 'ALL', exact: true }).click();
  await page.getByPlaceholder('Search tracking ID, address, or package...').fill(pending.trackingId);
  await expect(page.getByText(pending.trackingId).first()).toBeVisible();
  await expect(page.getByText(delivered.trackingId)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('merchant: orders filters, label modal from the table, and analytics timeframe', async ({ page, request }) => {
  const errors = trackErrors(page);
  const merchant = await apiLogin(request, credentials.merchant);
  const order = await createOrder(request, merchant, `Merch${stamp}`);

  await signIn(page, 'merchant');
  await page.goto('/merchant/orders');
  const search = page.getByPlaceholder('Search by ID, name, city...');
  await search.fill(order.trackingId);
  await expect(page.getByText(order.trackingId).first()).toBeVisible();

  await page.getByRole('button', { name: 'DELIVERED', exact: true }).click();
  await expect(page.getByText('No shipments found matching your filters.')).toBeVisible();
  await page.getByRole('button', { name: 'ALL', exact: true }).click();
  await expect(page.getByText(order.trackingId).first()).toBeVisible();

  await page.getByRole('button', { name: /Label/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('dialog').locator('img, svg').first()).toBeVisible();
  await page.keyboard.press('Escape');

  await page.goto('/merchant/analytics');
  const timeframe = page.locator('select');
  for (const option of ['Last 30 Days', 'Last 90 Days', 'This Year', 'All Time']) {
    await timeframe.selectOption(option);
    await expect(timeframe).toHaveValue(option);
  }
  expect(errors).toEqual([]);
});

test('agent history: period filter and delivery record download', async ({ page, request }) => {
  const errors = trackErrors(page);
  const merchant = await apiLogin(request, credentials.merchant);
  const hub = await apiLogin(request, credentials.hub);
  const agent = await apiLogin(request, credentials.agent);
  const order = await createOrder(request, merchant, `Hist${stamp}`);
  await deliver(request, order, hub, agent);

  await signIn(page, 'agent');
  await page.goto('/agent/history');
  await expect(page.getByText(order.orderId ?? order.id).first()).toBeVisible();

  const period = page.getByLabel('Delivery period');
  await period.selectOption('today');
  await expect(page.getByText(order.orderId ?? order.id).first()).toBeVisible();
  await period.selectOption('week');
  await expect(page.getByText(order.orderId ?? order.id).first()).toBeVisible();

  await page.getByRole('row', { name: new RegExp(order.orderId ?? order.id) }).getByRole('button', { name: 'View details' }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download delivery record' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/-delivery\.txt$/);
  expect(errors).toEqual([]);
});

test('admin: edit and delete a user, edit and delete a delivery zone', async ({ page, request }) => {
  const errors = trackErrors(page);
  const admin = await apiLogin(request, credentials.admin);
  const userName = `Temp User ${stamp}`;
  const userRes = await request.post(`${apiUrl}/users`, {
    headers: authHeaders(admin),
    data: { name: userName, email: `temp${stamp}@example.com`, password: 'password123', role: 'customer' },
  });
  expect(userRes.status()).toBe(201);
  const hubName = `Zone ${stamp}`;
  const hubRes = await request.post(`${apiUrl}/hubs`, {
    headers: authHeaders(admin),
    data: {
      hubId: `HZ${String(stamp).slice(-6)}`,
      name: hubName,
      address: '1 Test Road',
      city: 'Madurai',
      state: 'Tamil Nadu',
      pincode: '625001',
      capacity: 50,
    },
  });
  expect(hubRes.status()).toBe(201);

  await signIn(page, 'admin');
  await page.goto('/admin/users');
  const userRow = page.getByRole('row', { name: new RegExp(userName) });
  await expect(userRow).toBeVisible();
  await userRow.getByTitle('Edit User').click();
  const newName = `Renamed ${stamp}`;
  await page.getByRole('dialog', { name: 'Edit User' }).getByLabel('Full Name').fill(newName);
  await page.getByRole('button', { name: 'Update User' }).click();
  await expect(page.getByRole('row', { name: new RegExp(newName) })).toBeVisible();
  await expect(page.getByRole('row', { name: new RegExp(userName) })).toHaveCount(0);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('row', { name: new RegExp(newName) }).getByTitle('Delete User').click();
  await expect(page.getByRole('row', { name: new RegExp(newName) })).toHaveCount(0);

  await page.goto('/admin/system-configuration');
  // Zones are cards, not table rows: find the card that holds this zone's name and its buttons.
  const zoneCard = (name) =>
    page.getByText(name, { exact: true }).locator('xpath=ancestor::div[.//button[@title="Edit Zone"]][1]');
  await expect(zoneCard(hubName)).toBeVisible();
  await zoneCard(hubName).getByRole('button', { name: 'Edit Zone' }).click();
  const zoneDialog = page.getByRole('dialog', { name: 'Edit Delivery Zone' });
  const renamedZone = `Zone Renamed ${stamp}`;
  await zoneDialog.locator('input[name="name"]').fill(renamedZone);
  await page.getByRole('button', { name: 'Update Zone' }).click();
  await expect(zoneCard(renamedZone)).toBeVisible();
  await expect(page.getByText(hubName, { exact: true })).toHaveCount(0);

  page.once('dialog', (dialog) => dialog.accept());
  await zoneCard(renamedZone).getByRole('button', { name: 'Delete Zone' }).click();
  await expect(page.getByText(renamedZone, { exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('admin: deleting an expense removes it and charts render on both report pages', async ({ page, request }) => {
  const errors = trackErrors(page);
  const admin = await apiLogin(request, credentials.admin);
  const description = `Expense ${stamp}`;
  const res = await request.post(`${apiUrl}/expenses`, {
    headers: authHeaders(admin),
    data: { description, amount: 123, category: 'Maintenance', date: '2026-01-15' },
  });
  expect(res.status()).toBe(201);

  await signIn(page, 'admin');
  await page.goto('/admin/financials');
  await page.getByRole('button', { name: 'Expense Ledger' }).click();
  const row = page.getByRole('row', { name: new RegExp(description) });
  await expect(row).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await row.getByRole('button', { name: 'Delete' }).click();
  await expect(page.getByRole('row', { name: new RegExp(description) })).toHaveCount(0);

  await page.goto('/admin/reports');
  await expect(page.locator('.recharts-surface').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('hub: Edit Order saves changes and hub reports render charts', async ({ page, request }) => {
  const errors = trackErrors(page);
  const merchant = await apiLogin(request, credentials.merchant);
  const order = await createOrder(request, merchant, `Edit${stamp}`);

  await signIn(page, 'hub');
  await page.goto(`/hub/queue?id=${encodeURIComponent(order.id)}`);
  await page.getByRole('button', { name: 'View', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Edit Order' }).click();
  const address = `99 Edited Street ${stamp}, Chennai, 600002`;
  await dialog.getByLabel('Destination Address').fill(address);
  await dialog.getByRole('button', { name: 'Save Changes' }).click();
  await expect(dialog.getByText(address)).toBeVisible();

  await page.goto('/hub/reports');
  await expect(page.locator('.recharts-surface').first()).toBeVisible();
  expect(errors).toEqual([]);

  // Done last: a second API login for the same user replaces the browser's session.
  const freshHub = await apiLogin(request, credentials.hub);
  const check = await request.get(`${apiUrl}/orders/${order.id}`, { headers: authHeaders(freshHub) });
  expect((await check.json()).data.deliveryAddress).toBe(address);
});
