import { expect, test } from '@playwright/test';

const credentials = {
  admin: 'super@swifttrack.com',
  hub: 'hm_chennai@swifttrack.com',
  merchant: 'merchant1@example.com',
  agent: 'agent1@swifttrack.com',
  customer: 'customer2@example.com',
};

const apiUrl = 'http://127.0.0.1:43001';

async function authorized(page) {
  return { 'x-auth-token': await page.evaluate(() => localStorage.getItem('x-auth-token')) };
}

async function scan(page, reference, action, autoAssign = false) {
  await page.goto('/hub/warehouse');
  await page.getByLabel('Scan action').selectOption(action);
  if (action === 'check-in') await page.getByLabel('Auto-assign at the destination hub').setChecked(autoAssign);
  const field = page.getByLabel('Tracking barcode or order ID');
  await field.fill(reference);
  await field.press('Enter');
  await expect(page.getByRole('status')).toContainText(action === 'check-in' ? 'Checked in' : 'Checked out');
}

async function sendMessage(thread, body) {
  await thread.getByLabel('Message', { exact: true }).fill(body);
  await thread.getByRole('button', { name: 'Send message' }).click();
  await expect(thread.getByText(body, { exact: true })).toBeVisible();
}

async function signIn(page, role, email = credentials[role]) {
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/${role}/dashboard$`));
  await expect(page.locator('main')).toBeVisible();
}

const routes = {
  admin: ['dashboard', 'users', 'system-configuration', 'complaints', 'feedback', 'tickets', 'reports', 'financials'],
  hub: ['dashboard', 'queue', 'warehouse', 'dispatch', 'transfer', 'complaints', 'reports'],
  merchant: ['dashboard', 'book', 'orders', 'track', 'analytics', 'support'],
  agent: ['dashboard', 'worklist', 'history', 'report-issue', 'profile'],
  customer: ['dashboard', 'orders', 'tracking', 'support'],
};

for (const [role, views] of Object.entries(routes)) {
  test(`${role} can open every portal page`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      if (response.url().includes(':43001') && response.status() >= 400) {
        errors.push(`${response.status()} ${response.url()}`);
      }
    });
    await signIn(page, role);
    for (const view of views) {
      await test.step(view, async () => {
        await page.goto(`/${role}/${view}`);
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('main')).not.toBeEmpty();
        await page.waitForLoadState('networkidle');
        await expect(page.getByRole('alert')).toHaveCount(0);
      });
    }
    expect(errors).toEqual([]);
  });
}

test('protects role pages, preserves deep links, and signs out', async ({ page }) => {
  await page.goto('/customer/support?orderId=TRK-CD12EF34');
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('Email', { exact: true }).fill(credentials.customer);
  await page.getByLabel('Password', { exact: true }).fill('incorrect');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page.getByText('Invalid email or password')).toBeVisible();
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Sign In', exact: true }).click();
  await expect(page).toHaveURL(/\/customer\/support\?orderId=TRK-CD12EF34$/);
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/customer\/dashboard$/);
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.goto('/customer/dashboard');
  await expect(page).toHaveURL(/\/login$/);
});

test('books, assigns, delivers with proof, and tracks a real shipment', async ({ browser }) => {
  test.setTimeout(120_000);
  const newPage = () => browser.newPage({ baseURL: test.info().project.use.baseURL });
  const merchant = await newPage();
  const hub = await newPage();
  const agent = await newPage();
  const customer = await newPage();
  try {
    await signIn(merchant, 'merchant');
    await merchant.getByRole('link', { name: 'Book Shipment' }).first().click();
    await merchant.getByLabel('Recipient name').fill('E2E Recipient');
    await merchant.getByLabel('Recipient phone').fill('9876543210');
    await merchant.getByLabel('Customer account email').fill(credentials.customer);
    await merchant.getByLabel('Delivery address').fill('12 E2E Ledger Street');
    await merchant.getByLabel('PIN code').fill('600001');
    await merchant.getByLabel('Pickup hub').selectOption('H001');
    await merchant.getByLabel('Destination hub').selectOption('H001');
    await merchant.getByLabel('Service level').selectOption('same-day');
    const quote = merchant.waitForResponse(response =>
      response.url().endsWith('/pricing/quote') && response.request().postDataJSON().paymentMode === 'COD'
    );
    await merchant.getByLabel('Payment method').selectOption('COD');
    const submit = merchant.getByRole('button', { name: 'Book Shipment', exact: true });
    await expect(submit).toBeEnabled();
    const quoteTotal = await quote.then(response => response.json()).then(body => body.data.total);
    await merchant.getByLabel('Customer account email').fill('missing-customer@example.com');
    await submit.click();
    await expect(merchant.getByRole('alert')).toContainText('No active customer account');
    await expect(submit).toBeEnabled();
    await merchant.getByLabel('Customer account email').fill(credentials.customer);
    const created = merchant.waitForResponse(response => response.url().endsWith('/orders') && response.request().method() === 'POST');
    await submit.click();
    const createResponse = await created;
    expect(createResponse.status(), await createResponse.text()).toBe(201);
    const { data: order } = await createResponse.json();
    expect(order).toMatchObject({ status: 'Pending', customerName: 'E2E Recipient', amount: quoteTotal, paymentMode: 'COD' });
    const barcode = merchant.getByRole('dialog', { name: 'Shipping label' }).getByRole('img', { name: `Barcode for ${order.trackingId}` });
    await expect(barcode).toBeVisible();
    await expect.poll(() => barcode.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
    const label = merchant.getByRole('dialog', { name: 'Shipping label' });
    await expect(label).toHaveJSProperty('open', true);
    await expect(merchant.locator('main header')).toHaveCSS('position', 'static');
    await label.getByRole('button', { name: 'Print Label' }).click({ trial: true });
    await merchant.emulateMedia({ media: 'print' });
    await expect(merchant.locator('.shipping-label')).toHaveCSS('visibility', 'visible');
    await expect(merchant.getByRole('navigation', { includeHidden: true }).first()).toHaveCSS('visibility', 'hidden');
    await merchant.emulateMedia({ media: 'screen' });
    await merchant.setViewportSize({ width: 390, height: 650 });
    await expect(label.getByRole('button', { name: 'Close', exact: true })).toBeVisible();
    await label.getByRole('button', { name: 'Close', exact: true }).click({ trial: true });
    await merchant.keyboard.press('Escape');
    await expect(label).toBeHidden();
    await merchant.setViewportSize({ width: 1280, height: 720 });

    await signIn(hub, 'hub');
    const hubHeaders = await authorized(hub);
    const inventoryCounts = async () => {
      const response = await hub.request.get(`${apiUrl}/hubs/H001`, { headers: hubHeaders });
      expect(response.status()).toBe(200);
      return (await response.json()).data;
    };
    const beforeCheckIn = await inventoryCounts();
    await scan(hub, order.trackingId, 'check-in');
    const stored = hub.getByRole('row').filter({ hasText: order.trackingId });
    await expect(stored).toContainText('Checked in');
    const duplicate = await hub.request.patch(`${apiUrl}/orders/${order.trackingId}/warehouse`, {
      headers: hubHeaders, data: { action: 'check-in' },
    });
    expect(duplicate.status()).toBe(200);
    const { data: duplicateOrder } = await duplicate.json();
    expect(duplicateOrder.statusHistory.filter(event => event.note === 'Warehouse check-in')).toHaveLength(1);
    expect(await inventoryCounts()).toMatchObject({
      currentLoad: beforeCheckIn.currentLoad + 1,
      reservedParcels: beforeCheckIn.reservedParcels - 1,
      remainingCapacity: beforeCheckIn.remainingCapacity,
    });
    await hub.getByRole('link', { name: 'Order Queue' }).click();
    await hub.getByPlaceholder(/Search by Order ID/).fill(order.trackingId);
    await hub.locator('.order-card').getByRole('button', { name: 'View', exact: true }).click();
    await hub.getByRole('dialog', { name: 'Order Details' }).getByRole('button', { name: 'Assign Agent' }).click();
    const agentSelect = hub.getByRole('combobox', { name: 'Delivery agent' });
    const agentOne = agentSelect.getByRole('option', { name: /^Agent One \(/ });
    await agentSelect.selectOption(await agentOne.getAttribute('value'));
    await hub.getByRole('button', { name: 'Assign', exact: true }).click();
    await expect(hub.locator('.order-card')).toContainText('Assigned');

    await signIn(agent, 'agent');
    await agent.getByRole('link', { name: 'My Deliveries' }).click();
    await agent.getByLabel('Search or scan a shipment').fill(order.trackingId);
    const card = agent.locator('main .group').filter({ has: agent.getByRole('heading', { name: order.orderId, exact: true }) });
    await expect(card.getByRole('button', { name: 'Accept Delivery' })).toBeDisabled();
    const beforeHandoff = await agent.request.patch(`${apiUrl}/orders/${order.id}/status`, {
      headers: await authorized(agent), data: { status: 'PickedUp' },
    });
    expect(beforeHandoff.status()).toBe(400);

    await hub.locator('.order-card').getByRole('button', { name: 'View', exact: true }).click();
    await hub.getByRole('button', { name: 'Message delivery agent' }).click();
    const hubThread = hub.getByRole('region', { name: 'Message delivery agent' });
    await sendMessage(hubThread, 'Collect this parcel from the outbound desk.');
    await card.getByRole('button', { name: 'Message hub' }).click();
    const agentHubThread = card.getByRole('region', { name: 'Message hub', exact: true });
    await expect(agentHubThread).toContainText('Collect this parcel from the outbound desk.');
    await sendMessage(agentHubThread, 'I am at the outbound desk.');
    await expect(hubThread).toContainText('I am at the outbound desk.', { timeout: 10_000 });

    await signIn(customer, 'customer');
    await customer.goto(`/customer/tracking?id=${order.trackingId}`);
    await customer.getByRole('button', { name: 'Message delivery agent' }).click();
    const customerThread = customer.getByRole('region', { name: 'Message delivery agent' });
    await sendMessage(customerThread, 'Please ring the bell on arrival.');
    await card.getByRole('button', { name: 'Message customer' }).click();
    const agentCustomerThread = card.getByRole('region', { name: 'Message customer' });
    await expect(agentCustomerThread).toContainText('Please ring the bell on arrival.');
    await sendMessage(agentCustomerThread, 'I will ring the bell.');
    await expect(customerThread).toContainText('I will ring the bell.', { timeout: 10_000 });
    await expect(customerThread).not.toContainText('I am at the outbound desk.');
    const unauthorizedThread = await customer.request.get(`${apiUrl}/orders/${order.id}/messages/hub`, { headers: await authorized(customer) });
    expect(unauthorizedThread.status()).toBe(403);

    await scan(hub, order.trackingId, 'check-out');
    expect(await inventoryCounts()).toMatchObject({
      currentLoad: beforeCheckIn.currentLoad, remainingCapacity: beforeCheckIn.remainingCapacity + 1,
    });
    await agent.getByRole('button', { name: 'Refresh worklist' }).click();
    await card.getByRole('button', { name: 'Accept Delivery' }).click();
    await agent.getByRole('button', { name: 'Accept & Mark Picked Up' }).click();
    await card.getByRole('button', { name: 'Mark In Transit' }).click();
    await card.getByRole('button', { name: 'Mark Out for Delivery' }).click();
    await card.getByRole('button', { name: 'Complete Delivery' }).click();
    const delivery = agent.getByRole('dialog', { name: 'Confirm delivery' });
    await delivery.getByLabel('Proof of delivery photo (optional)').setInputFiles({
      name: 'delivery.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aI1sAAAAASUVORK5CYII=', 'base64'),
    });
    const delivered = agent.waitForResponse(response => response.url().endsWith(`/orders/${order.id}/delivery`));
    await delivery.getByRole('button', { name: 'Confirm delivery' }).click();
    const deliveredResponse = await delivered;
    expect(deliveredResponse.status(), await deliveredResponse.text()).toBe(200);
    const { data: updated } = await deliveredResponse.json();
    expect(updated).toMatchObject({ status: 'Delivered', paymentStatus: 'paid' });
    expect(updated.statusHistory.at(-1).deliveryPhoto).toMatch(/^pod-.+\.png$/);
    await agent.reload();
    await expect(card.getByRole('button', { name: 'Delivered' })).toBeVisible();
    await agent.getByRole('link', { name: 'Delivery History', exact: true }).click();
    await agent.getByLabel('Search deliveries').fill(order.orderId);
    const history = agent.getByRole('row').filter({ hasText: order.orderId });
    await history.getByRole('button', { name: 'View details' }).click();
    await expect(agent.getByRole('dialog', { name: 'Delivery details' })).toContainText('Proof of delivery photo recorded');
    await agent.getByRole('button', { name: 'Close', exact: true }).click();
    const csv = agent.waitForEvent('download');
    await agent.getByRole('button', { name: 'Export CSV' }).click();
    expect((await csv).suggestedFilename()).toBe('swifttrack-delivery-history.csv');

    await customer.goto(`/customer/tracking?id=${order.trackingId}`);
    await expect(customer.getByRole('heading', { name: order.trackingId })).toBeVisible();
    await expect(customer.getByText('Delivered', { exact: true }).first()).toBeVisible();
    await customer.getByRole('button', { name: 'Confirm Receipt' }).click();
    await expect(customer.getByText('Receipt confirmed.')).toBeVisible();
    await customer.reload();
    await expect(customer.getByText('Receipt confirmed.')).toBeVisible();
    await customer.getByRole('button', { name: 'Notifications', exact: true }).click();
    const notifications = customer.getByRole('region', { name: 'Notification feed' });
    await expect(notifications).toContainText(order.orderId);
    await notifications.getByRole('button', { name: 'Mark all as read' }).click();
    await expect(notifications.getByRole('button', { name: 'Mark read', exact: true })).toHaveCount(0);

    await customer.getByRole('link', { name: 'Raise a Complaint' }).click();
    await customer.getByPlaceholder('e.g. TRK-UV34WX56').fill('TRK-NOT-MINE');
    await customer.getByPlaceholder(/Please describe what happened/).fill('E2E complaint about the packaging');
    await customer.getByRole('button', { name: 'Submit Support Ticket' }).click();
    await expect(customer.getByRole('alert')).toContainText('one of your shipments');
    await customer.getByPlaceholder('e.g. TRK-UV34WX56').fill(order.trackingId);
    await customer.getByRole('button', { name: 'Submit Support Ticket' }).click();
    await expect(customer.getByText('Complaint submitted successfully.')).toBeVisible();
    await customer.getByRole('button', { name: 'Service Feedback' }).click();
    await customer.getByPlaceholder('e.g. TRK-XK29BL7M').fill(order.trackingId);
    await customer.getByRole('button', { name: '4 Stars' }).click();
    await customer.getByPlaceholder(/Tell us what you liked/).fill('E2E feedback on the delivery');
    await customer.getByRole('button', { name: 'Submit Service Feedback' }).click();
    await expect(customer.getByText('Thank you for your feedback!', { exact: false })).toBeVisible();

    await hub.getByRole('link', { name: 'Complaints', exact: true }).click();
    const complaint = hub.getByRole('row').filter({ hasText: 'E2E complaint about the packaging' });
    await complaint.getByRole('button', { name: 'Complaint options' }).click();
    await complaint.getByRole('button', { name: 'Mark Resolved' }).click();
    await expect(complaint.getByText('Resolved', { exact: true })).toBeVisible();
    await customer.reload();
    await expect(customer.getByText('Resolved', { exact: true }).first()).toBeVisible();

    const admin = await newPage();
    await signIn(admin, 'admin');
    await admin.getByRole('link', { name: 'Feedback Review' }).click();
    const feedback = admin.getByRole('row').filter({ hasText: 'E2E feedback on the delivery' });
    await feedback.getByRole('button', { name: 'Mark Reviewed' }).click();
    await expect(feedback.getByText('Reviewed', { exact: true })).toBeVisible();
    await admin.close();

    await merchant.goto(`/merchant/track?id=${order.trackingId}`);
    await expect(merchant.getByText('DELIVERED', { exact: true })).toBeVisible();

    const publicPage = await newPage();
    await publicPage.goto('/');
    await publicPage.getByPlaceholder(/Enter tracking ID/).fill(order.trackingId.toLowerCase());
    await publicPage.getByRole('button', { name: 'Track Order' }).click();
    await expect(publicPage.locator('#tracking-result')).toContainText(order.trackingId);
    await publicPage.close();

    await hub.getByRole('link', { name: 'Order Queue' }).click();
    await hub.getByPlaceholder(/Search by Order ID/).fill(order.trackingId);
    await hub.locator('.order-card').getByRole('button', { name: 'View', exact: true }).click();
    const details = hub.getByRole('dialog', { name: 'Order Details' });
    await details.getByRole('button', { name: 'Authorize Return' }).click();
    await details.getByLabel('Return reason').fill('E2E customer return');
    await details.getByRole('button', { name: 'Confirm Return' }).click();
    await expect(details).toContainText('Returned');
    await expect(details).toContainText('refunded');
    await merchant.reload();
    await expect(merchant.getByText('RETURNED', { exact: true })).toBeVisible();
  } finally {
    await Promise.all([merchant, hub, agent, customer].map(page => page.close()));
  }
});

test('registers a new customer and shows real empty states', async ({ page }) => {
  const email = `new-customer-${Date.now()}@example.com`;
  await page.goto('/login');
  await page.getByRole('link', { name: 'Create an account' }).click();
  await page.getByLabel('Name', { exact: true }).fill('New SwiftTrack Customer');
  await page.getByLabel('Email', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Create account', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Your account is ready.');
  await signIn(page, 'customer', email);
  await expect(page.getByText('No active shipments right now.')).toBeVisible();
  await page.getByRole('link', { name: 'My Orders' }).click();
  await expect(page.getByText('No matching orders found')).toBeVisible();
  await page.getByRole('link', { name: 'Help & Support' }).click();
  await expect(page.getByText('No past complaints on record.')).toBeVisible();
});

test('merchant tickets persist and failed submissions can be retried', async ({ page }) => {
  await signIn(page, 'merchant', 'merchant2@example.com');
  await page.getByRole('link', { name: 'Support Center' }).click();
  await page.getByRole('button', { name: 'New Ticket' }).click();
  const dialog = page.getByRole('dialog', { name: 'Create support ticket' });
  await dialog.getByLabel('Subject').fill('E2E billing question');
  await dialog.getByLabel('Category').selectOption('Billing');
  await dialog.getByLabel('Description').fill('Please review the invoice totals.');
  await page.route('**/tickets', async route => {
    if (route.request().method() !== 'POST') return route.continue();
    await route.fulfill({ status: 503, json: { error: 'Ticket service temporarily unavailable' } });
  });
  await dialog.getByRole('button', { name: 'Submit Ticket' }).click();
  await expect(dialog.getByRole('alert')).toContainText('temporarily unavailable');
  await expect(dialog.getByLabel('Description')).toHaveValue('Please review the invoice totals.');
  await page.unroute('**/tickets');
  await dialog.getByRole('button', { name: 'Submit Ticket' }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  const row = page.getByRole('row').filter({ hasText: 'E2E billing question' });
  await expect(row).toContainText('Billing');
  await expect(row).toContainText('Please review the invoice totals.');
  await signIn(page, 'admin');
  await page.getByRole('link', { name: 'Merchant Tickets' }).click();
  await page.getByLabel('Search merchant tickets').fill('E2E billing question');
  const status = page.getByLabel('Status for E2E billing question');
  await status.selectOption('resolved');
  await expect(status).toHaveValue('resolved');
  await signIn(page, 'merchant', 'merchant2@example.com');
  await page.getByRole('link', { name: 'Support Center' }).click();
  await expect(row).toContainText('RESOLVED');
});

test('agent availability and profile changes survive reload', async ({ page }) => {
  await signIn(page, 'agent', 'agent2@swifttrack.com');
  await page.getByRole('link', { name: 'Profile', exact: true }).click();
  await page.getByRole('button', { name: 'Edit Profile' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit Profile' });
  await dialog.getByLabel('Name', { exact: true }).fill('Agent Two Updated');
  await dialog.getByLabel('Phone', { exact: true }).fill('9876500123');
  await dialog.getByRole('button', { name: 'Save Profile' }).click();
  await expect(dialog).toBeHidden();
  const availability = page.locator('main').getByTitle('Click to toggle availability status');
  await availability.click();
  await page.locator('main').getByRole('button', { name: /Offline/ }).click();
  await expect(availability).toHaveText('Offline');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Agent Two Updated' })).toBeVisible();
  await expect(page.getByText('9876500123', { exact: true })).toBeVisible();
  await expect(availability).toHaveText('Offline');
  await availability.click();
  await page.locator('main').getByRole('button', { name: /Available Ready/ }).click();
  await expect(availability).toHaveText('Available');
});

test('admin creates and approves a delivery agent and manages pricing and expenses', async ({ page, browser }) => {
  const email = `e2e-agent-${Date.now()}@example.com`;
  await signIn(page, 'admin');
  await page.getByRole('link', { name: 'User Management' }).click();
  await page.getByRole('button', { name: 'Add New User' }).click();
  const user = page.getByRole('dialog', { name: 'Add New User' });
  await user.getByLabel('Full Name').fill('E2E Delivery Agent');
  await user.getByLabel('Email Address').fill(email);
  await user.getByPlaceholder('Enter password').fill('password123');
  await user.getByLabel('Role', { exact: true }).selectOption('delivery_agent');
  await user.getByLabel('Assigned hub').selectOption('H001');
  await user.getByRole('button', { name: 'Save User' }).click();
  const row = page.getByRole('row').filter({ hasText: email });
  await expect(row).toContainText('Pending Approval');
  await row.getByRole('button', { name: 'Approve User' }).click();
  await expect(row).toContainText('Active');
  const agent = await browser.newPage({ baseURL: test.info().project.use.baseURL });
  await signIn(agent, 'agent', email);
  await agent.getByRole('link', { name: 'Profile', exact: true }).click();
  await expect(agent.getByRole('heading', { name: 'E2E Delivery Agent' })).toBeVisible();
  await expect(agent.getByText('Chennai Central Hub', { exact: true })).toBeVisible();
  await agent.close();

  await page.getByRole('link', { name: 'System Configuration' }).click();
  await page.getByRole('button', { name: 'Add new Zone' }).click();
  const zone = page.getByRole('dialog', { name: 'Add Delivery Zone' });
  for (const [name, value] of Object.entries({
    hubId: 'H-E2E', name: 'E2E Dispatch Zone', city: 'Chennai', state: 'Tamil Nadu',
    pincode: '600001', address: '88 E2E Hub Street',
  })) {
    await zone.locator(`input[name="${name}"]`).fill(value);
  }
  await zone.getByRole('button', { name: /Save|Create/ }).click();
  const zoneName = page.getByText('E2E Dispatch Zone', { exact: true });
  await expect(zoneName).toBeVisible();
  await zoneName.locator('../..').getByRole('button', { name: 'Edit Zone' }).click();
  const editZone = page.getByRole('dialog', { name: 'Edit Delivery Zone' });
  await editZone.locator('input[name="name"]').fill('E2E Dispatch Zone Updated');
  await editZone.getByRole('button', { name: /Save|Update/ }).click();
  const updatedZone = page.getByText('E2E Dispatch Zone Updated', { exact: true });
  await expect(updatedZone).toBeVisible();
  page.once('dialog', dialog => dialog.accept());
  await updatedZone.locator('../..').getByRole('button', { name: 'Delete Zone' }).click();
  await expect(updatedZone).toHaveCount(0);

  await page.getByRole('button', { name: 'Pricing', exact: true }).click();
  const fee = page.getByLabel('Base fee', { exact: true });
  await expect(fee).not.toHaveValue('');
  const original = await fee.inputValue();
  await fee.fill('51.25');
  await page.getByRole('button', { name: 'Save Pricing' }).click();
  await expect(page.getByText('Pricing saved.')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Pricing', exact: true }).click();
  await expect(fee).toHaveValue('51.25');
  await fee.fill(original);
  await page.getByRole('button', { name: 'Save Pricing' }).click();
  await expect(page.getByText('Pricing saved.')).toBeVisible();

  await page.getByRole('link', { name: 'Financial Analytics' }).click();
  await page.getByRole('button', { name: 'Expense Ledger' }).click();
  await page.getByRole('button', { name: 'Add Expense' }).click();
  const expense = page.getByRole('dialog', { name: 'Add Expense' });
  await expense.getByLabel('Expense date').fill('2026-11-20');
  await expense.getByPlaceholder('Description').fill('E2E fractional expense');
  await expense.getByPlaceholder('Amount (₹)').fill('14.25');
  await expense.getByRole('button', { name: 'Save', exact: true }).click();
  const expenseRow = page.getByRole('row').filter({ hasText: 'E2E fractional expense' });
  await expect(expenseRow).toContainText('₹14.25');
  page.once('dialog', dialog => dialog.accept());
  await expenseRow.getByRole('button', { name: 'Delete' }).click();
  await expect(expenseRow).toHaveCount(0);
});

test('mobile sidebar opens menus and can sign out', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'hub');
  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  await page.getByRole('link', { name: 'Order Queue' }).click();
  await expect(page).toHaveURL(/\/hub\/queue$/);
  await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
  await page.getByRole('button', { name: 'Expand sidebar' }).click();
  await page.getByRole('link', { name: 'Warehouse' }).click();
  await expect(page.getByLabel('Tracking barcode or order ID')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record scan' })).toBeDisabled();
  await page.getByRole('button', { name: 'Account menu' }).click();
  await page.getByRole('button', { name: 'Sign Out' }).click();
  await expect(page).toHaveURL(/\/$/);
});

async function fillShipment(page, paymentMode, recipient, pickupHub = 'H001', deliveryHub = 'H002') {
  await page.goto('/merchant/book');
  await page.getByLabel('Recipient name').fill(recipient);
  await page.getByLabel('Recipient phone').fill('9876543210');
  await page.getByLabel('Customer account email').fill(credentials.customer);
  await page.getByLabel('Delivery address').fill('42 Test Workflow Road');
  await page.getByLabel('PIN code').fill('600001');
  await page.getByLabel('Pickup hub').selectOption(pickupHub);
  await page.getByLabel('Destination hub').selectOption(deliveryHub);
  await page.getByLabel('Payment method').selectOption(paymentMode);
}

async function bookForChennai(page, paymentMode, recipient) {
  await fillShipment(page, paymentMode, recipient);
  const created = page.waitForResponse(response => response.url().endsWith('/orders') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Book Shipment', exact: true }).click();
  const response = await created;
  expect(response.status(), await response.text()).toBe(201);
  const { data: order } = await response.json();
  await page.getByRole('button', { name: 'Close shipping label' }).click();
  return order;
}

test('guides a hub transfer, auto-assigns on destination check-in, and records an agent mishap', async ({ browser }) => {
  const newPage = () => browser.newPage({ baseURL: test.info().project.use.baseURL });
  const merchant = await newPage();
  const origin = await newPage();
  const destination = await newPage();
  const agent = await newPage();
  try {
    await signIn(merchant, 'merchant');
    const order = await bookForChennai(merchant, 'Prepaid', 'Transfer Recipient');
    await signIn(origin, 'hub');
    await signIn(destination, 'hub', 'hm_mumbai@swifttrack.com');
    const earlyScan = await destination.request.patch(`${apiUrl}/orders/${order.trackingId}/warehouse`, {
      headers: await authorized(destination), data: { action: 'check-in' },
    });
    expect(earlyScan.status()).toBe(403);
    await scan(origin, order.trackingId, 'check-in', true);
    await expect(origin.getByRole('status')).toContainText('Check out before transferring to H002');
    await origin.getByRole('link', { name: 'Open order in queue' }).click();
    await origin.locator('.order-card').getByRole('button', { name: 'View', exact: true }).click();
    const details = origin.getByRole('dialog', { name: 'Order Details' });
    await expect(details).toContainText('Check this parcel out, then transfer it to H002');
    await details.getByRole('link', { name: 'Open warehouse check-out' }).click();
    await expect(origin.getByLabel('Scan action')).toHaveValue('check-out');
    await expect(origin.getByLabel('Tracking barcode or order ID')).toHaveValue(order.trackingId);
    await origin.getByRole('button', { name: 'Record scan' }).click();
    await expect(origin.getByRole('status')).toContainText('Ready to transfer to H002');
    await origin.getByRole('link', { name: 'Open order in queue' }).click();
    const originCard = origin.locator('.order-card').filter({ hasText: order.orderId });
    await originCard.getByRole('button', { name: 'Transfer Hub' }).click();
    const transfer = origin.getByRole('dialog', { name: 'Transfer Order' });
    await transfer.getByLabel('Destination Hub').selectOption('H002');
    await transfer.getByLabel('Transfer reason (optional)').fill('Move to delivery hub');
    await transfer.getByRole('button', { name: 'Transfer', exact: true }).click();
    await expect(originCard).toHaveCount(0);

    const assigned = destination.waitForResponse(response => response.url().endsWith(`/orders/${order.trackingId}/warehouse`) && response.ok());
    await scan(destination, order.trackingId, 'check-in', true);
    const assignResponse = await assigned;
    expect(assignResponse.status(), await assignResponse.text()).toBe(200);
    await expect(destination.getByRole('status')).toContainText('Delivery agent assigned');

    const { data: updated } = await assignResponse.json();
    expect(updated).toMatchObject({ status: 'Assigned', pickupHubId: 'H002' });
    await scan(destination, order.trackingId, 'check-out');
    const expectedUser = await destination.evaluate(() => localStorage.getItem('x-auth-token'));
    const agentList = await destination.request.get('http://127.0.0.1:43001/users', { headers: { 'x-auth-token': expectedUser } });
    expect(agentList.ok()).toBeTruthy();
    const { data: users } = await agentList.json();
    const assignedUser = users.find(user => user.id === updated.assignedAgentId);
    await signIn(agent, 'agent', assignedUser.email);
    await agent.getByRole('link', { name: 'Report Issue', exact: true }).click();
    await agent.getByLabel('Affected order').selectOption(order.id);
    await agent.getByLabel('Issue type').selectOption('package_damaged');
    await agent.getByLabel('Description', { exact: true }).fill('Parcel arrived with a damaged seal');
    await agent.getByRole('button', { name: 'Submit Issue Report' }).click();
    await expect(agent.getByText(`Issue reported for ${order.orderId}.`)).toBeVisible();
    await agent.reload();
    await expect(agent.getByText('Parcel arrived with a damaged seal', { exact: true })).toBeVisible();
    await destination.getByRole('link', { name: 'Complaints', exact: true }).click();
    await expect(destination.getByRole('row').filter({ hasText: order.trackingId })).toContainText('Parcel arrived with a damaged seal');
  } finally {
    await Promise.all([merchant, origin, destination, agent].map(page => page.close()));
  }
});

test('cancels a pending cash-on-delivery shipment without creating a refund', async ({ page }) => {
  await signIn(page, 'merchant');
  const order = await bookForChennai(page, 'COD', 'Cancelled Recipient');
  await page.getByRole('link', { name: 'My Orders', exact: true }).click();
  await page.getByPlaceholder(/Search by ID/).fill(order.trackingId);
  const row = page.getByRole('row').filter({ hasText: order.trackingId });
  const cancellation = page.waitForResponse(response => response.url().endsWith(`/orders/${order.id}/cancel`));
  await row.getByRole('button', { name: 'Cancel', exact: true }).click();
  const response = await cancellation;
  expect(response.status(), await response.text()).toBe(200);
  const { data } = await response.json();
  expect(data.order).toMatchObject({ status: 'Cancelled', paymentStatus: 'cancelled' });
  expect(data.refund).toBeUndefined();
  await expect(row.getByText('CANCELLED', { exact: true })).toBeVisible();
  await page.reload();
  await expect(row.getByText('CANCELLED', { exact: true })).toBeVisible();
});

async function createTestHub(request, headers, hubId, capacity) {
  const result = await request.post(`${apiUrl}/hubs`, {
    headers, data: {
      hubId, name: `Test Warehouse ${hubId}`, address: '21 Warehouse Lane',
      city: 'Chennai', state: 'Tamil Nadu', pincode: '600002', capacity,
    },
  });
  expect(result.status(), await result.text()).toBe(201);
}

test('enforces hub capacity and requires the merchant to review a changed quote', async ({ browser }) => {
  const newPage = () => browser.newPage({ baseURL: test.info().project.use.baseURL });
  const [admin, merchant] = await Promise.all([newPage(), newPage()]);
  let originalBaseFee;
  let adminHeaders;
  try {
    await signIn(admin, 'admin');
    adminHeaders = await authorized(admin);
    await createTestHub(admin.request, adminHeaders, 'H-PRICE', 1);
    const config = await admin.request.get(`${apiUrl}/pricing/config`, { headers: adminHeaders });
    originalBaseFee = (await config.json()).data.baseFee;

    await signIn(merchant, 'merchant');
    await fillShipment(merchant, 'Prepaid', 'Capacity Test', 'H-PRICE', 'H-PRICE');
    await merchant.getByLabel('Package weight (kg)').fill('2.1');
    const submit = merchant.getByRole('button', { name: 'Book Shipment', exact: true });
    await expect(submit).toBeEnabled();
    await expect(merchant.getByText(/^2\.5 kg ×/)).toBeVisible();
    const change = await admin.request.put(`${apiUrl}/pricing/config`, {
      headers: adminHeaders, data: { baseFee: originalBaseFee + 11 },
    });
    expect(change.status()).toBe(200);

    await submit.click();
    await expect(merchant.getByRole('alert')).toContainText('Shipping rates changed');
    await expect(submit).toBeEnabled();
    const booked = merchant.waitForResponse(response => response.url().endsWith('/orders') && response.request().method() === 'POST');
    await submit.click();
    const response = await booked;
    expect(response.status(), await response.text()).toBe(201);
    const { data: order } = await response.json();
    expect(order.amount).toBe(response.request().postDataJSON().quotedTotal);
    expect(order.pricingBreakdown).toMatchObject({ weightKg: 2.1, billableWeightKg: 2.5, baseFee: originalBaseFee + 11 });
    await merchant.getByRole('button', { name: 'Close shipping label' }).click();
    await merchant.getByRole('button', { name: 'Book another shipment' }).click();
    await expect(merchant.getByLabel('Destination hub').getByRole('option', { name: /H-PRICE/ })).toBeDisabled();
    await expect(submit).toBeDisabled();

    const merchantHeaders = await authorized(merchant);
    const payload = {
      customerEmail: credentials.customer, deliveryAddress: '21 Capacity Test Lane', priority: 'Medium',
      weight: 2.1, pickupHubId: 'H001', deliveryHubId: 'H-PRICE',
    };
    const full = await merchant.request.post(`${apiUrl}/orders`, { headers: merchantHeaders, data: payload });
    expect(full.status()).toBe(409);
    expect((await full.json()).error).toContain('H-PRICE has no warehouse slots left');
    const cancelled = await merchant.request.patch(`${apiUrl}/orders/${order.id}/cancel`, { headers: merchantHeaders });
    expect(cancelled.status()).toBe(200);
    const bookings = await Promise.all([0, 1].map(() =>
      merchant.request.post(`${apiUrl}/orders`, { headers: merchantHeaders, data: payload }),
    ));
    expect(bookings.map(item => item.status()).sort()).toEqual([201, 409]);
  } finally {
    if (originalBaseFee !== undefined) {
      await admin.request.put(`${apiUrl}/pricing/config`, {
        headers: adminHeaders, data: { baseFee: originalBaseFee },
      });
    }
    await Promise.all([admin, merchant].map(page => page.close()));
  }
});

test('blocks manual overbooking and auto-assigns another agent when the first fills up', async ({ browser }) => {
  const newPage = () => browser.newPage({ baseURL: test.info().project.use.baseURL });
  const [admin, merchant, hub] = await Promise.all([newPage(), newPage(), newPage()]);
  try {
    await signIn(admin, 'admin');
    const adminHeaders = await authorized(admin);
    const hubId = 'H-DISPATCH';
    await createTestHub(admin.request, adminHeaders, hubId, 20);
    async function provision(role, name, email) {
      const response = await admin.request.post(`${apiUrl}/users`, {
        headers: adminHeaders, data: { name, email, role, hubId, password: 'password123' },
      });
      expect(response.status(), await response.text()).toBe(201);
      const { data: user } = await response.json();
      const approval = await admin.request.patch(`${apiUrl}/users/${user.id}/approve`, { headers: adminHeaders });
      expect(approval.status()).toBe(200);
      return user;
    }
    const manager = await provision('hub_manager', 'Dispatch Manager', 'dispatch-manager@example.com');
    const first = await provision('delivery_agent', 'Dispatch Agent One', 'dispatch-one@example.com');
    const second = await provision('delivery_agent', 'Dispatch Agent Two', 'dispatch-two@example.com');
    const third = await provision('delivery_agent', 'Dispatch Agent Three', 'dispatch-three@example.com');
    await signIn(hub, 'hub', manager.email);
    await signIn(merchant, 'merchant');
    const hubHeaders = await authorized(hub);
    const merchantHeaders = await authorized(merchant);
    const assign = (order, agentId) => hub.request.patch(`${apiUrl}/orders/${order.id}/assign`, {
      headers: hubHeaders, data: { agentId },
    });
    const orders = [];
    for (let count = 0; count < 10; count++) {
      const booked = await merchant.request.post(`${apiUrl}/orders`, {
        headers: merchantHeaders,
        data: { customerEmail: credentials.customer, deliveryAddress: '21 Dispatch Lane', priority: 'Medium', pickupHubId: hubId, weight: 1 },
      });
      expect(booked.status(), await booked.text()).toBe(201);
      const { data: order } = await booked.json();
      const checkIn = await hub.request.patch(`${apiUrl}/orders/${order.id}/warehouse`, { headers: hubHeaders, data: { action: 'check-in' } });
      expect(checkIn.status(), await checkIn.text()).toBe(200);
      orders.push(order);
    }
    for (const order of orders.slice(0, 7)) expect((await assign(order, first.id)).status()).toBe(200);

    const contenders = orders.slice(7, 9);
    const lastSlot = await Promise.all(contenders.map(order => assign(order, first.id)));
    expect(lastSlot.map(result => result.status()).sort()).toEqual([200, 409]);
    const remaining = contenders[lastSlot.findIndex(result => result.status() === 409)];
    const pending = orders.at(-1);

    await hub.goto(`/hub/queue?id=${remaining.trackingId}`);
    await hub.getByRole('button', { name: 'Assign Agent' }).click();
    const select = hub.getByRole('combobox', { name: 'Delivery agent' });
    await expect(select.getByRole('option', { name: 'Dispatch Agent One (8/8 active)' })).toBeDisabled();
    await select.selectOption(second.id);
    await hub.getByRole('button', { name: 'Assign', exact: true }).click();
    await expect(hub.locator('.order-card')).toContainText('Assigned');

    await hub.goto(`/hub/queue?id=${pending.trackingId}`);
    await hub.getByRole('button', { name: 'Assign Agent' }).click();
    const auto = hub.waitForResponse(response => response.url().endsWith(`/orders/${pending.id}/auto-assign`));
    await hub.getByRole('button', { name: 'Auto-assign' }).click();
    const autoResponse = await auto;
    expect(autoResponse.status(), await autoResponse.text()).toBe(200);
    expect((await autoResponse.json()).data.assignedAgentId).toBe(third.id);
    const cancellation = await merchant.request.patch(`${apiUrl}/orders/${orders[0].id}/cancel`, { headers: merchantHeaders });
    expect(cancellation.status()).toBe(200);
    const profile = await hub.request.get(`${apiUrl}/agents/${first.id}`, { headers: hubHeaders });
    expect((await profile.json()).data.currentTasksCount).toBe(7);
    await hub.goto('/hub/warehouse');
    await expect(hub.getByRole('row').filter({ hasText: orders[0].trackingId })).toContainText('Cancelled');
    await scan(hub, orders[0].trackingId, 'check-out');
    await expect(hub.getByRole('row').filter({ hasText: orders[0].trackingId })).toHaveCount(0);

    const setAvailability = (agent, availabilityStatus) => hub.request.patch(`${apiUrl}/agents/${agent.id}/availability`, {
      headers: hubHeaders, data: { availabilityStatus },
    });
    for (const agent of [first, second, third]) expect((await setAvailability(agent, 'Busy')).status()).toBe(200);
    const retryBooking = await merchant.request.post(`${apiUrl}/orders`, {
      headers: merchantHeaders,
      data: { customerEmail: credentials.customer, deliveryAddress: '22 Dispatch Lane', priority: 'Medium', pickupHubId: hubId, weight: 1 },
    });
    expect(retryBooking.status()).toBe(201);
    const { data: retryOrder } = await retryBooking.json();
    await scan(hub, retryOrder.trackingId, 'check-in', true);
    await expect(hub.getByRole('status')).toContainText('No eligible agent was assigned');
    expect((await setAvailability(third, 'Available')).status()).toBe(200);
    await scan(hub, retryOrder.trackingId, 'check-in', true);
    await expect(hub.getByRole('status')).toContainText('Delivery agent assigned');
    const retryDetails = await hub.request.get(`${apiUrl}/orders/${retryOrder.id}`, { headers: hubHeaders });
    const { data: retried } = await retryDetails.json();
    expect(retried.assignedAgentId).toBe(third.id);
    expect(retried.statusHistory.filter(event => event.note === 'Warehouse check-in')).toHaveLength(1);
  } finally {
    await Promise.all([admin, merchant, hub].map(page => page.close()));
  }
});
