import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { notify } from '../../utils/notify';

// Modular Subcomponents
import MachineTelemetryRibbon from './machine/MachineTelemetryRibbon';
import MachineFleetGauges from './machine/MachineFleetGauges';
import WorkCenterFleetMatrix from './machine/WorkCenterFleetMatrix';
import PeriodCapacityLedger from './machine/PeriodCapacityLedger';
import WorkOrderLoadInspector from './machine/WorkOrderLoadInspector';
import RecordOvertimeModal from './machine/RecordOvertimeModal';
import SimulateRescheduleModal from './machine/SimulateRescheduleModal';
import NewPeriodModal from './machine/NewPeriodModal';
import ValidateScheduleModal from './machine/ValidateScheduleModal';

const MachineCapacity = () => {
  // Busy lock state for API submissions
  const [busy, setBusy] = useState(false);
  const runBusy = async (fn) => {
    setBusy(true);
    try { 
      await fn(); 
    } finally { 
      setBusy(false); 
    }
  };

  // Main data states
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected period and drill-down load details
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [loadDetails, setLoadDetails] = useState([]);
  const [loadingLoads, setLoadingLoads] = useState(false);

  // View Mode: 'ledger' (Period Table), 'grid' (Machine Bays), 'split' (Split Rebalancer)
  const [viewMode, setViewMode] = useState('ledger');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [overtimeModal, setOvertimeModal] = useState({ isOpen: false, period: null });
  const [rescheduleModal, setRescheduleModal] = useState({ isOpen: false, load: null });
  const [newPeriodModal, setNewPeriodModal] = useState({ isOpen: false });
  const [validateModal, setValidateModal] = useState({ isOpen: false });

  // Initial fetch
  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/capacity/periods');
      const data = res.data.data || [];
      setPeriods(data);

      // Keep selected period synchronized if it was already selected
      if (selectedPeriod) {
        const updated = data.find(p => p._id === selectedPeriod._id);
        if (updated) {
          setSelectedPeriod(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching capacity periods:', err);
      notify.error(err.response?.data?.message || 'Failed to load machine capacity periods');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoadDetails = useCallback(async (periodId) => {
    if (!periodId) return;
    setLoadingLoads(true);
    try {
      const res = await axios.get(`/capacity/periods/${periodId}/loads`);
      setLoadDetails(res.data.data || []);
    } catch (err) {
      console.error('Error fetching load details:', err);
      notify.error('Failed to load work orders for selected period');
    } finally {
      setLoadingLoads(false);
    }
  }, []);

  const handlePeriodSelect = (period) => {
    if (selectedPeriod && selectedPeriod._id === period._id) {
      // Toggle off if clicked again in split mode or keep open
      setSelectedPeriod(period);
      fetchLoadDetails(period._id);
    } else {
      setSelectedPeriod(period);
      fetchLoadDetails(period._id);
    }
  };

  // Submit Overtime (Add extra hours)
  const handleRecordOvertime = async ({ periodId, additionalHours, reason }) => {
    await runBusy(async () => {
      try {
        const res = await axios.post(`/capacity/periods/${periodId}/overtime`, {
          additionalHours,
          reason
        });
        notify.success(res.data.message || 'Capacity injected successfully');
        setOvertimeModal({ isOpen: false, period: null });
        await fetchPeriods();
        if (selectedPeriod && selectedPeriod._id === periodId) {
          await fetchLoadDetails(selectedPeriod._id);
        }
      } catch (err) {
        console.error('Overtime submission error:', err);
        notify.error(err.response?.data?.message || 'Error recording overtime');
      }
    });
  };

  // Submit Reschedule (Move load to another period)
  const handleSimulateReschedule = async ({ loadId, newPeriodId }) => {
    await runBusy(async () => {
      try {
        const res = await axios.post('/capacity/simulate-reschedule', {
          loadId,
          newPeriodId
        });
        notify.success(res.data.message || 'Work order rescheduled and capacity recalculated');
        setRescheduleModal({ isOpen: false, load: null });
        await fetchPeriods();
        if (selectedPeriod) {
          await fetchLoadDetails(selectedPeriod._id);
        }
      } catch (err) {
        console.error('Reschedule error:', err);
        notify.error(err.response?.data?.message || 'Error simulating reschedule');
      }
    });
  };

  // Submit New Period
  const handleCreatePeriod = async (payload) => {
    await runBusy(async () => {
      try {
        const res = await axios.post('/capacity/periods', payload);
        notify.success('Capacity period created successfully');
        setNewPeriodModal({ isOpen: false });
        await fetchPeriods();
      } catch (err) {
        console.error('Create period error:', err);
        notify.error(err.response?.data?.message || 'Error creating capacity period');
      }
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      minHeight: '100%',
      paddingBottom: '40px'
    }}>
      {/* 1. Industrial Telemetry Command Ribbon */}
      <MachineTelemetryRibbon
        viewMode={viewMode}
        setViewMode={setViewMode}
        periods={periods}
        onOpenOvertime={(period) => setOvertimeModal({ isOpen: true, period: period || selectedPeriod || periods[0] })}
        onOpenNewPeriod={() => setNewPeriodModal({ isOpen: true })}
        onOpenValidate={() => setValidateModal({ isOpen: true })}
        onRefresh={fetchPeriods}
        loading={loading}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* 2. Industrial Fleet Telemetry Diagnostics (4 Gauges) */}
      <MachineFleetGauges
        periods={periods}
        onQuickOvertime={(p) => setOvertimeModal({ isOpen: true, period: p })}
      />

      {/* 3. Main Views Deck based on viewMode */}
      {loading ? (
        <div style={{
          background: 'rgba(30, 41, 59, 0.5)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          color: '#94a3b8'
        }}>
          Loading Machine Capacity Fleet Matrix...
        </div>
      ) : (
        <>
          {/* VIEW A: Work Center Fleet Bays Grid */}
          {viewMode === 'grid' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <WorkCenterFleetMatrix
                periods={periods}
                selectedPeriod={selectedPeriod}
                onSelectPeriod={(p) => {
                  handlePeriodSelect(p);
                }}
                onOpenOvertime={(p) => setOvertimeModal({ isOpen: true, period: p })}
              />

              {/* Load Inspector below bays if a period is selected */}
              {selectedPeriod && (
                <WorkOrderLoadInspector
                  selectedPeriod={selectedPeriod}
                  loadDetails={loadDetails}
                  loading={loadingLoads}
                  onClose={() => setSelectedPeriod(null)}
                  onOpenReschedule={(load) => setRescheduleModal({ isOpen: true, load })}
                  onOpenOvertime={(p) => setOvertimeModal({ isOpen: true, period: p })}
                />
              )}
            </div>
          )}

          {/* VIEW B: Period Timeline Ledger */}
          {viewMode === 'ledger' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <PeriodCapacityLedger
                periods={periods}
                selectedPeriod={selectedPeriod}
                onSelectPeriod={handlePeriodSelect}
                onOpenOvertime={(p) => setOvertimeModal({ isOpen: true, period: p })}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />

              {/* Load Inspector drawer below table */}
              {selectedPeriod && (
                <WorkOrderLoadInspector
                  selectedPeriod={selectedPeriod}
                  loadDetails={loadDetails}
                  loading={loadingLoads}
                  onClose={() => setSelectedPeriod(null)}
                  onOpenReschedule={(load) => setRescheduleModal({ isOpen: true, load })}
                  onOpenOvertime={(p) => setOvertimeModal({ isOpen: true, period: p })}
                />
              )}
            </div>
          )}

          {/* VIEW C: Finite Load Balancing (Split Screen) */}
          {viewMode === 'split' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(420px, 1.8fr)',
              gap: '20px',
              alignItems: 'start'
            }}>
              {/* Left Column: Period Table */}
              <div>
                <PeriodCapacityLedger
                  periods={periods}
                  selectedPeriod={selectedPeriod}
                  onSelectPeriod={handlePeriodSelect}
                  onOpenOvertime={(p) => setOvertimeModal({ isOpen: true, period: p })}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                />
              </div>

              {/* Right Column: Work Order Dispatch Inspector */}
              <div>
                {selectedPeriod ? (
                  <WorkOrderLoadInspector
                    selectedPeriod={selectedPeriod}
                    loadDetails={loadDetails}
                    loading={loadingLoads}
                    onClose={() => setSelectedPeriod(null)}
                    onOpenReschedule={(load) => setRescheduleModal({ isOpen: true, load })}
                    onOpenOvertime={(p) => setOvertimeModal({ isOpen: true, period: p })}
                  />
                ) : (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: '12px',
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: '#94a3b8'
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>
                      Select a Period on the Left
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', maxWidth: '380px', marginInline: 'auto' }}>
                      Click on any work center period in the table to inspect its individual work orders and simulate moving jobs to balance plant capacity.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Record Overtime Modal */}
      <RecordOvertimeModal
        isOpen={overtimeModal.isOpen}
        onClose={() => setOvertimeModal({ isOpen: false, period: null })}
        period={overtimeModal.period}
        periods={periods}
        onSubmit={handleRecordOvertime}
        busy={busy}
      />

      {/* Simulate Reschedule Modal */}
      <SimulateRescheduleModal
        isOpen={rescheduleModal.isOpen}
        onClose={() => setRescheduleModal({ isOpen: false, load: null })}
        load={rescheduleModal.load}
        selectedPeriod={selectedPeriod}
        periods={periods}
        onSubmit={handleSimulateReschedule}
        busy={busy}
      />

      {/* Create New Capacity Period Modal */}
      <NewPeriodModal
        isOpen={newPeriodModal.isOpen}
        onClose={() => setNewPeriodModal({ isOpen: false })}
        periods={periods}
        onSubmit={handleCreatePeriod}
        busy={busy}
      />

      {/* Validate Schedule Feasibility Modal */}
      <ValidateScheduleModal
        isOpen={validateModal.isOpen}
        onClose={() => setValidateModal({ isOpen: false })}
        periods={periods}
      />
    </div>
  );
};

export default MachineCapacity;
