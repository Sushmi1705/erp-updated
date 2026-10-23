import React from 'react';
import { Printer, X, Download, ShieldCheck, Factory, CheckCircle2 } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import { fmtQty } from '../../../utils/money';

const PlanPrintModal = ({
  isOpen,
  onClose,
  plan = null
}) => {
  if (!plan) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalQty = plan.details?.reduce((sum, d) => sum + (d.Target_Quantity || 0), 0) || 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Master Production Schedule (MPS)" maxWidth={900}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Printable Paper Document Container */}
        <div id="printable-mps-document" style={{
          backgroundColor: '#ffffff',
          color: '#0f172a',
          padding: '28px 32px',
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          {/* Header Block */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '2px solid #0f172a',
            paddingBottom: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: '#0f172a' }}>
                PRECISION AUTO COMPONENTS PVT LTD
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#e11d48' }}>
                LAXMI BALAJI AUTOMOTIVE GROUP — TIER-1 OEM SYSTEMS
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                Plant: {plan.Plant_ID?.name || 'Hosur Main Plant (Unit 1)'} · IATF 16949:2016 Certified
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-block',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}>
                MASTER PRODUCTION SCHEDULE (MPS)
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                Doc Ref: MPS-{plan.Plan_Number}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Date: {new Date().toLocaleDateString('en-GB')}
              </div>
            </div>
          </div>

          {/* Plan Metadata Strip */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '12px 14px',
            marginBottom: '18px',
            fontSize: '12px'
          }}>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Plan Number:</span>
              <strong style={{ fontFamily: 'monospace', fontSize: '13px' }}>{plan.Plan_Number}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Manufacturing Type:</span>
              <strong>{plan.Plan_Type}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Execution Priority:</span>
              <strong style={{ color: plan.Priority === 'Urgent' ? '#e11d48' : '#0f172a' }}>{plan.Priority}</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Capacity Validation:</span>
              <strong style={{ color: plan.Capacity_Status === 'Validated' ? '#059669' : '#d97706' }}>
                {plan.Capacity_Status || 'Unchecked'}
              </strong>
            </div>
          </div>

          {/* Part Lines Table */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              Scheduled Part Breakdown &amp; Dispatch Sequencing
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                  <th style={{ padding: '8px 10px', width: '40px' }}>Seq</th>
                  <th style={{ padding: '8px 12px' }}>Part Name / Description</th>
                  <th style={{ padding: '8px 10px' }}>Part No / Code</th>
                  <th style={{ padding: '8px 10px' }}>Grade</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Target Qty</th>
                  <th style={{ padding: '8px 10px' }}>Planned Start</th>
                  <th style={{ padding: '8px 10px' }}>Planned End</th>
                </tr>
              </thead>
              <tbody>
                {plan.details?.map((line, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 600 }}>
                      {line.Line_Sequence_Number || (idx + 1) * 10}
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>
                      {line.Material_ID?.name || 'Raw Component'}
                    </td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace' }}>
                      {line.Material_ID?.code || '-'}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#64748b' }}>
                      {line.Material_ID?.grade || 'Standard'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700 }}>
                      {fmtQty(line.Target_Quantity)}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>
                      {line.Planned_Start_Date ? new Date(line.Planned_Start_Date).toLocaleDateString() : '-'}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#475569' }}>
                      {line.Planned_End_Date ? new Date(line.Planned_End_Date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr style={{ backgroundColor: '#f8fafc', borderTop: '2px solid #cbd5e1', fontWeight: 700 }}>
                  <td colSpan="4" style={{ padding: '10px 12px', textAlign: 'right' }}>
                    TOTAL SCHEDULED RUN QUANTITY:
                  </td>
                  <td style={{ padding: '10px 10px', textAlign: 'right', fontSize: '13px', color: '#e11d48' }}>
                    {fmtQty(totalQty)} units
                  </td>
                  <td colSpan="2" style={{ padding: '10px 10px', color: '#64748b', fontSize: '10px' }}>
                    {plan.details?.length || 0} part line items
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Compliance & Authorization Sign-off Section */}
          <div style={{
            borderTop: '2px dashed #cbd5e1',
            paddingTop: '16px',
            marginTop: '20px'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '12px' }}>
              IATF 16949 Section 8.5.1 Multi-Tier Authorization Sign-Off
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px'
            }}>
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px', minHeight: '70px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>1. Prepared By</div>
                <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>Production Planner</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '20px' }}>Sign &amp; Date: ___________________</div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px', minHeight: '70px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>2. Capacity Validated By</div>
                <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>Manufacturing Engineering</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '20px' }}>Sign &amp; Date: ___________________</div>
              </div>

              <div style={{ border: '1px solid #e2e8f0', borderRadius: '4px', padding: '10px', minHeight: '70px' }}>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>3. Approved &amp; Released By</div>
                <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>Plant Manager / Head of Ops</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '20px' }}>Sign &amp; Date: ___________________</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePrint}
            style={{
              backgroundColor: '#e11d48',
              borderColor: '#e11d48',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Printer size={15} />
            Print MPS Schedule Document
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default PlanPrintModal;
