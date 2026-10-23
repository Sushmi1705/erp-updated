import React from 'react';
import {
  GitPullRequest, Plus, Search, AlertTriangle, ShieldCheck,
  Clock, DollarSign, Lock, Flame, Filter, RefreshCw
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

export const ECRCommandBar = ({
  headers = [],
  searchTerm,
  setSearchTerm,
  priorityFilter,
  setPriorityFilter,
  statusFilter,
  setStatusFilter,
  changeTypeFilter,
  setChangeTypeFilter,
  onOpenCreateModal,
  loading
}) => {
  // Aggregate KPIs
  const totalECRs = headers.length;
  const urgentCount = headers.filter(h => h.priority === 'Urgent/Line-Down').length;
  const inReviewCount = headers.filter(h => h.status === 'In Review' || h.status === 'Submitted').length;
  const approvedCount = headers.filter(h => h.status === 'Approved' || h.status === 'Implemented').length;
  const lockedCount = headers.filter(h => h.isLocked).length;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      background: 'linear-gradient(135deg, #0a0f1d 0%, #111827 50%, #1e293b 100%)',
      border: '1px solid rgba(245, 158, 11, 0.25)',
      borderRadius: 10,
      padding: '14px 18px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
      color: '#ffffff'
    }}>
      {/* ── TOP BAR: MODULE TITLE & EXECUTIVE ACTIONS ──────────────────────── */}
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
            width: 40,
            height: 40,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(245, 158, 11, 0.4)'
          }}>
            <GitPullRequest size={22} color="#0a0f1d" strokeWidth={2.5} />
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
                Engineering Change Management (ECM / ECO)
              </h1>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 4,
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}>
                IATF 16949 / APQP
              </span>
            </div>
            <p style={{
              fontSize: 12,
              color: '#94a3b8',
              margin: '2px 0 0',
              fontWeight: 400
            }}>
              Engineering Change Requests (ECR), Multi-Role Sign-Off Runway, 4-D Impact Radar & Automated Revision Cutover
            </p>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={onOpenCreateModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#0a0f1d',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(245, 158, 11, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Raise Change Request</span>
          </button>
        </div>
      </div>

      {/* ── MIDDLE ROW: REAL-TIME EXECUTIVE TELEMETRY CHIPS ────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: 10,
        paddingTop: 4
      }}>
        {/* KPI 1: Active Pipeline */}
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
            width: 30,
            height: 30,
            borderRadius: 6,
            background: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#38bdf8'
          }}>
            <GitPullRequest size={15} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Total Dossiers</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>
              {totalECRs} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>ECRs</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Urgent Line-Down Alerts */}
        <div style={{
          background: urgentCount > 0 ? 'rgba(244, 63, 94, 0.12)' : 'rgba(15, 23, 42, 0.65)',
          border: '1px solid',
          borderColor: urgentCount > 0 ? 'rgba(244, 63, 94, 0.35)' : 'rgba(148, 163, 184, 0.2)',
          borderRadius: 6,
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            background: 'rgba(244, 63, 94, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f43f5e'
          }}>
            <Flame size={15} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: urgentCount > 0 ? '#fda4af' : '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Line-Down / Urgent</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: urgentCount > 0 ? '#f43f5e' : '#ffffff', fontFamily: 'monospace' }}>
              {urgentCount} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Critical</span>
            </div>
          </div>
        </div>

        {/* KPI 3: In Review & Approvals Pending */}
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
            width: 30,
            height: 30,
            borderRadius: 6,
            background: 'rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f59e0b'
          }}>
            <Clock size={15} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>In Review / Voting</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f59e0b', fontFamily: 'monospace' }}>
              {inReviewCount} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Active</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Approved & Released ECOs */}
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
            width: 30,
            height: 30,
            borderRadius: 6,
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <ShieldCheck size={15} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Approved / ECO Active</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#10b981', fontFamily: 'monospace' }}>
              {approvedCount} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Released</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Locked Audit Records */}
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
            width: 30,
            height: 30,
            borderRadius: 6,
            background: 'rgba(139, 92, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#a78bfa'
          }}>
            <Lock size={15} />
          </div>
          <div>
            <div style={{ fontSize: 10.5, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Locked Revision Cuts</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#a78bfa', fontFamily: 'monospace' }}>
              {lockedCount} <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Locked</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: SEARCH & QUICK FILTER PILLS ───────────────────────── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        paddingTop: 2,
        borderTop: '1px solid rgba(148, 163, 184, 0.15)'
      }}>
        {/* Left: Search input */}
        <div style={{ position: 'relative', width: 280 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search ECR #, title, or reason..."
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

        {/* Right: Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Status filters */}
          {[
            { id: 'All', label: 'All ECRs' },
            { id: 'Draft', label: 'Drafts' },
            { id: 'In Review', label: 'In Review' },
            { id: 'Approved', label: 'Approved (ECO)' },
            { id: 'Implemented', label: 'Implemented' }
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
                  borderColor: active ? '#f59e0b' : 'rgba(148, 163, 184, 0.2)',
                  background: active ? 'rgba(245, 158, 11, 0.18)' : 'rgba(15, 23, 42, 0.5)',
                  color: active ? '#f59e0b' : '#94a3b8',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                {f.label}
              </button>
            );
          })}

          <div style={{ height: 16, width: 1, background: 'rgba(148, 163, 184, 0.25)', margin: '0 4px' }} />

          {/* Priority filter */}
          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            style={{
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: priorityFilter !== 'All' ? '#f59e0b' : '#94a3b8',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="All">All Priorities</option>
            <option value="Urgent/Line-Down">🚨 Urgent/Line-Down</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          {/* Change Type filter */}
          <select
            value={changeTypeFilter}
            onChange={e => setChangeTypeFilter(e.target.value)}
            style={{
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid rgba(148, 163, 184, 0.25)',
              background: 'rgba(15, 23, 42, 0.8)',
              color: changeTypeFilter !== 'All' ? '#38bdf8' : '#94a3b8',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <option value="All">All Change Types</option>
            <option value="Design">Design Change</option>
            <option value="Process">Process Change</option>
            <option value="Material Replacement">Material Replacement</option>
            <option value="Cost Reduction">Cost Reduction</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ECRCommandBar;
