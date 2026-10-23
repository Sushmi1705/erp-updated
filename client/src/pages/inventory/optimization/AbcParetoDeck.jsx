import React from 'react';
import { BarChart3, TrendingUp, ShieldAlert, CheckCircle2, ArrowRight, Layers, IndianRupee } from 'lucide-react';

const AbcParetoDeck = ({
  profiles = [],
  parameters = {},
  onOpenParamModal
}) => {
  const classA = profiles.filter(p => p.ABC_Class === 'A');
  const classB = profiles.filter(p => p.ABC_Class === 'B');
  const classC = profiles.filter(p => p.ABC_Class === 'C' || !p.ABC_Class || p.ABC_Class === 'Unclassified');

  const sumValuation = (list) => list.reduce((sum, p) => sum + (p.valuation || 0), 0);
  const totalVal = sumValuation(profiles) || 1;

  const valA = sumValuation(classA);
  const valB = sumValuation(classB);
  const valC = sumValuation(classC);

  const pctA = Math.round((valA / totalVal) * 100);
  const pctB = Math.round((valB / totalVal) * 100);
  const pctC = Math.round((valC / totalVal) * 100);

  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const cards = [
    {
      classId: 'A',
      title: 'Class A — Critical Capital Materials',
      targetShare: `${parameters.ABC_Class_A_Percentage || 70}%`,
      actualShare: `${pctA}%`,
      count: classA.length,
      valuation: valA,
      themeColor: '#2563eb',
      bgLight: 'rgba(37, 99, 235, 0.08)',
      borderColor: 'rgba(37, 99, 235, 0.25)',
      description: 'The vital few materials that tie up the majority of working capital. Tightest controls, JIT replenishment, and frequent physical cycle counts required.',
      rules: [
        'Daily / Weekly delivery schedule releases against blanket POs',
        'Minimal safety buffer (tight lean buffer)',
        'Mandatory weekly cycle counting verification'
      ],
      items: classA
    },
    {
      classId: 'B',
      title: 'Class B — Moderate Value Materials',
      targetShare: `${parameters.ABC_Class_B_Percentage || 20}%`,
      actualShare: `${pctB}%`,
      count: classB.length,
      valuation: valB,
      themeColor: '#d97706',
      bgLight: 'rgba(217, 119, 6, 0.08)',
      borderColor: 'rgba(217, 119, 6, 0.25)',
      description: 'Intermediary volume materials with standard carrying cost. Balanced replenishment based on monthly demand forecasting.',
      rules: [
        'Fortnightly / Monthly batch replenishment orders',
        'Standard 15-day safety buffer',
        'Monthly physical cycle count reconciliation'
      ],
      items: classB
    },
    {
      classId: 'C',
      title: 'Class C — Bulk Consumables & Low-Cost SKUs',
      targetShare: `${parameters.ABC_Class_C_Percentage || 10}%`,
      actualShare: `${pctC}%`,
      count: classC.length,
      valuation: valC,
      themeColor: '#64748b',
      bgLight: 'rgba(100, 116, 139, 0.08)',
      borderColor: 'rgba(100, 116, 139, 0.25)',
      description: 'Numerous low-value parts, welding wires, and shopfloor consumables. Bulk purchasing allowed to eliminate administrative overhead.',
      rules: [
        'Quarterly bulk procurement or two-bin Kanban system',
        'High safety stock allowable (low financial holding penalty)',
        'Quarterly or semi-annual inventory audits'
      ],
      items: classC
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top Pareto Explanation Bar */}
      <div 
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '10px',
          padding: '16px 20px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              ABC Pareto Working Capital Stratification
            </h3>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
              Target split: Class A ({parameters.ABC_Class_A_Percentage || 70}%), Class B ({parameters.ABC_Class_B_Percentage || 20}%), Class C ({parameters.ABC_Class_C_Percentage || 10}%). Materials automatically sorted by annual consumption value.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenParamModal}
          style={{
            padding: '7px 14px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Adjust Pareto % Target Shares
        </button>
      </div>

      {/* 3 Pareto Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {cards.map((card) => (
          <div
            key={card.classId}
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '10px',
              border: `1px solid ${card.borderColor}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Card Header */}
            <div 
              style={{
                padding: '16px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: card.bgLight,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span 
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: card.themeColor,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '15px'
                  }}
                >
                  {card.classId}
                </span>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Class {card.classId} Materials
                  </h4>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {card.count} SKUs • Target: {card.targetShare}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: card.themeColor }}>
                  {card.actualShare}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  of Store Capital
                </div>
              </div>
            </div>

            {/* Valuation Metric */}
            <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current Stock Valuation:</span>
              <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{formatCurrency(card.valuation)}</strong>
            </div>

            {/* Description & Rules */}
            <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {card.description}
              </p>

              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  IATF 16949 Control Rules
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {card.rules.map((rule, rIdx) => (
                    <li key={rIdx}>{rule}</li>
                  ))}
                </ul>
              </div>

              {/* Top Materials List */}
              <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Top Materials in Class {card.classId}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {card.items.slice(0, 4).map((item) => (
                    <div 
                      key={item._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '5px 8px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-secondary)',
                        fontSize: '11px'
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.Material_ID?.name || 'Material'}
                      </span>
                      <span style={{ color: card.themeColor, fontWeight: 700 }}>
                        {formatCurrency(item.valuation)}
                      </span>
                    </div>
                  ))}
                  {card.items.length === 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '4px 0' }}>
                      No materials currently classified as Class {card.classId}.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AbcParetoDeck;
