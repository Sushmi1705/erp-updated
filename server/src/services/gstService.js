/**
 * GST Service — Server-side tax calculation
 * Never trusts client-supplied tax amounts.
 * Reads rates from TaxConfigurationMaster if available, else uses HSN-based defaults.
 */

// Indian GST rates by HSN chapter (simplified — extend as needed)
const GST_RATE_MAP = {
  '8708': 28, // Automotive parts and accessories
  '4016': 18, // Rubber parts
  '7320': 18, // Springs, steel
  '8482': 18, // Bearings
  '8544': 18, // Wiring harnesses
  '3403': 18, // Lubricants
  '4011': 18, // Pneumatic tyres
  'DEFAULT': 18 // Default GST rate for auto parts
};

/**
 * Determine if transaction is interstate (IGST) or intrastate (CGST+SGST)
 */
const isInterstate = (supplierStateCode, companyStateCode) => {
  if (!supplierStateCode || !companyStateCode) return false;
  return supplierStateCode !== companyStateCode;
};

/**
 * Calculate GST for a line item
 * @param {number} taxableValue - pre-tax amount
 * @param {string} hsnCode - HSN code for the item
 * @param {boolean} interstate - true if IGST applies, false for CGST+SGST
 * @param {number} overrideRate - optional manual rate override (from TaxConfig master)
 */
const calculateGST = (taxableValue, hsnCode, interstate = false, overrideRate = null) => {
  const chapter = hsnCode ? hsnCode.substring(0, 4) : 'DEFAULT';
  const totalGstRate = overrideRate !== null ? overrideRate : (GST_RATE_MAP[chapter] || GST_RATE_MAP['DEFAULT']);
  
  const taxAmount = Math.round((taxableValue * totalGstRate / 100) * 100) / 100;
  
  if (interstate) {
    return {
      taxableValue,
      igstRate: totalGstRate,
      igstAmount: taxAmount,
      cgstRate: 0, cgstAmount: 0,
      sgstRate: 0, sgstAmount: 0,
      totalTax: taxAmount,
      totalAmount: taxableValue + taxAmount
    };
  } else {
    const halfRate = totalGstRate / 2;
    const halfTax = Math.round((taxableValue * halfRate / 100) * 100) / 100;
    return {
      taxableValue,
      cgstRate: halfRate, cgstAmount: halfTax,
      sgstRate: halfRate, sgstAmount: halfTax,
      igstRate: 0, igstAmount: 0,
      totalTax: halfTax * 2,
      totalAmount: taxableValue + halfTax * 2
    };
  }
};

/**
 * Calculate GST for multiple line items
 */
const calculateLineItemsGST = (lineItems, interstate = false) => {
  let grandTaxableValue = 0, grandTax = 0, grandTotal = 0;
  const lines = lineItems.map(item => {
    const taxableValue = (item.Quantity || item.quantity || 0) * (item.Unit_Price || item.unitPrice || item.price || 0);
    const gst = calculateGST(taxableValue, item.HSN_Code || item.hsnCode || '', interstate, item.taxRate || null);
    grandTaxableValue += gst.taxableValue;
    grandTax += gst.totalTax;
    grandTotal += gst.totalAmount;
    return { ...item, ...gst, lineTotal: gst.totalAmount };
  });
  return {
    lines,
    summary: {
      taxableValue: Math.round(grandTaxableValue * 100) / 100,
      totalTax: Math.round(grandTax * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100
    }
  };
};

module.exports = { calculateGST, calculateLineItemsGST, isInterstate, GST_RATE_MAP };
