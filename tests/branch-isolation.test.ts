
import { Express } from 'express';
import request from 'supertest';
import { startServer } from '../server.ts';

describe('Branch Isolation and Jurisdiction Strategy', () => {
  let app: Express;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = await startServer();
  });

  describe('GET /api/properties', () => {
    it('should return only properties assigned to user-02 (Branch Manager) in br-ca-01', async () => {
      const res = await request(app)
        .get('/api/properties')
        .set('x-user-id', 'user-02')
        .set('x-branch-id', 'br-ca-01');

      expect(res.status).toBe(200);
      expect(res.body.every((p: { branchId: string }) => p.branchId === 'br-ca-01')).toBe(true);
    });

    it('should fail (403) when user-02 attempts to access br-on-01', async () => {
      const res = await request(app)
        .get('/api/properties')
        .set('x-user-id', 'user-02')
        .set('x-branch-id', 'br-on-01');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    it('should allow user-01 (Org Admin) to access any branch (br-on-01)', async () => {
      const res = await request(app)
        .get('/api/properties')
        .set('x-user-id', 'user-01')
        .set('x-branch-id', 'br-on-01');

      expect(res.status).toBe(200);
      expect(res.body.some((p: { branchId: string }) => p.branchId === 'br-on-01')).toBe(true);
    });
  });

  describe('Jurisdiction Strategy', () => {
    it('should load California config when x-branch-id is br-ca-01', async () => {
      const res = await request(app)
        .get('/api/jurisdiction-config')
        .set('x-user-id', 'user-01')
        .set('x-branch-id', 'br-ca-01');

      expect(res.status).toBe(200);
      expect(res.body.taxRate).toBe(0.08); // California rate
      expect(res.body.mandatoryInspection).toBe(true);
    });

    it('should load Ontario config when x-branch-id is br-on-01', async () => {
      const res = await request(app)
        .get('/api/jurisdiction-config')
        .set('x-user-id', 'user-01')
        .set('x-branch-id', 'br-on-01');

      expect(res.status).toBe(200);
      expect(res.body.taxRate).toBe(0.13); // Ontario rate
      expect(res.body.isHSTEnabled).toBe(true);
    });
  });

  describe('Branch Creation', () => {
    it('should fail if an invalid jurisdiction is provided', async () => {
      const res = await request(app)
        .post('/api/branches')
        .set('x-user-id', 'user-01')
        .send({ name: 'Fake Branch', jurisdictionId: 'invalid-jur' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Valid jurisdiction ID is required');
    });
  });
});
