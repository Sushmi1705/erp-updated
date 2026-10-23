/**
 * Unit Tests: docNumbering.js (C-07 — Sequential document numbering)
 * Uses Jest module mocking to avoid DB dependency.
 * Tests the numbering logic: formatting, prefix, sequential counter, and independence.
 */

// Mock the DocSequence model before requiring the module under test
jest.mock('../models/DocSequence', () => {
  // Track counters per docType in memory
  const counters = {};

  const mockFindOneAndUpdate = jest.fn(async (filter, update, opts) => {
    const { docType } = filter;
    const prefix = update.$setOnInsert?.prefix || docType;
    const padding = update.$setOnInsert?.padding || 5;

    // Initialize counter for this docType if not present
    if (!(docType in counters)) {
      counters[docType] = 0;
    }
    // Increment (mirrors $inc: { currentNumber: 1 })
    counters[docType] += 1;

    // Derive fiscal year (Indian Apr-Mar)
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const fiscalYear = `${year}-${String(year + 1).slice(-2)}`;

    return { currentNumber: counters[docType], prefix, fiscalYear, padding };
  });

  // Expose reset helper to clear counters between tests
  mockFindOneAndUpdate.__resetCounters = () => {
    for (const k in counters) delete counters[k];
  };

  return { findOneAndUpdate: mockFindOneAndUpdate };
});

const { generateDocNumber } = require('../utils/docNumbering');
const DocSequence = require('../models/DocSequence');

afterEach(() => {
  DocSequence.findOneAndUpdate.__resetCounters();
  jest.clearAllMocks();
});

describe('generateDocNumber — Sequential numbering (C-07)', () => {
  test('first call returns a correctly formatted document number', async () => {
    const num = await generateDocNumber('INV', 'INV');
    expect(typeof num).toBe('string');
    expect(num).toMatch(/^INV-\d{4}-\d{2}-\d{5}$/);  // INV-2025-26-00001
  });

  test('sequential calls produce incrementing numbers', async () => {
    const n1 = await generateDocNumber('PO', 'PO');
    const n2 = await generateDocNumber('PO', 'PO');
    const n3 = await generateDocNumber('PO', 'PO');
    // All three must be different
    expect(n1).not.toBe(n2);
    expect(n2).not.toBe(n3);
    expect(n1).not.toBe(n3);
  });

  test('different prefix types maintain independent sequences', async () => {
    const inv1 = await generateDocNumber('INV', 'INV');
    const po1  = await generateDocNumber('PO',  'PO');
    const inv2 = await generateDocNumber('INV', 'INV');
    // INV and PO sequences are independent
    expect(inv1).not.toBe(po1);
    expect(inv2).not.toBe(po1);
    // INV counter incremented twice: first = ...00001, second = ...00002
    const inv1Seq = inv1.split('-').pop();
    const inv2Seq = inv2.split('-').pop();
    expect(Number(inv2Seq)).toBe(Number(inv1Seq) + 1);
  });

  test('generated number contains the entity prefix', async () => {
    const num = await generateDocNumber('GRN', 'GRN');
    expect(num).toContain('GRN');
  });

  test('DocSequence.findOneAndUpdate is called once per generate call', async () => {
    await generateDocNumber('WO', 'WO');
    await generateDocNumber('WO', 'WO');
    expect(DocSequence.findOneAndUpdate).toHaveBeenCalledTimes(2);
  });

  test('findOneAndUpdate called with correct $inc and upsert options', async () => {
    await generateDocNumber('MRP', 'MRP');
    const [filter, update, opts] = DocSequence.findOneAndUpdate.mock.calls[0];
    expect(filter.docType).toBe('MRP');
    expect(update.$inc.currentNumber).toBe(1);
    expect(opts.upsert).toBe(true);
    expect(opts.new).toBe(true);
  });

  test('output is padded to 5 digits', async () => {
    const num = await generateDocNumber('BILL', 'BILL');
    // Last segment should be 5 digits
    const segments = num.split('-');
    const paddedSeq = segments[segments.length - 1];
    expect(paddedSeq).toHaveLength(5);
    expect(paddedSeq).toBe('00001');
  });

  test('concurrent calls each get unique numbers', async () => {
    const calls = Array.from({ length: 10 }, () => generateDocNumber('BATCH', 'BATCH'));
    const results = await Promise.all(calls);
    const unique = new Set(results);
    // Mock is synchronous so all 10 resolve uniquely
    expect(unique.size).toBe(10);
  });
});
