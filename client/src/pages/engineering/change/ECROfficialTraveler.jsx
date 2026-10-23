import React from 'react';
import {
  Printer, ShieldCheck, QrCode, FileText, CheckCircle2, Lock
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../../utils/money';

export const ECROfficialTraveler = ({
  selectedECR,
  affectedItems = [],
  impactForm = {},
  approvals = []
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* ── PRINT ACTION BAR (HIDDEN IN PRINT) ──────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        padding: '10px 14px',
        borderRadius: 8,
        border: '1px solid var(--border-color)',
        flexWrap: 'wrap',
        gap: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={16} color="#f59e0b" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Official Automotive Engineering Change Order (ECO) Release Notice
          </span>
        </div>

        <button
          onClick={() => window.print()}
          className="btn btn-primary"
          style={{
            fontSize: 12,
            padding: '6px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)'
          }}
        >
          <Printer size={13} />
          <span>Print ECO Notice</span>
        </button>
      </div>

      {/* ── PRINTABLE ECO DOCUMENT CONTAINER ────────────────────────────── */}
      <div
        id="printable-eco"
        style={{
          background: 'var(--surface-canvas)',
          border: '1px solid var(--border-color)',
          borderRadius: 8,
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16
        }}
      >
        {/* Document Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid var(--border-color)',
          paddingBottom: 14
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              PRECISION AUTO COMPONENTS PVT LTD
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
              Engineering Change Notice & Release Authorization (IATF 16949 / APQP Section 4.4)
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: '0.12em',
              background: 'var(--bg-primary)',
              padding: '2px 8px',
              border: '1px solid var(--border-color)',
              borderRadius: 4,
              color: 'var(--text-primary)'
            }}>
              *{selectedECR.ecrNumber}*
            </div>
            <span style={{ fontSize: 9.5, color: 'var(--text-secondary)' }}>CONTROLLED DOCUMENT</span>
          </div>
        </div>

        {/* Change Order Core Metadata Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 12,
          background: 'var(--bg-secondary)',
          padding: '12px 14px',
          borderRadius: 6,
          border: '1px solid var(--border-color)',
          fontSize: 12
        }}>
          <div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Change Notice No.</span>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>
              {selectedECR.ecrNumber}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Change Category</span>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedECR.changeType}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Priority Level</span>
            <div style={{ fontWeight: 700, color: selectedECR.priority === 'Urgent/Line-Down' ? '#f43f5e' : 'var(--text-primary)' }}>
              {selectedECR.priority}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Target Cutover Date</span>
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedECR.targetImplementationDate ? new Date(selectedECR.targetImplementationDate).toLocaleDateString() : 'Immediate'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Approval Status</span>
            <div style={{ marginTop: 2 }}>
              <StatusBadge value={selectedECR.status} />
            </div>
          </div>

          <div>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Stock Disposition</span>
            <div style={{ fontWeight: 700, color: '#059669' }}>
              {impactForm.inventoryDisposition || 'Use Existing'}
            </div>
          </div>
        </div>

        {/* Change Title & Reason */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
            Subject: {selectedECR.title}
          </div>
          <div style={{
            fontSize: 11.5,
            color: 'var(--text-primary)',
            padding: '10px 12px',
            background: 'var(--bg-primary)',
            borderRadius: 5,
            border: '1px solid var(--border-color)',
            lineHeight: 1.45
          }}>
            <strong>Engineering Justification / Defect Root Cause:</strong><br />
            {selectedECR.reasonForChange || 'No reason specified'}
          </div>
        </div>

        {/* Affected Assets Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>
            Affected Bills of Material, Process Sheets & Product Masters:
          </span>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, border: '1px solid var(--border-color)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px' }}>Type</th>
                <th style={{ padding: '6px 8px' }}>Asset Code</th>
                <th style={{ padding: '6px 8px' }}>Asset Description</th>
                <th style={{ padding: '6px 8px' }}>Pre-Change Rev</th>
                <th style={{ padding: '6px 8px' }}>Post-Change Rev</th>
              </tr>
            </thead>
            <tbody>
              {affectedItems.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: 12, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No specific items attached.
                  </td>
                </tr>
              ) : (
                affectedItems.map(item => (
                  <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '6px 8px', fontWeight: 600 }}>{item.itemType}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700 }}>
                      {item.bomId?.bomCode || item.routingId?.routingCode || item.productId?.code || '—'}
                    </td>
                    <td style={{ padding: '6px 8px' }}>
                      {item.bomId?.bomName || item.routingId?.routingName || item.productId?.name || '—'}
                    </td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace' }}>{item.currentRevisionCode || 'v1.0'}</td>
                    <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
                      {item.newRevisionCode || 'Pending Cutover'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Cost & Impact Notes */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          fontSize: 11
        }}>
          <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 5, border: '1px solid var(--border-color)' }}>
            <strong>Estimated Financial Impact:</strong>
            <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 800, marginTop: 4, color: (impactForm.costImpactEstimated || 0) < 0 ? '#059669' : '#d97706' }}>
              {fmtMoneyFull(impactForm.costImpactEstimated || 0)}
            </div>
          </div>
          <div style={{ padding: 10, background: 'var(--bg-secondary)', borderRadius: 5, border: '1px solid var(--border-color)' }}>
            <strong>Routing & Tooling Notes:</strong>
            <div style={{ marginTop: 4, color: 'var(--text-secondary)' }}>
              {impactForm.routingImpactNotes || 'Standard production line flow maintained.'}
            </div>
          </div>
        </div>

        {/* Official Signatures Runway */}
        <div style={{
          marginTop: 10,
          paddingTop: 12,
          borderTop: '2px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          textAlign: 'center'
        }}>
          {['Design Engineering', 'Quality Assurance', 'Production Operations', 'Plant Management'].map((role, i) => {
            const appr = approvals[i];
            const isApproved = appr?.approvalStatus === 'Approved';
            return (
              <div key={role} style={{ border: '1px solid var(--border-color)', borderRadius: 4, padding: 8, background: 'var(--bg-secondary)' }}>
                <span style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  {role}
                </span>
                <div style={{ height: 35, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isApproved ? (
                    <span style={{ color: '#059669', fontWeight: 800, fontSize: 12 }}>
                      ✓ APPROVED
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: 10, fontStyle: 'italic' }}>
                      {appr ? appr.approvalStatus : 'Pending Sign-off'}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 9, color: 'var(--text-secondary)', borderTop: '1px dashed var(--border-color)', paddingTop: 4 }}>
                  {appr?.assignedUserId?.name || 'Authorized Signatory'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ECROfficialTraveler;
