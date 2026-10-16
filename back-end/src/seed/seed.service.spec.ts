jest.mock('uuid', () => ({ v4: () => 'mock-uuid' }));

import { Test, TestingModule } from '@nestjs/testing';
import { SeedService } from './seed.service';
import { DatabaseService } from '../common/database/database.service';
import { UsersRepository } from '../users/users.repository';
import { RolesRepository } from '../roles/roles.repository';
import { AgentsRepository } from '../agents/agents.repository';
import { HubsRepository } from '../hubs/hubs.repository';
import { OrdersRepository } from '../orders/orders.repository';
import { ShipmentsRepository } from '../shipments/shipments.repository';
import { TicketsRepository } from '../tickets/tickets.repository';
import { ComplaintsRepository } from '../complaints/complaints.repository';
import { FeedbackRepository } from '../feedback/feedback.repository';
import { PricingService } from '../pricing/pricing.service';

describe('SeedService Production Safety & Transaction Correctness', () => {
  let seedService: SeedService;
  const originalEnv = { ...process.env };

  beforeEach(async () => {
    process.env = { ...originalEnv };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedService,
        { provide: DatabaseService, useValue: { count: jest.fn(), queryOne: jest.fn(), transaction: jest.fn() } },
        { provide: UsersRepository, useValue: {} },
        { provide: RolesRepository, useValue: {} },
        { provide: AgentsRepository, useValue: {} },
        { provide: HubsRepository, useValue: {} },
        { provide: OrdersRepository, useValue: { create: jest.fn() } },
        { provide: ShipmentsRepository, useValue: {} },
        { provide: TicketsRepository, useValue: {} },
        { provide: ComplaintsRepository, useValue: {} },
        { provide: FeedbackRepository, useValue: {} },
        { provide: PricingService, useValue: { getConfig: jest.fn(), calculateQuote: jest.fn() } },
      ],
    }).compile();

    seedService = module.get<SeedService>(SeedService);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('isDevelopmentOrTestEnvironment() production-seeding safety', () => {
    it('should REJECT seeding when NODE_ENV is production', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SEED_DEV_DATA;
      delete process.env.SWIFTTRACK_DEV_FIXTURES;
      delete process.env.npm_lifecycle_event;

      expect(seedService.isDevelopmentOrTestEnvironment()).toBe(false);
    });

    it('should REJECT seeding when NODE_ENV is staging', () => {
      process.env.NODE_ENV = 'staging';
      delete process.env.SEED_DEV_DATA;
      delete process.env.SWIFTTRACK_DEV_FIXTURES;
      delete process.env.npm_lifecycle_event;

      expect(seedService.isDevelopmentOrTestEnvironment()).toBe(false);
    });

    it('should REJECT seeding when NODE_ENV is missing/empty, even if DB_FILE is swifttrack.db', () => {
      delete process.env.NODE_ENV;
      process.env.DB_FILE = 'back-end/data/swifttrack.db';
      delete process.env.SEED_DEV_DATA;
      delete process.env.SWIFTTRACK_DEV_FIXTURES;
      delete process.env.SWIFTTRACK_ENV;
      delete process.env.npm_lifecycle_event;

      // Crucial test: Filename alone MUST NOT trigger development seeding
      expect(seedService.isDevelopmentOrTestEnvironment()).toBe(false);
    });

    it('should REJECT seeding when DB_FILE contains production regardless of flags', () => {
      process.env.NODE_ENV = 'development';
      process.env.DB_FILE = '/var/data/production-swifttrack.db';

      expect(seedService.isDevelopmentOrTestEnvironment()).toBe(false);
    });

    it('should ALLOW seeding when NODE_ENV is explicitly development', () => {
      process.env.NODE_ENV = 'development';
      process.env.DB_FILE = 'back-end/data/swifttrack.db';
      delete process.env.npm_lifecycle_event;

      expect(seedService.isDevelopmentOrTestEnvironment()).toBe(true);
    });

    it('should ALLOW seeding when NODE_ENV is explicitly test', () => {
      process.env.NODE_ENV = 'test';
      process.env.DB_FILE = 'back-end/data/swifttrack.test.db';

      expect(seedService.isDevelopmentOrTestEnvironment()).toBe(true);
    });

    it('should ALLOW seeding when explicit opt-in SEED_DEV_DATA flag is true', () => {
      delete process.env.NODE_ENV;
      delete process.env.npm_lifecycle_event;
      process.env.SEED_DEV_DATA = 'true';

      expect(seedService.isDevelopmentOrTestEnvironment()).toBe(true);
    });

    it('should ALLOW seeding when explicit opt-in SWIFTTRACK_DEV_FIXTURES flag is true', () => {
      delete process.env.NODE_ENV;
      delete process.env.npm_lifecycle_event;
      process.env.SWIFTTRACK_DEV_FIXTURES = 'true';

      expect(seedService.isDevelopmentOrTestEnvironment()).toBe(true);
    });

    it('should ALLOW seeding when invoked via npm run start:dev lifecycle', () => {
      delete process.env.NODE_ENV;
      delete process.env.SEED_DEV_DATA;
      process.env.npm_lifecycle_event = 'start:dev';

      expect(seedService.isDevelopmentOrTestEnvironment()).toBe(true);
    });
  });

  describe('OrdersRepository.create transactional connection support', () => {
    it('should execute INSERT using transaction conn when conn is supplied', () => {
      const mockConn: any = {
        prepare: jest.fn().mockReturnValue({
          run: jest.fn().mockReturnValue({ changes: 1 }),
        }),
      };
      const mockDb: any = {
        run: jest.fn(),
      };
      const repo = new OrdersRepository(mockDb);

      const orderData: any = {
        orderId: 'ORD-TEST-001',
        trackingId: 'TRK-TEST-001',
        merchantId: 'm1',
        customerId: 'c1',
        deliveryAddress: 'Test Address',
        status: 'Pending',
      };

      const result = repo.create(orderData, mockConn);

      expect(mockConn.prepare).toHaveBeenCalled();
      expect(mockDb.run).not.toHaveBeenCalled();
      expect(result.orderId).toBe('ORD-TEST-001');
    });

    it('should fall back to this.db.run when no conn is supplied', () => {
      const mockDb: any = {
        run: jest.fn().mockReturnValue({ changes: 1 }),
      };
      const repo = new OrdersRepository(mockDb);

      const orderData: any = {
        orderId: 'ORD-TEST-002',
        trackingId: 'TRK-TEST-002',
        merchantId: 'm1',
        customerId: 'c1',
        deliveryAddress: 'Test Address 2',
        status: 'Pending',
      };

      const result = repo.create(orderData);

      expect(mockDb.run).toHaveBeenCalled();
      expect(result.orderId).toBe('ORD-TEST-002');
    });
  });
});
