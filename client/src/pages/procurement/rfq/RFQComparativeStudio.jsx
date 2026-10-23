import React, { useState } from 'react';
import { 
  Award, Clock, ShieldCheck, CheckCircle2, ChevronRight, 
  Plus, Building2, Package, TrendingDown, AlertTriangle, 
  Sparkles, Check, DollarSign, Calendar, Lock, FileText,
  Search, X, Printer, Trash2, ArrowRight, ShieldAlert,
  Percent, Zap
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const RFQComparativeStudio = ({
  rfqs = [],
  selectedRfq,
  onSelectRfq,
  onSaveQuote,
  onSelectWinningQuote,
  onAddNew,
  onPrintReport,
  onDeleteRfq,
  vendors = [],
  awardingBidId,
  savingQuote
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All'); // 'All', 'Open', 'Sealed', 'Awarded'
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [quoteVendorId, setQuoteVendorId] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteLeadTime, setQuoteLeadTime] = useState('');
  const [quotePaymentTerms, setQuotePaymentTerms] = useState('Net 30 Days');
  const [quoteRemarks, setQuoteRemarks] = useState('');

  // Auto-select first RFQ if none selected
  if (!selectedRfq && rfqs.length > 0) {
    onSelectRfq(rfqs[0]);
  }

  // Filter left list
  const filteredRfqs = rfqs.filter(r => {
    const num = r.rfqNumber?.toLowerCase() || '';
    const title = r.title?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    const matchesSearch = !search || num.includes(search) || title.includes(search);

    let matchesFilter = true;
    if (filterType === 'Open') matchesFilter = r.status === 'Open';
    else if (filterType === 'Sealed') matchesFilter = r.sourcingType === 'Sealed Bid';
    else if (filterType === 'Awarded') matchesFilter = r.status === 'Awarded';

    return matchesSearch && matchesFilter;
  });

  const isSealed = selectedRfq?.sourcingType === 'Sealed Bid';
  const isPastDeadline = selectedRfq?.submissionDeadline ? new Date(selectedRfq.submissionDeadline) < new Date() : false;
  const isMasked = isSealed && !isPastDeadline;

  // Bids on the active RFQ
  const bids = selectedRfq?.bids || [];

  // Determine lowest price and fastest lead time for badges
  let lowestPrice = Infinity;
  let fastestLeadTime = Infinity;
  let highestScoreId = null;
  let maxScore = -1;

  if (!isMasked && bids.length > 0) {
    bids.forEach(b => {
      const price = typeof b.offeredUnitPrice === 'number' ? b.offeredUnitPrice : parseFloat(b.offeredUnitPrice);
      if (!isNaN(price) && price < lowestPrice && b.status !== 'Disqualified') {
        lowestPrice = price;
      }
      if (b.offeredLeadTimeDays && b.offeredLeadTimeDays < fastestLeadTime && b.status !== 'Disqualified') {
        fastestLeadTime = b.offeredLeadTimeDays;
      }
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
      offeredLeadTimeDays: parseInt(quoteLeadTime, 10),
      paymentTerms: quotePaymentTerms,
      remarks: quoteRemarks
    });
    setQuoteVendorId('');
    setQuotePrice('');
    setQuoteLeadTime('');
    setQuotePaymentTerms('Net 30 Days');
    setQuoteRemarks('');
    setIsAddingQuote(false);
  };

  return (
    <div style={{
      display: 'flex',
      gap: '16px',
      height: 'calc(100vh - 215px)',
      minHeight: '520px',
      overflow: 'hidden'
    }}>
      {/* ── LEFT PANEL: SOURCING TRAY / TENDERS INBOX (320px) ───────────────── */}
      <div style={{
        width: '320px',
        flexShrink: 0,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Tray Header */}
        <div style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--border-color)',
          background: 'var(--surface-canvas)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Active Sourcing Tenders
            </span>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: '10px',
              background: '#2563eb',
              color: '#ffffff'
            }}>
              {rfqs.length}
            </span>
          </div>

          {/* Quick Search */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--surface-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '5px 8px'
          }}>
            <Search size={13} color="var(--text-secondary)" />
            <input
              type="text"
              placeholder="Filter by RFQ # or material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                width: '100%',
                color: 'var(--text-primary)'
              }}
            />
            {searchTerm && (
              <X size={12} color="var(--text-secondary)" cursor="pointer" onClick={() => setSearchTerm('')} />
            )}
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {['All', 'Open', 'Sealed', 'Awarded'].map(tab => (
              <button
                key={tab}
                onClick={() => setFilterType(tab)}
                style={{
                  flex: 1,
                  padding: '3px 0',
                  fontSize: '11px',
                  fontWeight: filterType === tab ? 600 : 500,
                  background: filterType === tab ? '#2563eb' : 'transparent',
                  color: filterType === tab ? '#ffffff' : 'var(--text-secondary)',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable RFQ List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
        }}>
          {filteredRfqs.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>
              No price requests found matching criteria.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {filteredRfqs.map(rfq => {
                const isSelected = selectedRfq?._id === rfq._id;
                const rfqSealed = rfq.sourcingType === 'Sealed Bid';
                const rfqClosed = new Date(rfq.submissionDeadline) < new Date();
                const bidsCount = rfq.bids?.length || 0;
                const isAwarded = rfq.status === 'Awarded';

                return (
                  <div
                    key={rfq._id}
                    onClick={() => onSelectRfq(rfq)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #2563eb' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(37, 99, 235, 0.04)' : 'var(--surface-card)',
                      boxShadow: isSelected ? '0 1px 4px rgba(37, 99, 235, 0.12)' : 'none',
                      transition: 'all 0.12s ease',
                      position: 'relative'
                    }}
                  >
                    {/* Top Row: RFQ Number & Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{
                        fontSize: '11.5px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color: isSelected ? '#2563eb' : 'var(--text-primary)'
                      }}>
                        {rfq.rfqNumber}
                      </span>

                      {isAwarded ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Check size={10} strokeWidth={3} /> Awarded
                        </span>
                      ) : rfqSealed ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(245, 158, 11, 0.12)',
                          color: '#d97706',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <Lock size={10} /> Sealed Vault
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#2563eb'
                        }}>
                          Open Tender
                        </span>
                      )}
                    </div>

                    {/* Scope / Material Title */}
                    <div style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      lineHeight: '1.35',
                      marginBottom: '6px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {rfq.title || 'Direct Raw Material Sourcing'}
                    </div>

                    {/* Bottom Metadata: Quotations count & closing date */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span style={{
                        fontWeight: 600,
                        color: bidsCount >= 2 ? '#059669' : bidsCount > 0 ? '#2563eb' : 'var(--text-secondary)'
                      }}>
                        {bidsCount} {bidsCount === 1 ? 'quote' : 'quotes'} logged
                      </span>

                      <span>
                        {rfqClosed ? 'Deadline Passed' : `Closes ${new Date(rfq.submissionDeadline).toLocaleDateString()}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: SOURCING STUDIO & BID COMPARISON MATRIX ─────────────── */}
      <div style={{
        flex: 1,
        background: 'var(--surface-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {selectedRfq ? (
          <>
            {/* Dossier Header */}
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-color)',
              background: 'var(--surface-canvas)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: '#2563eb',
                    color: '#ffffff'
                  }}>
                    {selectedRfq.rfqNumber}
                  </span>

                  <h2 style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {selectedRfq.title}
                  </h2>

                  {isSealed ? (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(245, 158, 11, 0.12)',
                      color: '#d97706',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Lock size={11} /> Sealed Tender Protocol
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#059669'
                    }}>
                      Open Market RFQ
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '4px', flexWrap: 'wrap' }}>
                  {selectedRfq.requisitionId && (
                    <span>PR Ref: <strong style={{ color: 'var(--text-primary)' }}>{selectedRfq.requisitionId?.requisitionNumber || 'PR Linked'}</strong></span>
                  )}
                  <span>Target Date: <strong style={{ color: 'var(--text-primary)' }}>{new Date(selectedRfq.submissionDeadline).toLocaleDateString()}</strong></span>
                  {selectedRfq.estimatedBudget > 0 && (
                    <span>Target Budget: <strong style={{ color: 'var(--text-primary)' }}>{fmtMoneyFull(selectedRfq.estimatedBudget)}</strong></span>
                  )}
                  <span>Invited Vendors: <strong style={{ color: 'var(--text-primary)' }}>{selectedRfq.invitedVendors?.length || 0}</strong></span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setIsAddingQuote(!isAddingQuote)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: isAddingQuote ? 'var(--surface-card)' : '#2563eb',
                    color: isAddingQuote ? 'var(--text-primary)' : '#ffffff',
                    border: isAddingQuote ? '1px solid var(--border-color)' : 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: isAddingQuote ? 'none' : '0 2px 4px rgba(37,99,235,0.2)'
                  }}
                >
                  <Plus size={14} />
                  <span>{isAddingQuote ? 'Close Quote Form' : 'Record Quote'}</span>
                </button>

                <button
                  onClick={onPrintReport}
                  title="Print Comparative Quotation Statement"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    background: 'var(--surface-card)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Printer size={13} />
                </button>

                {onDeleteRfq && selectedRfq.status !== 'Awarded' && (
                  <button
                    onClick={() => onDeleteRfq(selectedRfq._id)}
                    title="Delete RFQ"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 10px',
                      fontSize: '12px',
                      background: 'rgba(239, 68, 68, 0.08)',
                      color: '#dc2626',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Quick Quote Logger Drawer / Bar */}
            {isAddingQuote && (
              <form onSubmit={handleQuoteSubmit} style={{
                background: 'rgba(37, 99, 235, 0.03)',
                borderBottom: '1.5px solid rgba(37, 99, 235, 0.25)',
                padding: '14px 18px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'flex-end'
              }}>
                <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Select Supplier / Vendor *
                  </label>
                  <select
                    value={quoteVendorId}
                    onChange={(e) => setQuoteVendorId(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">-- Choose invited supplier --</option>
                    {vendors.map(v => (
                      <option key={v._id} value={v._id}>
                        {v.name} ({v.vendorCode || 'VND'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ width: '130px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Offered Unit Rate (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 58500"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div style={{ width: '110px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Lead Time (Days) *
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5"
                    value={quoteLeadTime}
                    onChange={(e) => setQuoteLeadTime(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <div style={{ width: '130px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Payment Terms
                  </label>
                  <select
                    value={quotePaymentTerms}
                    onChange={(e) => setQuotePaymentTerms(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="Net 30 Days">Net 30 Days</option>
                    <option value="Net 45 Days">Net 45 Days</option>
                    <option value="Net 60 Days">Net 60 Days</option>
                    <option value="100% Advance">100% Advance</option>
                    <option value="Against Delivery">Against Delivery</option>
                  </select>
                </div>

                <div style={{ flex: '1 1 180px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Freight / Technical Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Free delivery at Hosur plant..."
                    value={quoteRemarks}
                    onChange={(e) => setQuoteRemarks(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--surface-card)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingQuote}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: savingQuote ? 'not-allowed' : 'pointer'
                  }}
                >
                  {savingQuote ? 'Saving...' : 'Save & Score Quote'}
                </button>
              </form>
            )}

            {/* Sealed Bid Vault Banner if active */}
            {isMasked && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                borderBottom: '1px solid rgba(245, 158, 11, 0.25)',
                padding: '10px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12px',
                color: '#b45309'
              }}>
                <Lock size={16} />
                <span>
                  <strong>Sealed Bid Protocol Active:</strong> Supplier quotation rates remain encrypted and masked until the submission deadline ({new Date(selectedRfq.submissionDeadline).toLocaleDateString()}). PO conversion is locked to ensure compliance with automotive procurement guidelines.
                </span>
              </div>
            )}

            {/* Scrollable Comparison Arena */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              {/* 1. Side-by-Side Quotation Cards */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Supplier Quotations ({bids.length})
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Auto-scored: 70% Price + 30% Lead Time × Vendor Quality
                    </span>
                  </div>

                  {bids.length >= 2 && (
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#059669',
                      background: 'rgba(16, 185, 129, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      ✓ Committee Sourcing Minimum (2+ Quotes) Met
                    </span>
                  )}
                </div>

                {bids.length === 0 ? (
                  <div style={{
                    padding: '36px 20px',
                    background: 'var(--surface-canvas)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <Building2 size={28} color="var(--text-secondary)" style={{ margin: '0 auto 8px auto' }} />
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                      No quotations received yet for this tender
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 14px 0' }}>
                      Log quotations received via email or supplier portal to begin competitive scoring.
                    </p>
                    <button
                      onClick={() => setIsAddingQuote(true)}
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      + Record First Quote
                    </button>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '14px'
                  }}>
                    {bids.map(bid => {
                      const vendor = bid.vendorId || {};
                      const vendorName = vendor.name || 'Vendor Partner';
                      const vendorCode = vendor.vendorCode || 'VND';
                      const vendorRating = vendor.rating || 4.5;
                      const isWinning = selectedRfq.awardedVendorId?._id === vendor._id || bid.status === 'Awarded';
                      const isBestValue = bid._id === highestScoreId;
                      const unitPrice = typeof bid.offeredUnitPrice === 'number' ? bid.offeredUnitPrice : parseFloat(bid.offeredUnitPrice);
                      const isLowest = !isMasked && !isNaN(unitPrice) && unitPrice === lowestPrice;
                      const isFastest = !isMasked && bid.offeredLeadTimeDays === fastestLeadTime;
                      const score = bid.score?.finalWeightedScore || 0;

                      return (
                        <div
                          key={bid._id}
                          style={{
                            background: isWinning 
                              ? 'rgba(16, 185, 129, 0.04)' 
                              : isBestValue 
                              ? 'rgba(37, 99, 235, 0.03)' 
                              : 'var(--surface-card)',
                            border: isWinning 
                              ? '1.5px solid #059669' 
                              : isBestValue 
                              ? '1.5px solid #2563eb' 
                              : '1px solid var(--border-color)',
                            borderRadius: '8px',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            position: 'relative',
                            boxShadow: isBestValue ? '0 2px 8px rgba(37,99,235,0.1)' : 'none'
                          }}
                        >
                          {/* Top Badges */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '10px',
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 700,
                              color: 'var(--text-secondary)'
                            }}>
                              {vendorCode}
                            </span>

                            {isWinning ? (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: '#059669',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <Check size={11} strokeWidth={3} /> Awarded PO
                              </span>
                            ) : isBestValue ? (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: '#2563eb',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}>
                                <Award size={11} /> #1 Best Evaluation
                              </span>
                            ) : null}
                          </div>

                          {/* Vendor Name */}
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                              {vendorName}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span>Reliability:</span>
                              <strong style={{ color: '#059669' }}>★ {vendorRating.toFixed(1)}</strong>
                            </div>
                          </div>

                          {/* Price & Lead Time Numbers */}
                          <div style={{
                            padding: '10px',
                            background: 'var(--surface-canvas)',
                            borderRadius: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <div>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>Offered Rate:</span>
                              <span style={{
                                fontSize: '16px',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                fontFamily: 'var(--font-mono)'
                              }}>
                                {isMasked ? '*** (Sealed)' : fmtMoneyFull(unitPrice)}
                              </span>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary)', display: 'block' }}>Lead Time:</span>
                              <span style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                color: 'var(--text-primary)'
                              }}>
                                {bid.offeredLeadTimeDays} Days
                              </span>
                            </div>
                          </div>

                          {/* Comparative Delta Pills */}
                          {!isMasked && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              {isLowest ? (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  color: '#059669'
                                }}>
                                  💰 L1 Best Price
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 500,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  color: '#dc2626'
                                }}>
                                  +{(((unitPrice - lowestPrice) / lowestPrice) * 100).toFixed(1)}% vs L1
                                </span>
                              )}

                              {isFastest && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  color: '#2563eb'
                                }}>
                                  ⚡ Fastest Lead Time
                                </span>
                              )}
                            </div>
                          )}

                          {/* Sourcing Score Breakdown */}
                          {!isMasked && score > 0 && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>Automated Sourcing Score:</span>
                                <strong style={{ color: isBestValue ? '#2563eb' : 'var(--text-primary)' }}>
                                  {score.toFixed(1)} / 100
                                </strong>
                              </div>
                              <div style={{
                                height: '5px',
                                width: '100%',
                                background: 'var(--surface-canvas)',
                                borderRadius: '3px',
                                overflow: 'hidden'
                              }}>
                                <div style={{
                                  height: '100%',
                                  width: `${Math.min(score, 100)}%`,
                                  background: isBestValue ? '#2563eb' : '#94a3b8',
                                  borderRadius: '3px'
                                }} />
                              </div>
                            </div>
                          )}

                          {/* Award Contract Button */}
                          <div style={{ marginTop: 'auto', paddingTop: '6px' }}>
                            {isWinning ? (
                              <button
                                disabled
                                style={{
                                  width: '100%',
                                  padding: '6px 0',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  background: 'rgba(16, 185, 129, 0.15)',
                                  color: '#059669',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'default'
                                }}
                              >
                                ✓ Contract Awarded
                              </button>
                            ) : selectedRfq.status === 'Awarded' ? (
                              <button
                                disabled
                                style={{
                                  width: '100%',
                                  padding: '6px 0',
                                  fontSize: '11px',
                                  color: 'var(--text-secondary)',
                                  background: 'var(--surface-canvas)',
                                  borderRadius: '6px',
                                  border: '1px solid var(--border-color)',
                                  cursor: 'default'
                                }}
                              >
                                Tender Concluded
                              </button>
                            ) : isMasked ? (
                              <button
                                disabled
                                style={{
                                  width: '100%',
                                  padding: '6px 0',
                                  fontSize: '11px',
                                  color: '#d97706',
                                  background: 'rgba(245, 158, 11, 0.08)',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(245, 158, 11, 0.2)',
                                  cursor: 'not-allowed'
                                }}
                              >
                                Sealed Until Deadline
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Award tender ${selectedRfq.rfqNumber} to ${vendorName} at ${fmtMoneyFull(unitPrice)} and generate Purchase Order?`)) {
                                    onSelectWinningQuote(selectedRfq._id, bid._id);
                                  }
                                }}
                                disabled={awardingBidId === bid._id}
                                style={{
                                  width: '100%',
                                  padding: '7px 0',
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  background: isBestValue ? '#059669' : 'var(--surface-card)',
                                  color: isBestValue ? '#ffffff' : 'var(--text-primary)',
                                  borderRadius: '6px',
                                  border: isBestValue ? 'none' : '1px solid var(--border-color)',
                                  cursor: awardingBidId === bid._id ? 'not-allowed' : 'pointer',
                                  boxShadow: isBestValue ? '0 2px 4px rgba(5,150,105,0.2)' : 'none'
                                }}
                              >
                                {awardingBidId === bid._id ? 'Issuing PO...' : 'Award Tender & Issue PO'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Side-by-Side Comparative Specification Matrix Table */}
              {bids.length > 0 && !isMasked && (
                <div style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid var(--border-color)',
                    background: 'var(--surface-canvas)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: 'var(--text-primary)'
                  }}>
                    Side-by-Side Parameter Matrix
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'var(--surface-canvas)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '8px 12px', textAlign: 'left', width: '220px' }}>Evaluation Metric</th>
                          {bids.map(b => (
                            <th key={b._id} style={{ padding: '8px 12px', textAlign: 'left' }}>
                              {b.vendorId?.name || 'Vendor'}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Offered Unit Price</td>
                          {bids.map(b => (
                            <td key={b._id} style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                              {fmtMoneyFull(b.offeredUnitPrice)}
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Delivery Lead Time</td>
                          {bids.map(b => (
                            <td key={b._id} style={{ padding: '8px 12px' }}>
                              {b.offeredLeadTimeDays} Calendar Days
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Payment Terms</td>
                          {bids.map(b => (
                            <td key={b._id} style={{ padding: '8px 12px' }}>
                              {b.paymentTerms || 'Net 30 Days'}
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Vendor Reliability Rating</td>
                          {bids.map(b => (
                            <td key={b._id} style={{ padding: '8px 12px' }}>
                              ★ {b.vendorId?.rating || 4.5}
                            </td>
                          ))}
                        </tr>

                        <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--surface-canvas)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--text-primary)' }}>Composite Sourcing Score</td>
                          {bids.map(b => (
                            <td key={b._id} style={{ padding: '8px 12px', fontWeight: 700, color: '#2563eb' }}>
                              {b.score?.finalWeightedScore ? `${b.score.finalWeightedScore.toFixed(1)} / 100` : '—'}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-secondary)',
            fontSize: '13px'
          }}>
            <FileText size={36} color="var(--text-secondary)" style={{ marginBottom: '10px' }} />
            <p>Select a price request on the left to evaluate quotations.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RFQComparativeStudio;
