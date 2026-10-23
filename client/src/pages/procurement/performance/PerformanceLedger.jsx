import React, { useState } from 'react';
import { 
  Search, Star, ShieldAlert, CheckCircle2, AlertTriangle, 
  ArrowRight, Truck, Award, Eye, FileText, Check, ShieldCheck,
  Zap, Download, Filter, TrendingDown, Layers
} from 'lucide-react';

const getGrade = (score) => {
  if (score >= 90) return { grade: 'Grade A', label: 'Preferred Tier-1', color: '#059669', bg: 'rgba(16, 185, 129, 0.1)' };
  if (score >= 75) return { grade: 'Grade B', label: 'Standard Approved', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.1)' };
  return { grade: 'Grade C', label: 'At-Risk / Watchlist', color: '#dc2626', bg: 'rgba(239, 68, 68, 0.1)' };
};

const PerformanceLedger = ({
  scorecards = [],
  onSelectScorecard,
  onOpenStudio,
  onOpenSimulator,
  onPrintAudit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'GradeA', 'GradeB', 'GradeC', 'Approved', 'Probation', 'Blocked'
  const [sortBy, setSortBy] = useState('score-desc'); // 'score-desc', 'score-asc', 'otif-desc', 'ppm-asc', 'name-asc'

  // Filter & Sort Logic
  const filteredData = scorecards.filter(row => {
    const name = row.vendorId?.name?.toLowerCase() || '';
    const code = row.vendorId?.code?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    const matchesSearch = !search || name.includes(search) || code.includes(search);

    if (!matchesSearch) return false;

    const overallScore = row.currentOverallScore || 0;
    if (statusFilter === 'GradeA') return overallScore >= 90;
    if (statusFilter === 'GradeB') return overallScore >= 75 && overallScore < 90;
    if (statusFilter === 'GradeC') return overallScore < 75;
    if (statusFilter === 'Approved') return row.riskStatus === 'Approved';
    if (statusFilter === 'Probation') return row.riskStatus === 'Probation';
    if (statusFilter === 'Blocked') return row.riskStatus === 'Blocked';

    return true;
  }).sort((a, b) => {
    if (sortBy === 'score-desc') return (b.currentOverallScore || 0) - (a.currentOverallScore || 0);
    if (sortBy === 'score-asc') return (a.currentOverallScore || 0) - (b.currentOverallScore || 0);
    if (sortBy === 'otif-desc') return (b.rollingOtifPct || 0) - (a.rollingOtifPct || 0);
    if (sortBy === 'ppm-asc') return (a.rollingDefectPpm || 0) - (b.rollingDefectPpm || 0);
    if (sortBy === 'name-asc') return (a.vendorId?.name || '').localeCompare(b.vendorId?.name || '');
    return 0;
  });

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ['Supplier Name,Code,Risk Status,Grade,Overall Score,OTIF %,Defect PPM,Last Calculated'];
    const rows = filteredData.map(s => {
      const name = `"${s.vendorId?.name || ''}"`;
      const code = s.vendorId?.code || '';
      const status = s.riskStatus || 'Approved';
      const grade = getGrade(s.currentOverallScore || 0).grade;
      const score = (s.currentOverallScore || 0).toFixed(1);
      const otif = (s.rollingOtifPct || 0).toFixed(1);
      const ppm = s.rollingDefectPpm || 0;
      const date = s.lastCalculated ? new Date(s.lastCalculated).toISOString().split('T')[0] : '';
      return [name, code, status, grade, score, otif, ppm, date].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Supplier_Performance_Matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      flex: 1,
      minHeight: '520px',
      height: 'calc(100vh - 215px)'
    }}>
      {/* ── Control Bar: Search, Status Filters & Sorters ────────────────────── */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Search Input */}
        <div style={{
          position: 'relative',
          width: '280px',
          maxWidth: '100%'
        }}>
          <Search size={14} color="var(--text-secondary)" style={{
            position: 'absolute',
            left: '10px',
            top: '50%',
            transform: 'translateY(-50%)'
          }} />
          <input
            type="text"
            placeholder="Search supplier name or code..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              fontSize: '12px',
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              outline: 'none'
            }}
          />
        </div>

        {/* Status Filter Chips */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          flexWrap: 'wrap'
        }}>
          {[
            { id: 'All', label: 'All Suppliers' },
            { id: 'GradeA', label: 'Grade A (≥90)' },
            { id: 'GradeB', label: 'Grade B (75-89)' },
            { id: 'GradeC', label: 'Grade C (<75)' },
            { id: 'Approved', label: 'Approved' },
            { id: 'Probation', label: 'Probation' },
            { id: 'Blocked', label: 'Blocked' }
          ].map(f => {
            const active = statusFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: active ? 600 : 500,
                  borderRadius: '16px',
                  border: active ? '1px solid #059669' : '1px solid var(--border-color)',
                  background: active ? 'rgba(16, 185, 129, 0.1)' : 'var(--surface-canvas)',
                  color: active ? '#059669' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Sort & Export Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="score-desc">Sort by: Score (High → Low)</option>
            <option value="score-asc">Sort by: Score (Low → High)</option>
            <option value="otif-desc">Sort by: OTIF % (Highest)</option>
            <option value="ppm-asc">Sort by: Defect PPM (Lowest)</option>
            <option value="name-asc">Sort by: Name (A → Z)</option>
          </select>

          <button
            onClick={handleExportCSV}
            title="Export filtered matrix to CSV"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              background: 'var(--surface-canvas)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <Download size={13} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* ── Table Container ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        overflow: 'hidden',
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ overflowX: 'auto', flex: 1 }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '12px'
          }}>
            <thead>
              <tr style={{
                background: 'var(--surface-canvas)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <th style={{ padding: '10px 16px' }}>Rank & Supplier</th>
                <th style={{ padding: '10px 12px' }}>Order Eligibility</th>
                <th style={{ padding: '10px 12px' }}>Quality Tier</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Delivery OTIF %</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Defect PPM</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Overall Score</th>
                <th style={{ padding: '10px 14px' }}>Last Evaluation</th>
                <th style={{ padding: '10px 16px', textAlign: 'right' }}>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={24} color="var(--status-caution-fg)" />
                      <span style={{ fontWeight: 600, fontSize: '13px' }}>No suppliers match current filter</span>
                      <span style={{ fontSize: '12px' }}>Try clearing the search query or status filter.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map((row, idx) => {
                  const score = row.currentOverallScore || 0;
                  const otif = row.rollingOtifPct || 0;
                  const ppm = row.rollingDefectPpm || 0;
                  const grade = getGrade(score);
                  const isBlocked = row.riskStatus === 'Blocked';
                  const isProbation = row.riskStatus === 'Probation';

                  // OTIF bar color
                  const otifColor = otif >= 90 ? '#059669' : otif >= 75 ? '#d97706' : '#dc2626';

                  return (
                    <tr 
                      key={row._id || idx}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        transition: 'background 0.1s',
                        background: isBlocked ? 'rgba(239, 68, 68, 0.02)' : 'transparent'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-canvas)'}
                      onMouseLeave={e => e.currentTarget.style.background = isBlocked ? 'rgba(239, 68, 68, 0.02)' : 'transparent'}
                    >
                      {/* Rank & Supplier */}
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '12px',
                            background: idx < 3 ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-canvas)',
                            color: idx < 3 ? '#059669' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: idx < 3 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                            flexShrink: 0
                          }}>
                            {idx + 1}
                          </span>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
                              {row.vendorId?.name || 'Unnamed Supplier'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', gap: '6px' }}>
                              <span>Code: {row.vendorId?.code || 'SUP-N/A'}</span>
                              {row.vendorId?.category && (
                                <>
                                  <span>•</span>
                                  <span>{row.vendorId.category}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Order Eligibility */}
                      <td style={{ padding: '12px 12px' }}>
                        {isBlocked ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#dc2626',
                            border: '1px solid rgba(239, 68, 68, 0.25)'
                          }}>
                            <ShieldAlert size={11} /> Blocked
                          </span>
                        ) : isProbation ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: 'rgba(245, 158, 11, 0.1)',
                            color: '#b45309',
                            border: '1px solid rgba(245, 158, 11, 0.25)'
                          }}>
                            <AlertTriangle size={11} /> On Probation
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#059669',
                            border: '1px solid rgba(16, 185, 129, 0.25)'
                          }}>
                            <CheckCircle2 size={11} /> Approved
                          </span>
                        )}
                      </td>

                      {/* Quality Tier Grade */}
                      <td style={{ padding: '12px 12px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: grade.bg,
                          color: grade.color,
                          border: `1px solid ${grade.color}40`
                        }}>
                          <Award size={11} />
                          {grade.grade}
                        </span>
                      </td>

                      {/* Delivery OTIF % */}
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                          <span style={{ fontWeight: 700, color: otifColor, fontSize: '12px' }}>
                            {otif.toFixed(1)}%
                          </span>
                          <div style={{
                            width: '64px',
                            height: '4px',
                            background: 'var(--surface-canvas)',
                            borderRadius: '2px',
                            overflow: 'hidden',
                            border: '1px solid var(--border-color)'
                          }}>
                            <div style={{
                              width: `${Math.min(100, Math.max(0, otif))}%`,
                              height: '100%',
                              background: otifColor
                            }} />
                          </div>
                        </div>
                      </td>

                      {/* Defect PPM */}
                      <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                        <div>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '12px',
                            color: ppm > 2500 ? '#dc2626' : ppm > 500 ? '#d97706' : '#059669'
                          }}>
                            {ppm.toLocaleString()} PPM
                          </span>
                          <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                            {ppm === 0 ? 'Zero Defect' : ppm > 2500 ? 'High Defect Rate' : 'Acceptable'}
                          </div>
                        </div>
                      </td>

                      {/* Overall Composite Score */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: 'var(--surface-canvas)',
                          border: '1px solid var(--border-color)',
                          fontWeight: 700,
                          fontSize: '12px',
                          color: 'var(--text-primary)'
                        }}>
                          <Star size={12} fill="#d97706" color="#d97706" />
                          <span>{score.toFixed(1)}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>/ 100</span>
                        </div>
                      </td>

                      {/* Last Evaluation */}
                      <td style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {row.lastCalculated ? (
                          <div>
                            <div>{new Date(row.lastCalculated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                              {new Date(row.lastCalculated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : 'Never'}
                      </td>

                      {/* Quick Actions */}
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => {
                              onSelectScorecard(row);
                              onOpenStudio();
                            }}
                            title="Inspect 360° Supplier Dossier"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 9px',
                              fontSize: '11px',
                              fontWeight: 600,
                              background: '#059669',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <Eye size={12} />
                            <span>Dossier</span>
                          </button>

                          <button
                            onClick={() => {
                              onSelectScorecard(row);
                              onOpenSimulator();
                            }}
                            title="Record manual delivery/QA event"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '5px 7px',
                              fontSize: '11px',
                              background: 'var(--surface-canvas)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <Zap size={12} />
                          </button>

                          <button
                            onClick={() => onPrintAudit(row)}
                            title="Print IATF / VDA 6.3 Audit Sheet"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '5px 7px',
                              fontSize: '11px',
                              background: 'var(--surface-canvas)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '5px',
                              cursor: 'pointer'
                            }}
                          >
                            <FileText size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--surface-canvas)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}>
          <div>
            Showing <strong>{filteredData.length}</strong> of <strong>{scorecards.length}</strong> suppliers
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span><strong>Grade A:</strong> Score ≥ 90 (Tier-1 Strategic)</span>
            <span><strong>Grade B:</strong> Score 75 - 89.9 (Approved)</span>
            <span><strong>Grade C:</strong> Score &lt; 75 (High Risk Watchlist)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceLedger;
