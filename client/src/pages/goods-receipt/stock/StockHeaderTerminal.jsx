import React from 'react';
import { 
  Warehouse, PackagePlus, Boxes, Barcode, Layers, 
  Printer, RefreshCw, Clock, CheckCircle2, TrendingUp,
  MapPin, ShieldCheck, Radio
} from 'lucide-react';

const StockHeaderTerminal = ({
  stocks = [],
  stagingQueue = [],
  activePerspective,
  setActivePerspective,
  onOpenPutAwayModal,
  onOpenLabelModal,
  onRefresh,
  loading = false
}) => {
  const activeBatchesCount = stocks.length;
  const readyForPutAwayCount = stagingQueue.length;

  const totalStockUnits = stocks.reduce((sum, s) => sum + (s.quantityAvailable || 0), 0);
  const totalValuation = stocks.reduce((sum, s) => {
    const qty = s.quantityAvailable || 0;
    const cost = s.unitCost || s.materialId?.standardCost || 0;
    return sum + (qty * cost);
  }, 0);

  const formatValuation = (val) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)} Lakh`;
    }
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div style={{
      background: 'var(--surface-card)',
      border: '1px solid var(--border-color)',
      borderRadius: '9px',
      padding: '12px 18px',
      marginBottom: '12px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* ── Top Level Command Ribbon ─────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* Left Identity with Industrial Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 2px 5px rgba(2, 132, 199, 0.3)',
            flexShrink: 0
          }}>
            <Warehouse size={19} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{
                fontSize: '16px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.3px'
              }}>
                Move Into Stock
              </h1>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#0284c7',
                background: 'rgba(2, 132, 199, 0.08)',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                padding: '1px 7px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Radio size={10} color="#0284c7" className="animate-pulse" />
                <span>Stores Put-Away Terminal</span>
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Physical bin placement, batch number induction, and material ledger capitalization.
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onOpenLabelModal()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '11px',
              fontWeight: 600,
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
            title="Generate thermal pallet & bin barcode tag"
          >
            <Barcode size={14} color="#0284c7" />
            <span>Bin Barcode Tag</span>
          </button>

          <button
            onClick={onRefresh}
            style={{
              padding: '6px 10px',
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Refresh stock ledger"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={onOpenPutAwayModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              fontSize: '12px',
              fontWeight: 700,
              background: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
            }}
          >
            <PackagePlus size={15} />
            <span>Induct Inward Batch</span>
          </button>
        </div>
      </div>

      {/* ── Bottom Strip: High-Impact Metrics & Tab Switcher ─────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-color)'
      }}>
        {/* Metric Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Staging Dock Queue */}
          <div
            onClick={() => setActivePerspective('Staging')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: readyForPutAwayCount > 0 ? 'rgba(245, 158, 11, 0.1)' : 'var(--surface-canvas)',
              borderRadius: '5px',
              border: readyForPutAwayCount > 0 ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--border-color)',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            <Clock size={12} color={readyForPutAwayCount > 0 ? '#d97706' : 'var(--text-secondary)'} />
            <span style={{ color: readyForPutAwayCount > 0 ? '#b45309' : 'var(--text-secondary)', fontWeight: 500 }}>
              Staging Transit Bay:
            </span>
            <span style={{ fontWeight: 800, color: readyForPutAwayCount > 0 ? '#b45309' : 'var(--text-primary)' }}>
              {readyForPutAwayCount} Lots Awaiting Rack
            </span>
          </div>

          {/* Active Batches */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'var(--surface-canvas)',
            borderRadius: '5px',
            border: '1px solid var(--border-color)',
            fontSize: '11px'
          }}>
            <Boxes size={12} color="var(--text-secondary)" />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Tracked Batches:</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{activeBatchesCount}</span>
          </div>

          {/* Stock on Hand */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(16, 185, 129, 0.08)',
            borderRadius: '5px',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '11px'
          }}>
            <CheckCircle2 size={12} color="#059669" />
            <span style={{ color: '#047857', fontWeight: 500 }}>Total Units Stored:</span>
            <span style={{ fontWeight: 800, color: '#047857' }}>
              {totalStockUnits.toLocaleString()} units
            </span>
          </div>

          {/* Capital Valuation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'var(--surface-canvas)',
            borderRadius: '5px',
            border: '1px solid var(--border-color)',
            fontSize: '11px'
          }}>
            <TrendingUp size={12} color="#0284c7" />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Store Capitalization:</span>
            <span style={{ fontWeight: 800, color: '#0369a1' }}>
              {formatValuation(totalValuation)}
            </span>
          </div>
        </div>

        {/* Perspective Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          background: 'var(--surface-canvas)',
          padding: '2px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setActivePerspective('Ledger')}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: activePerspective === 'Ledger' ? 700 : 500,
              background: activePerspective === 'Ledger' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Ledger' ? '#0284c7' : 'var(--text-secondary)',
              borderRadius: '5px',
              border: activePerspective === 'Ledger' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Ledger' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Layers size={13} />
            <span>Pallet & Bin Ledger</span>
          </button>

          <button
            onClick={() => setActivePerspective('Staging')}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: activePerspective === 'Staging' ? 700 : 500,
              background: activePerspective === 'Staging' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Staging' ? '#0284c7' : 'var(--text-secondary)',
              borderRadius: '5px',
              border: activePerspective === 'Staging' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Staging' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Clock size={13} />
            <span>Staging Runway</span>
            {readyForPutAwayCount > 0 && (
              <span style={{
                background: '#d97706',
                color: '#ffffff',
                fontSize: '9px',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '0 5px',
                lineHeight: '14px'
              }}>
                {readyForPutAwayCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActivePerspective('Warehouses')}
            style={{
              padding: '4px 12px',
              fontSize: '11px',
              fontWeight: activePerspective === 'Warehouses' ? 700 : 500,
              background: activePerspective === 'Warehouses' ? 'var(--surface-card)' : 'transparent',
              color: activePerspective === 'Warehouses' ? '#0284c7' : 'var(--text-secondary)',
              borderRadius: '5px',
              border: activePerspective === 'Warehouses' ? '1px solid var(--border-color)' : 'none',
              boxShadow: activePerspective === 'Warehouses' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Warehouse size={13} />
            <span>Store Capacity Map</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockHeaderTerminal;
