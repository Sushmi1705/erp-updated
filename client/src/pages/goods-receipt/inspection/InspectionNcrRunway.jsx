import React, { useState } from 'react';
import { 
  ShieldAlert, AlertTriangle, ArrowRight, Printer, Microscope, 
  RotateCcw, Package, DollarSign, Filter, Search, CheckCircle2,
  FileText, Clock, ExternalLink, ShieldCheck
} from 'lucide-react';

const InspectionNcrRunway = ({
  inspections = [],
  onSelectInspection,
  onOpenWorkbench,
  onOpenPrintModal,
  onNavigateToStock
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dispositionFilter, setDispositionFilter] = useState('All'); // 'All', 'Rejected', 'Hold'

  // Non-conforming items: rejectedQuantity > 0 OR holdQuantity > 0 OR status is Hold-Review
  const ncrList = inspections.filter(item => {
    const isNcr = (item.rejectedQuantity || 0) > 0 || 
                  (item.holdQuantity || 0) > 0 || 
                  item.inspectionStatus === 'Hold-Review';
    if (!isNcr) return false;

    // Search filter
    const search = searchTerm.toLowerCase();
    const inspNo = item.inspectionNumber?.toLowerCase() || '';
    const grnNo = item.grnId?.grnNumber?.toLowerCase() || '';
    const matName = item.grnId?.materialId?.name?.toLowerCase() || '';
    const vendorName = item.grnId?.vendorId?.name?.toLowerCase() || '';
    const defect = item.defectCategory?.toLowerCase() || '';

    const matchesSearch = !search || 
      inspNo.includes(search) || 
      grnNo.includes(search) || 
      matName.includes(search) || 
      vendorName.includes(search) ||
      defect.includes(search);

    if (!matchesSearch) return false;

    // Category filter
    if (categoryFilter !== 'All' && item.defectCategory !== categoryFilter) {
      return false;
    }

    // Disposition filter
    if (dispositionFilter === 'Rejected' && (item.rejectedQuantity || 0) <= 0) return false;
    if (dispositionFilter === 'Hold' && (item.holdQuantity || 0) <= 0 && item.inspectionStatus !== 'Hold-Review') return false;

    return true;
  });

  // Aggregated Stats
  const allNcrItems = inspections.filter(item => 
    (item.rejectedQuantity || 0) > 0 || (item.holdQuantity || 0) > 0 || item.inspectionStatus === 'Hold-Review'
  );
  const totalRejectedUnits = allNcrItems.reduce((sum, item) => sum + (item.rejectedQuantity || 0), 0);
  const totalHoldUnits = allNcrItems.reduce((sum, item) => sum + (item.holdQuantity || 0), 0);
  
  // Total cost impact = rejected * standardCost
  const totalFinancialExposure = allNcrItems.reduce((sum, item) => {
    const cost = item.grnId?.materialId?.standardCost || 0;
    const rej = item.rejectedQuantity || 0;
    return sum + (cost * rej);
  }, 0);

  // Distinct defect categories
  const categories = ['All', ...new Set(allNcrItems.map(i => i.defectCategory || 'Uncategorized').filter(Boolean))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* ── Top Metric Cards for NCR Runway ────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '10px'
      }}>
        {/* Total NCR Lots */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '7px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#dc2626',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Active NCR / Hold Lots</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>{allNcrItems.length} Lots</div>
          </div>
        </div>

        {/* Total Rejected Units */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '7px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <RotateCcw size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Rejected Units (RTV Due)</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {totalRejectedUnits.toLocaleString()} units
            </div>
          </div>
        </div>

        {/* Quarantined Hold */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '7px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: 'rgba(245, 158, 11, 0.1)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Clock size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Under MRB / Quarantine</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#b45309' }}>
              {totalHoldUnits.toLocaleString()} units
            </div>
          </div>
        </div>

        {/* Financial Exposure */}
        <div style={{
          background: 'var(--surface-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '7px',
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '6px',
            background: 'rgba(99, 102, 241, 0.1)',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <DollarSign size={18} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Rejection Scrap Cost</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {totalFinancialExposure > 0 ? `₹${totalFinancialExposure.toLocaleString('en-IN')}` : '₹0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '7px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Search */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--surface-canvas)',
          border: '1px solid var(--border-color)',
          borderRadius: '5px',
          padding: '5px 10px',
          width: '280px'
        }}>
          <Search size={14} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search lot, supplier, defect..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: '12px',
              color: 'var(--text-primary)',
              width: '100%'
            }}
          />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Disposition Filter */}
          <div style={{
            display: 'flex',
            background: 'var(--surface-canvas)',
            border: '1px solid var(--border-color)',
            borderRadius: '5px',
            padding: '2px'
          }}>
            {['All', 'Rejected', 'Hold'].map((d) => (
              <button
                key={d}
                onClick={() => setDispositionFilter(d)}
                style={{
                  padding: '3px 10px',
                  fontSize: '11px',
                  fontWeight: dispositionFilter === d ? 600 : 500,
                  background: dispositionFilter === d ? 'var(--surface-card)' : 'transparent',
                  color: dispositionFilter === d ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: dispositionFilter === d ? '1px solid var(--border-color)' : 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {d === 'All' ? 'All NCRs' : d}
              </button>
            ))}
          </div>

          {/* Defect Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: '5px 10px',
              fontSize: '11px',
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-color)',
              borderRadius: '5px',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>Defect: {cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Runway Cards List ─────────────────────────────────────────── */}
      {ncrList.length === 0 ? (
        <div style={{
          background: 'var(--surface-card)',
          border: '1px dashed var(--border-color)',
          borderRadius: '8px',
          padding: '40px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#059669'
          }}>
            <ShieldCheck size={26} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Zero Non-Conformance Flagged
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '440px' }}>
            All received consignments currently meet inward quality specifications. No rejected quantities or active quarantine holds require review.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ncrList.map((item) => {
            const matCode = item.grnId?.materialId?.code || 'RAW-AUTO';
            const matName = item.grnId?.materialId?.name || 'Inward Consignment';
            const vendorName = item.grnId?.vendorId?.name || 'Direct Inward Supplier';
            const grnNo = item.grnId?.grnNumber || 'GRN-DIRECT';
            const poNo = item.grnId?.purchaseOrderId?.poNumber || 'PO-ATTACHED';
            const cost = item.grnId?.materialId?.standardCost || 0;
            const rejValue = (item.rejectedQuantity || 0) * cost;

            const isRejected = (item.rejectedQuantity || 0) > 0;
            const isHold = (item.holdQuantity || 0) > 0 || item.inspectionStatus === 'Hold-Review';

            return (
              <div
                key={item._id}
                style={{
                  background: 'var(--surface-card)',
                  border: isRejected ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                  borderLeft: isRejected ? '4px solid #ef4444' : '4px solid #f59e0b',
                  borderRadius: '7px',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'transform 0.12s ease'
                }}
              >
                {/* Header Row: Lot ID & Badges */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '13px',
                      color: 'var(--text-primary)'
                    }}>
                      {item.inspectionNumber}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      background: 'var(--surface-canvas)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)'
                    }}>
                      {grnNo}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: 'var(--text-secondary)',
                      background: 'var(--surface-canvas)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-color)'
                    }}>
                      {poNo}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Defect Category Tag */}
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#dc2626',
                      border: '1px solid rgba(239, 68, 68, 0.25)'
                    }}>
                      Defect: {item.defectCategory || 'Uncategorized'}
                    </span>

                    {/* Status Badge */}
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '2px 7px',
                      borderRadius: '4px',
                      background: item.inspectionStatus === 'Hold-Review' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: item.inspectionStatus === 'Hold-Review' ? '#b45309' : '#b91c1c'
                    }}>
                      {item.inspectionStatus}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '8px',
                  padding: '8px 10px',
                  background: 'var(--surface-canvas)',
                  borderRadius: '5px',
                  border: '1px solid var(--border-color)'
                }}>
                  {/* Material & Part */}
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>Part / Material</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {matName}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {matCode}
                    </div>
                  </div>

                  {/* Supplier */}
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>Supplier</div>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {vendorName}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Insp: {item.inspectorName || 'Lead Inspector'}
                    </div>
                  </div>

                  {/* Rejection / Hold Breakdown */}
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>Non-Conformance Vol.</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                      {isRejected && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626' }}>
                          {item.rejectedQuantity} Rejected
                        </span>
                      )}
                      {isHold && (
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#d97706' }}>
                          {item.holdQuantity} On Hold
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Lot Size: {item.inspectedQuantity} units
                    </div>
                  </div>

                  {/* Financial Claim */}
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 500 }}>Claim Value (Debit Due)</div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: rejValue > 0 ? '#dc2626' : 'var(--text-primary)' }}>
                      {rejValue > 0 ? `₹${rejValue.toLocaleString('en-IN')}` : 'Debit TBD'}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Unit Cost: ₹{cost.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Root Cause / Remarks */}
                {item.remarks && (
                  <div style={{
                    fontSize: '11px',
                    color: 'var(--text-primary)',
                    background: 'rgba(0,0,0,0.015)',
                    padding: '6px 10px',
                    borderRadius: '4px',
                    borderLeft: '2px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '10px', textTransform: 'uppercase' }}>
                      Defect Cause:
                    </span>
                    <span>{item.remarks}</span>
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '8px',
                  paddingTop: '4px'
                }}>
                  <button
                    onClick={() => onOpenPrintModal(item)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 500,
                      background: 'var(--surface-canvas)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '5px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Printer size={12} />
                    <span>Print NCR Form</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectInspection(item);
                      onOpenWorkbench();
                    }}
                    style={{
                      padding: '4px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 1px 2px rgba(5, 150, 105, 0.2)'
                    }}
                  >
                    <Microscope size={12} />
                    <span>Open in Test Bench</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InspectionNcrRunway;
