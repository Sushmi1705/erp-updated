import React from 'react';
import { Search, Filter, Layers, ShoppingCart, Hammer, CalendarClock, CheckCircle, Zap } from 'lucide-react';

export const RecommendationsFilterBar = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  activeView,
  setActiveView,
  pendingCount,
  onBatchConvert,
  batchBusy = false
}) => {
  return (
    <div style={{
      background: 'var(--bg-primary, #ffffff)',
      borderRadius: '12px',
      border: '1px solid var(--border-color, #e2e8f0)',
      padding: '14px 18px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: '14px'
    }}>
      {/* Search Input */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'var(--bg-secondary, #f8fafc)',
        border: '1px solid var(--border-color, #cbd5e1)',
        borderRadius: '8px',
        padding: '7px 12px',
        minWidth: '280px',
        flex: '1 1 280px',
        maxWidth: '420px'
      }}>
        <Search size={15} color="var(--text-secondary, #64748b)" />
        <input
          type="text"
          placeholder="Search items (MAT/PRD), action, linked orders..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: '13px',
            width: '100%',
            color: 'var(--text-primary, #1e293b)'
          }}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary, #94a3b8)',
              fontSize: '12px',
              padding: 0
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Status Filter Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{
          fontSize: '11.5px',
          fontWeight: 600,
          color: 'var(--text-secondary, #64748b)',
          marginRight: '2px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <Filter size={12} /> Status:
        </span>
        {[
          { key: 'All', label: 'All Recommendations' },
          { key: 'Pending', label: 'Pending Only ⏳' },
          { key: 'Converted', label: 'Converted ✅' },
          { key: 'Dismissed', label: 'Dismissed' }
        ].map(item => {
          const isActive = statusFilter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              style={{
                padding: '5px 11px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: isActive ? '1px solid #0284c7' : '1px solid var(--border-color, #e2e8f0)',
                background: isActive ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-secondary, #f8fafc)',
                color: isActive ? '#0284c7' : 'var(--text-secondary, #64748b)'
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Stream View Mode Switcher + Batch Convert */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-secondary, #f1f5f9)',
          borderRadius: '8px',
          padding: '3px',
          border: '1px solid var(--border-color, #e2e8f0)',
          gap: '2px'
        }}>
          {[
            { key: 'tri', label: 'Tri-Deck View', icon: Layers },
            { key: 'purchase', label: 'Purchase (Buy)', icon: ShoppingCart },
            { key: 'production', label: 'Work Orders (Make)', icon: Hammer },
            { key: 'reschedule', label: 'Rescheduling', icon: CalendarClock }
          ].map(vm => {
            const Icon = vm.icon;
            const isActive = activeView === vm.key;
            return (
              <button
                key={vm.key}
                type="button"
                onClick={() => setActiveView(vm.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: 'none',
                  background: isActive ? '#0f172a' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary, #64748b)',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                <Icon size={12} />
                {vm.label}
              </button>
            );
          })}
        </div>

        {/* Batch Convert Trigger */}
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={onBatchConvert}
            disabled={batchBusy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: batchBusy ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
            }}
          >
            <Zap size={13} />
            {batchBusy ? 'Batch Converting…' : `Convert All Pending (${pendingCount})`}
          </button>
        )}
      </div>
    </div>
  );
};
