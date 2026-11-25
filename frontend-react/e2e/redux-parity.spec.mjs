import { expect, test } from '@playwright/test';

const credentials = {
  admin: 'super@swifttrack.com',
  hub: 'hm_chennai@swifttrack.com',
  merchant: 'merchant1@example.com',
  agent: 'agent1@swifttrack.com',
  customer: 'customer2@example.com',
};

const apiUrl = 'http://127.0.0.1:43001';

async function signIn(page, role, email = credentials[role]) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}/dashboard$`));
  await expect(page.locator('main')).toBeVisible();
}

async function apiLogin(request, email) {
  const res = await request.post(`${apiUrl}/auth/login`, {
    data: { email, password: 'password123' },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  return body.data;
}

async function createAndDeliverOrderViaApi(request) {
  const merchantAuth = await apiLogin(request, credentials.merchant);
  const hubAuth = await apiLogin(request, credentials.hub);
  const agentAuth = await apiLogin(request, credentials.agent);

  const quoteRes = await request.post(`${apiUrl}/pricing/quote`, {
    headers: { 'x-auth-token': merchantAuth.token },
    data: { serviceLevel: 'express', weightKg: 2, paymentMode: 'Prepaid' },
  });
  expect(quoteRes.status()).toBe(200);
  const quoteTotal = (await quoteRes.json()).data.total;

  const createRes = await request.post(`${apiUrl}/orders`, {
    headers: { 'x-auth-token': merchantAuth.token },
    data: {
      customerEmail: credentials.customer,
      recipientName: 'Parity Customer',
      recipientPhone: '9876543210',
      deliveryAddress: '10 Parity Ave, Chennai, 600001',
      pickupAddress: 'Anna Salai Hub, Chennai',
      pickupHubId: 'H001',
      deliveryHubId: 'H001',
      weight: 2,
      serviceLevel: 'express',
      paymentMode: 'Prepaid',
      packageType: 'Box',
      priority: 'Medium',
      quotedTotal: quoteTotal,
    },
  });
  expect(createRes.status()).toBe(201);
  const order = (await createRes.json()).data;

  await request.patch(`${apiUrl}/orders/${order.trackingId}/warehouse`, {
    headers: { 'x-auth-token': hubAuth.token },
    data: { action: 'check-in', autoAssign: false },
  });
  await request.patch(`${apiUrl}/orders/${order.id}/assign`, {
    headers: { 'x-auth-token': hubAuth.token },
    data: { agentId: agentAuth.user.id },
  });
  await request.patch(`${apiUrl}/orders/${order.trackingId}/warehouse`, {
    headers: { 'x-auth-token': hubAuth.token },
    data: { action: 'check-out' },
  });
  for (const status of ['PickedUp', 'InTransit', 'OutForDelivery']) {
    const patchRes = await request.patch(`${apiUrl}/orders/${order.id}/status`, {
      headers: { 'x-auth-token': agentAuth.token },
      data: { status },
    });
    expect(patchRes.status()).toBe(200);
  }
  const delRes = await request.patch(`${apiUrl}/orders/${order.id}/delivery`, {
    headers: { 'x-auth-token': agentAuth.token },
  });
  expect(delRes.status()).toBe(200);
  return { order, merchantAuth, hubAuth, agentAuth };
}

test('REM-02: clicking Notifications bell on fresh load and re-opening throws zero errors', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await signIn(page, 'admin');

  await page.getByRole('button', { name: 'Notifications', exact: true }).click();
  const feed = page.getByRole('region', { name: 'Notification feed' });
  await expect(feed).toBeVisible();
  await expect(feed.getByText(/Loading notifications…/)).toBeHidden();

  await page.keyboard.press('Escape');
  await expect(feed).toBeHidden();

  let notificationsRequests = 0;
  page.on('request', (req) => {
    if (req.url().includes('/notifications') && !req.url().includes('unread-count')) {
      notificationsRequests += 1;
    }
  });
  await page.getByRole('button', { name: 'Notifications', exact: true }).click();
  await expect(feed).toBeVisible();
  await expect.poll(() => notificationsRequests).toBeGreaterThanOrEqual(1);

  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

for (const role of Object.keys(credentials)) {
  test(`${role}: login, reload persistence, 401 token reset without loop, and logout`, async ({ page }) => {
    const pageErrors = [];
    const unexpectedResponses = [];
    let allowUnauthorized = false;

    page.on('pageerror', (err) => pageErrors.push(err.message));
    page.on('response', (res) => {
      if (res.url().includes(':43001') && res.status() >= 400) {
        if (allowUnauthorized && res.status() === 401 && res.url().includes('/auth/me')) return;
        unexpectedResponses.push(`${res.status()} ${res.url()}`);
      }
    });

    await signIn(page, role);

    // Reload persists authenticated session
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/${role}/dashboard$`));
    await expect(page.locator('main')).toBeVisible();

    // Invalid token triggers clean 401 -> /login redirect with no retry loop
    let authMeCount = 0;
    page.on('request', (req) => {
      if (allowUnauthorized && req.url().includes('/auth/me')) authMeCount += 1;
    });
    allowUnauthorized = true;
    await page.evaluate(() => localStorage.setItem('x-auth-token', 'invalid-expired-token'));
    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
    await page.waitForTimeout(800);
    expect(authMeCount).toBe(1);
    const tokenAfter401 = await page.evaluate(() => localStorage.getItem('x-auth-token'));
    expect(tokenAfter401).toBeNull();
    allowUnauthorized = false;

    // Sign back in cleanly and verify Sign Out clears storage
    await signIn(page, role);
    await page.getByRole('button', { name: 'Account menu' }).click();
    await page.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page).toHaveURL(/\/$/);
    expect(await page.evaluate(() => localStorage.getItem('x-auth-token'))).toBeNull();
    expect(await page.evaluate(() => localStorage.getItem('user'))).toBeNull();

    expect(pageErrors).toEqual([]);
    expect(unexpectedResponses).toEqual([]);
  });
}

test('cross-tab logout logs out sibling tab via storage event', async ({ context }) => {
  const page1 = await context.newPage();
  const page2 = await context.newPage();
  try {
    await signIn(page1, 'customer');
    await page2.goto('/customer/orders');
    await expect(page2).toHaveURL(/\/customer\/orders$/);

    await page1.getByRole('button', { name: 'Account menu' }).click();
    await page1.getByRole('button', { name: 'Sign Out' }).click();
    await expect(page1).toHaveURL(/\/$/);
    await expect(page2).toHaveURL(/\/login$/);
  } finally {
    await page1.close();
    await page2.close();
  }
});

test('BLK-04: /hub redirects to /hub/dashboard, keeps Sidebar/Topbar mounted, updates titles per subpath', async ({ page }) => {
  await signIn(page, 'hub');
  await page.goto('/hub');
  await expect(page).toHaveURL(/\/hub\/dashboard$/);
  await expect(page.locator('header.topbar .topbar-title')).toHaveText('Hub Operations Dashboard');

  await page.evaluate(() => {
    window.__topbarEl = document.querySelector('header.topbar');
    window.__asideEl = document.querySelector('aside');
  });

  const navTargets = [
    ['Order Queue', 'Order Queue', /\/hub\/queue$/],
    ['Warehouse', 'Warehouse', /\/hub\/warehouse$/],
    ['Dispatch', 'Dispatch & Assignment', /\/hub\/dispatch$/],
    ['Hub Transfer', 'Hub Transfer', /\/hub\/transfer$/],
    ['Complaints', 'Hub Complaints', /\/hub\/complaints$/],
    ['Reports', 'Hub Reports', /\/hub\/reports$/],
  ];

  for (const [linkName, expectedTitle, expectedUrl] of navTargets) {
    await page.getByRole('link', { name: linkName, exact: true }).click();
    await expect(page).toHaveURL(expectedUrl);
    await expect(page.locator('header.topbar .topbar-title')).toHaveText(expectedTitle);
    const sameNodes = await page.evaluate(() => ({
      topbarSame: document.querySelector('header.topbar') === window.__topbarEl,
      asideSame: document.querySelector('aside') === window.__asideEl,
    }));
    expect(sameNodes, `Remounted layout when visiting ${linkName}`).toEqual({ topbarSame: true, asideSame: true });
  }
});

test('BookShipment rapid weight changes produce zero stale AbortError alerts', async ({ page }) => {
  await signIn(page, 'merchant');
  await page.getByRole('link', { name: 'Book Shipment' }).first().click();

  const weightInput = page.getByLabel('Package weight (kg)');
  for (const val of ['1', '1.5', '2.8', '4.2', '2']) {
    await weightInput.fill(val);
    await page.waitForTimeout(25);
  }

  await expect(page.locator('dl')).toContainText('2 kg');
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('Customer ?id= drawer, Confirm Receipt SPA invalidation, and external OrderDetailsModal refresh', async ({ browser, page, request }) => {
  const { order } = await createAndDeliverOrderViaApi(request);

  // Also test OrderDetailsModal seeing external transition via SPA nav + mount refetch
  const hubPage = await (await browser.newContext()).newPage();
  try {
    await signIn(hubPage, 'hub');
    await hubPage.getByRole('link', { name: 'Order Queue' }).click();
    await hubPage.getByPlaceholder(/Search by Order ID/).fill(order.trackingId);
    await hubPage.locator('.order-card').getByRole('button', { name: 'View', exact: true }).click();
    const details = hubPage.getByRole('dialog', { name: 'Order Details' });
    await expect(details).toContainText('Delivered');
    await expect(details.getByRole('button', { name: 'Authorize Return' })).toBeVisible();
  } finally {
    await hubPage.context().close();
  }

  // Customer ?id= drawer
  await signIn(page, 'customer');
  await page.goto(`/customer/orders?id=${encodeURIComponent(order.trackingId)}`);
  const drawerHeading = page.getByRole('heading', { name: order.trackingId });
  await expect(drawerHeading).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(drawerHeading).toBeHidden();

  // Confirm Receipt via SPA navigation updates Orders and Dashboard without reload
  await page.getByRole('link', { name: 'Live Tracking', exact: true }).click();
  await page.getByLabel('Tracking or order ID').fill(order.trackingId);
  await page.getByRole('button', { name: 'Track Package' }).click();
  await expect(page.getByRole('button', { name: 'Confirm Receipt' })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm Receipt' }).click();
  await expect(page.getByText('Receipt confirmed.')).toBeVisible();

  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page).toHaveURL(/\/customer\/dashboard$/);
  await expect(page.getByText('DELIVERED', { exact: true })).toBeVisible();
  const supportCardText = await page.locator('p', { hasText: 'SUPPORT TICKETS' }).locator('..').innerText();
  const supportBefore = Number(supportCardText.replace(/[^0-9]/g, '')) || 0;

  // Support ticket invalidation updates Dashboard SUPPORT TICKETS KPI without reload
  await page.getByRole('link', { name: 'Help & Support', exact: true }).click();
  await page.getByPlaceholder('e.g. TRK-UV34WX56').fill(order.trackingId);
  await page.getByPlaceholder(/Please describe what happened/).fill('Parity cache invalidation ticket');
  await page.getByRole('button', { name: 'Submit Support Ticket' }).click();
  await expect(page.getByText('Complaint submitted successfully.')).toBeVisible();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect.poll(async () => {
    const afterCard = await page.locator('p', { hasText: 'SUPPORT TICKETS' }).locator('..').innerText();
    return Number(afterCard.replace(/[^0-9]/g, ''));
  }).toBe(supportBefore + 1);
});

test('Admin Expense mutation invalidates Analytics Overview Revenue without reload', async ({ page }) => {
  await signIn(page, 'admin');
  await page.getByRole('link', { name: 'Financial Analytics' }).click();
  await expect(page.getByText('Operating Expenses')).toBeVisible();
  const opExpCard = page.locator('div', { has: page.getByText('Operating Expenses', { exact: true }) }).last();
  const beforeText = await page.locator('p', { hasText: 'Operating Expenses' }).locator('..').innerText();
  const beforeVal = Number(beforeText.replace(/[^0-9.]/g, '')) || 0;
  void opExpCard;

  await page.getByRole('button', { name: 'Expense Ledger' }).click();
  await page.getByRole('button', { name: '+ Add Expense' }).click();
  await page.getByLabel('Expense date').fill('2026-11-25');
  await page.getByPlaceholder('Description').fill('Parity test expense');
  await page.getByPlaceholder('Amount (₹)').fill('1234');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Parity test expense')).toBeVisible();

  await page.getByRole('button', { name: 'Analytics Overview' }).click();
  await expect.poll(async () => {
    const afterText = await page.locator('p', { hasText: 'Operating Expenses' }).locator('..').innerText();
    return Number(afterText.replace(/[^0-9.]/g, ''));
  }).toBeCloseTo(beforeVal + 1234, 1);
});

test('Polling: OrderMessages 5s polls only while open; Topbar 30s polls without runaway loops and stops on logout', async ({ page, request }) => {
  test.setTimeout(90_000);
  const { order } = await createAndDeliverOrderViaApi(request);

  await signIn(page, 'customer');
  await page.goto(`/customer/tracking?id=${order.trackingId}`);

  let messagePolls = 0;
  let unreadPolls = 0;
  let orderFetches = 0;
  let track = false;

  page.on('request', (req) => {
    if (!track) return;
    if (req.url().includes(`/orders/${order.id}/messages/`)) messagePolls += 1;
    if (req.url().includes('/notifications/unread-count')) unreadPolls += 1;
    if (req.url().endsWith('/orders')) orderFetches += 1;
  });

  track = true;
  await page.getByRole('button', { name: 'Message delivery agent' }).click();
  await expect.poll(() => messagePolls, { timeout: 10_000 }).toBeGreaterThanOrEqual(2);

  // Close thread -> polling must stop
  await page.getByRole('button', { name: 'Message delivery agent' }).click();
  const countOnClose = messagePolls;
  await page.waitForTimeout(6500);
  expect(messagePolls).toBe(countOnClose);

  // Idle on dashboard for ~32s -> expect 1 Topbar 30s poll (or 2 max with timing skew) and 0 runaway order fetches
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  const unreadBeforeIdle = unreadPolls;
  await page.waitForTimeout(1000); // wait past initial mount /orders
  const ordersAfterMount = orderFetches;
  await page.waitForTimeout(32_000);
  expect(unreadPolls - unreadBeforeIdle).toBeGreaterThanOrEqual(1);
  expect(unreadPolls - unreadBeforeIdle).toBeLessThanOrEqual(2);
  expect(orderFetches).toBe(ordersAfterMount);

  // Logout stops polling
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/$/);
  const unreadAfterLogout = unreadPolls;
  await page.waitForTimeout(2000);
  expect(unreadPolls).toBe(unreadAfterLogout);
});
