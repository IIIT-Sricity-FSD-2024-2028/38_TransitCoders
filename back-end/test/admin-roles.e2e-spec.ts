import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import * as fs from 'fs';
import * as path from 'path';

// Use a distinct database file for testing
const TEST_DB = path.join(__dirname, 'test-swifttrack.db');
process.env.DB_FILE = TEST_DB;

import { AppModule } from './../src/app.module';

describe('Role Boundaries (e2e)', () => {
  let app: INestApplication<App>;
  let tokens: Record<string, string> = {};

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Authenticate all needed roles
    const users = [
      { role: 'admin', email: 'admin@swifttrack.com' },
      { role: 'super_user', email: 'super@swifttrack.com' },
      { role: 'hub_manager', email: 'hm_chennai@swifttrack.com' },
      { role: 'merchant', email: 'merchant1@example.com' },
      { role: 'delivery_agent', email: 'agent1@swifttrack.com' },
      { role: 'customer', email: 'customer1@example.com' },
    ];

    for (const u of users) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: u.email, password: 'password123' })
        .expect(200);
      tokens[u.role] = res.body.data.token;
    }
  });

  afterAll(async () => {
    await app.close();
    if (fs.existsSync(TEST_DB)) {
      fs.unlinkSync(TEST_DB);
    }
  });

  describe('ADMIN role', () => {
    it('should be ALLOWED to view, create, update, and delete expenses (finance ownership)', async () => {
      // POST
      const postRes = await request(app.getHttpServer())
        .post('/expenses')
        .set('x-auth-token', tokens['admin'])
        .send({ amount: 100, category: 'Supplies', date: '2026-09-02', description: 'Test' })
        .expect(201);
      
      const id = postRes.body.data?.id || 'E1';

      // PUT
      await request(app.getHttpServer())
        .put(`/expenses/${id}`)
        .set('x-auth-token', tokens['admin'])
        .send({ amount: 150 })
        .expect(200);

      // DELETE
      await request(app.getHttpServer())
        .delete(`/expenses/${id}`)
        .set('x-auth-token', tokens['admin'])
        .expect(200);
    });

    it('should be ALLOWED to update pricing config', async () => {
      await request(app.getHttpServer())
        .put('/pricing/config')
        .set('x-auth-token', tokens['admin'])
        .send({ taxPercentage: 18 })
        .expect(200);
    });

    it('should be BLOCKED from accessing or mutating roles', async () => {
      await request(app.getHttpServer())
        .get('/roles')
        .set('x-auth-token', tokens['admin'])
        .expect(403);
    });

    it('should be BLOCKED from mutating hubs', async () => {
      await request(app.getHttpServer())
        .post('/hubs')
        .set('x-auth-token', tokens['admin'])
        .send({ name: 'Test Hub' })
        .expect(403);
    });

    it('should be BLOCKED from destructive system operations (Orders, Shipments, Tickets deletes)', async () => {
      await request(app.getHttpServer())
        .delete('/orders/O123')
        .set('x-auth-token', tokens['admin'])
        .expect(403);

      await request(app.getHttpServer())
        .delete('/shipments/S123')
        .set('x-auth-token', tokens['admin'])
        .expect(403);

      await request(app.getHttpServer())
        .delete('/tickets/T123')
        .set('x-auth-token', tokens['admin'])
        .expect(403);
    });

    it('should be ALLOWED to view any agent worklist (business oversight bypass)', async () => {
      // Find the agent profile to get their agentId first, since the seed uses agent1@swifttrack.com
      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('x-auth-token', tokens['delivery_agent']);
      const agentUserId = meRes.body.data.id;

      // Assuming we need agentId or userId, the worklist route is /agents/:id/worklist
      // In agents controller: findById matches on agentId. But the seeded agent ID usually isn't the email.
      // We will first list all agents as admin and grab the first one.
      const agentsRes = await request(app.getHttpServer())
        .get('/agents')
        .set('x-auth-token', tokens['admin'])
        .expect(200);
      
      const agentId = agentsRes.body.data[0].id;

      await request(app.getHttpServer())
        .get(`/agents/${agentId}/worklist`)
        .set('x-auth-token', tokens['admin'])
        .expect(200);
    });

    it('should be BLOCKED from updating agent availability', async () => {
      const agentsRes = await request(app.getHttpServer())
        .get('/agents')
        .set('x-auth-token', tokens['admin'])
        .expect(200);
      
      const agentId = agentsRes.body.data[0].id;

      await request(app.getHttpServer())
        .patch(`/agents/${agentId}/availability`)
        .set('x-auth-token', tokens['admin'])
        .send({ status: 'Off-Duty' })
        .expect(403);
    });
  });

  describe('SUPER_USER role', () => {
    it('should be ALLOWED to perform destructive operations', async () => {
      const res = await request(app.getHttpServer())
        .delete('/orders/INVALID')
        .set('x-auth-token', tokens['super_user']);
      expect(res.status).not.toBe(403);
    });

    it('should be ALLOWED to access roles', async () => {
      await request(app.getHttpServer())
        .get('/roles')
        .set('x-auth-token', tokens['super_user'])
        .expect(200);
    });
  });

  describe('Non-Admin/Super roles regression', () => {
    const roles = ['hub_manager', 'merchant', 'delivery_agent', 'customer'];

    it.each(roles)('%s should be BLOCKED from viewing expenses', async (role) => {
      await request(app.getHttpServer())
        .get('/expenses')
        .set('x-auth-token', tokens[role])
        .expect(403);
    });

    it.each(roles)('%s should be BLOCKED from updating pricing config', async (role) => {
      await request(app.getHttpServer())
        .put('/pricing/config')
        .set('x-auth-token', tokens[role])
        .send({ taxPercentage: 18 })
        .expect(403);
    });
  });

  describe('Existing Happy Paths Regression', () => {
    it('HUB_MANAGER can view orders (scope access)', async () => {
      await request(app.getHttpServer())
        .get('/orders')
        .set('x-auth-token', tokens['hub_manager'])
        .expect(200);
    });

    it('MERCHANT can view orders and tickets', async () => {
      await request(app.getHttpServer())
        .get('/orders')
        .set('x-auth-token', tokens['merchant'])
        .expect(200);
      
      await request(app.getHttpServer())
        .get('/tickets')
        .set('x-auth-token', tokens['merchant'])
        .expect(200);
    });

    it('DELIVERY_AGENT can update their own availability and view worklist', async () => {
      const meRes = await request(app.getHttpServer())
        .get('/auth/me')
        .set('x-auth-token', tokens['delivery_agent']);
      const agentUserId = meRes.body.data.id;

      // The patch/get worklist uses the agent's profile ID in the path, but the seed
      // uses random UUIDs for agent profiles. Wait, agent1@swifttrack.com has a profile.
      // We can query the agent profile first using a super_user token, or we can just expect 403 vs 404.
      // Wait, let's just get the agentId by listing it as super_user.
      const agentsRes = await request(app.getHttpServer())
        .get('/agents')
        .set('x-auth-token', tokens['super_user'])
        .expect(200);
      
      const agentId = agentsRes.body.data.find(a => a.userId === agentUserId)?.id || agentsRes.body.data[0].id;

      await request(app.getHttpServer())
        .patch(`/agents/${agentId}/availability`)
        .set('x-auth-token', tokens['delivery_agent'])
        .send({ availabilityStatus: 'Off-Duty' })
        .expect(200);

      await request(app.getHttpServer())
        .get(`/agents/${agentId}/worklist`)
        .set('x-auth-token', tokens['delivery_agent'])
        .expect(200);
    });

    it('CUSTOMER can view their own orders', async () => {
      await request(app.getHttpServer())
        .get('/orders')
        .set('x-auth-token', tokens['customer'])
        .expect(200);
    });
  });
});
