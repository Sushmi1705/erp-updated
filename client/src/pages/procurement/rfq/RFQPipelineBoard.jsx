import React from 'react';
import { 
  Award, Clock, Lock, CheckCircle2, ShieldAlert, ArrowRight, 
  FileText, Users, Sparkles, Building2, Package, Check
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const PIPELINE_COLUMNS = [
  { id: 'Open', title: 'Open Market Tenders', color: '#2563eb', bg: 'rgba(37, 99, 235, 0.08)' },
  { id: 'Sealed', title: 'Sealed Bid Vault', color: '#d97706', bg: 'rgba(245, 158, 11, 0.08)' },
  { id: 'Scoring', title: 'Scoring & Evaluation', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.08)' },
  { id: 'Awarded', title: 'Awarded & PO Issued', color: '#059669', bg: 'rgba(16, 185, 129, 0.08)' }
];

const RFQPipelineBoard = ({
  rfqs = [],
  onSelectRfq,
  onOpenDeck
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '14px',
      alignItems: 'start'
    }}>
      {PIPELINE_COLUMNS.map(col => {
        const colRfqs = rfqs.filter(r => {
          if (col.id === 'Awarded') return r.status === 'Awarded';
          if (col.id === 'Scoring') return (r.bids?.length || 0) >= 2 && r.status !== 'Awarded';
          if (col.id === 'Sealed') return r.sourcingType === 'Sealed Bid' && r.status !== 'Awarded' && (r.bids?.length || 0) < 2;
          if (col.id === 'Open') return r.sourcingType === 'Standard RFQ' && r.status !== 'Awarded' && (r.bids?.length || 0) < 2;
          return false;
        });

        return (
          <div
            key={col.id}
            style={{
              background: 'var(--surface-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              minHeight: '480px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            {/* Column Header */}
            <div style={{
              padding: '12px 14px',
              background: col.bg,
              borderBottom: `2px solid ${col.color}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {col.title}
                </span>
                <div style={{ fontSize: '10.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {colRfqs.length} sourcing {colRfqs.length === 1 ? 'tender' : 'tenders'}
                </div>
              </div>

              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'var(--surface-card)',
                color: col.color,
                border: `1px solid ${col.color}`
              }}>
                {colRfqs.length}
              </span>
            </div>

            {/* Event Cards Container */}
            <div style={{
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              flex: 1,
              overflowY: 'auto',
              maxHeight: '680px'
            }}>
              {colRfqs.length === 0 ? (
                <div style={{
                  padding: '30px 10px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontStyle: 'italic',
                  opacity: 0.7
                }}>
                  No tenders currently in this stage
                </div>
              ) : (
                colRfqs.map(rfq => {
                  const bidsCount = rfq.bids?.length || 0;
                  const isClosed = new Date(rfq.submissionDeadline) < new Date();
                  const firstLine = rfq.items?.[0];

                  return (
                    <div
                      key={rfq._id}
                      style={{
                        background: 'var(--surface-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = col.color;
                        e.currentTarget.style.boxShadow = '0 3px 8px rgba(0,0,0,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.03)';
                      }}
                    >
                      {/* Top Bar: RFQ Number & Type */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '11px',
                          color: '#2563eb'
                        }}>
                          {rfq.rfqNumber}
                        </span>

                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: rfq.sourcingType === 'Sealed Bid' ? '#d97706' : '#2563eb',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          {rfq.sourcingType === 'Sealed Bid' && <Lock size={10} />}
                          {rfq.sourcingType}
                        </span>
                      </div>

                      {/* Title & Material */}
                      <div 
                        onClick={() => {
                          onSelectRfq(rfq);
                          onOpenDeck();
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <h4 style={{
                          fontSize: '12.5px',
                          fontWeight: 700,
                          margin: 0,
                          color: 'var(--text-primary)',
                          lineHeight: 1.3
                        }}>
                          {rfq.title}
                        </h4>

                        <div style={{
                          fontSize: '11px',
                          color: 'var(--text-secondary)',
                          marginTop: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Package size={11} />
                          {firstLine?.materialId?.name || 'Raw Material Scope'}
                        </div>
                      </div>

                      {/* Quotations Count & Deadline Strip */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: 'var(--surface-canvas)',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        fontSize: '11px'
                      }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Quotes Received:</span>
                        <strong style={{ fontSize: '11.5px', color: bidsCount > 0 ? '#059669' : 'var(--text-secondary)' }}>
                          {bidsCount}
                        </strong>
                      </div>

                      {/* Footer Actions */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '4px',
                        borderTop: '1px solid var(--border-color)',
                        fontSize: '11px'
                      }}>
                        <span style={{ color: isClosed ? '#dc2626' : 'var(--text-secondary)' }}>
                          {isClosed ? 'Closed' : `Due: ${new Date(rfq.submissionDeadline).toLocaleDateString()}`}
                        </span>

                        <button
                          onClick={() => {
                            onSelectRfq(rfq);
                            onOpenDeck();
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#2563eb',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px',
                            cursor: 'pointer',
                            padding: '2px 4px'
                          }}
                        >
                          Evaluate <ArrowRight size={11} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RFQPipelineBoard;
