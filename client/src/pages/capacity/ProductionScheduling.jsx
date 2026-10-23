import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Calendar, CalendarDays, CalendarRange, Plus, Sparkles, Printer, RefreshCw, 
  Activity, AlertTriangle, CheckCircle2, Clock, Gauge, Layers, ShieldCheck, 
  Flame, LayoutGrid, Kanban, BarChart3, ListFilter, SlidersHorizontal
} from 'lucide-react';
import { notify } from '../../utils/notify';

// Specialized Subcomponents
import ScheduleCommandRibbon from './schedule/ScheduleCommandRibbon';
import ScheduleGanttTimeline from './schedule/ScheduleGanttTimeline';
import ScheduleShiftMatrix from './schedule/ScheduleShiftMatrix';
import ScheduleKanbanBoard from './schedule/ScheduleKanbanBoard';
import ScheduleGridLedger from './schedule/ScheduleGridLedger';
import ScheduleDetailDrawer from './schedule/ScheduleDetailDrawer';
import ScheduleFormModal from './schedule/ScheduleFormModal';
import ShiftDispatchPrintModal from './schedule/ShiftDispatchPrintModal';

const ProductionScheduling = () => {
  // Navigation & View Mode State
  const [activeTab, setActiveTab] = useState('Daily'); // 'Daily', 'Weekly', 'Monthly'
  const [viewMode, setViewMode] = useState('Gantt'); // 'Gantt', 'ShiftMatrix', 'Kanban', 'Ledger'

  // Data States
  const [schedules, setSchedules] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [products, setProducts] = useState([]);
  const [mrpSuggestions, setMrpSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  // Modal & Drawer States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    scheduleType: 'Daily',
    shift: 'Shift 1',
    status: 'Draft',
    priority: 'Normal',
    setupTimeHours: 0.5,
    runTimeHours: 2.0,
    plannedOperators: 2
  });

  const runBusy = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchDependencies = async () => {
    try {
      const [wcRes, prodRes, mrpRes] = await Promise.all([
        axios.get('/master/workcenter'),
        axios.get('/master/product'),
        axios.get('/mrp/recommendations')
      ]);

      const activeWc = (wcRes.data?.data || []).filter(wc => wc.isActive !== false && wc.status !== 'Inactive');
      const activeProd = (prodRes.data?.data || []).filter(p => p.lifecycleStatus === 'Active');
      const pendingMrp = (mrpRes.data?.data || []).filter(r => r.suggestionCategory === 'Production' && r.status !== 'Dismissed' && r.status !== 'Converted');

      setWorkCenters(activeWc);
      setProducts(activeProd);
      setMrpSuggestions(pendingMrp);
    } catch (err) {
      console.error('Error fetching scheduling dependencies:', err);
      notify.error('Failed to load work centers or products');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/capacity/schedules?type=${activeTab}`);
      setSchedules(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      notify.error('Failed to load production schedules');
    } finally {
      setLoading(false);
    }
  };

  // Create or Update Schedule
  const handleSave = async (e) => {
    e.preventDefault();
    await runBusy(async () => {
      try {
        if (editingId) {
          const res = await axios.put(`/capacity/schedules/${editingId}`, formData);
          notify.success('Schedule updated successfully');
          if (selectedSchedule?._id === editingId) {
            setSelectedSchedule(res.data?.data || null);
          }
        } else {
          await axios.post('/capacity/schedules', formData);
          notify.success('New production schedule created and allocated');
        }

        setIsFormModalOpen(false);
        setEditingId(null);
        resetFormData();
        fetchData();
        fetchDependencies(); // refresh depleted MRP recommendations
      } catch (err) {
        console.error('Save schedule error:', err);
        notify.error(err.response?.data?.message || 'Error saving production schedule');
      }
    });
  };

  // Open Edit Modal
  const handleEdit = (row) => {
    setFormData({
      scheduleType: row.scheduleType || activeTab,
      targetDate: row.targetDate ? row.targetDate.split('T')[0] : '',
      shift: row.shift || 'Shift 1',
      mrpRecommendationId: row.mrpRecommendationId || '',
      productId: row.productId?._id || row.productId,
      scheduledQuantity: row.scheduledQuantity,
      assignedWorkCenterId: row.assignedWorkCenterId?._id || row.assignedWorkCenterId,
      status: row.status || 'Draft',
      priority: row.priority || 'Normal',
      dieToolId: row.dieToolId || '',
      setupTimeHours: row.setupTimeHours !== undefined ? row.setupTimeHours : 0.5,
      runTimeHours: row.runTimeHours !== undefined ? row.runTimeHours : 2.0,
      plannedOperators: row.plannedOperators || 2,
      workOrderNumber: row.workOrderNumber || '',
      customerReference: row.customerReference || '',
      notes: row.notes || ''
    });
    setEditingId(row._id);
    setIsFormModalOpen(true);
  };

  // Delete Schedule
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule? Associated shop floor dispatch will be removed.')) {
      return;
    }
    try {
      await axios.delete(`/capacity/schedules/${id}`);
      notify.success('Schedule deleted successfully');
      if (selectedSchedule?._id === id) {
        setSelectedSchedule(null);
      }
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error deleting schedule');
    }
  };

  // Update Status directly (e.g. Firm/Released, In-Progress, Completed)
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await axios.put(`/capacity/schedules/${id}`, { status: newStatus });
      notify.success(`Schedule status changed to ${newStatus}`);
      if (selectedSchedule?._id === id) {
        setSelectedSchedule(res.data?.data || null);
      }
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating schedule status');
    }
  };

  // Convert to Shop Floor Work Order
  const handleConvertToWorkOrder = async (schedule) => {
    try {
      const res = await axios.post(`/capacity/schedules/${schedule._id}/convert-to-wo`);
      notify.success(res.data?.message || 'Work Order generated successfully');
      if (selectedSchedule?._id === schedule._id) {
        setSelectedSchedule(res.data?.data || null);
      }
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to generate Work Order');
    }
  };

  // SMED Changeover Optimization
  const handleAutoSequence = async () => {
    try {
      const res = await axios.post('/capacity/schedules/auto-sequence', {});
      notify.success(res.data?.message || 'SMED sequencing optimization applied');
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Auto-sequence optimization failed');
    }
  };

  const resetFormData = () => {
    setFormData({
      scheduleType: activeTab,
      shift: 'Shift 1',
      status: 'Draft',
      priority: 'Normal',
      setupTimeHours: 0.5,
      runTimeHours: 2.0,
      plannedOperators: 2
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '100%',
      padding: '16px 20px',
      overflowY: 'auto',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* 1. Command Ribbon with Live Automotive Telemetry & Controls */}
      <ScheduleCommandRibbon
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        viewMode={viewMode}
        setViewMode={setViewMode}
        schedules={schedules}
        workCenters={workCenters}
        onAddNew={() => {
          resetFormData();
          setEditingId(null);
          setIsFormModalOpen(true);
        }}
        onAutoSequence={handleAutoSequence}
        onPrintDispatch={() => setIsPrintModalOpen(true)}
        onRefresh={fetchData}
        loading={loading}
      />

      {/* 2. Visual Mode Navigation Toolbar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: '8px 14px',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        {/* View Mode Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginRight: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Perspective:
          </span>

          <button
            onClick={() => setViewMode('Gantt')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: viewMode === 'Gantt' ? 600 : 500,
              background: viewMode === 'Gantt' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'Gantt' ? '#ffffff' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <BarChart3 size={14} /> Visual Gantt Timeline
          </button>

          <button
            onClick={() => setViewMode('ShiftMatrix')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: viewMode === 'ShiftMatrix' ? 600 : 500,
              background: viewMode === 'ShiftMatrix' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'ShiftMatrix' ? '#ffffff' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <LayoutGrid size={14} /> Fleet Shift Matrix
          </button>

          <button
            onClick={() => setViewMode('Kanban')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: viewMode === 'Kanban' ? 600 : 500,
              background: viewMode === 'Kanban' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'Kanban' ? '#ffffff' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Kanban size={14} /> Execution Kanban Board
          </button>

          <button
            onClick={() => setViewMode('Ledger')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: viewMode === 'Ledger' ? 600 : 500,
              background: viewMode === 'Ledger' ? 'var(--accent-primary)' : 'transparent',
              color: viewMode === 'Ledger' ? '#ffffff' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <ListFilter size={14} /> Dispatch Grid Ledger
          </button>
        </div>

        {/* Informative Waterfall Resolution Helper */}
        {(activeTab === 'Monthly' || activeTab === 'Weekly') && (
          <div style={{
            fontSize: '11px',
            color: '#d97706',
            background: 'rgba(245, 158, 11, 0.1)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <AlertTriangle size={13} />
            <span>
              <strong>Waterfall Resolution:</strong> Viewing rough-cut {activeTab} plan. Decompose into Daily to release dispatch.
            </span>
          </div>
        )}
      </div>

      {/* 3. Main Workspace Area */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {viewMode === 'Gantt' && (
          <ScheduleGanttTimeline
            schedules={schedules}
            workCenters={workCenters}
            onSelectSchedule={(sched) => setSelectedSchedule(sched)}
            onAddNewForWorkCenter={(wc) => {
              resetFormData();
              setFormData(prev => ({ ...prev, assignedWorkCenterId: wc._id }));
              setIsFormModalOpen(true);
            }}
          />
        )}

        {viewMode === 'ShiftMatrix' && (
          <ScheduleShiftMatrix
            schedules={schedules}
            workCenters={workCenters}
            onSelectSchedule={(sched) => setSelectedSchedule(sched)}
            onAddNew={() => {
              resetFormData();
              setIsFormModalOpen(true);
            }}
            onQuickStatusChange={handleUpdateStatus}
          />
        )}

        {viewMode === 'Kanban' && (
          <ScheduleKanbanBoard
            schedules={schedules}
            activeTab={activeTab}
            onSelectSchedule={(sched) => setSelectedSchedule(sched)}
            onUpdateStatus={handleUpdateStatus}
            onConvertToWorkOrder={handleConvertToWorkOrder}
            onAddNew={() => {
              resetFormData();
              setIsFormModalOpen(true);
            }}
          />
        )}

        {viewMode === 'Ledger' && (
          <ScheduleGridLedger
            schedules={schedules}
            workCenters={workCenters}
            onSelectSchedule={(sched) => setSelectedSchedule(sched)}
            onEditSchedule={handleEdit}
            onDeleteSchedule={handleDelete}
            onUpdateStatus={handleUpdateStatus}
            onConvertToWorkOrder={handleConvertToWorkOrder}
            onAddNew={() => {
              resetFormData();
              setIsFormModalOpen(true);
            }}
          />
        )}
      </div>

      {/* 4. Slide-Out Job Detail Inspector Drawer */}
      <ScheduleDetailDrawer
        schedule={selectedSchedule}
        isOpen={!!selectedSchedule}
        onClose={() => setSelectedSchedule(null)}
        onEdit={(sched) => {
          setSelectedSchedule(null);
          handleEdit(sched);
        }}
        onDelete={(id) => {
          setSelectedSchedule(null);
          handleDelete(id);
        }}
        onUpdateStatus={handleUpdateStatus}
        onConvertToWorkOrder={handleConvertToWorkOrder}
      />

      {/* 5. Create & Edit Schedule Modal */}
      <ScheduleFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleSave}
        formData={formData}
        setFormData={setFormData}
        editingId={editingId}
        activeTab={activeTab}
        workCenters={workCenters}
        products={products}
        mrpSuggestions={mrpSuggestions}
        busy={busy}
      />

      {/* 6. Shift Dispatch Print Sheet Modal */}
      <ShiftDispatchPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        schedules={schedules}
        activeTab={activeTab}
      />
    </div>
  );
};

export default ProductionScheduling;