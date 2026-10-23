import React from 'react';
import {
  FileText, Plus, Search, DollarSign, Layers, CheckCircle2,
  AlertTriangle, ShieldCheck, Clock, Award, Filter, RefreshCw
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

export const QuotationCommandBar = ({
  headers = [],
  revisions = [],
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  customerFilter,
  setCustomerFilter,
  customers = [],
  onOpenCreateModal,
  loading
}) => {
  // Aggregate KPIs
  const totalQuotes = headers.length;
  const quotesWithInquiry = headers.filter(h => h.inquiryId).length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      background: 'linear-gradient(135deg, #07172c 0%, #0f274a 40%, #1e1b4b 100%)',
      border: '1px solid rgba(245, 158, 11, 0.35)',
      borderRadius: 10,
      padding: '14px 18px',
      boxShadow: '0 4px 22px rgba(0, 0, 0, 0.32)',
      color: '#ffffff'
    }}>
      {/* ── TOP ROW: BRANDING & ACTION ───────────────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 18px rgba(245, 158, 11, 0.45)'
          }}>
            <DollarSign size={24} color="#07172c" strokeWidth={2.6} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: '-0.02em',
                margin: 0,
                color: '#ffffff',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                Commercial Quotation Studio
              </h1>
              <span style={{
                fontSize: 10.5,
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.5)',
                color: '#fbbf24',
                letterSpacing: '0.04em'
              }}>
                MULTI-VERSION PRICING & MARGIN STUDIO
              </span>
            </div>
            <p style={{
              fontSize: 12,
              color: '#94a3b8',
              margin: '3px 0 0 0',
              fontWeight: 400
            }}>
              Customer Price Proposals, Multi-Revision Versioning, Margin Guardrails & GST Financial Breakdown
            </p>
          </div>
        </div>

        {/* Create Quotation Button */}
        <button
          type="button"
          onClick={onOpenCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#07172c',
            border: 'none',
            borderRadius: 6,
            padding: '8px 16px',
            fontSize: 13,
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 12px rgba(245, 158, 11, 0.35)',
            transition: 'transform 0.15s ease'
          }}
        >
          <Plus size={16} strokeWidth={3} />
          <span>Add Quotation</span>
        </button>
      </div>

      {/* ── KPI TELEMETRY CARDS ─────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: 10
      }}>
        {/* Total Quotations */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={17} color="#fbbf24" />
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>
              Total Quotations
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
              {totalQuotes} <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Proposals</span>
            </div>
          </div>
        </div>

        {/* From Inquiries */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: 'rgba(0, 180, 216, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Layers size={17} color="#00b4d8" />
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>
              Inquiry Conversions
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
              {quotesWithInquiry} <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>from RFQs</span>
            </div>
          </div>
        </div>

        {/* Direct Quotes */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Award size={17} color="#34d399" />
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>
              Direct Pricing Deals
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
              {totalQuotes - quotesWithInquiry} <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Direct</span>
            </div>
          </div>
        </div>

        {/* Target Customers */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: 8,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={17} color="#a78bfa" />
          </div>
          <div>
            <div style={{ fontSize: 10, textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>
              Enterprise Customers
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>
              {new Set(headers.map(h => h.customerId?._id || h.customerId)).size} <span style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>Accounts</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER STRIP ───────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
        paddingTop: 4
      }}>
        {/* Search Input */}
        <div style={{
          position: 'relative',
          flex: '1 1 280px',
          maxWidth: 380
        }}>
          <Search
            size={14}
            color="#94a3b8"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search quotation #, customer, inquiry #, sales rep…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: 6,
              padding: '6px 12px 6px 32px',
              fontSize: 12,
              color: '#ffffff',
              outline: 'none'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {['All', 'Draft', 'Pending Approval', 'Approved', 'Sent to Customer', 'Accepted', 'Rejected'].map(s => {
            const isSelected = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                style={{
                  background: isSelected ? '#f59e0b' : 'rgba(255, 255, 255, 0.08)',
                  color: isSelected ? '#07172c' : '#cbd5e1',
                  border: isSelected ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 20,
                  padding: '3px 10px',
                  fontSize: 11,
                  fontWeight: isSelected ? 800 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {s}
              </button>
            );
          })}

          {/* Customer Dropdown */}
          <select
            value={customerFilter}
            onChange={e => setCustomerFilter(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              color: '#ffffff',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All" style={{ background: '#0f172a', color: '#fff' }}>All Customers</option>
            {customers.map(c => (
              <option key={c._id} value={c._id} style={{ background: '#0f172a', color: '#fff' }}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default QuotationCommandBar;
