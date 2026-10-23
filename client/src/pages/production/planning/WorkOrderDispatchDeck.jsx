import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Factory, 
  Search, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ArrowRight,
  RefreshCw,
  Box
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { fmtQty } from '../../../utils/money';

const WorkOrderDispatchDeck = ({
  plans = [],
  onOpenCreateModal
}) => {
  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    fetchWorkOrders();
  }, []);

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/production/v2/work-orders');
      if (res.data?.data) {
        setWorkOrders(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching work orders', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = workOrders.filter(wo => {
    if (statusFilter !== 'ALL' && wo.Status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const woNum = (wo.WO_Number || '').toLowerCase();
    const plant = (wo.Plant_ID?.name || '').toLowerCase();
    const planNum = (wo.Source_Plan_ID?.Plan_Number || '').toLowerCase();
    return woNum.includes(q) || plant.includes(q) || planNum.includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Control Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: 'var(--bg-secondary)',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 260px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search WO number, source plan, plant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', fontSize: '13px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ fontSize: '12px', padding: '5px 8px', height: '34px', borderRadius: '6px' }}
          >
            <option value="ALL">All WO Statuses</option>
            <option value="Released">Released</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Closed">Closed</option>
          </select>

          <button
            onClick={fetchWorkOrders}
            className="btn btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px', height: '34px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            title="Refresh work orders"
          >
            <RefreshCw size={12} className={loading ? 'spinner' : ''} />
            Refresh
          </button>

          <a
            href="/production/work-orders"
            className="btn btn-primary"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              height: '34px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#e11d48',
              borderColor: '#e11d48',
              textDecoration: 'none'
            }}
          >
            <Factory size={13} />
            Go to Work Orders Module
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Dispatched Work Orders Table */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        overflowX: 'auto'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
          <thead>
            <tr style={{
              backgroundColor: 'rgba(15, 23, 42, 0.03)',
              borderBottom: '2px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              <th style={{ padding: '12px 14px' }}>Work Order No</th>
              <th style={{ padding: '12px 14px' }}>Source Production Plan</th>
              <th style={{ padding: '12px 14px' }}>Plant</th>
              <th style={{ padding: '12px 14px' }}>Status</th>
              <th style={{ padding: '12px 14px' }}>Priority</th>
              <th style={{ padding: '12px 14px' }}>Part Details</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Target Units</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <div className="spinner" style={{ width: '18px', height: '18px' }} />
                    Loading dispatched work orders...
                  </div>
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Factory size={36} style={{ color: 'var(--text-muted)', marginBottom: '8px', opacity: 0.6 }} />
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                    No shop floor work orders dispatched yet
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    When a plan is approved or released in the Master Schedule Cockpit, click <strong>"Dispatch WOs"</strong> to spawn work orders.
                  </p>
                </td>
              </tr>
            ) : (
              filteredOrders.map((wo) => {
                const totalQty = wo.details?.reduce((sum, d) => sum + (d.Target_Quantity || 0), 0) || 0;
                return (
                  <tr key={wo._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#0f172a' }}>
                      {wo.WO_Number}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        backgroundColor: 'rgba(244, 63, 94, 0.08)',
                        color: '#e11d48',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: '11px',
                        border: '1px solid rgba(244, 63, 94, 0.2)'
                      }}>
                        {wo.Source_Plan_ID?.Plan_Number || 'Manual WO'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-primary)' }}>
                      {wo.Plant_ID?.name || 'LBAP Hosur'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <StatusBadge value={wo.Status || 'Released'} />
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: wo.Priority === 'Urgent' ? '#e11d48' : 'var(--text-secondary)'
                      }}>
                        {wo.Priority || 'Normal'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                      {wo.details?.length || 1} line item(s)
                    </td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                      {fmtQty(totalQty)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WorkOrderDispatchDeck;
