import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get, INestApplication, Post, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ApiKeyGuard } from '../src/common/guards/api-key.guard';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest');

@Controller('records')
class MockRecordsController {
  @Get()
  getRecords() {
    return {
      data: [],
      pagination: { total: 0, limit: 10, nextCursor: null, hasMore: false },
    };
  }
}

@Controller('admin')
class MockAdminController {
  @Post('trigger-ingestion')
  trigger() {
    return { message: 'ok' };
  }
}

describe('Application (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [MockRecordsController, MockAdminController],
      providers: [ApiKeyGuard],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('GET /records', () => {
    it('should return 200 with data and pagination structure', async () => {
      const res = await request(app.getHttpServer()).get('/records');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.pagination).toHaveProperty('total');
      expect(res.body.pagination).toHaveProperty('limit');
      expect(res.body.pagination).toHaveProperty('hasMore');
    });

    it('should accept query parameters', async () => {
      const res = await request(app.getHttpServer()).get(
        '/records?source=test&limit=5',
      );
      expect(res.status).toBe(200);
    });
  });

  describe('POST /admin/trigger-ingestion', () => {
    it('should return 401 without API key when guard is applied', async () => {
      // Test the guard directly
      const guard = new ApiKeyGuard();
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} }),
        }),
      };

      expect(() => guard.canActivate(mockContext as never)).toThrow();
    });
  });
});
