import React from 'react';
import { Printer, X, Award, CheckCircle2, AlertTriangle, ShieldAlert, FileText, Check } from 'lucide-react';

const getGrade = (score) => {
  if (score >= 90) return { grade: 'Grade A', label: 'Preferred Tier-1 Strategic Supplier', color: '#059669' };
  if (score >= 75) return { grade: 'Grade B', label: 'Standard Approved Supplier', color: '#2563eb' };
  return { grade: 'Grade C', label: 'At-Risk / Watchlist / Conditional', color: '#dc2626' };
};

const PerformancePrintModal = ({
  scorecard,
  onClose
}) => {
  if (!scorecard) return null;

  const vendor = scorecard.vendorId || {};
  const overallScore = scorecard.currentOverallScore || 0;
  const otif = scorecard.rollingOtifPct || 0;
  const ppm = scorecard.rollingDefectPpm || 0;
  const isBlocked = scorecard.riskStatus === 'Blocked';
  const isProbation = scorecard.riskStatus === 'Probation';
  const gradeInfo = getGrade(overallScore);

  const otifPoints = ((otif / 100) * 40).toFixed(1);
  const ppmFactor = Math.max(0, 1 - (ppm / 10000));
  const qualityPoints = (ppmFactor * 40).toFixed(1);
  const compliancePoints = isBlocked ? 0 : 20;

  const docNo = `AUD-VDA63-${vendor.code || 'SUP'}-${new Date().toISOString().slice(0,10).replace(/-/g, '')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1000
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          background: '#ffffff',
          color: '#1e293b',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Top Actions (Non-printable) */}
        <div 
          className="no-print"
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f8fafc'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#059669" />
            <span style={{ fontWeight: 600, fontSize: '14px' }}>
              Supplier Performance Audit Document Preview (VDA 6.3 / IATF 16949)
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 600,
                background: '#059669',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Sheet Body */}
        <div 
          id="printable-audit-sheet"
          style={{
            padding: '36px 40px',
            overflowY: 'auto',
            flex: 1,
            fontSize: '12px',
            lineHeight: 1.5,
            color: '#0f172a'
          }}
        >
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-audit-sheet, #printable-audit-sheet * {
                visibility: visible;
              }
              #printable-audit-sheet {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                padding: 20mm !important;
                margin: 0 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>

          {/* ── Document Header ────────────────────────────────────────────── */}
          <div style={{
            borderBottom: '2px solid #0f172a',
            paddingBottom: '16px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                PRECISION AUTO COMPONENTS PVT LTD
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                Plant 1: Sector 58, IMT Faridabad, Haryana - 121004 | IATF 16949:2016 Certified
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669', marginTop: '6px' }}>
                SUPPLIER QUALITY ASSURANCE & PERIODIC RATING AUDIT REPORT
              </div>
            </div>

            <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
              <div><strong>Audit Ref:</strong> {docNo}</div>
              <div><strong>Date:</strong> {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
              <div><strong>Standard:</strong> VDA 6.3 / IATF 16949 cl. 8.4</div>
            </div>
          </div>

          {/* ── Supplier Profile Info Grid ──────────────────────────────────── */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            fontSize: '11px'
          }}>
            <div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Vendor Name: </span>
                <strong>{vendor.name || 'Tata Steel Ltd'}</strong>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>Vendor Code: </span>
                <strong>{vendor.code || 'VEN-001'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Category / Commodity: </span>
                <strong>{vendor.category || 'Raw Materials / Coil Sheet'}</strong>
              </div>
            </div>

            <div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>GSTIN / Tax ID: </span>
                <strong>{vendor.gstin || '06AABCT1332L1Z4'}</strong>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#64748b' }}>QMS Certificate: </span>
                <strong style={{ color: isBlocked ? '#dc2626' : '#059669' }}>
                  {isBlocked ? 'EXPIRED / SUSPENDED' : 'ISO 9001:2015 / IATF 16949 (Active)'}
                </strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Assessment Cycle: </span>
                <strong>Rolling 90-Day Continuous Evaluation</strong>
              </div>
            </div>
          </div>

          {/* ── Executive Rating Badge Box ──────────────────────────────────── */}
          <div style={{
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '16px 20px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: overallScore >= 90 ? '#f0fdf4' : overallScore >= 75 ? '#eff6ff' : '#fef2f2'
          }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', fontWeight: 600 }}>
                Consolidated Quality Rating
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: gradeInfo.color, marginTop: '2px' }}>
                {gradeInfo.grade} — {gradeInfo.label}
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                Purchasing Recommendation: <strong>{isBlocked ? 'DO NOT ORDER (BLOCKED)' : isProbation ? 'CONDITIONAL (PROBATION)' : 'PREFERRED TIER-1 SOURCING'}</strong>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '32px', fontWeight: 900, color: gradeInfo.color, lineHeight: 1 }}>
                {overallScore.toFixed(1)}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                TOTAL SCORE OUT OF 100
              </div>
            </div>
          </div>

          {/* ── Tri-Pillar Quantitative Evaluation Matrix ───────────────────── */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px', textTransform: 'uppercase' }}>
              1. Quantitative Pillar Breakdown
            </div>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid #cbd5e1',
              fontSize: '11px'
            }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px' }}>Pillar</th>
                  <th style={{ padding: '8px 10px' }}>Measured Metric</th>
                  <th style={{ padding: '8px 10px' }}>IATF Benchmark</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Weightage</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Score Achieved</th>
                  <th style={{ padding: '8px 10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>1. Delivery Discipline</td>
                  <td style={{ padding: '8px 10px' }}>{otif.toFixed(1)}% Rolling OTIF</td>
                  <td style={{ padding: '8px 10px' }}>≥ 95.0% On-Time</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>40%</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{otifPoints} / 40.0</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ color: otif >= 90 ? '#059669' : '#d97706', fontWeight: 600 }}>
                      {otif >= 90 ? 'Compliant' : 'Improvement Required'}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>2. Quality & Defect PPM</td>
                  <td style={{ padding: '8px 10px' }}>{ppm.toLocaleString()} PPM</td>
                  <td style={{ padding: '8px 10px' }}>≤ 50 PPM Target</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>40%</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{qualityPoints} / 40.0</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ color: ppm <= 500 ? '#059669' : '#dc2626', fontWeight: 600 }}>
                      {ppm <= 500 ? 'Acceptable' : 'Defect Spike'}
                    </span>
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ padding: '8px 10px', fontWeight: 600 }}>3. System & Compliance</td>
                  <td style={{ padding: '8px 10px' }}>{isBlocked ? 'Expired Cert' : 'ISO 9001 / IATF'}</td>
                  <td style={{ padding: '8px 10px' }}>Valid Accreditation</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>20%</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>{compliancePoints}.0 / 20.0</td>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ color: isBlocked ? '#dc2626' : '#059669', fontWeight: 600 }}>
                      {isBlocked ? 'Non-Compliant' : 'Certified'}
                    </span>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                  <td colSpan={3} style={{ padding: '8px 10px' }}>Consolidated Total Performance Score:</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>100%</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: gradeInfo.color, fontSize: '12px' }}>
                    {overallScore.toFixed(1)} / 100
                  </td>
                  <td style={{ padding: '8px 10px', color: gradeInfo.color }}>
                    {gradeInfo.grade}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* ── Corrective Action Requirements (CAPA) ───────────────────────── */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            padding: '12px 14px',
            marginBottom: '28px',
            fontSize: '11px'
          }}>
            <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
              2. Quality Assurance Directives & CAPA Mandate:
            </div>
            <ul style={{ paddingLeft: '18px', margin: 0, color: '#334155' }}>
              <li>Suppliers maintaining <strong>Grade A (≥90)</strong> receive priority PO distribution and expedited receiving dock clearance.</li>
              <li>Suppliers falling into <strong>Grade B (75-89.9)</strong> must conduct root-cause review for any delivery slips exceeding 3 calendar days.</li>
              <li>Suppliers in <strong>Grade C (&lt;75) or Blocked status</strong> are prohibited from new Purchase Order allocation until an 8D CAPA report is submitted and approved by Precision Auto Components SQA.</li>
            </ul>
          </div>

          {/* ── Four Signature Approval Blocks ──────────────────────────────── */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#475569', marginBottom: '8px' }}>
              3. Verification & Sign-off Authority
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              fontSize: '10px'
            }}>
              {[
                { title: 'SQA Lead Engineer', role: 'Prepared By' },
                { title: 'Head of Quality Assurance', role: 'Verified By' },
                { title: 'VP Sourcing & Procurement', role: 'Approved By' },
                { title: 'Supplier Quality Representative', role: 'Acknowledged By' }
              ].map((sig, idx) => (
                <div key={idx} style={{
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  padding: '10px',
                  height: '75px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: '#f8fafc'
                }}>
                  <div style={{ color: '#64748b' }}>{sig.role}:</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>{sig.title}</div>
                    <div style={{ borderTop: '1px dashed #94a3b8', marginTop: '4px', paddingTop: '2px', color: '#94a3b8' }}>
                      Sign & Stamp
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformancePrintModal;
