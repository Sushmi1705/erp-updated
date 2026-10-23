import React from 'react';
import { Search, Filter, Layers, AlertTriangle, PackageX, Factory } from 'lucide-react';

export const ShortageFilterBar = ({
  searchTerm,
  setSearchTerm,
  severityFilter,
  setSeverityFilter,
  activeView,
  setActiveView,
  totalCount,
  filteredCount
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
      {/* Left: Search input */}
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
          placeholder="Search by item, material code (MAT-xxx), constraint..."
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

      {/* Middle: Severity Filter Chips */}
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
          <Filter size={12} /> Severity:
        </span>
        {[
          { key: 'All', label: 'All Deficits' },
          { key: 'Critical', label: 'Critical 🔴' },
          { key: 'High', label: 'High 🟠' },
          { key: 'Medium', label: 'Medium 🟡' },
          { key: 'OpenOnly', label: 'Action Needed ⚡' }
        ].map(item => {
          const isActive = severityFilter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSeverityFilter(item.key)}
              style={{
                padding: '5px 11px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: isActive ? '1px solid #dc2626' : '1px solid var(--border-color, #e2e8f0)',
                background: isActive ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-secondary, #f8fafc)',
                color: isActive ? '#dc2626' : 'var(--text-secondary, #64748b)'
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Right: Stream / View Mode Switcher */}
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
          { key: 'constraints', label: 'Blockers Only', icon: AlertTriangle },
          { key: 'raw', label: 'Raw Materials', icon: PackageX },
          { key: 'components', label: 'Sub-Assemblies', icon: Factory }
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
                background: isActive ? '#1e293b' : 'transparent',
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
    </div>
  );
};
