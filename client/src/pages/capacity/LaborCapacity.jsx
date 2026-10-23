import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { notify } from '../../utils/notify';

// Modular Subcomponents
import LaborTelemetryRibbon from './labor/LaborTelemetryRibbon';
import LaborShiftDiagnostics from './labor/LaborShiftDiagnostics';
import DepartmentShiftRoster from './labor/DepartmentShiftRoster';
import MasterLaborLedger from './labor/MasterLaborLedger';
import LaborLoadInspector from './labor/LaborLoadInspector';
import PlanWorkforceModal from './labor/PlanWorkforceModal';
import SimulateLaborRescheduleModal from './labor/SimulateLaborRescheduleModal';
import NewLaborPeriodModal from './labor/NewLaborPeriodModal';
import SkillMatrixAuditModal from './labor/SkillMatrixAuditModal';

const LaborCapacity = () => {
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

  // View Mode: 'ledger' (Master Table), 'roster' (Department Shift Bays), 'split' (Tactical Rebalancer)
  const [viewMode, setViewMode] = useState('ledger');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [planModal, setPlanModal] = useState({ isOpen: false, period: null });
  const [rescheduleModal, setRescheduleModal] = useState({ isOpen: false, load: null });
  const [newPeriodModal, setNewPeriodModal] = useState({ isOpen: false });
  const [skillAuditModal, setSkillAuditModal] = useState({ isOpen: false });

  // Initial fetch
  useEffect(() => {
    fetchPeriods();
  }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/capacity/labor-periods');
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
      console.error('Error fetching labor periods:', err);
      notify.error(err.response?.data?.message || 'Failed to load labor capacity periods');
    } finally {
      setLoading(false);
    }
  };

  const fetchLoadDetails = useCallback(async (periodId) => {
    if (!periodId) return;
    setLoadingLoads(true);
    try {
      const res = await axios.get(`/capacity/labor-periods/${periodId}/loads`);
      setLoadDetails(res.data.data || []);
    } catch (err) {
      console.error('Error fetching labor load details:', err);
      notify.error('Failed to load labor orders for selected shift');
    } finally {
      setLoadingLoads(false);
    }
  }, []);

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    fetchLoadDetails(period._id);
  };

  // Submit Workforce Plan (headcount and overtime hours)
  const handlePlanWorkforce = async ({ periodId, newHeadcount, manualHoursAdjustment, reason }) => {
    await runBusy(async () => {
      try {
        const res = await axios.post(`/capacity/labor-periods/${periodId}/workforce-plan`, {
          newHeadcount,
          manualHoursAdjustment,
          reason
        });
        notify.success(res.data.message || 'Workforce roster updated successfully');
        setPlanModal({ isOpen: false, period: null });
        await fetchPeriods();
        if (selectedPeriod && selectedPeriod._id === periodId) {
          await fetchLoadDetails(selectedPeriod._id);
        }
      } catch (err) {
        console.error('Plan workforce error:', err);
        notify.error(err.response?.data?.message || 'Error planning workforce');
      }
    });
  };

  // Submit Reschedule (Move labor load to another shift)
  const handleSimulateReschedule = async ({ loadId, newPeriodId }) => {
    await runBusy(async () => {
      try {
        const res = await axios.post('/capacity/simulate-labor-reschedule', {
          loadId,
          newPeriodId
        });
        notify.success(res.data.message || 'Labor load moved and roster recalculated');
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

  // Submit New Labor Period
  const handleCreatePeriod = async (payload) => {
    await runBusy(async () => {
      try {
        const res = await axios.post('/capacity/labor-periods', payload);
        notify.success('New shift period roster created successfully');
        setNewPeriodModal({ isOpen: false });
        await fetchPeriods();
      } catch (err) {
        console.error('Create labor period error:', err);
        notify.error(err.response?.data?.message || 'Error creating labor period');
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
      {/* 1. Workforce Tactical Command Ribbon */}
      <LaborTelemetryRibbon
        viewMode={viewMode}
        setViewMode={setViewMode}
        periods={periods}
        onOpenPlanWorkforce={(p) => setPlanModal({ isOpen: true, period: p || selectedPeriod || periods[0] })}
        onOpenNewPeriod={() => setNewPeriodModal({ isOpen: true })}
        onOpenSkillAudit={() => setSkillAuditModal({ isOpen: true })}
        onRefresh={fetchPeriods}
        loading={loading}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* 2. Shift Spectrum & Labor Diagnostics */}
      <LaborShiftDiagnostics
        periods={periods}
        onQuickPlan={(p) => setPlanModal({ isOpen: true, period: p })}
        onOpenSkillAudit={() => setSkillAuditModal({ isOpen: true })}
      />

      {/* 3. Main Views Deck based on viewMode */}
      {loading ? (
        <div style={{
          background: 'rgba(6, 44, 43, 0.5)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          padding: '48px',
          textAlign: 'center',
          color: '#94a3b8'
        }}>
          Loading Manpower Shift Rosters...
        </div>
      ) : (
        <>
          {/* VIEW A: Department Shift Bays Deck */}
          {viewMode === 'roster' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <DepartmentShiftRoster
                periods={periods}
                selectedPeriod={selectedPeriod}
                onSelectPeriod={handlePeriodSelect}
                onOpenPlanWorkforce={(p) => setPlanModal({ isOpen: true, period: p })}
              />

              {/* Load Inspector below bays if a period is selected */}
              {selectedPeriod && (
                <LaborLoadInspector
                  selectedPeriod={selectedPeriod}
                  loadDetails={loadDetails}
                  loading={loadingLoads}
                  onClose={() => setSelectedPeriod(null)}
                  onOpenReschedule={(load) => setRescheduleModal({ isOpen: true, load })}
                  onOpenPlanWorkforce={(p) => setPlanModal({ isOpen: true, period: p })}
                />
              )}
            </div>
          )}

          {/* VIEW B: Master Manpower Ledger */}
          {viewMode === 'ledger' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <MasterLaborLedger
                periods={periods}
                selectedPeriod={selectedPeriod}
                onSelectPeriod={handlePeriodSelect}
                onOpenPlanWorkforce={(p) => setPlanModal({ isOpen: true, period: p })}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />

              {/* Load Inspector drawer below table */}
              {selectedPeriod && (
                <LaborLoadInspector
                  selectedPeriod={selectedPeriod}
                  loadDetails={loadDetails}
                  loading={loadingLoads}
                  onClose={() => setSelectedPeriod(null)}
                  onOpenReschedule={(load) => setRescheduleModal({ isOpen: true, load })}
                  onOpenPlanWorkforce={(p) => setPlanModal({ isOpen: true, period: p })}
                />
              )}
            </div>
          )}

          {/* VIEW C: Tactical Labor Re-balancing (Split View) */}
          {viewMode === 'split' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(380px, 1.2fr) minmax(420px, 1.8fr)',
              gap: '20px',
              alignItems: 'start'
            }}>
              {/* Left Column: Shift List Table */}
              <div>
                <MasterLaborLedger
                  periods={periods}
                  selectedPeriod={selectedPeriod}
                  onSelectPeriod={handlePeriodSelect}
                  onOpenPlanWorkforce={(p) => setPlanModal({ isOpen: true, period: p })}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                />
              </div>

              {/* Right Column: Work Order Dispatch Inspector */}
              <div>
                {selectedPeriod ? (
                  <LaborLoadInspector
                    selectedPeriod={selectedPeriod}
                    loadDetails={loadDetails}
                    loading={loadingLoads}
                    onClose={() => setSelectedPeriod(null)}
                    onOpenReschedule={(load) => setRescheduleModal({ isOpen: true, load })}
                    onOpenPlanWorkforce={(p) => setPlanModal({ isOpen: true, period: p })}
                  />
                ) : (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(6, 44, 43, 0.8) 0%, rgba(10, 25, 30, 0.9) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '12px',
                    padding: '48px 24px',
                    textAlign: 'center',
                    color: '#94a3b8'
                  }}>
                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>
                      Select a Shift on the Left
                    </div>
                    <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', maxWidth: '380px', marginInline: 'auto' }}>
                      Click on any department shift to inspect its labor requirements, audit skill matrix certifications, and re-balance workforce capacity.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Plan Workforce & Overtime Modal */}
      <PlanWorkforceModal
        isOpen={planModal.isOpen}
        onClose={() => setPlanModal({ isOpen: false, period: null })}
        period={planModal.period}
        periods={periods}
        onSubmit={handlePlanWorkforce}
        busy={busy}
      />

      {/* Simulate Labor Reschedule Modal */}
      <SimulateLaborRescheduleModal
        isOpen={rescheduleModal.isOpen}
        onClose={() => setRescheduleModal({ isOpen: false, load: null })}
        load={rescheduleModal.load}
        selectedPeriod={selectedPeriod}
        periods={periods}
        onSubmit={handleSimulateReschedule}
        busy={busy}
      />

      {/* Create New Labor Shift Period Modal */}
      <NewLaborPeriodModal
        isOpen={newPeriodModal.isOpen}
        onClose={() => setNewPeriodModal({ isOpen: false })}
        periods={periods}
        onSubmit={handleCreatePeriod}
        busy={busy}
      />

      {/* Skill Matrix Audit Modal */}
      <SkillMatrixAuditModal
        isOpen={skillAuditModal.isOpen}
        onClose={() => setSkillAuditModal({ isOpen: false })}
        periods={periods}
        onPlanPeriod={(p) => setPlanModal({ isOpen: true, period: p })}
      />
    </div>
  );
};

export default LaborCapacity;
