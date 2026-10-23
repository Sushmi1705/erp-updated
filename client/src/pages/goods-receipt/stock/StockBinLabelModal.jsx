import React, { useRef } from 'react';
import { X, Printer, Barcode, Warehouse, MapPin, CheckCircle2, QrCode } from 'lucide-react';

const StockBinLabelModal = ({
  stockItem,
  onClose
}) => {
  const printAreaRef = useRef(null);

  if (!stockItem) return null;

  const handlePrint = () => {
    window.print();
  };

  const batchNo = stockItem.batchNumber || 'BATCH-2026-AUTO';
  const matName = stockItem.materialId?.name || 'Raw Material Consignment';
  const matCode = stockItem.materialId?.code || 'RAW-001';
  const matUom = stockItem.materialId?.uom || 'PCS';
  const whName = stockItem.warehouseId?.name || 'Raw Material Store';
  const whCode = stockItem.warehouseId?.code || 'WH-RMS';
  const qty = stockItem.quantityAvailable || 0;
  const grnNo = stockItem.sourceGrnId?.grnNumber || 'GRN-INWARD';
  const vendorName = stockItem.sourceGrnId?.vendorId?.name || 'Direct Automotive Supplier';
  const binLocation = stockItem.notes || stockItem.binLocation || 'Rack A2 - Bin 01';
  const dateStr = stockItem.postingDate ? new Date(stockItem.postingDate).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : new Date().toLocaleDateString('en-IN');

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '10px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        color: '#1e293b'
      }}>
        {/* Modal Control Header (hidden on print) */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 18px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Barcode size={18} color="#0284c7" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
              Material Batch & Warehouse Bin Label
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Printer size={14} />
              <span>Print Label</span>
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '6px',
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Label Body */}
        <div 
          ref={printAreaRef}
          style={{
            padding: '24px',
            overflowY: 'auto',
            background: '#ffffff',
            fontFamily: 'Inter, system-ui, sans-serif'
          }}
        >
          {/* Label Outer Container (Standard Thermal 4x6 Aspect) */}
          <div style={{
            border: '2px solid #0f172a',
            borderRadius: '6px',
            padding: '16px',
            background: '#ffffff'
          }}>
            {/* Header: Company & Title */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0f172a',
              paddingBottom: '10px',
              marginBottom: '12px'
            }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  PRECISION AUTO COMPONENTS PVT. LTD.
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>
                  Plant Inward Stores • Chakan MIDC, Pune
                </div>
              </div>

              <div style={{
                background: '#0f172a',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}>
                BIN TAG
              </div>
            </div>

            {/* Large Barcode Representation */}
            <div style={{
              textAlign: 'center',
              padding: '10px 0',
              borderBottom: '1px solid #cbd5e1',
              marginBottom: '12px'
            }}>
              {/* Simulated Code-128 SVG Barcode Lines */}
              <div style={{
                display: 'inline-flex',
                height: '42px',
                gap: '2px',
                alignItems: 'flex-end',
                marginBottom: '4px'
              }}>
                {[4, 2, 5, 2, 3, 6, 2, 4, 3, 2, 5, 4, 2, 3, 5, 2, 4, 6, 3, 2, 4, 5, 2, 3, 6, 2, 4, 3, 5, 2, 4, 2, 6, 3, 2, 5].map((w, i) => (
                  <div
                    key={i}
                    style={{
                      width: `${w}px`,
                      height: '100%',
                      backgroundColor: '#0f172a'
                    }}
                  />
                ))}
              </div>
              <div style={{
                fontSize: '15px',
                fontWeight: 800,
                letterSpacing: '2px',
                fontFamily: 'monospace',
                color: '#0f172a'
              }}>
                {batchNo}
              </div>
            </div>

            {/* Material & Part Code Details */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '5px',
              padding: '10px 12px',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                Material Description
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {matName}
              </div>
              <div style={{ fontSize: '12px', color: '#475569', fontFamily: 'monospace', marginTop: '2px' }}>
                Part Code: <strong>{matCode}</strong>
              </div>
            </div>

            {/* Grid: Quantity, Warehouse, Bin, Date */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              marginBottom: '12px'
            }}>
              <div style={{
                border: '1px solid #cbd5e1',
                padding: '8px 10px',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Stored Quantity</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {qty.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>{matUom}</span>
                </div>
              </div>

              <div style={{
                border: '1px solid #cbd5e1',
                padding: '8px 10px',
                borderRadius: '4px'
              }}>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Warehouse Location</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                  {whName}
                </div>
                <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: 600 }}>
                  {binLocation}
                </div>
              </div>
            </div>

            {/* Consignment Traceability Meta */}
            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              fontSize: '10px',
              color: '#64748b',
              marginBottom: '12px'
            }}>
              <div>
                <div>Source GRN:</div>
                <strong style={{ color: '#0f172a' }}>{grnNo}</strong>
              </div>
              <div>
                <div>Induction Date:</div>
                <strong style={{ color: '#0f172a' }}>{dateStr}</strong>
              </div>
              <div>
                <div>Supplier:</div>
                <strong style={{ color: '#0f172a' }}>{vendorName}</strong>
              </div>
            </div>

            {/* Bottom Certification Stamp */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px dashed #cbd5e1',
              paddingTop: '8px',
              fontSize: '10px',
              color: '#64748b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 600 }}>
                <CheckCircle2 size={13} />
                <span>IATF 16949 FIFO Compliant</span>
              </div>
              <div>
                Storekeeper Sign: ________________
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockBinLabelModal;
