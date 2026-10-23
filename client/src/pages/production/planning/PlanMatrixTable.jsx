import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight, 
  Gauge, 
  CheckCircle2, 
  Send, 
  Layers, 
  Factory, 
  Printer, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  Check, 
  ArrowUpDown,
  FileSpreadsheet,
  Box,
  Plus,
  Sparkles
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { fmtQty } from '../../../utils/money';

const PlanMatrixTable = ({
  plans = [],
  loading = false,
  busy = false,
  busyId = null,
  onValidateCapacity,
  onApprovePlan,
  onReleasePlan,
  onGenerateWos,
  onInspectCapacity,
  onSelectPlanForTimeline,
  onOpenPrintModal,
  onSeedDummy,
  onOpenCreateModal,
  selectedPlanId
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [expandedPlanIds, setExpandedPlanIds] = useState(new Set());
  const [sortField, setSortField] = useState('createdAt');
  const [sortAsc, setSortAsc] = useState(false);

  const toggleExpand = (id) => {
    setExpandedPlanIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPlanIds(new Set(plans.map(p => p._id)));
  };

  const collapseAll = () => {
    setExpandedPlanIds(new Set());
  };

  // Filtered & sorted plans
  const filteredPlans = useMemo(() => {
    return plans.filter(p => {
      if (statusFilter !== 'ALL' && p.Status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && p.Priority !== priorityFilter) return false;
      if (typeFilter !== 'ALL' && p.Plan_Type !== typeFilter) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const planNo = (p.Plan_Number || '').toLowerCase();
      const notes = (p.Notes || '').toLowerCase();
      const plant = (p.Plant_ID?.name || '').toLowerCase();
      const hasMatMatch = p.details?.some(d => 
        (d.Material_ID?.name || '').toLowerCase().includes(q) ||
        (d.Material_ID?.code || '').toLowerCase().includes(q)
      );

      return planNo.includes(q) || notes.includes(q) || plant.includes(q) || hasMatMatch;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortField === 'plant') {
        valA = a.Plant_ID?.name || '';
        valB = b.Plant_ID?.name || '';
      } else if (sortField === 'lines') {
        valA = a.details?.length || 0;
        valB = b.details?.length || 0;
      }
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [plans, searchQuery, statusFilter, priorityFilter, typeFilter, sortField, sortAsc]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getCapacityStatusBadge = (status) => {
    const isVal = status === 'Validated';
    const isOver = status === 'Overloaded';
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: isVal ? 'rgba(16, 185, 129, 0.12)' : isOver ? 'rgba(239, 68, 68, 0.12)' : 'rgba(100, 116, 139, 0.12)',
        color: isVal ? '#059669' : isOver ? '#dc2626' : '#64748b',
        border: `1px solid ${isVal ? 'rgba(16, 185, 129, 0.3)' : isOver ? 'rgba(239, 68, 68, 0.3)' : 'rgba(100, 116, 139, 0.25)'}`
      }}>
        {isVal && <CheckCircle2 size={12} />}
        {isOver && <AlertTriangle size={12} />}
        {!isVal && !isOver && <Gauge size={12} />}
        {status || 'Unchecked'}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const isUrgent = priority === 'Urgent';
    const isHigh = priority === 'High';
    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: isUrgent ? 'rgba(225, 29, 72, 0.12)' : isHigh ? 'rgba(245, 158, 11, 0.12)' : 'rgba(241, 245, 249, 1)',
        color: isUrgent ? '#e11d48' : isHigh ? '#d97706' : '#475569',
        border: `1px solid ${isUrgent ? 'rgba(225, 29, 72, 0.3)' : isHigh ? 'rgba(245, 158, 11, 0.3)' : 'rgba(203, 213, 225, 0.6)'}`
      }}>
        {priority}
      </span>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Control Filter Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: 'var(--bg-secondary)',
        padding: '12px 16px',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        {/* Search input with live match */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 280px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Search plan no, material, part code, notes, plant..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: '34px',
              fontSize: '13px',
              width: '100%',
              borderRadius: '8px',
              borderColor: 'var(--border-color)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '10px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '12px'
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>STATUS:</span>
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ fontSize: '12px', padding: '5px 8px', height: '32px', borderRadius: '6px' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Approved">Approved</option>
              <option value="Released">Released</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>PRIORITY:</span>
            <select
              className="input-field"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{ fontSize: '12px', padding: '5px 8px', height: '32px', borderRadius: '6px' }}
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>TYPE:</span>
            <select
              className="input-field"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ fontSize: '12px', padding: '5px 8px', height: '32px', borderRadius: '6px' }}
            >
              <option value="ALL">All Types</option>
              <option value="Make-to-Stock">Make-to-Stock</option>
              <option value="Make-to-Order">Make-to-Order</option>
              <option value="Experimental">Experimental</option>
            </select>
          </div>

          {/* Expand/Collapse All */}
          <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
            <button
              onClick={expandAll}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '11px', height: '32px' }}
              title="Expand all part lines"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '11px', height: '32px' }}
              title="Collapse all part lines"
            >
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Matrix (Pure document flow, NO nested double scrollbar) */}
      <div style={{
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '10px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
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
              <th style={{ padding: '12px 10px', width: '36px', textAlign: 'center' }}></th>
              <th 
                onClick={() => handleSort('Plan_Number')}
                style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Plan Number
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th 
                onClick={() => handleSort('Plan_Type')}
                style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Type &amp; Priority
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '12px 14px' }}>Plant Location</th>
              <th style={{ padding: '12px 14px' }}>Rough-Cut Capacity</th>
              <th 
                onClick={() => handleSort('lines')}
                style={{ padding: '12px 14px', cursor: 'pointer', userSelect: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Part Lines &amp; Qty
                  <ArrowUpDown size={12} />
                </div>
              </th>
              <th style={{ padding: '12px 14px' }}>Lifecycle Status</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Manufacturing Operations</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <div className="spinner" style={{ width: '18px', height: '18px' }} />
                    Loading production plans...
                  </div>
                </td>
              </tr>
            ) : filteredPlans.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Box size={36} style={{ color: 'var(--text-muted)', marginBottom: '8px', opacity: 0.6 }} />
                  <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)' }}>
                    No production plans matched your criteria
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '460px', margin: '4px auto 0' }}>
                    Adjust your search query or status filter, or generate sample OEM automotive plans with scheduled part lines and capacity loads.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                    {onSeedDummy && (
                      <button
                        type="button"
                        onClick={onSeedDummy}
                        disabled={busy}
                        className="btn btn-primary"
                        style={{
                          backgroundColor: '#e11d48',
                          borderColor: '#e11d48',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 18px',
                          fontSize: '13px',
                          fontWeight: 600
                        }}
                      >
                        <Sparkles size={15} />
                        {busy ? 'Generating Demo Data…' : 'Generate Demo Production Plans'}
                      </button>
                    )}
                    {onOpenCreateModal && (
                      <button
                        type="button"
                        onClick={onOpenCreateModal}
                        className="btn btn-secondary"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          fontSize: '13px'
                        }}
                      >
                        <Plus size={15} />
                        Add Production Plan Manually
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredPlans.map((plan) => {
                const isExpanded = expandedPlanIds.has(plan._id);
                const isSelected = selectedPlanId === plan._id;
                const totalUnits = plan.details?.reduce((acc, d) => acc + (d.Target_Quantity || 0), 0) || 0;
                const isDraft = plan.Status === 'Draft';
                const isApproved = plan.Status === 'Approved';
                const isReleased = plan.Status === 'Released';
                const isCapacityValidated = plan.Capacity_Status === 'Validated';

                return (
                  <React.Fragment key={plan._id}>
                    <tr style={{
                      borderBottom: '1px solid var(--border-color)',
                      backgroundColor: isSelected ? 'rgba(244, 63, 94, 0.05)' : isExpanded ? 'rgba(15, 23, 42, 0.015)' : 'transparent',
                      transition: 'background-color 0.15s ease'
                    }}>
                      {/* Expand / Collapse trigger */}
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => toggleExpand(plan._id)}
                          style={{
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px',
                            borderRadius: '4px'
                          }}
                          title={isExpanded ? 'Collapse line details' : 'Expand line details'}
                        >
                          {isExpanded ? <ChevronDown size={15} color="#e11d48" /> : <ChevronRight size={15} />}
                        </button>
                      </td>

                      {/* Plan Number & Notes */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            fontSize: '13px',
                            color: '#0f172a'
                          }}>
                            {plan.Plan_Number}
                          </span>
                          {plan.Notes && (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={plan.Notes}>
                              {plan.Notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type & Priority */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'var(--text-primary)'
                          }}>
                            {plan.Plan_Type}
                          </span>
                          {getPriorityBadge(plan.Priority)}
                        </div>
                      </td>

                      {/* Plant Location */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>
                          {plan.Plant_ID?.name || 'LBAP Hosur'}
                        </span>
                      </td>

                      {/* Capacity Status */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {getCapacityStatusBadge(plan.Capacity_Status)}
                          <button
                            type="button"
                            onClick={() => onInspectCapacity(plan)}
                            className="btn btn-secondary"
                            style={{
                              padding: '2px 6px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            title="Inspect Rough-Cut Capacity breakdown across work centers"
                          >
                            <Gauge size={11} />
                            RCCP
                          </button>
                        </div>
                      </td>

                      {/* Part Lines count & Volume */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
                            {plan.details?.length || 0} part line{plan.details?.length === 1 ? '' : 's'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
                            Σ {fmtQty(totalUnits)} units
                          </span>
                        </div>
                      </td>

                      {/* Lifecycle Status */}
                      <td style={{ padding: '12px 14px' }}>
                        <StatusBadge value={plan.Status} />
                      </td>

                      {/* Actions Toolbar */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                          {/* 1. Capacity Check Button for Draft */}
                          {isDraft && !isCapacityValidated && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              disabled={busy}
                              onClick={() => onValidateCapacity(plan._id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                borderColor: 'rgba(244, 63, 94, 0.4)',
                                color: '#e11d48'
                              }}
                            >
                              <Gauge size={12} />
                              {busyId === 'cap-' + plan._id ? 'Checking…' : 'Check Capacity'}
                            </button>
                          )}

                          {/* 2. Approve Plan Button for Draft (Enabled once validated or direct) */}
                          {isDraft && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={busy}
                              onClick={() => onApprovePlan(plan._id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#059669',
                                borderColor: '#059669'
                              }}
                            >
                              <CheckCircle2 size={12} />
                              {busyId === 'app-' + plan._id ? 'Approving…' : 'Approve Plan'}
                            </button>
                          )}

                          {/* 3. Release to Shop Floor for Approved */}
                          {isApproved && (
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={busy}
                              onClick={() => onReleasePlan(plan._id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                backgroundColor: '#e11d48',
                                borderColor: '#e11d48'
                              }}
                            >
                              <Send size={12} />
                              {busyId === 'rel-' + plan._id ? 'Releasing…' : 'Release to Shop'}
                            </button>
                          )}

                          {/* 4. Generate Work Orders for Approved or Released */}
                          {(isApproved || isReleased) && (
                            <button
                              type="button"
                              className="btn btn-secondary"
                              disabled={busy}
                              onClick={() => onGenerateWos(plan._id)}
                              style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Generate Shop Floor Work Orders for all part lines in this plan"
                            >
                              <Factory size={12} />
                              {busyId === 'wos-' + plan._id ? 'Spawning…' : 'Dispatch WOs'}
                            </button>
                          )}

                          {/* 5. Takt Timeline Shortcut */}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => onSelectPlanForTimeline(plan)}
                            style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            title="Open in Takt &amp; Gantt Timeline Schedule"
                          >
                            <Clock size={12} />
                            Takt
                          </button>

                          {/* 6. Printable MPS Certificate */}
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => onOpenPrintModal(plan)}
                            style={{ padding: '4px 7px', fontSize: '11px', display: 'inline-flex', alignItems: 'center' }}
                            title="Print IATF 16949 Master Production Schedule document"
                          >
                            <Printer size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Part Line Drawer */}
                    {isExpanded && (
                      <tr style={{ backgroundColor: 'rgba(248, 250, 252, 0.95)', borderBottom: '2px solid rgba(226, 232, 240, 0.9)' }}>
                        <td colSpan="8" style={{ padding: '14px 20px 16px 44px' }}>
                          <div style={{
                            borderLeft: '3px solid #e11d48',
                            paddingLeft: '14px'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '8px'
                            }}>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                color: '#1e293b'
                              }}>
                                Scheduled Part Lines for {plan.Plan_Number} ({plan.details?.length || 0} items)
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                Drag sequencing order reflected in shop floor routing
                              </span>
                            </div>

                            {/* Part Lines Inner Table */}
                            {(!plan.details || plan.details.length === 0) ? (
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                                No scheduled lines found on this plan.
                              </div>
                            ) : (
                              <div style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '6px',
                                border: '1px solid rgba(226, 232, 240, 0.8)',
                                overflowX: 'auto'
                              }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                  <thead>
                                    <tr style={{
                                      backgroundColor: 'rgba(241, 245, 249, 0.7)',
                                      borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                                      color: '#64748b',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      textAlign: 'left'
                                    }}>
                                      <th style={{ padding: '8px 10px', width: '50px' }}>Seq</th>
                                      <th style={{ padding: '8px 12px' }}>Material / Part Specification</th>
                                      <th style={{ padding: '8px 12px' }}>Code / Grade</th>
                                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Target Qty</th>
                                      <th style={{ padding: '8px 12px' }}>Start Date</th>
                                      <th style={{ padding: '8px 12px' }}>End Date</th>
                                      <th style={{ padding: '8px 12px', textAlign: 'right' }}>Schedule Duration</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {plan.details.map((line, idx) => {
                                      const start = new Date(line.Planned_Start_Date);
                                      const end = new Date(line.Planned_End_Date);
                                      const diffTime = Math.abs(end - start);
                                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                                      return (
                                        <tr key={line._id || idx} style={{
                                          borderBottom: idx === plan.details.length - 1 ? 'none' : '1px solid rgba(241, 245, 249, 0.9)'
                                        }}>
                                          <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontWeight: 600, color: '#e11d48' }}>
                                            {line.Line_Sequence_Number || (idx + 1) * 10}
                                          </td>
                                          <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>
                                            {line.Material_ID?.name || 'Raw / Component Part'}
                                          </td>
                                          <td style={{ padding: '8px 12px', color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>
                                            {line.Material_ID?.code || '-'}{line.Material_ID?.grade ? ` (${line.Material_ID.grade})` : ''}
                                          </td>
                                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                                            {fmtQty(line.Target_Quantity)}
                                          </td>
                                          <td style={{ padding: '8px 12px', color: '#334155' }}>
                                            {line.Planned_Start_Date ? new Date(line.Planned_Start_Date).toLocaleDateString() : '-'}
                                          </td>
                                          <td style={{ padding: '8px 12px', color: '#334155' }}>
                                            {line.Planned_End_Date ? new Date(line.Planned_End_Date).toLocaleDateString() : '-'}
                                          </td>
                                          <td style={{ padding: '8px 12px', textAlign: 'right', color: '#64748b' }}>
                                            <span style={{
                                              background: 'rgba(241, 245, 249, 1)',
                                              padding: '2px 6px',
                                              borderRadius: '4px',
                                              fontSize: '11px',
                                              fontWeight: 500
                                            }}>
                                              {diffDays} day{diffDays === 1 ? '' : 's'}
                                            </span>
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Summary Strip */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '12px',
        color: 'var(--text-secondary)',
        padding: '8px 12px',
        backgroundColor: 'rgba(15, 23, 42, 0.02)',
        borderRadius: '8px'
      }}>
        <span>
          Showing <strong>{filteredPlans.length}</strong> of <strong>{plans.length}</strong> production plans
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          IATF 16949 Master Production Scheduling &amp; Capacity Control
        </span>
      </div>
    </div>
  );
};

export default PlanMatrixTable;
