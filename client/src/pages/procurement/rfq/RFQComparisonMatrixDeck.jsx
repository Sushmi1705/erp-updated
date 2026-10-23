import React, { useState } from 'react';
import { 
  Award, Clock, ShieldAlert, CheckCircle2, ChevronRight, 
  Send, Plus, Building2, Package, TrendingDown, AlertTriangle, 
  Sparkles, Check, DollarSign, Calendar, Eye, Lock
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const RFQComparisonMatrixDeck = ({
  rfqs = [],
  selectedRfq,
  onSelectRfq,
  onSaveQuote,
  onSelectWinningQuote,
  onAddNew,
  awardingBidId,
  savingQuote
}) => {
  const [activeTab, setActiveTab] = useState('matrix'); // 'matrix' or 'addQuote'
  const [quoteVendorId, setQuoteVendorId] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteLeadTime, setQuoteLeadTime] = useState('');

  if (!selectedRfq && rfqs.length > 0) {
    onSelectRfq(rfqs[0]);
  }

  const isSealed = selectedRfq?.sourcingType === 'Sealed Bid';
  const isPastDeadline = selectedRfq?.submissionDeadline ? new Date(selectedRfq.submissionDeadline) < new Date() : false;
  const isMasked = isSealed && !isPastDeadline;

  // Find highest scoring bid
  let highestScoreId = null;
  if (!isMasked && selectedRfq?.bids) {
    let maxScore = -1;
    selectedRfq.bids.forEach(b => {
      if (b.score && b.score.finalWeightedScore > maxScore && b.status !== 'Disqualified') {
        maxScore = b.score.finalWeightedScore;
        highestScoreId = b._id;
      }
    });
  }

  const handleQuoteSubmit = (e) => {
    e.preventDefault();
    if (!quoteVendorId || !quotePrice || !quoteLeadTime) return;
    onSaveQuote({
      vendorId: quoteVendorId,
      offeredUnitPrice: parseFloat(quotePrice),
      offeredLeadTimeDays: parseInt(quoteLeadTime, 10)
    });
    setQuoteVendorId('');
    setQuotePrice('');
    setQuoteLeadTime('');
    setActiveTab('matrix');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Sourcing Event Carousel / Selector Cards */}
      <div style={{
        display: 'flex',
        gap: '10px',
        overflowX: 'auto',
        paddingBottom: '8px'
      }}>
        {rfqs.map(rfq => {
          const isSelected = selectedRfq?._id === rfq._id;
          const rfqSealed = rfq.sourcingType === 'Sealed Bid';
          const rfqClosed = new Date(rfq.submissionDeadline) < new Date();
          const bidsCount = rfq.bids?.length || 0;

          return (
            <div
              key={rfq._id}
              onClick={() => onSelectRfq(rfq)}
              style={{
                minWidth: '220px',
                maxWidth: '260px',
                background: isSelected 
                  ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, var(--bg-secondary) 100%)' 
                  : 'var(--bg-secondary)',
                border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '12px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                flexShrink: 0,
                boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.2)' : '0 2px 4px rgba(0,0,0,0.03)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)'
                }}>
                  {rfq.rfqNumber}
                </span>

                <span style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '4px',
                  background: rfq.status === 'Awarded' ? '#dcfce7' : rfqSealed ? '#fee2e2' : 'var(--bg-tertiary)',
                  color: rfq.status === 'Awarded' ? '#15803d' : rfqSealed ? '#b91c1c' : 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px'
                }}>
                  {rfqSealed && <Lock size={9} />}
                  {rfq.status}
                </span>
              </div>

              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginTop: '6px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {rfq.title}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                marginTop: '6px',
                paddingTop: '6px',
                borderTop: '1px solid var(--border-color)'
              }}>
                <span>{bidsCount} {bidsCount === 1 ? 'quote' : 'quotes'} in</span>
                <span style={{ color: rfqClosed ? '#ef4444' : 'var(--text-secondary)' }}>
                  {rfqClosed ? 'Closed' : 'Active'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Selected RFQ Bid Evaluation Deck */}
      {!selectedRfq ? (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '60px 20px',
          textAlign: 'center',
          color: 'var(--text-secondary)'
        }}>
          <Award size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <h3>No Sourcing Event Selected</h3>
          <p style={{ fontSize: '12px', marginTop: '4px' }}>Choose a price request from above or create a new tender.</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
        }}>
          {/* Sourcing Event Dossier Header */}
          <div style={{
            padding: '16px 20px',
            background: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '12px',
                  color: 'var(--accent-primary)',
                  background: 'var(--bg-secondary)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-color)'
                }}>
                  {selectedRfq.rfqNumber}
                </span>

                <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {selectedRfq.title}
                </h2>

                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: selectedRfq.status === 'Awarded' ? '#dcfce7' : 'rgba(99, 102, 241, 0.1)',
                  color: selectedRfq.status === 'Awarded' ? '#15803d' : '#6366f1'
                }}>
                  {selectedRfq.status}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                <span>Type: <strong>{selectedRfq.sourcingType}</strong></span>
                <span>•</span>
                <span>Closing Deadline: <strong>{new Date(selectedRfq.submissionDeadline).toLocaleString('en-IN')}</strong> {isPastDeadline ? '(Closed)' : ''}</span>
                <span>•</span>
                <span>Invited: <strong>{selectedRfq.invitedVendors?.length || 0} Suppliers</strong></span>
              </div>
            </div>

            {/* Tab Toggles: Matrix vs Enter Quote */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setActiveTab('matrix')}
                style={{
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: activeTab === 'matrix' ? 600 : 500,
                  borderRadius: '6px',
                  background: activeTab === 'matrix' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: activeTab === 'matrix' ? '#ffffff' : 'var(--text-secondary)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              >
                Compare Quotes ({selectedRfq.bids?.length || 0})
              </button>

              {selectedRfq.status !== 'Awarded' && !isPastDeadline && (
                <button
                  onClick={() => setActiveTab('addQuote')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: activeTab === 'addQuote' ? 600 : 500,
                    borderRadius: '6px',
                    background: activeTab === 'addQuote' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                    color: activeTab === 'addQuote' ? '#ffffff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    cursor: 'pointer'
                  }}
                >
                  + Record Supplier Quote
                </button>
              )}
            </div>
          </div>

          {/* Sourcing Event Main Body */}
          <div style={{ padding: '20px' }}>
            {activeTab === 'addQuote' ? (
              /* Quote Entry Form */
              <div style={{
                maxWidth: '600px',
                margin: '0 auto',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '20px'
              }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                  Record Supplier Quotation
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px 0' }}>
                  Log an official price quote submitted by vendor via email, portal, or phone.
                </p>

                <form onSubmit={handleQuoteSubmit}>
                  <div className="input-group">
                    <label className="input-label">Supplier / Vendor *</label>
                    <select
                      className="input-field"
                      required
                      value={quoteVendorId}
                      onChange={(e) => setQuoteVendorId(e.target.value)}
                    >
                      <option value="">Select invited supplier</option>
                      {selectedRfq.invitedVendors?.map(v => (
                        <option key={v._id} value={v._id}>{v.name} ({v.code || 'VEN'})</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div className="input-group">
                      <label className="input-label">Offered Unit Price (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="input-field"
                        required
                        placeholder="e.g. 450.00"
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(e.target.value)}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Delivery Lead Time (Days) *</label>
                      <input
                        type="number"
                        min="1"
                        className="input-field"
                        required
                        placeholder="e.g. 7"
                        value={quoteLeadTime}
                        onChange={(e) => setQuoteLeadTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setActiveTab('matrix')}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={savingQuote}
                    >
                      {savingQuote ? 'Recording Quote...' : 'Save & Auto-Score Quote'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Bid Comparison Matrix Cards */
              <div>
                {/* Sealed Bid Masking Alert */}
                {isMasked && (
                  <div style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#ef4444',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px'
                  }}>
                    <Lock size={18} style={{ flexShrink: 0 }} />
                    <div>
                      <strong style={{ display: 'block', marginBottom: '2px' }}>
                        Sealed Bid Vault Active — Quotes Encrypted
                      </strong>
                      In accordance with PAC competitive procurement governance, pricing and lead times remain securely encrypted until closing date ({new Date(selectedRfq.submissionDeadline).toLocaleString('en-IN')}) to eliminate supplier undercutting.
                    </div>
                  </div>
                )}

                {(!selectedRfq.bids || selectedRfq.bids.length === 0) ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '50px 20px',
                    color: 'var(--text-secondary)'
                  }}>
                    <Clock size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                    <p style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 600 }}>
                      No quotations received yet for this event.
                    </p>
                    <p style={{ margin: '0 0 16px 0', fontSize: '11px' }}>
                      Suppliers have been invited. You can also record quotes manually using the button above.
                    </p>
                    {selectedRfq.status !== 'Awarded' && (
                      <button
                        onClick={() => setActiveTab('addQuote')}
                        className="btn btn-primary"
                        style={{ fontSize: '11px', padding: '6px 14px' }}
                      >
                        + Record First Supplier Quote
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '16px'
                  }}>
                    {selectedRfq.bids.map(bid => {
                      const isBestOffer = bid._id === highestScoreId;
                      const isAwarded = bid.status === 'Awarded';
                      const isDisqualified = bid.status === 'Disqualified';

                      return (
                        <div
                          key={bid._id}
                          style={{
                            background: isAwarded 
                              ? '#ecfdf5' 
                              : isBestOffer 
                                ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, var(--bg-primary) 100%)' 
                                : 'var(--bg-primary)',
                            border: isAwarded 
                              ? '2px solid #10b981' 
                              : isBestOffer 
                                ? '2px solid var(--accent-primary)' 
                                : '1px solid var(--border-color)',
                            borderRadius: '10px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px',
                            position: 'relative',
                            boxShadow: isBestOffer ? '0 4px 14px rgba(99, 102, 241, 0.15)' : '0 2px 4px rgba(0,0,0,0.03)'
                          }}
                        >
                          {/* Best Value Ribbon */}
                          {isBestOffer && !isMasked && !isAwarded && (
                            <div style={{
                              position: 'absolute',
                              top: '-10px',
                              right: '14px',
                              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                              color: '#ffffff',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 6px rgba(99, 102, 241, 0.4)'
                            }}>
                              <Sparkles size={11} /> #1 Best Evaluation
                            </div>
                          )}

                          {isAwarded && (
                            <div style={{
                              position: 'absolute',
                              top: '-10px',
                              right: '14px',
                              background: '#10b981',
                              color: '#ffffff',
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              ✓ Contract Awarded
                            </div>
                          )}

                          {/* Vendor Name & Code */}
                          <div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                              Bidding Vendor
                            </div>
                            <h4 style={{
                              fontSize: '15px',
                              fontWeight: 700,
                              margin: '2px 0 0 0',
                              color: 'var(--text-primary)'
                            }}>
                              {bid.vendorId?.name || 'Approved Supplier'}
                            </h4>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                              Status: <strong style={{ color: isAwarded ? '#10b981' : isDisqualified ? '#ef4444' : 'var(--text-primary)' }}>{bid.status}</strong>
                            </div>
                          </div>

                          {/* Price & Lead Time Card */}
                          <div style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '8px'
                          }}>
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Offered Price:</div>
                              <div style={{
                                fontSize: '15px',
                                fontWeight: 800,
                                color: isMasked ? 'var(--text-secondary)' : '#0d9488',
                                marginTop: '2px'
                              }}>
                                {isMasked ? '*** Sealed' : fmtMoneyFull(bid.offeredUnitPrice)}
                              </div>
                            </div>

                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Lead Time:</div>
                              <div style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: isMasked ? 'var(--text-secondary)' : 'var(--text-primary)',
                                marginTop: '2px'
                              }}>
                                {isMasked ? '*** Sealed' : `${bid.offeredLeadTimeDays} days`}
                              </div>
                            </div>
                          </div>

                          {/* Weighted Scoring Gauge */}
                          {!isMasked && bid.score && (
                            <div style={{
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              padding: '10px 12px'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                  Multi-Criteria Score:
                                </span>
                                <strong style={{
                                  fontSize: '14px',
                                  color: isBestOffer ? 'var(--accent-primary)' : 'var(--text-primary)'
                                }}>
                                  {bid.score.finalWeightedScore?.toFixed(1)} / 100
                                </strong>
                              </div>

                              <div style={{
                                height: '5px',
                                borderRadius: '3px',
                                background: 'var(--bg-tertiary)',
                                overflow: 'hidden',
                                margin: '6px 0'
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${Math.min(100, bid.score.finalWeightedScore || 0)}%`,
                                  background: isBestOffer ? '#6366f1' : '#10b981',
                                  borderRadius: '3px'
                                }} />
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)' }}>
                                <span>Price: {bid.score.priceScore?.toFixed(0)} pts</span>
                                <span>Lead Time: {bid.score.leadTimeScore?.toFixed(0)} pts</span>
                              </div>
                            </div>
                          )}

                          {/* Award Action Button */}
                          {selectedRfq.status !== 'Awarded' && selectedRfq.status !== 'Cancelled' && (
                            <button
                              onClick={() => onSelectWinningQuote(selectedRfq._id, bid._id)}
                              disabled={isMasked || awardingBidId === bid._id}
                              style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '12px',
                                fontWeight: 700,
                                borderRadius: '6px',
                                background: isMasked 
                                  ? 'var(--bg-tertiary)' 
                                  : isBestOffer 
                                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                                    : '#0284c7',
                                color: isMasked ? 'var(--text-secondary)' : '#ffffff',
                                border: 'none',
                                cursor: isMasked ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: isBestOffer && !isMasked ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
                              }}
                            >
                              <Award size={14} />
                              {isMasked 
                                ? 'Sealed until closing date' 
                                : awardingBidId === bid._id 
                                  ? 'Issuing Purchase Order...' 
                                  : 'Award Contract & Create PO'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RFQComparisonMatrixDeck;
