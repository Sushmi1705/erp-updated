import React from 'react';
import { Warehouse, Boxes, TrendingUp, Layers, MapPin, ArrowRight, Package } from 'lucide-react';

const StockWarehouseMap = ({
  stocks = [],
  warehouses = [],
  onSelectWarehouseFilter
}) => {
  // Aggregate stats per warehouse
  const warehouseStats = warehouses.map(wh => {
    const whStocks = stocks.filter(s => {
      const sWhId = s.warehouseId?._id || s.warehouseId;
      return sWhId === wh._id || s.warehouseId?.name === wh.name;
    });

    const totalUnits = whStocks.reduce((sum, s) => sum + (s.quantityAvailable || 0), 0);
    const totalValuation = whStocks.reduce((sum, s) => {
      const cost = s.unitCost || s.materialId?.standardCost || 0;
      return sum + ((s.quantityAvailable || 0) * cost);
    }, 0);

    // Distinct materials
    const materials = [...new Set(whStocks.map(s => s.materialId?.name).filter(Boolean))];

    return {
      ...wh,
      batchCount: whStocks.length,
      totalUnits,
      totalValuation,
      materials
    };
  });

  // Calculate unassigned or default stocks if any
  const assignedWhIds = new Set(warehouses.map(w => w._id));
  const unassignedStocks = stocks.filter(s => {
    const sWhId = s.warehouseId?._id || s.warehouseId;
    return !assignedWhIds.has(sWhId) && !warehouses.some(w => w.name === s.warehouseId?.name);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* ── Warehouse Cards Grid ──────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '12px'
      }}>
        {warehouseStats.map(wh => {
          return (
            <div
              key={wh._id}
              style={{
                background: 'var(--surface-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                transition: 'border-color 0.15s ease'
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '6px',
                    background: 'rgba(2, 132, 199, 0.1)',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <Warehouse size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      {wh.name}
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Type: <strong>{wh.type || 'Storage Store'}</strong> • Code: <strong>{wh.code || 'WH-STORE'}</strong>
                    </div>
                  </div>
                </div>

                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  background: 'var(--surface-canvas)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)'
                }}>
                  {wh.location || 'Plant Floor'}
                </span>
              </div>

              {/* Metrics Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                background: 'var(--surface-canvas)',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Batches</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                    {wh.batchCount}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Stock Units</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#047857', marginTop: '2px' }}>
                    {wh.totalUnits.toLocaleString()}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Valuation</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', marginTop: '2px' }}>
                    ₹{wh.totalValuation > 100000 ? `${(wh.totalValuation / 100000).toFixed(1)}L` : wh.totalValuation.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Materials Stocked Tags */}
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 600 }}>
                  Active Materials in Store:
                </div>
                {wh.materials.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {wh.materials.slice(0, 4).map((m, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '10px',
                          background: 'var(--surface-canvas)',
                          border: '1px solid var(--border-color)',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          color: 'var(--text-primary)'
                        }}
                      >
                        {m}
                      </span>
                    ))}
                    {wh.materials.length > 4 && (
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', alignSelf: 'center' }}>
                        +{wh.materials.length - 4} more
                      </span>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    No materials currently stocked in this bay.
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={() => onSelectWarehouseFilter(wh._id)}
                style={{
                  marginTop: 'auto',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: 600,
                  background: 'var(--surface-canvas)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '5px',
                  color: '#0284c7',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>View Stored Batches</span>
                <ArrowRight size={12} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StockWarehouseMap;
