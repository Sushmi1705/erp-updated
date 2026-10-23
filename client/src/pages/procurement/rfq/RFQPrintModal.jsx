import React from 'react';
import { Printer, X, Award, ShieldAlert, CheckCircle2, Building2 } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import { fmtMoneyFull } from '../../../utils/money';

const RFQPrintModal = ({
  isOpen,
  onClose,
  rfq
}) => {
  if (!rfq) return null;

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const bids = rfq.bids || [];
  const winningBid = bids.find(b => b.status === 'Awarded') || bids[0];

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Sourcing Committee Bid Comparison & Award Voucher"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Action Toolbar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Official purchase committee award recommendation & competitive benchmarking document.
          </span>
          <button
            onClick={handlePrint}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              background: '#6366f1',
              color: '#ffffff',
              borderRadius: '6px',
              border: 'none',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <Printer size={14} /> Print Evaluation Sheet
          </button>
        </div>

        {/* Printable Document Box */}
        <div id="printable-rfq-sheet" style={{
          background: '#ffffff',
          color: '#0f172a',
          padding: '24px',
          borderRadius: '8px',
          border: '2px solid #cbd5e1',
          fontFamily: 'Inter, sans-serif'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            paddingBottom: '16px',
            borderBottom: '2px solid #0f172a',
            marginBottom: '16px'
          }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                PRECISION AUTO COMPONENTS PVT LTD
              </div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                Strategic Sourcing & Vendor Governance Division • Chennai Facility
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px' }}>
                Competitive Quotation Comparative Statement (CQS) • IATF 16949 Certified
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 700,
                background: '#6366f1',
                color: '#ffffff',
                padding: '3px 10px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                CQS EVALUATION VOUCHER
              </div>
              <div style={{ fontSize: '12px', color: '#0f172a', marginTop: '4px', fontWeight: 700 }}>
                {rfq.rfqNumber}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>
                Date: {currentDate}
              </div>
            </div>
          </div>

          {/* Sourcing Scope Meta */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.5fr 1fr 1fr',
            gap: '12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '16px',
            fontSize: '11px'
          }}>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Scope of Tender:</span>
              <strong style={{ color: '#0f172a', fontSize: '12px' }}>
                {rfq.title}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Tender Protocol:</span>
              <strong style={{ color: '#0f172a', fontSize: '12px' }}>
                {rfq.sourcingType}
              </strong>
            </div>

            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Evaluation Status:</span>
              <strong style={{ color: '#6366f1', fontSize: '12px' }}>
                {rfq.status}
              </strong>
            </div>
          </div>

          {/* Bid Comparison Table */}
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            marginBottom: '20px'
          }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #94a3b8' }}>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>#</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Bidding Supplier</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'right' }}>Unit Rate (₹)</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Lead Time</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Price Score (70%)</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Lead Score (30%)</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Weighted Total</th>
                <th style={{ padding: '8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>Decision</th>
              </tr>
            </thead>
            <tbody>
              {bids.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                    No supplier quotes recorded for this tender.
                  </td>
                </tr>
              ) : (
                bids.map((bid, idx) => {
                  const isWinning = bid.status === 'Awarded';

                  return (
                    <tr
                      key={bid._id || idx}
                      style={{
                        background: isWinning ? '#ecfdf5' : 'transparent',
                        borderBottom: '1px solid #e2e8f0'
                      }}
                    >
                      <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 700 }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '7px', border: '1px solid #cbd5e1' }}>
                        <strong style={{ color: '#0f172a' }}>{bid.vendorId?.name || 'Unknown Supplier'}</strong>
                        {isWinning && <span style={{ marginLeft: '6px', color: '#10b981', fontWeight: 700 }}>[AWARDED]</span>}
                      </td>
                      <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'right', fontWeight: 700, fontSize: '12px' }}>
                        {typeof bid.offeredUnitPrice === 'number' ? fmtMoneyFull(bid.offeredUnitPrice) : bid.offeredUnitPrice}
                      </td>
                      <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                        {typeof bid.offeredLeadTimeDays === 'number' ? `${bid.offeredLeadTimeDays} Days` : bid.offeredLeadTimeDays}
                      </td>
                      <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                        {bid.score?.priceScore ? `${bid.score.priceScore.toFixed(0)} pts` : '—'}
                      </td>
                      <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center' }}>
                        {bid.score?.leadTimeScore ? `${bid.score.leadTimeScore.toFixed(0)} pts` : '—'}
                      </td>
                      <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 800, color: '#6366f1' }}>
                        {bid.score?.finalWeightedScore ? `${bid.score.finalWeightedScore.toFixed(1)} / 100` : '—'}
                      </td>
                      <td style={{ padding: '7px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}>
                        {bid.status}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Sourcing Committee Recommendation Box */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            fontSize: '11px',
            lineHeight: 1.5
          }}>
            <strong style={{ color: '#0f172a', display: 'block', marginBottom: '2px' }}>
              Procurement Committee Recommendation:
            </strong>
            {winningBid ? (
              <span>
                Based on multi-criteria technical and financial evaluation, <strong>{winningBid.vendorId?.name}</strong> has been scored with highest composite rating of <strong>{winningBid.score?.finalWeightedScore?.toFixed(1) || '—'} pts</strong>. The committee authorizes issuance of formal Purchase Order under contract pricing.
              </span>
            ) : (
              <span>Tender remains in scoring and vendor evaluation stage.</span>
            )}
          </div>

          {/* Committee Sign-Off Matrix */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '14px',
            paddingTop: '16px',
            borderTop: '1px dashed #94a3b8',
            fontSize: '10px',
            color: '#334155'
          }}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: '22px' }}>1. Lead Buyer:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
              <div style={{ color: '#64748b', marginTop: '4px' }}>Bid Evaluation Officer</div>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: '22px' }}>2. Head of Procurement:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
              <div style={{ color: '#64748b', marginTop: '4px' }}>Purchase Authorization</div>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: '22px' }}>3. Quality Assurance:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
              <div style={{ color: '#64748b', marginTop: '4px' }}>Supplier Quality Rating</div>
            </div>

            <div>
              <div style={{ fontWeight: 700, marginBottom: '22px' }}>4. Chief Financial Officer:</div>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '90%' }}></div>
              <div style={{ color: '#64748b', marginTop: '4px' }}>Commercial Sign-Off</div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default RFQPrintModal;
