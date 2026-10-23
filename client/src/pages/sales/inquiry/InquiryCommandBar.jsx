import React from 'react';
import {
  FileText, Plus, Search, Target, Clock, ShieldCheck,
  TrendingUp, Lock, Award, DollarSign, Filter, RefreshCw
} from 'lucide-react';

export const InquiryCommandBar = ({
  headers = [],
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  inquiryTypeFilter,
  setInquiryTypeFilter,
  onOpenCreateModal,
  loading
}) => {
  // Aggregate KPI Calculations
  const totalInquiries = headers.length;
  const activeCount = headers.filter(h => h.status === 'New' || h.status === 'Active').length;
  const feasibilityCount = headers.filter(h => h.status === 'Feasibility Check').length;
  const quotedCount = headers.filter(h => h.status === 'Quoted' || h.quotationId).length;
  const wonCount = headers.filter(h => h.status === 'Closed-Won').length;
  const highProbabilityCount = headers.filter(h => (h.probabilityOfWin || 0) >= 60 && h.status !== 'Closed-Lost').length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      background: 'linear-gradient(135deg, #0b132b 0%, #1c2541 50%, #1e293b 100%)',
      border: '1px solid rgba(0, 180, 216, 0.25)',
      borderRadius: 10,
      padding: '14px 18px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.28)',
      color: '#ffffff'
    }}>
      {/* ── TOP ROW: BRANDING & EXECUTIVE ACTION ─────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 14
      }}>
        {/* Left: Branding & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(0, 180, 216, 0.45)'
          }}>
            <FileText size={22} color="#0b132b" strokeWidth={2.5} />
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
                Customer Inquiries & RFQ Deal Desk
              </h1>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 4,
                background: 'rgba(0, 180, 216, 0.15)',
                color: '#00b4d8',
                border: '1px solid rgba(0, 180, 216, 0.35)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                Automotive RFQ Radar
              </span>
            </div>
            <p style={{
              fontSize: 12,
              color: '#94a3b8',
              margin: '2px 0 0',
              fontWeight: 400
            }}>
              Tier-1 Customer RFQ Tracking, APQP Technical Feasibility Review & Win-Probability Pipeline
            </p>
          </div>
        </div>

        {/* Right: Add Inquiry Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onOpenCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)',
              color: '#0b132b',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(0, 180, 216, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Create Customer Inquiry</span>
          </button>
        </div>
      </div>

      {/* ── MIDDLE ROW: COMMERCIAL PIPELINE KPI CHIPS ─────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 10,
        paddingTop: 4
      }}>
        {/* KPI 1: Total Inquiries */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: 6,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'rgba(0, 180, 216, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00b4d8'
          }}>
            <FileText size={16} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Inquiries</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
              {totalInquiries} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>RFQs</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Active Leads */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: 6,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <Target size={16} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Active Evaluation</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
              {activeCount} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Leads</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Feasibility Review Gates */}
        <div style={{
          background: feasibilityCount > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(15, 23, 42, 0.65)',
          border: '1px solid',
          borderColor: feasibilityCount > 0 ? 'rgba(245, 158, 11, 0.35)' : 'rgba(148, 163, 184, 0.2)',
          borderRadius: 6,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b'
          }}>
            <Clock size={16} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: feasibilityCount > 0 ? '#fde68a' : '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Feasibility Checks</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: feasibilityCount > 0 ? '#f59e0b' : '#ffffff', fontFamily: 'monospace' }}>
              {feasibilityCount} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Pending</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Quoted & Locked */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: 6,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa'
          }}>
            <Lock size={16} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Quotations Sent</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#a78bfa', fontFamily: 'monospace' }}>
              {quotedCount} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Quoted</span>
            </div>
          </div>
        </div>

        {/* KPI 5: High Win Probability Deals */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: 6,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <Award size={16} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>High Win Chance (≥60%)</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
              {highProbabilityCount} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Deals</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: SEARCH & PIPELINE FILTERS ─────────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        paddingTop: 2,
        borderTop: '1px solid rgba(148, 163, 184, 0.15)'
      }}>
        {/* Left: Search Bar */}
        <div style={{ position: 'relative', width: 280 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search inquiry #, customer, sales rep..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px 6px 30px',
              fontSize: 12,
              borderRadius: 5,
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: '#ffffff',
              outline: 'none'
            }}
          />
        </div>

        {/* Right: Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'All', label: 'All Inquiries' },
            { id: 'New', label: 'New Leads' },
            { id: 'Active', label: 'Active' },
            { id: 'Feasibility Check', label: 'Feasibility' },
            { id: 'Quoted', label: 'Quoted' },
            { id: 'Closed-Won', label: 'Won 🏆' }
          ].map(f => {
            const active = statusFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                style={{
                  fontSize: 11,
                  padding: '4px 9px',
                  borderRadius: 4,
                  border: '1px solid',
                  borderColor: active ? '#00b4d8' : 'rgba(148, 163, 184, 0.2)',
                  background: active ? 'rgba(0, 180, 216, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                  color: active ? '#00b4d8' : '#94a3b8',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            );
          })}

          <div style={{ height: 16, width: 1, background: 'rgba(148, 163, 184, 0.25)', margin: '0 4px' }} />

          {/* Inquiry Type Filter */}
          <select
            value={inquiryTypeFilter}
            onChange={e => setInquiryTypeFilter(e.target.value)}
            style={{
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: inquiryTypeFilter !== 'All' ? '#00b4d8' : '#94a3b8',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="All">All Inquiry Types</option>
            <option value="Standard">Standard Quote</option>
            <option value="RFQ">Customer RFQ</option>
            <option value="Sample Request">Sample Request</option>
            <option value="Blanket Contract">Blanket Contract</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default InquiryCommandBar;
