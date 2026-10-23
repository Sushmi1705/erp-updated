import React, { useState } from 'react';
import { 
  PackagePlus, CheckCircle2, Clock, Search, Truck, 
  FileText, ArrowRight, ShieldCheck, MapPin, Building,
  Inbox, Layers, Sparkles
} from 'lucide-react';

const StockStagingDockRunway = ({
  stagingQueue = [],
  onSelectLotForPutAway,
  onNavigateToInspection
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter staging queue
  const filteredQueue = stagingQueue.filter(item => {
    const search = searchTerm.toLowerCase();
    const inspNo = item.inspectionNumber?.toLowerCase() || '';
    const grnNo = item.grnId?.grnNumber?.toLowerCase() || '';
    const matName = item.grnId?.materialId?.name?.toLowerCase() || item.materialName?.toLowerCase() || '';
    const matCode = item.grnId?.materialId?.code?.toLowerCase() || '';
    const vendorName = item.grnId?.vendorId?.name?.toLowerCase() || '';
    const poNo = item.grnId?.purchaseOrderId?.poNumber?.toLowerCase() || '';

    return !search || 
      inspNo.includes(search) || 
      grnNo.includes(search) || 
      matName.includes(search) || 
      matCode.includes(search) || 
      vendorName.includes(search) ||
      poNo.includes(search);
  });

  const totalWaitingUnits = stagingQueue.reduce((sum, item) => sum + (item.acceptedQuantity || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* ── Staging Dock Status & Search Ribbon ─────────────────────────── */}
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
        {/* Dock Overview Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '5px',
            background: 'rgba(245, 158, 11, 0.1)',
            color: '#d97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Inbox size={15} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Inward Gate Staging Dock (Transit Bay)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              {stagingQueue.length} Consignments ({totalWaitingUnits.toLocaleString()} units) cleared by QA, awaiting warehouse store put-away
            </div>
          </div>
        </div>

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
            placeholder="Search material, supplier, GRN, PO..."
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
      </div>

      {/* ── Staging Consignments Grid ─────────────────────────────────── */}
      {filteredQueue.length === 0 ? (
        <div style={{
          background: 'var(--surface-card)',
          border: '1px dashed var(--border-color)',
          borderRadius: '8px',
          padding: '44px 20px',
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
            <CheckCircle2 size={26} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            Inward Staging Dock Completely Cleared
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '440px' }}>
            All received materials that passed quality inspection have been successfully inducted into warehouse bin racks. New lots will populate here automatically upon QA sign-off.
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '12px'
        }}>
          {filteredQueue.map((item) => {
            const inspNo = item.inspectionNumber || item.inspectionNo || `INSP-${item._id.slice(-6)}`;
            const grnNo = item.grnId?.grnNumber || 'GRN-DIRECT';
            const poNo = item.grnId?.purchaseOrderId?.poNumber || 'PO-CONTRACT';
            const matName = item.grnId?.materialId?.name || item.materialName || 'Inward Automotive Material';
            const matCode = item.grnId?.materialId?.code || 'RAW-001';
            const matUom = item.grnId?.materialId?.uom || 'PCS';
            const vendorName = item.grnId?.vendorId?.name || 'Direct Supplier';
            const vendorGstin = item.grnId?.vendorId?.gstin || '';
            const qty = item.acceptedQuantity || item.inspectedQuantity || 0;
            const inspector = item.inspectorName || 'Lead Inspector';
            const vehicleNo = item.grnId?.vehicleNumber || 'Gate Verified';

            return (
              <div
                key={item._id}
                style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-color)',
                  borderTop: '3px solid #0284c7',
                  borderRadius: '7px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  transition: 'transform 0.1s ease, box-shadow 0.1s ease'
                }}
              >
                {/* Header: Inspection ID & Stamp */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '6px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: '12px',
                      color: 'var(--text-primary)'
                    }}>
                      {inspNo}
                    </span>
                    <span style={{
                      fontSize: '10px',
                      color: 'var(--text-secondary)',
                      background: 'var(--surface-canvas)',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      border: '1px solid var(--border-color)'
                    }}>
                      {grnNo}
                    </span>
                  </div>

                  <span style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#047857',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ShieldCheck size={11} />
                    <span>QA Cleared</span>
                  </span>
                </div>

                {/* Material Spec Block */}
                <div style={{
                  background: 'var(--surface-canvas)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '5px',
                  padding: '8px 10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {matName}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      Part Code: {matCode}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#047857' }}>
                      {qty.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      {matUom} Accepted
                    </div>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '6px',
                  fontSize: '11px',
                  color: 'var(--text-secondary)'
                }}>
                  <div>
                    <span style={{ fontSize: '10px', display: 'block', textTransform: 'uppercase' }}>Supplier</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{vendorName}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', display: 'block', textTransform: 'uppercase' }}>Purchase Order</span>
                    <strong style={{ color: 'var(--text-primary)' }}>{poNo}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', display: 'block', textTransform: 'uppercase' }}>Transit Vehicle</span>
                    <span>{vehicleNo}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', display: 'block', textTransform: 'uppercase' }}>Certified By</span>
                    <span>{inspector}</span>
                  </div>
                </div>

                {/* Bottom Action Ribbon */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '8px',
                  paddingTop: '6px',
                  borderTop: '1px dashed var(--border-color)'
                }}>
                  <button
                    onClick={() => onSelectLotForPutAway(item)}
                    style={{
                      width: '100%',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: '#0284c7',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      boxShadow: '0 1px 2px rgba(2, 132, 199, 0.25)'
                    }}
                  >
                    <PackagePlus size={13} />
                    <span>Put-Away to Store Rack</span>
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

export default StockStagingDockRunway;
