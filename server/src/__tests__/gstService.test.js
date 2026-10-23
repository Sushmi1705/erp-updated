/**
 * Unit Tests: gstService.js (H-10/H-11 — Server-side GST calculation)
 * Tests run in isolation; no DB required.
 */
const { calculateGST, calculateLineItemsGST, isInterstate, GST_RATE_MAP } = require('../services/gstService');

describe('gstService — calculateGST', () => {
  test('intrastate: splits 28% into CGST 14% + SGST 14% for automotive parts (8708)', () => {
    const result = calculateGST(1000, '8708', false);
    expect(result.cgstRate).toBe(14);     // 28% / 2 = 14%
    expect(result.sgstRate).toBe(14);
    expect(result.igstAmount).toBe(0);
    expect(result.totalTax).toBeCloseTo(280, 2);
    expect(result.totalAmount).toBeCloseTo(1280, 2);
  });

  test('interstate: uses IGST only', () => {
    const result = calculateGST(1000, '8708', true);
    expect(result.igstRate).toBe(28);
    expect(result.cgstAmount).toBe(0);
    expect(result.totalTax).toBeCloseTo(280, 2);
    expect(result.totalAmount).toBeCloseTo(1280, 2);
  });

  test('unknown HSN defaults to 18%', () => {
    const result = calculateGST(500, '9999', false);
    expect(result.cgstRate).toBe(9);
    expect(result.totalTax).toBeCloseTo(90, 2);
  });

  test('override rate takes precedence over HSN lookup', () => {
    const result = calculateGST(1000, '8708', false, 5);
    expect(result.cgstRate).toBe(2.5);
    expect(result.totalTax).toBeCloseTo(50, 2);
  });

  test('zero taxable value produces zero tax', () => {
    const result = calculateGST(0, '8708', false);
    expect(result.totalTax).toBe(0);
    expect(result.totalAmount).toBe(0);
  });

  test('precision: rounds to 2 decimal places', () => {
    const result = calculateGST(333.33, '4016', false); // 18%
    expect(result.totalTax).toBe(60); // 333.33 * 0.18 = 59.9994 → 60.00
    expect(typeof result.totalAmount).toBe('number');
  });
});

describe('gstService — calculateLineItemsGST', () => {
  const items = [
    { Quantity: 10, Unit_Price: 100, HSN_Code: '8708' },
    { Quantity: 5,  Unit_Price: 200, HSN_Code: '4016' },
  ];

  test('computes per-line totals and grand summary', () => {
    const { lines, summary } = calculateLineItemsGST(items, false);
    expect(lines).toHaveLength(2);
    // Line 1: 10*100=1000 taxable; 8708 = 28% → CGST 14% + SGST 14% = 280, total = 1280
    expect(lines[0].lineTotal).toBeCloseTo(1280, 2);
    // Line 2: 5*200=1000 taxable; 4016 = 18% → CGST 9% + SGST 9% = 180, total = 1180
    expect(lines[1].lineTotal).toBeCloseTo(1180, 2);
    expect(summary.grandTotal).toBeCloseTo(2460, 2);
  });

  test('summary taxableValue equals sum of line taxable values', () => {
    const { lines, summary } = calculateLineItemsGST(items, true);
    const manualTotal = lines.reduce((s, l) => s + l.taxableValue, 0);
    expect(summary.taxableValue).toBeCloseTo(manualTotal, 2);
  });

  test('empty lines produce zero summary', () => {
    const { summary } = calculateLineItemsGST([], false);
    expect(summary.grandTotal).toBe(0);
    expect(summary.totalTax).toBe(0);
  });
});

describe('gstService — isInterstate', () => {
  test('same state code returns false (intrastate)', () => {
    expect(isInterstate('29', '29')).toBe(false);
  });

  test('different state codes returns true (interstate)', () => {
    expect(isInterstate('29', '27')).toBe(true);
  });

  test('missing state code defaults to intrastate', () => {
    expect(isInterstate(null, '29')).toBe(false);
    expect(isInterstate('29', undefined)).toBe(false);
  });
});

describe('gstService — GST_RATE_MAP', () => {
  test('automotive parts chapter 8708 is 28%', () => {
    expect(GST_RATE_MAP['8708']).toBe(28);
  });

  test('DEFAULT rate is 18%', () => {
    expect(GST_RATE_MAP['DEFAULT']).toBe(18);
  });
});
