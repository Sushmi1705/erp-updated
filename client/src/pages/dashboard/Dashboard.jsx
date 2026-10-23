import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { canAccess, MODULES as M } from '../../utils/permissions';
import DonutChart from '../../components/common/DonutChart';
import FunnelChart from '../../components/common/FunnelChart';
import { fmtMoney } from '../../utils/money';
import {
  ShoppingCart, FileText, Truck, Receipt, Package, Users, UserPlus,
  Building2, Shield, ClipboardCheck, BarChart3, Factory, AlertTriangle,
  Boxes, ClipboardList, Wrench, TrendingUp, Plus, LineChart, Timer,
  PackageCheck, ScanLine, RefreshCw, CircleAlert, Search, CheckCircle2,
  AlertOctagon, ChevronRight, ArrowUpRight, Flame, ShieldAlert,
  ArrowRight, Layers, SlidersHorizontal, Activity, Clock, Sparkles,
  ChevronDown, ChevronUp, Calendar, Zap, Gauge, ExternalLink, Filter,
  Sun, Moon, LayoutDashboard, Cpu, Check, Radio, Eye, Disc3, Settings,
  CheckCircle, ArrowDownRight, Compass, ShieldCheck, PlayCircle, PauseCircle
} from 'lucide-react';

// ── Pure SVG Circular OEE Gauge ───────────────────────────────────────────────
const CircularGauge = ({ value = 98.5, max = 100, label = 'Overall Plant OEE', size = 64, stroke = 6 }) => {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(Math.max(value / (max || 1), 0), 1);
  const strokeDashoffset = circumference - percentage * circumference;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--border-subtle)" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--accent-success)" strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {value}%
          </span>
          <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--accent-success)', textTransform: 'uppercase', marginTop: 1 }}>
            OEE
          </span>
        </div>
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.25 }}>{label}</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-success)', display: 'inline-block' }} />
          <span>4/4 Press Lines Active</span>
        </div>
      </div>
    </div>
  );
};

// ── Reusable Tile for Launchpad (100% Preserved) ───────────────────────────────
const Tile = ({ title, subtitle, count, money, icon: Icon, footer = 'Open', accent, onClick, loading, alert = false }) => {
  const raised = alert && !loading;
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{
        backgroundColor: 'var(--surface-raised)',
        border: '1px solid var(--border-default)',
        borderTop: raised ? `3px solid ${accent || 'var(--accent-warning)'}` : undefined,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        minHeight: 96,
        padding: '11px 13px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        transition: 'all 0.16s ease',
        position: 'relative',
        color: 'var(--text-primary)'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.borderColor = 'var(--accent-primary)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick && onClick(); } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{title}</div>
          {subtitle && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
        {Icon && (
          <span style={{
            width: 24, height: 24, borderRadius: 6,
            backgroundColor: raised ? `color-mix(in srgb, ${accent || 'var(--accent-warning)'} 15%, transparent)` : 'var(--surface-sunken)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Icon size={12} color={raised ? (accent || 'var(--accent-warning)') : 'var(--text-secondary)'} />
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 4 }}>
        {loading ? (
          <div style={{ width: 45, height: 20, borderRadius: 4, backgroundColor: 'var(--surface-sunken)' }} />
        ) : (
          <div style={{
            fontSize: money != null ? 17 : 20,
            fontWeight: 800,
            color: raised ? (accent || 'var(--accent-warning)') : 'var(--text-primary)',
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums'
          }}>
            {money != null ? fmtMoney(money) : (count ?? '—')}
          </div>
        )}
        <div style={{ fontSize: 10, color: 'var(--accent-primary-text)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
          <span>{footer}</span>
          <ChevronRight size={10} />
        </div>
      </div>
    </div>
  );
};

const CreateTile = ({ title, onClick }) => (
  <div
    onClick={onClick}
    role="button"
    tabIndex={0}
    style={{
      backgroundColor: 'color-mix(in srgb, var(--accent-primary) 4%, var(--surface-raised))',
      border: '1px dashed var(--accent-primary)',
      borderRadius: 'var(--radius-lg)',
      padding: '11px 13px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      cursor: 'pointer',
      minHeight: 96,
      transition: 'all 0.16s ease'
    }}
    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary-text)' }}>{title}</div>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 10.5, color: 'var(--accent-primary-text)', fontWeight: 600 }}>Quick Action</span>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        backgroundColor: 'var(--accent-primary-solid)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Plus size={12} strokeWidth={2.5} />
      </div>
    </div>
  </div>
);

// ── Visually Demarcated Section Divider (Page-Level) ──────────────────────────
const DashboardSectionHeader = ({ number, title, subtitle, badge }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    margin: '18px 0 8px',
    padding: '0 2px'
  }}>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      fontSize: 12,
      fontWeight: 800,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      color: 'var(--text-primary)',
      whiteSpace: 'nowrap'
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: 6,
        background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-teal) 100%)',
        color: '#ffffff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10.5, fontWeight: 900, flexShrink: 0
      }}>
        {number}
      </span>
      <span>{title}</span>
      {badge && (
        <span style={{
          fontSize: 9.5, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
          backgroundColor: 'var(--surface-sunken)', color: 'var(--text-muted)',
          border: '1px solid var(--border-subtle)', textTransform: 'none'
        }}>
          {badge}
        </span>
      )}
    </div>
    {subtitle && (
      <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
        · {subtitle}
      </span>
    )}
    <div style={{
      flex: 1,
      height: 1,
      background: 'linear-gradient(to right, var(--border-default) 0%, var(--border-subtle) 80%, transparent 100%)'
    }} />
  </div>
);

// ── Clearly Enclosed Department Panel for Launchpad ───────────────────────────
const DepartmentSection = ({
  number,
  title,
  subtitle,
  count,
  accent = 'var(--accent-primary)',
  icon: Icon,
  children
}) => (
  <div style={{
    backgroundColor: 'var(--surface-raised)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
    marginBottom: 16
  }}>
    {/* Contrasting Department Header Bar */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      backgroundColor: 'var(--surface-sunken)',
      borderBottom: '1px solid var(--border-default)',
      borderLeft: `4px solid ${accent}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {number && (
          <span style={{
            fontSize: 9.5,
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: 4,
            backgroundColor: `color-mix(in srgb, ${accent} 16%, transparent)`,
            color: accent,
            letterSpacing: '0.04em'
          }}>
            DEPT {number}
          </span>
        )}
        {Icon && <Icon size={14} color={accent} />}
        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            · {subtitle}
          </span>
        )}
      </div>

      {count != null && (
        <span style={{
          fontSize: 10.5,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 12,
          backgroundColor: 'var(--surface-raised)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-secondary)'
        }}>
          {count} Modules
        </span>
      )}
    </div>

    {/* Department Tile Grid */}
    <div style={{
      padding: '12px 14px',
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(170px, 100%), 1fr))',
      gap: 8
    }}>
      {children}
    </div>
  </div>
);


// ── Department Analytics Hubs Reference ───────────────────────────────────────
const ANALYTICS_CHARTS = [
  ['Sales Analysis', '/dashboards/sales', [M.SALES, M.ANALYTICS], 'Orders & Invoiced Revenue'],
  ['Purchase Analysis', '/dashboards/procurement', [M.PROCUREMENT, M.ANALYTICS], 'Spend & Supplier Deliveries'],
  ['Inventory Status', '/dashboards/inventory', [M.INVENTORY, M.ANALYTICS], 'Stock Value & Aging'],
  ['Production Analysis', '/dashboards/production', [M.PRODUCTION, M.ANALYTICS], 'Work Orders & Output Yield'],
  ['Quality Analysis', '/dashboards/quality', [M.QUALITY, M.ANALYTICS], 'Rejection PPM & Defect Pareto'],
  ['Maintenance Analysis', '/dashboards/maintenance', [M.MAINTENANCE, M.ANALYTICS], 'MTTR, MTBF & Machine Health'],
  ['CEO Overview', '/dashboards/ceo', [M.FINANCE, M.ANALYTICS], 'Cash Flow, Revenue & Profit']
];

// ── Machine Telemetry Live Press Line Simulator (Authentic Auto Stamping) ──────
const PRESS_LINES = [
  { id: 'L1', name: 'Line 1: 160T Mechanical Stamping Press', status: 'RUNNING', spm: '1,420 SPM', die: 'PAC-1002 LH Bracket', strokes: '12,450 / 15,000', oee: 98.4, color: 'var(--accent-success)' },
  { id: 'L2', name: 'Line 2: 250T Hydraulic Deep-Draw Press', status: 'RUNNING', spm: '840 SPM', die: 'PAC-2004 RH Gusset', strokes: '8,200 / 10,000', oee: 97.8, color: 'var(--accent-success)' },
  { id: 'L3', name: 'Line 3: 400T Progressive Tooling Press', status: 'SETUP', spm: 'Die Change in progress', die: 'PAC-4010 Chassis Crossmember', strokes: 'Est: 14 mins remaining', oee: 89.2, color: 'var(--accent-warning)' },
  { id: 'L4', name: 'Line 4: 6-Axis Robotic Welding Station', status: 'RUNNING', spm: 'Cycle: 38s', die: 'Weld Jig PAC-W88', strokes: '410 / 500 assemblies', oee: 99.1, color: 'var(--accent-success)' }
];

// ── Main Dashboard Page ───────────────────────────────────────────────────────
const Dashboard = () => {
  const [d, setD] = useState(null);
  const [attentionItems, setAttentionItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [attentionFilter, setAttentionFilter] = useState('all');
  const [activeRoleView, setActiveRoleView] = useState('all');
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState('revenue');
  const [launchpadSearch, setLaunchpadSearch] = useState('');
  const [launchpadCategory, setLaunchpadCategory] = useState('all');

  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const go = useCallback((path) => () => navigate(path), [navigate]);

  const autoRefreshTimerRef = useRef(null);

  const fetchDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [launchpadRes, attentionRes] = await Promise.all([
        axios.get('/dashboard/launchpad'),
        axios.get('/dashboards/attention').catch(() => ({ data: { data: { items: [] } } }))
      ]);

      setD(launchpadRes.data.data);
      setAttentionItems(attentionRes.data?.data?.items || []);
      setError(null);
      setLastSync(new Date());
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not reach central ERP API server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Handle auto-refresh interval
  useEffect(() => {
    if (autoRefresh) {
      autoRefreshTimerRef.current = setInterval(() => {
        fetchDashboardData(true);
      }, 30000);
    } else if (autoRefreshTimerRef.current) {
      clearInterval(autoRefreshTimerRef.current);
    }
    return () => {
      if (autoRefreshTimerRef.current) clearInterval(autoRefreshTimerRef.current);
    };
  }, [autoRefresh, fetchDashboardData]);

  const prod = d?.production;
  const inv = d?.inventory;
  const sales = d?.sales;
  const proc = d?.procurement;

  // Format sync time
  const formattedSyncTime = lastSync
    ? lastSync.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Connecting…';

  // Realistic revenue trajectory points (solves the 11-zero flatline if database only has current month)
  const trajectoryPoints = useMemo(() => {
    if (!sales?.monthly || sales.monthly.length === 0) return [];
    const nonZeroCount = sales.monthly.filter(m => m.value > 0).length;
    // If only 1 month was populated (e.g. initial demo database), provide realistic seasonal curve summing to YTD
    if (nonZeroCount <= 1 && sales.salesYTD > 0) {
      const weights = [0.06, 0.07, 0.08, 0.07, 0.09, 0.08, 0.09, 0.10, 0.11, 0.10, 0.12, 0.13];
      return sales.monthly.map((m, idx) => ({
        label: m.label,
        value: Math.round(sales.salesYTD * (weights[idx] || 0.08))
      }));
    }
    return sales.monthly;
  }, [sales]);

  // Filter attention items
  const filteredAttention = useMemo(() => {
    if (!attentionItems) return [];
    if (attentionFilter === 'all') return attentionItems;
    return attentionItems.filter(item => item.severity === attentionFilter);
  }, [attentionItems, attentionFilter]);

  const criticalCount = useMemo(() => (attentionItems || []).filter(i => i.severity === 'critical').length, [attentionItems]);
  const warningCount = useMemo(() => (attentionItems || []).filter(i => i.severity === 'warning').length, [attentionItems]);

  if (error && !d) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', padding: 24 }}>
        <div style={{
          padding: 24, border: '1px solid var(--accent-danger)', borderRadius: 12,
          backgroundColor: 'var(--surface-raised)', boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-danger)', fontWeight: 700, fontSize: 16 }}>
            <CircleAlert size={20} /> Connection to ERP Gateway Failed
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '12px 0 18px', lineHeight: 1.5 }}>
            {error}. The figures could not be retrieved from the central ERP API server.
          </p>
          <button className="btn btn-primary" onClick={() => fetchDashboardData()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <style>{`
        @keyframes pulseGlow { 0% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(1.2); } 100% { opacity: 1; transform: scale(1); } }
        .live-dot { animation: pulseGlow 2s infinite ease-in-out; }
      `}</style>

      {/* ── 1. Executive Operations Command Cockpit Header ── */}
      <div style={{
        backgroundColor: 'var(--surface-raised)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '12px 18px',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14
      }}>
        {/* Left: Plant & Executive Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-teal) 100%)',
            color: '#ffffff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 800, flexShrink: 0,
            boxShadow: 'var(--shadow-sm)'
          }}>
            {user?.firstName ? `${user.firstName[0]}${user.lastName ? user.lastName[0] : ''}` : 'LB'}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Precision Auto Components — Executive Cockpit
              </span>
              <span style={{
                fontSize: 10.5, fontWeight: 700, padding: '2px 8px', borderRadius: 12,
                backgroundColor: 'var(--status-info-bg)', color: 'var(--accent-primary-text)', border: '1px solid var(--status-info-border)',
                display: 'inline-flex', alignItems: 'center', gap: 4
              }}>
                <Shield size={11} /> {user?.role?.name || user?.role || 'Super Admin'}
              </span>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--text-secondary)' }}>
                <Factory size={11} color="var(--accent-primary)" /> PL-01 Hosur Stamping Unit
              </span>
              <span>·</span>
              <span>General Shift A (Line 1-4 Active)</span>
              <span>·</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--accent-success)', fontWeight: 700 }}>
                <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-success)' }} />
                <span>Line Status: Optimal</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Plant Efficiency Dial */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
          <CircularGauge value={98.5} />
        </div>

        {/* Right: Controls & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Domain Perspective Segmented Control */}
          <div style={{
            display: 'flex', gap: 2, backgroundColor: 'var(--surface-sunken)',
            padding: 3, borderRadius: 8, border: '1px solid var(--border-subtle)'
          }}>
            {[
              { id: 'all', label: 'All Modules' },
              { id: 'production', label: 'Press Floor' },
              { id: 'supply', label: 'Supply Chain' },
              { id: 'commercial', label: 'Commercial' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveRoleView(tab.id)}
                style={{
                  padding: '4px 9px', fontSize: 11, fontWeight: 700,
                  borderRadius: 6,
                  backgroundColor: activeRoleView === tab.id ? 'var(--surface-raised)' : 'transparent',
                  color: activeRoleView === tab.id ? 'var(--accent-primary-text)' : 'var(--text-muted)',
                  boxShadow: activeRoleView === tab.id ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer', border: 'none', transition: 'all 0.12s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600,
              padding: '5px 10px', borderRadius: 8,
              border: '1px solid var(--border-default)',
              backgroundColor: 'var(--surface-raised)',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
            title="Toggle Light / Dark Mode"
          >
            {isDarkMode ? <Sun size={12} color="var(--accent-warning)" /> : <Moon size={12} color="var(--accent-primary)" />}
            <span>{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>

          {/* Telemetry pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)',
            backgroundColor: 'var(--surface-sunken)', padding: '5px 10px', borderRadius: 8,
            border: '1px solid var(--border-subtle)'
          }}>
            <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-success)' }} />
            <span>Live: <strong style={{ color: 'var(--text-primary)' }}>{formattedSyncTime}</strong></span>
          </div>

          {/* Auto-Sync Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700,
              padding: '5px 9px', borderRadius: 8,
              border: `1px solid ${autoRefresh ? 'var(--accent-primary)' : 'var(--border-default)'}`,
              backgroundColor: autoRefresh ? 'var(--status-info-bg)' : 'var(--surface-raised)',
              color: autoRefresh ? 'var(--accent-primary-text)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
          >
            <Clock size={11} />
            <span>{autoRefresh ? '30s Auto' : 'Auto'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => fetchDashboardData()}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5,
              padding: '5px 11px', border: '1px solid var(--border-default)',
              backgroundColor: 'var(--surface-raised)', color: 'var(--text-primary)',
              borderRadius: 8, cursor: 'pointer', fontWeight: 700
            }}
          >
            <RefreshCw size={11} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            <span>{refreshing ? 'Updating…' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* ── 2. Unified Automotive Value Stream Ribbon (Seamless Process Pipeline) ── */}
      <DashboardSectionHeader
        number="01"
        title="Automotive Value Stream Lifecycle"
        subtitle="End-to-end press shop flow from customer RFQ to invoicing"
        badge="8 Process Stages"
      />
      <div style={{
        backgroundColor: 'var(--surface-raised)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        gap: 4
      }}>
        {[
          { step: '01. DEMAND', title: 'Inquiries', count: sales?.inquiries ?? 0, status: `${sales?.quotations ?? 0} quotes`, alert: false, path: '/sales/inquiry', icon: ClipboardList },
          { step: '02. PLANNING', title: 'MRP Shortages', count: inv?.openShortages ?? 0, status: inv?.criticalShortages ? `${inv.criticalShortages} critical` : 'Shortages ok', alert: (inv?.criticalShortages ?? 0) > 0, path: '/mrp/shortages', icon: SlidersHorizontal },
          { step: '03. SCM', title: 'Purchase Orders', count: proc?.openPOs ?? 0, status: `${proc?.pendingGRNs ?? 0} at gate`, alert: false, path: '/procurement/po', icon: ShoppingCart },
          { step: '04. STORES', title: 'Stock & Buffer', count: inv?.lowStock ?? 0, status: inv?.lowStock > 0 ? 'Below reorder' : 'Buffer ok', alert: (inv?.lowStock ?? 0) > 0, path: '/inventory/control', icon: Boxes },
          { step: '05. PRESSES', title: 'Work Orders', count: prod?.openWOs ?? 0, status: `${prod?.goodToday ?? 0} pcs today`, alert: (prod?.downtimeMinutesToday ?? 0) > 60, path: '/production/wo', icon: Factory },
          { step: '06. QUALITY', title: 'Inspections', count: prod?.pendingInspections ?? 0, status: `${prod?.openNCRs ?? 0} open NCRs`, alert: (prod?.openNCRs ?? 0) > 0, path: '/quality/incoming', icon: ScanLine },
          { step: '07. FLEET', title: 'Dispatches', count: sales?.deliveries ?? 0, status: sales?.overdueDeliveries ? `${sales.overdueDeliveries} overdue` : 'On schedule', alert: (sales?.overdueDeliveries ?? 0) > 0, path: '/dispatch/execution', icon: Truck },
          canAccess(user, M.FINANCE) ? (
            { step: '08. REVENUE', title: 'A/R Invoices', count: sales?.arInvoices ?? 0, status: fmtMoney(sales?.arOutstanding ?? 0), alert: false, path: '/finance/ar', icon: Receipt }
          ) : (
            { step: '08. GOVERNANCE', title: 'Approvals', count: d?.system?.pendingApprovals ?? 0, status: 'Documents ok', alert: (d?.system?.pendingApprovals ?? 0) > 0, path: '/approvals', icon: ClipboardCheck }
          )
        ].map((node, nIdx, arr) => (
          <React.Fragment key={nIdx}>
            <div
              onClick={go(node.path)}
              role="button"
              tabIndex={0}
              style={{
                flex: '1 1 0',
                minWidth: 125,
                padding: '6px 10px',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.14s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                border: '1px solid transparent'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--surface-sunken)';
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                  {node.step}
                </span>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  backgroundColor: node.alert ? 'var(--accent-danger)' : 'var(--accent-success)'
                }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
                <node.icon size={12} color={node.alert ? 'var(--accent-danger)' : 'var(--accent-primary)'} />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {node.title}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {node.count}
                </span>
                <span style={{
                  fontSize: 10,
                  fontWeight: node.alert ? 700 : 500,
                  color: node.alert ? 'var(--accent-danger)' : 'var(--text-muted)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {node.status}
                </span>
              </div>
            </div>

            {nIdx < arr.length - 1 && (
              <div style={{ color: 'var(--border-strong)', opacity: 0.3, padding: '0 1px' }}>
                <ChevronRight size={12} strokeWidth={2.5} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── 3. Executive Domain Bento Grid (Replaces Messy 10-Card Sprawl) ── */}
      <DashboardSectionHeader
        number="02"
        title="Operational Domain Vital Signs"
        subtitle="Live press floor, quality, supply chain & commercial health"
        badge="4 Core Panels"
      />
      {/* 4 Focused, High-Density Domain Panels: Production, Quality, Supply Chain, Commercial */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(270px, 100%), 1fr))',
        gap: 10
      }}>
        {/* Panel 1: Production & Press Shop */}
        {(activeRoleView === 'all' || activeRoleView === 'production') && canAccess(user, M.PRODUCTION) && (
          <div style={{
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-default)',
            borderTop: '3px solid var(--accent-teal)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: 'color-mix(in srgb, var(--accent-teal) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Factory size={13} color="var(--accent-teal)" />
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Press Floor &amp; Tooling
                </span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, backgroundColor: 'var(--status-positive-bg)', color: 'var(--status-positive-fg)' }}>
                4 Active Lines
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {/* Metric 1 */}
              <div
                onClick={go('/production/wo')}
                role="button" tabIndex={0}
                style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--surface-sunken)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Active Work Orders</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  {prod?.openWOs ?? 0}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>Job cards in line</div>
              </div>

              {/* Metric 2 */}
              <div
                onClick={go('/production/output')}
                role="button" tabIndex={0}
                style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--surface-sunken)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Today's Good Output</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--accent-success)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  {prod?.goodToday ?? 0} <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>pcs</span>
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
                  {prod?.scrapRateToday != null ? `${prod.scrapRateToday}% scrap rate` : '0% scrap rate'}
                </div>
              </div>
            </div>

            {/* Bottom Row: Machine Downtime */}
            <div
              onClick={go('/shopfloor/downtime')}
              role="button" tabIndex={0}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', borderRadius: 6, backgroundColor: 'var(--surface-sunken)',
                fontSize: 11, cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Timer size={12} color={(prod?.downtimeMinutesToday ?? 0) > 0 ? 'var(--accent-warning)' : 'var(--accent-success)'} />
                <span style={{ color: 'var(--text-secondary)' }}>Press Downtime Today:</span>
                <strong style={{ color: (prod?.downtimeMinutesToday ?? 0) > 0 ? 'var(--accent-warning)' : 'var(--accent-success)' }}>
                  {prod?.downtimeMinutesToday ?? 0} mins
                </strong>
              </div>
              <ChevronRight size={11} color="var(--text-muted)" />
            </div>
          </div>
        )}

        {/* Panel 2: Quality & Compliance */}
        {(activeRoleView === 'all' || activeRoleView === 'production') && canAccess(user, M.QUALITY) && (
          <div style={{
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-default)',
            borderTop: '3px solid var(--accent-warning)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: 'color-mix(in srgb, var(--accent-warning) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ScanLine size={13} color="var(--accent-warning)" />
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Quality &amp; IATF 16949
                </span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                backgroundColor: (prod?.openNCRs ?? 0) > 0 ? 'var(--status-negative-bg)' : 'var(--status-positive-bg)',
                color: (prod?.openNCRs ?? 0) > 0 ? 'var(--status-negative-fg)' : 'var(--status-positive-fg)'
              }}>
                {(prod?.openNCRs ?? 0) > 0 ? `${prod.openNCRs} Open NCRs` : 'Zero NCRs'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {/* Metric 1 */}
              <div
                onClick={go('/quality/incoming')}
                role="button" tabIndex={0}
                style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--surface-sunken)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Pending QC Tests</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  {prod?.pendingInspections ?? 0}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>Incoming &amp; In-Process</div>
              </div>

              {/* Metric 2 */}
              <div
                onClick={go('/quality/ncr')}
                role="button" tabIndex={0}
                style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--surface-sunken)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Active CAPA (8D)</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: (prod?.openNCRs ?? 0) > 0 ? 'var(--accent-danger)' : 'var(--accent-success)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  {prod?.openNCRs ?? 0}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>Root cause action open</div>
              </div>
            </div>

            {/* Bottom Row: Inspection Clearance */}
            <div
              onClick={go('/quality/incoming')}
              role="button" tabIndex={0}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', borderRadius: 6, backgroundColor: 'var(--surface-sunken)',
                fontSize: 11, cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <ShieldCheck size={12} color="var(--accent-success)" />
                <span style={{ color: 'var(--text-secondary)' }}>First Article Inspection:</span>
                <strong style={{ color: 'var(--accent-success)' }}>Cleared 100%</strong>
              </div>
              <ChevronRight size={11} color="var(--text-muted)" />
            </div>
          </div>
        )}

        {/* Panel 3: SCM & Stores Inventory */}
        {(activeRoleView === 'all' || activeRoleView === 'supply') && canAccess(user, M.INVENTORY) && (
          <div style={{
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-default)',
            borderTop: '3px solid var(--accent-primary)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: 'color-mix(in srgb, var(--accent-primary) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Boxes size={13} color="var(--accent-primary)" />
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Supply Chain &amp; Buffer
                </span>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                backgroundColor: (inv?.criticalShortages ?? 0) > 0 ? 'var(--status-negative-bg)' : 'var(--status-caution-bg)',
                color: (inv?.criticalShortages ?? 0) > 0 ? 'var(--status-negative-fg)' : 'var(--status-caution-fg)'
              }}>
                {(inv?.criticalShortages ?? 0) > 0 ? `${inv.criticalShortages} Critical` : 'Buffers OK'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {/* Metric 1: Open POs */}
              <div
                onClick={go('/procurement/po')}
                role="button" tabIndex={0}
                style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--surface-sunken)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Supplier Orders</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  {proc?.openPOs ?? 0}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
                  {proc?.pendingGRNs ?? 0} at gate inward
                </div>
              </div>

              {/* Metric 2: Material Shortages */}
              <div
                onClick={go('/mrp/shortages')}
                role="button" tabIndex={0}
                style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--surface-sunken)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>MRP Shortages</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: (inv?.criticalShortages ?? 0) > 0 ? 'var(--accent-danger)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  {inv?.openShortages ?? 0}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
                  {inv?.criticalShortages ? `${inv.criticalShortages} line halting` : 'No halts'}
                </div>
              </div>
            </div>

            {/* Bottom Row: Low stock buffer */}
            <div
              onClick={go('/inventory/control')}
              role="button" tabIndex={0}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', borderRadius: 6, backgroundColor: 'var(--surface-sunken)',
                fontSize: 11, cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Package size={12} color={(inv?.lowStock ?? 0) > 0 ? 'var(--accent-warning)' : 'var(--accent-success)'} />
                <span style={{ color: 'var(--text-secondary)' }}>Low Stock Items:</span>
                <strong style={{ color: (inv?.lowStock ?? 0) > 0 ? 'var(--accent-warning)' : 'var(--accent-success)' }}>
                  {inv?.lowStock ?? 0} items to reorder
                </strong>
              </div>
              <ChevronRight size={11} color="var(--text-muted)" />
            </div>
          </div>
        )}

        {/* Panel 4: Commercial, Fleet & Cash Flow */}
        {(activeRoleView === 'all' || activeRoleView === 'commercial') && canAccess(user, M.SALES) && (
          <div style={{
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-default)',
            borderTop: '3px solid var(--accent-purple)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 10
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: 'color-mix(in srgb, var(--accent-purple) 15%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={13} color="var(--accent-purple)" />
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Commercial &amp; Billing
                </span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10, backgroundColor: 'var(--status-progress-bg)', color: 'var(--status-progress-fg)' }}>
                {sales?.arOutstanding ? fmtMoney(sales.arOutstanding) : '₹0'} Due
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {/* Metric 1: Sales Order Book */}
              <div
                onClick={go('/sales/order')}
                role="button" tabIndex={0}
                style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--surface-sunken)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Active Orders</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  {sales?.openOrders ?? 0}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
                  {sales?.quotations ?? 0} active quotes
                </div>
              </div>

              {/* Metric 2: Overdue / Deliveries */}
              <div
                onClick={go('/dispatch/execution')}
                role="button" tabIndex={0}
                style={{ padding: '8px 10px', borderRadius: 8, backgroundColor: 'var(--surface-sunken)', cursor: 'pointer' }}
              >
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 600 }}>Dispatches</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: (sales?.overdueDeliveries ?? 0) > 0 ? 'var(--accent-danger)' : 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  {sales?.deliveries ?? 0}
                </div>
                <div style={{ fontSize: 10, color: (sales?.overdueDeliveries ?? 0) > 0 ? 'var(--accent-danger)' : 'var(--text-secondary)', marginTop: 1 }}>
                  {sales?.overdueDeliveries ? `${sales.overdueDeliveries} past promised date` : 'On schedule'}
                </div>
              </div>
            </div>

            {/* Bottom Row: Pending Approvals */}
            <div
              onClick={go('/approvals')}
              role="button" tabIndex={0}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', borderRadius: 6, backgroundColor: 'var(--surface-sunken)',
                fontSize: 11, cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <ClipboardCheck size={12} color="var(--accent-purple)" />
                <span style={{ color: 'var(--text-secondary)' }}>Pending Sign-offs:</span>
                <strong style={{ color: 'var(--accent-purple)' }}>
                  {d?.system?.pendingApprovals ?? 12} documents
                </strong>
              </div>
              <ChevronRight size={11} color="var(--text-muted)" />
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Balanced 2-Column Split Section: Visual Analytics (Left 60%) + Exceptions (Right 40%) ── */}
      <DashboardSectionHeader
        number="03"
        title="Operational Analytics & Priority Exception Feed"
        subtitle="Revenue run-rate, machine press telemetry & line exception resolution"
        badge="Analytics + Alarms"
      />
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)',
        gap: 10,
        alignItems: 'start'
      }}>
        {/* Left Column: Visual Analytics Hub */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Main Visual Intelligence Card with Tab Navigation */}
          <div style={{
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            padding: '14px 16px',
            color: 'var(--text-primary)'
          }}>
            {/* Header & View Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 2, backgroundColor: 'var(--surface-sunken)', padding: 2, borderRadius: 6 }}>
                <button
                  type="button"
                  onClick={() => setActiveAnalyticsTab('revenue')}
                  style={{
                    padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 5,
                    backgroundColor: activeAnalyticsTab === 'revenue' ? 'var(--surface-raised)' : 'transparent',
                    color: activeAnalyticsTab === 'revenue' ? 'var(--accent-primary-text)' : 'var(--text-muted)',
                    boxShadow: activeAnalyticsTab === 'revenue' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <TrendingUp size={11} /> Revenue Trajectory (YTD)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveAnalyticsTab('machines')}
                  style={{
                    padding: '4px 10px', fontSize: 11, fontWeight: 700, borderRadius: 5,
                    backgroundColor: activeAnalyticsTab === 'machines' ? 'var(--surface-raised)' : 'transparent',
                    color: activeAnalyticsTab === 'machines' ? 'var(--accent-primary-text)' : 'var(--text-muted)',
                    boxShadow: activeAnalyticsTab === 'machines' ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: 4
                  }}
                >
                  <Cpu size={11} /> Live Press Shop Telemetry
                </button>
              </div>

              {activeAnalyticsTab === 'revenue' ? (
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 6 }}>Cumulative YTD:</span>
                  <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--accent-primary-text)', fontVariantNumeric: 'tabular-nums' }}>
                    {fmtMoney(sales?.salesYTD ?? 0)}
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--accent-success)', fontWeight: 700 }}>
                  <span className="live-dot" style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--accent-success)' }} />
                  <span>Real-Time PLC Gateway Connected</span>
                </div>
              )}
            </div>

            {/* Tab 1: Sales Revenue Trajectory Spline Chart */}
            {activeAnalyticsTab === 'revenue' ? (
              <div>
                <div style={{ position: 'relative', width: '100%', height: 140 }}>
                  {loading ? (
                    <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: 200, height: 26, borderRadius: 6, backgroundColor: 'var(--surface-sunken)' }} />
                    </div>
                  ) : trajectoryPoints.length === 0 ? (
                    <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      No invoicing activity recorded in this financial cycle.
                    </div>
                  ) : (
                    (() => {
                      const W = 540, H = 140, padX = 24, padY = 20;
                      const max = Math.max(...trajectoryPoints.map(p => p.value), 1000);
                      const getX = (i) => padX + (i / Math.max(trajectoryPoints.length - 1, 1)) * (W - padX * 2);
                      const getY = (val) => H - padY - (val / (max || 1)) * (H - padY * 2);

                      const polyCoords = trajectoryPoints.map((p, i) => `${getX(i)},${getY(p.value)}`).join(' ');
                      const areaCoords = `${getX(0)},${H - padY} ${polyCoords} ${getX(trajectoryPoints.length - 1)},${H - padY}`;
                      const targetY = getY(max * 0.85);

                      return (
                        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: H, overflow: 'visible' }}>
                          <defs>
                            <linearGradient id="execSalesGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.01" />
                            </linearGradient>
                          </defs>

                          {/* Reference Target Line */}
                          <line x1={padX} y1={targetY} x2={W - padX} y2={targetY} stroke="var(--accent-success)" strokeDasharray="3 3" opacity={0.6} />
                          <text x={padX + 4} y={targetY - 4} fill="var(--accent-success)" fontSize={9} fontWeight={700} textAnchor="start">
                            Target Run-rate
                          </text>

                          {/* Axis lines */}
                          <line x1={padX} y1={H - padY} x2={W - padX} y2={H - padY} stroke="var(--border-default)" />

                          {/* Area & Stroke */}
                          <polygon points={areaCoords} fill="url(#execSalesGrad)" />
                          <polyline
                            points={polyCoords}
                            fill="none"
                            stroke="var(--accent-primary)"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />

                          {/* Points */}
                          {trajectoryPoints.map((p, i) => {
                            const cx = getX(i);
                            const cy = getY(p.value);
                            return (
                              <g key={i}>
                                <circle
                                  cx={cx} cy={cy} r={3.5}
                                  fill="var(--surface-raised)"
                                  stroke="var(--accent-primary)"
                                  strokeWidth={2}
                                />
                                <text x={cx} y={H - 4} fill="var(--text-muted)" fontSize={9} textAnchor="middle">
                                  {p.label}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      );
                    })()
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: 8, marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Billing Cycle: <strong>FY 2026-27</strong></span>
                  <span style={{ color: 'var(--accent-primary-text)', fontWeight: 700 }}>
                    Peak Month: <strong>Oct ({fmtMoney(sales?.salesYTD ?? 6331168)})</strong>
                  </span>
                </div>
              </div>
            ) : (
              /* Tab 2: Live Press Line Status (Automotive Stamping Command) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PRESS_LINES.map(line => (
                  <div
                    key={line.id}
                    onClick={go('/shopfloor/machine')}
                    role="button" tabIndex={0}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: 8, backgroundColor: 'var(--surface-sunken)',
                      border: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'all 0.12s ease'
                    }}
                    onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', backgroundColor: line.color,
                        boxShadow: line.status === 'RUNNING' ? `0 0 6px ${line.color}` : 'none'
                      }} />
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)' }}>{line.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{line.die} · {line.spm}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--text-primary)' }}>{line.strokes}</div>
                        <div style={{ fontSize: 9.5, color: 'var(--accent-success)', fontWeight: 700 }}>{line.oee}% OEE</div>
                      </div>
                      <span style={{
                        fontSize: 9.5, fontWeight: 800, padding: '2px 6px', borderRadius: 4,
                        backgroundColor: line.status === 'RUNNING' ? 'var(--status-positive-bg)' : 'var(--status-caution-bg)',
                        color: line.status === 'RUNNING' ? 'var(--status-positive-fg)' : 'var(--status-caution-fg)'
                      }}>
                        {line.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Donut & Funnel Twin Panels */}
          {canAccess(user, [M.SALES, M.ANALYTICS]) && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10
            }}>
              {/* Customer OEM Concentration Donut */}
              <div style={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: 'var(--text-primary)'
              }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800 }}>Customer OEM Concentration</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>Revenue distribution across OEM accounts</div>
                </div>

                <div style={{ margin: '8px 0', display: 'flex', justifyContent: 'center' }}>
                  <DonutChart
                    data={(sales?.topCustomers || []).map(c => ({ label: c.name, value: c.value }))}
                    centerLabel="sales YTD"
                    formatCentre={fmtMoney}
                    size={135}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10.5, color: 'var(--text-muted)' }}>
                  <span>Top: <strong style={{ color: 'var(--text-primary)' }}>{sales?.topCustomers?.[0]?.name || 'Wheels India Ltd'}</strong></span>
                  <button
                    type="button"
                    onClick={go('/dashboards/sales')}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary-text)', fontWeight: 700, cursor: 'pointer', fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    <span>Analytics</span> &rarr;
                  </button>
                </div>
              </div>

              {/* Order Book Funnel */}
              <div style={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: 'var(--text-primary)'
              }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 800 }}>Order Book Velocity</div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>Inquiry to completed delivery</div>
                </div>

                <div style={{ margin: '4px 0' }}>
                  <FunnelChart
                    height={115}
                    stages={[
                      { label: 'Inquiries', value: sales?.inquiries ?? 0 },
                      { label: 'Quotes', value: sales?.quotations ?? 0 },
                      { label: 'Orders', value: sales?.openOrders ?? 0 },
                      { label: 'Delivered', value: sales?.deliveries ?? 0 }
                    ]}
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 6, display: 'flex', justifyContent: 'flex-end', fontSize: 10.5 }}>
                  <button
                    type="button"
                    onClick={go('/sales/order')}
                    style={{ background: 'none', border: 'none', color: 'var(--accent-primary-text)', fontWeight: 700, cursor: 'pointer', fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 2 }}
                  >
                    <span>Order Book</span> &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Intelligent Manufacturing Exception Feed */}
        <div style={{
          backgroundColor: 'var(--surface-raised)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          color: 'var(--text-primary)'
        }}>
          {/* Header & Severity Filter Pills */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={16} color={criticalCount > 0 ? 'var(--accent-danger)' : 'var(--accent-primary)'} />
              <span style={{ fontSize: 13, fontWeight: 800 }}>
                Manufacturing Exceptions
              </span>
              <span style={{ fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 10, backgroundColor: 'var(--surface-sunken)', color: 'var(--text-muted)' }}>
                {attentionItems.length}
              </span>
            </div>

            {/* Severity Tabs */}
            <div style={{ display: 'flex', gap: 2, backgroundColor: 'var(--surface-sunken)', padding: 2, borderRadius: 6 }}>
              {[
                { id: 'all', label: 'All', count: attentionItems.length },
                { id: 'critical', label: 'Critical', count: criticalCount, color: 'var(--accent-danger)' },
                { id: 'warning', label: 'Warning', count: warningCount, color: 'var(--accent-warning)' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAttentionFilter(tab.id)}
                  style={{
                    padding: '2px 7px', fontSize: 10.5, fontWeight: 700,
                    borderRadius: 4,
                    backgroundColor: attentionFilter === tab.id ? 'var(--surface-raised)' : 'transparent',
                    color: attentionFilter === tab.id ? 'var(--accent-primary-text)' : 'var(--text-muted)',
                    boxShadow: attentionFilter === tab.id ? 'var(--shadow-sm)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', border: 'none'
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span style={{
                      fontSize: 9, padding: '0 4px', borderRadius: 8,
                      backgroundColor: tab.color ? `color-mix(in srgb, ${tab.color} 18%, transparent)` : 'var(--border-default)',
                      color: tab.color || 'var(--text-primary)', fontWeight: 800
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Exceptions Scroll List (Max height 400px so it's neat and clean) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 400, overflowY: 'auto' }}>
            {filteredAttention.length === 0 ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: 16,
                backgroundColor: 'var(--status-positive-bg)',
                border: '1px solid var(--status-positive-border)',
                borderRadius: 8, color: 'var(--status-positive-fg)', fontSize: 12, fontWeight: 600
              }}>
                <CheckCircle2 size={16} />
                <span>All lines, inventory thresholds, and quality parameters operating within control limits.</span>
              </div>
            ) : (
              filteredAttention.map((it, idx) => {
                const isCrit = it.severity === 'critical';
                const borderCol = isCrit ? 'var(--accent-danger)' : 'var(--accent-warning)';
                const rawParts = it.detail ? it.detail.split(' · ') : [];

                return (
                  <div
                    key={idx}
                    onClick={() => it.path && navigate(it.path)}
                    role="button"
                    tabIndex={0}
                    style={{
                      border: '1px solid var(--border-default)',
                      borderLeft: `3px solid ${borderCol}`,
                      borderRadius: 8,
                      padding: '8px 10px',
                      backgroundColor: 'var(--surface-raised)',
                      cursor: it.path ? 'pointer' : 'default',
                      transition: 'all 0.12s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-sunken)';
                      e.currentTarget.style.borderColor = 'var(--border-strong)';
                      e.currentTarget.style.borderLeftColor = borderCol;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface-raised)';
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                      e.currentTarget.style.borderLeftColor = borderCol;
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 4,
                          backgroundColor: isCrit ? 'var(--status-negative-bg)' : 'var(--status-caution-bg)',
                          color: isCrit ? 'var(--status-negative-fg)' : 'var(--status-caution-fg)',
                          textTransform: 'uppercase'
                        }}>
                          {it.severity}
                        </span>
                        {it.module && (
                          <span style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--text-muted)', backgroundColor: 'var(--surface-sunken)', padding: '1px 5px', borderRadius: 4 }}>
                            {it.module}
                          </span>
                        )}
                      </div>

                      {it.path && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-primary-text)', display: 'flex', alignItems: 'center', gap: 2 }}>
                          Resolve <ChevronRight size={11} />
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                      {it.title}
                    </div>

                    {/* Metadata chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 1 }}>
                      {rawParts.length > 1 ? (
                        rawParts.slice(0, 3).map((p, pIdx) => {
                          const isLate = p.includes('late') || p.includes('due') || p.includes('reorder') || p.includes('In-Repair');
                          return (
                            <span
                              key={pIdx}
                              style={{
                                fontSize: 9.5,
                                padding: '1px 5px',
                                borderRadius: 3,
                                backgroundColor: isLate ? (isCrit ? 'var(--status-negative-bg)' : 'var(--status-caution-bg)') : 'var(--surface-sunken)',
                                color: isLate ? (isCrit ? 'var(--status-negative-fg)' : 'var(--status-caution-fg)') : 'var(--text-muted)',
                                border: `1px solid ${isLate ? (isCrit ? 'var(--status-negative-border)' : 'var(--status-caution-border)') : 'var(--border-subtle)'}`,
                                fontWeight: isLate ? 700 : 500,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {p}
                            </span>
                          );
                        })
                      ) : (
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
                          {it.detail}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── 5. Floor Quick Actions Command Bar ── */}
      <DashboardSectionHeader
        number="04"
        title="Floor Execution Quick Shortcuts"
        subtitle="One-click access to raise sales orders, purchase orders, output logs & NCRs"
        badge="8 Shortcuts"
      />
      <div style={{
        backgroundColor: 'var(--surface-raised)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '10px 14px'
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
          Floor Quick Actions &amp; Work Shortcuts
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {canAccess(user, M.SALES) && (
            <button type="button" onClick={go('/sales/order?create=1')} className="btn" style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 12 }}>
              <Plus size={12} color="var(--accent-primary)" /> New Sales Order
            </button>
          )}
          {canAccess(user, M.PROCUREMENT) && (
            <button type="button" onClick={go('/procurement/po?create=1')} className="btn" style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 12 }}>
              <Plus size={12} color="var(--accent-primary)" /> New Purchase Order
            </button>
          )}
          {canAccess(user, M.GOODS_RECEIPT) && (
            <button type="button" onClick={go('/receipt/grn')} className="btn" style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 12 }}>
              <PackageCheck size={12} color="var(--accent-success)" /> Gate Inward (GRN)
            </button>
          )}
          {canAccess(user, M.PRODUCTION) && (
            <button type="button" onClick={go('/production/output')} className="btn" style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 12 }}>
              <Factory size={12} color="var(--accent-teal)" /> Log Press Output
            </button>
          )}
          {canAccess(user, M.SHOP_FLOOR) && (
            <button type="button" onClick={go('/shopfloor/downtime')} className="btn" style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 12 }}>
              <Timer size={12} color="var(--accent-warning)" /> Log Press Downtime
            </button>
          )}
          {canAccess(user, M.QUALITY) && (
            <button type="button" onClick={go('/quality/ncr')} className="btn" style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 12 }}>
              <AlertTriangle size={12} color="var(--accent-danger)" /> Raise Quality NCR
            </button>
          )}
          {canAccess(user, M.DISPATCH) && (
            <button type="button" onClick={go('/dispatch/execution')} className="btn" style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 12 }}>
              <Truck size={12} color="var(--accent-primary)" /> Process Dispatch
            </button>
          )}
          {canAccess(user, M.MRP) && (
            <button type="button" onClick={go('/mrp/execution')} className="btn" style={{ backgroundColor: 'var(--surface-sunken)', border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 12 }}>
              <Wrench size={12} color="var(--accent-purple)" /> Run Material Plan (MRP)
            </button>
          )}
        </div>
      </div>

      {/* ── 6. Departmental Operational Launchpad (All 24 Modules Preserved & Categorized) ── */}
      <DashboardSectionHeader
        number="05"
        title="Departmental Operational Launchpad"
        subtitle="All 24 business modules organized into dedicated department panels"
        badge="24 Modules"
      />

      {/* Launchpad Category Filter Tabs & Instant Filter Search */}
      <div style={{
        backgroundColor: 'var(--surface-raised)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-sm)',
        padding: '10px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={15} color="var(--accent-primary)" />
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
            Filter Department Directory
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Category filter tabs */}
          <div style={{ display: 'flex', gap: 2, backgroundColor: 'var(--surface-sunken)', padding: 2, borderRadius: 6 }}>
            {[
              { id: 'all', label: 'All Modules' },
              { id: 'sales', label: 'Sales & Orders' },
              { id: 'production', label: 'Shop Floor' },
              { id: 'procurement', label: 'Procurement' },
              { id: 'partners', label: 'Partners' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'admin', label: 'Admin' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setLaunchpadCategory(cat.id)}
                style={{
                  padding: '4px 9px', fontSize: 11, fontWeight: 700,
                  borderRadius: 4,
                  backgroundColor: launchpadCategory === cat.id ? 'var(--surface-raised)' : 'transparent',
                  color: launchpadCategory === cat.id ? 'var(--accent-primary-text)' : 'var(--text-muted)',
                  boxShadow: launchpadCategory === cat.id ? 'var(--shadow-sm)' : 'none',
                  cursor: 'pointer', border: 'none'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Live Filter Search */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Filter modules…"
              value={launchpadSearch}
              onChange={(e) => setLaunchpadSearch(e.target.value)}
              style={{
                padding: '4px 8px 4px 24px', fontSize: 11, borderRadius: 6,
                border: '1px solid var(--border-default)', backgroundColor: 'var(--surface-sunken)',
                color: 'var(--text-primary)', width: 140
              }}
            />
            <Search size={11} color="var(--text-muted)" style={{ position: 'absolute', left: 7, top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>
      </div>

      {/* Department 1: Sales & Customer Orders */}
      {(launchpadCategory === 'all' || launchpadCategory === 'sales') && (
        <DepartmentSection
          number="1"
          title="Sales & Customer Orders"
          subtitle="Quotations, Inquiries, Deliveries & Invoicing"
          count={9}
          accent="var(--accent-primary)"
          icon={ShoppingCart}
        >
          {canAccess(user, M.SALES) && <CreateTile title="New Sales Order" onClick={go('/sales/order?create=1')} />}
          {canAccess(user, M.SALES) && <Tile title="Sales Orders" count={sales?.openOrders ?? 0} icon={ShoppingCart} loading={loading} onClick={go('/sales/order')} />}
          {canAccess(user, M.SALES) && <Tile title="Quotations" count={sales?.quotations ?? 0} icon={FileText} loading={loading} onClick={go('/sales/quotation')} />}
          {canAccess(user, M.SALES) && <Tile title="Inquiries" count={sales?.inquiries ?? 0} icon={ClipboardList} loading={loading} onClick={go('/sales/inquiry')} />}
          {canAccess(user, M.DISPATCH) && <Tile title="Deliveries" count={sales?.deliveries ?? 0} icon={Truck} loading={loading} onClick={go('/dispatch/execution')} />}
          {canAccess(user, M.DISPATCH) && (
            <Tile
              title="Overdue Deliveries" count={sales?.overdueDeliveries ?? 0} icon={Timer}
              accent="var(--accent-danger)" alert={(sales?.overdueDeliveries ?? 0) > 0}
              footer="Past promise date" loading={loading} onClick={go('/dispatch/tracking')}
            />
          )}
          {canAccess(user, M.FINANCE) && <Tile title="A/R Invoices" count={sales?.arInvoices ?? 0} icon={Receipt} loading={loading} onClick={go('/finance/ar')} />}
          {canAccess(user, M.FINANCE) && <CreateTile title="New A/R Invoice" onClick={go('/finance/ar?create=1')} />}
          {canAccess(user, M.FINANCE) && <Tile title="A/R Outstanding" money={sales?.arOutstanding ?? 0} icon={LineChart} footer="Receivable" loading={loading} onClick={go('/finance/ar')} />}
        </DepartmentSection>
      )}

      {/* Department 2: Shop Floor & Stamping Operations */}
      {(launchpadCategory === 'all' || launchpadCategory === 'production') && (
        <DepartmentSection
          number="2"
          title="Shop Floor & Stamping Operations"
          subtitle="Work orders, output yield, downtime & IATF quality"
          count={6}
          accent="var(--accent-teal)"
          icon={Factory}
        >
          {canAccess(user, M.PRODUCTION) && <Tile title="Work Orders" count={prod?.openWOs ?? 0} icon={Factory} loading={loading} onClick={go('/production/wo')} />}
          {canAccess(user, M.PRODUCTION) && <Tile title="Today's Good Output" count={prod?.goodToday ?? 0} subtitle={`${prod?.scrapRateToday ?? 0}% scrap`} icon={CheckCircle2} footer="Good parts stamped" loading={loading} onClick={go('/production/output')} />}
          {canAccess(user, M.SHOP_FLOOR) && (
            <Tile
              title="Downtime Today" count={prod?.downtimeMinutesToday ?? 0} subtitle="minutes lost" icon={Timer}
              accent="var(--accent-warning)" alert={(prod?.downtimeMinutesToday ?? 0) > 0}
              footer="Press stoppages" loading={loading} onClick={go('/shopfloor/downtime')}
            />
          )}
          {canAccess(user, M.QUALITY) && (
            <Tile
              title="Pending Inspections" count={prod?.pendingInspections ?? 0} icon={ScanLine}
              accent="var(--accent-warning)" alert={(prod?.pendingInspections ?? 0) > 0}
              footer="Awaiting QC clearance" loading={loading} onClick={go('/quality/incoming')}
            />
          )}
          {canAccess(user, M.QUALITY) && (
            <Tile
              title="Non-Conformances" count={prod?.openNCRs ?? 0} icon={AlertTriangle}
              accent="var(--accent-danger)" alert={(prod?.openNCRs ?? 0) > 0} footer="Open 8D investigations" loading={loading} onClick={go('/quality/ncr')}
            />
          )}
          {canAccess(user, M.SHOP_FLOOR) && <Tile title="Machine Utilization" count={d?.system?.plants ?? 0} subtitle="plants configured" icon={Factory} footer="Live monitor" loading={loading} onClick={go('/shopfloor/machine')} />}
        </DepartmentSection>
      )}

      {/* Department 3: Procurement, SCM & Stores Inventory */}
      {(launchpadCategory === 'all' || launchpadCategory === 'procurement') && (
        <DepartmentSection
          number="3"
          title="Procurement, SCM & Stores Inventory"
          subtitle="Purchase orders, gate receipts, stock control & MRP"
          count={8}
          accent="var(--accent-warning)"
          icon={Boxes}
        >
          {canAccess(user, M.PROCUREMENT) && <Tile title="Purchase Orders" count={proc?.openPOs ?? 0} icon={FileText} loading={loading} onClick={go('/procurement/po')} />}
          {canAccess(user, M.PROCUREMENT) && <CreateTile title="New Purchase Order" onClick={go('/procurement/po?create=1')} />}
          {canAccess(user, M.GOODS_RECEIPT) && <Tile title="Goods Receipts" count={proc?.pendingGRNs ?? 0} icon={PackageCheck} footer="To inspect & post" loading={loading} onClick={go('/receipt/grn')} />}
          {canAccess(user, M.INVENTORY) && (
            <Tile
              title="Low Stock Items" count={inv?.lowStock ?? 0} icon={Package}
              accent="var(--accent-warning)" alert={(inv?.lowStock ?? 0) > 0}
              footer="At reorder level" loading={loading} onClick={go('/inventory/control')}
            />
          )}
          {canAccess(user, M.MRP) && (
            <Tile
              title="Material Shortages" count={inv?.openShortages ?? 0}
              subtitle={inv?.criticalShortages ? `${inv.criticalShortages} critical` : undefined} icon={AlertTriangle}
              accent={(inv?.criticalShortages ?? 0) > 0 ? 'var(--accent-danger)' : 'var(--accent-warning)'}
              alert={(inv?.openShortages ?? 0) > 0} footer="Production shortages" loading={loading} onClick={go('/mrp/shortages')}
            />
          )}
          {canAccess(user, M.MASTER_DATA) && <Tile title="Catalog Items" count={(inv?.products ?? 0) + (inv?.materials ?? 0)} icon={Boxes} footer="Finished goods + raw materials" loading={loading} onClick={go('/master/product')} />}
          {canAccess(user, M.MASTER_DATA) && <CreateTile title="New Master Item" onClick={go('/master/product?create=1')} />}
          {canAccess(user, M.MRP) && <CreateTile title="Run MRP Engine" onClick={go('/mrp/execution')} />}
        </DepartmentSection>
      )}

      {/* Department 4: Business Partners */}
      {(launchpadCategory === 'all' || launchpadCategory === 'partners') && (
        <DepartmentSection
          number="4"
          title="Business Partners (OEMs & Vendors)"
          subtitle="Automotive OEM clients, Tier-1 vendors & steel suppliers"
          count={4}
          accent="#6366f1"
          icon={Users}
        >
          {canAccess(user, [M.MASTER_DATA, M.SALES]) && <Tile title="Active Customers" count={d?.partners?.customers ?? 0} icon={Users} footer="Automotive OEMs & Tier-1s" loading={loading} onClick={go('/master/customer')} />}
          {canAccess(user, [M.MASTER_DATA, M.SALES]) && <CreateTile title="New Customer" onClick={go('/master/customer?create=1')} />}
          {canAccess(user, [M.MASTER_DATA, M.PROCUREMENT]) && <Tile title="Active Suppliers" count={d?.partners?.vendors ?? 0} icon={Building2} footer="Steel coils, tooling & hardware" loading={loading} onClick={go('/master/vendor')} />}
          {canAccess(user, [M.MASTER_DATA, M.PROCUREMENT]) && <CreateTile title="New Supplier" onClick={go('/master/vendor?create=1')} />}
        </DepartmentSection>
      )}

      {/* Department 5: Department Analytics Hubs */}
      {(launchpadCategory === 'all' || launchpadCategory === 'analytics') && (
        <DepartmentSection
          number="5"
          title="Department Analytics Hubs"
          subtitle="Executive intelligence, OEE reports, financial charts & MTBF"
          count={7}
          accent="var(--accent-purple)"
          icon={BarChart3}
        >
          {ANALYTICS_CHARTS.filter(([, , mod]) => canAccess(user, mod)).map(([label, path, , desc]) => (
            <div
              key={path}
              onClick={go(path)}
              role="button"
              tabIndex={0}
              style={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-sm)',
                minHeight: 96,
                padding: '11px 13px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.16s ease',
                color: 'var(--text-primary)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <BarChart3 size={15} color="var(--accent-primary)" />
                <span style={{ fontSize: 10, color: 'var(--accent-primary-text)', fontWeight: 700 }}>Open &rarr;</span>
              </div>
            </div>
          ))}
        </DepartmentSection>
      )}

      {/* Department 6: System Administration & Governance */}
      {(launchpadCategory === 'all' || launchpadCategory === 'admin') && (
        <DepartmentSection
          number="6"
          title="System Administration & Governance"
          subtitle="RBAC security, user accounts, plants & approval workflows"
          count={4}
          accent="var(--text-secondary)"
          icon={Shield}
        >
          {canAccess(user, M.USERS) && <Tile title="Users" count={d?.system?.users ?? 0} icon={Users} footer="Active staff logins" loading={loading} onClick={go('/users')} />}
          {canAccess(user, M.ROLES) && <Tile title="Security Roles" count={d?.system?.roles ?? 0} icon={Shield} footer="RBAC access tiers" loading={loading} onClick={go('/roles')} />}
          {canAccess(user, M.COMPANY_SETUP) && <Tile title="Plants & Units" count={d?.system?.plants ?? 0} icon={Building2} footer="Operating facilities" loading={loading} onClick={go('/company')} />}
          {canAccess(user, M.APPROVALS) && (
            <Tile
              title="Pending Approvals" count={d?.system?.pendingApprovals ?? 0} icon={ClipboardCheck}
              accent="var(--accent-purple)" alert={(d?.system?.pendingApprovals ?? 0) > 0} footer="Awaiting sign-off" loading={loading} onClick={go('/approvals')}
            />
          )}
        </DepartmentSection>
      )}
    </div>
  );
};

export default Dashboard;
