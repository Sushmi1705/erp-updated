import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { notify } from '../../utils/notify';
import PlanControlHeader from './planning/PlanControlHeader';
import PlanMatrixTable from './planning/PlanMatrixTable';
import TaktTimelineStudio from './planning/TaktTimelineStudio';
import CapacityBoardView from './planning/CapacityBoardView';
import WorkOrderDispatchDeck from './planning/WorkOrderDispatchDeck';
import PlanCreateModal from './planning/PlanCreateModal';
import PlanPrintModal from './planning/PlanPrintModal';

const ProductionPlanning = () => {
  const [plans, setPlans] = useState([]);
  const [summary, setSummary] = useState({});
  const [materials, setMaterials] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Active perspective tab: 'matrix' | 'timeline' | 'capacity' | 'wos'
  const [activeTab, setActiveTab] = useState('matrix');

  // Selected plan for contextual drill-downs
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printPlan, setPrintPlan] = useState(null);

  const runBusy = async (fn, id = null) => {
    setBusy(true);
    setBusyId(id);
    try {
      await fn();
    } finally {
      setBusy(false);
      setBusyId(null);
    }
  };

  const fetchDependencies = useCallback(async () => {
    try {
      const [matRes, plantRes] = await Promise.all([
        axios.get('/master/material'),
        axios.get('/company/plants')
      ]);
      setMaterials((matRes.data?.data || []).filter(m => m.isActive !== false && m.status !== 'Inactive'));
      setPlants((plantRes.data?.data || []).filter(p => p.isActive !== false && p.status !== 'Inactive'));
    } catch (err) {
      console.error('Failed to load material/plant dependencies', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/production/v2/production-plan');
      const loadedPlans = res.data?.data || [];
      setPlans(loadedPlans);
      setSummary(res.data?.summary || {
        totalPlans: loadedPlans.length,
        totalPartLines: loadedPlans.reduce((sum, p) => sum + (p.details?.length || 0), 0),
        totalPlannedUnits: loadedPlans.reduce((sum, p) => sum + (p.details?.reduce((s, d) => s + (d.Target_Quantity || 0), 0) || 0), 0),
        validatedPlans: loadedPlans.filter(p => p.Capacity_Status === 'Validated').length,
        releasedPlans: loadedPlans.filter(p => p.Status === 'Released').length,
        approvedPlans: loadedPlans.filter(p => p.Status === 'Approved').length,
        draftPlans: loadedPlans.filter(p => p.Status === 'Draft').length,
        urgentPlans: loadedPlans.filter(p => p.Priority === 'Urgent' || p.Priority === 'High').length
      });

      // Maintain selection or select first
      if (loadedPlans.length > 0) {
        setSelectedPlan(prev => {
          if (!prev) return loadedPlans[0];
          const matched = loadedPlans.find(p => p._id === prev._id);
          return matched || loadedPlans[0];
        });
      }
    } catch (err) {
      console.error('Failed to load production plans', err);
      notify.error('Failed to load production plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, [fetchDependencies, fetchData]);

  // Handler: Create Plan
  const handleCreatePlan = async (payload) => {
    await runBusy(async () => {
      try {
        const res = await axios.post('/production/v2/production-plan', payload);
        notify.success(res.data?.message || 'Production Plan created successfully');
        setIsCreateModalOpen(false);
        await fetchData();
      } catch (err) {
        notify.error(err.response?.data?.message || 'Error creating production plan');
      }
    });
  };

  // Handler: Validate Capacity
  const handleValidateCapacity = async (id) => {
    await runBusy(async () => {
      try {
        const res = await axios.put(`/production/v2/production-plan/${id}/validate`);
        notify.success(res.data?.message || 'Rough-cut capacity validated successfully');
        await fetchData();
      } catch (err) {
        notify.error(err.response?.data?.message || 'Error validating capacity');
      }
    }, 'cap-' + id);
  };

  // Handler: Approve Plan
  const handleApprovePlan = async (id) => {
    await runBusy(async () => {
      try {
        const res = await axios.put(`/production/v2/production-plan/${id}/approve`);
        notify.success(res.data?.message || 'Plan approved by Plant Manager');
        await fetchData();
      } catch (err) {
        notify.error(err.response?.data?.message || 'Error approving plan');
      }
    }, 'app-' + id);
  };

  // Handler: Release to Shop Floor
  const handleReleasePlan = async (id) => {
    await runBusy(async () => {
      try {
        const res = await axios.put(`/production/v2/production-plan/${id}/release`);
        notify.success(res.data?.message || 'Plan released to shop floor');
        await fetchData();
      } catch (err) {
        notify.error(err.response?.data?.message || 'Error releasing plan');
      }
    }, 'rel-' + id);
  };

  // Handler: Generate Work Orders
  const handleGenerateWos = async (id) => {
    await runBusy(async () => {
      try {
        const res = await axios.post(`/production/v2/production-plan/${id}/generate-wos`);
        notify.success(res.data?.message || 'Shop floor work orders dispatched successfully');
        await fetchData();
        // Switch to WOs tab so user immediately sees their dispatched orders!
        setActiveTab('wos');
      } catch (err) {
        notify.error(err.response?.data?.message || 'Error dispatching work orders');
      }
    }, 'wos-' + id);
  };

  // Handler: Inspect Capacity shortcut
  const handleInspectCapacity = (plan) => {
    setSelectedPlan(plan);
    setActiveTab('capacity');
  };

  // Handler: Select for Timeline shortcut
  const handleSelectPlanForTimeline = (plan) => {
    setSelectedPlan(plan);
    setActiveTab('timeline');
  };

  // Handler: Open Print Modal
  const handleOpenPrintModal = (plan) => {
    setPrintPlan(plan || selectedPlan || plans[0] || null);
    setIsPrintModalOpen(true);
  };

  // Handler: Seed Dummy Plans
  const handleSeedDummy = async () => {
    await runBusy(async () => {
      try {
        const res = await axios.post('/production/v2/production-plan/seed-dummy');
        notify.success(res.data?.message || 'Sample automotive production plans generated');
        await fetchData();
      } catch (err) {
        notify.error(err.response?.data?.message || 'Error generating demo plans');
      }
    }, 'seed-dummy');
  };

  // Handler: Export CSV
  const handleExportCsv = () => {
    if (!plans.length) {
      notify.error('No production plans available to export');
      return;
    }

    const rows = [];
    rows.push(['Plan Number', 'Type', 'Status', 'Capacity Status', 'Priority', 'Plant', 'Seq', 'Material Name', 'Material Code', 'Target Qty', 'Start Date', 'End Date', 'Notes']);

    plans.forEach(plan => {
      const plantName = plan.Plant_ID?.name || 'LBAP Hosur';
      if (plan.details && plan.details.length > 0) {
        plan.details.forEach(d => {
          rows.push([
            plan.Plan_Number,
            plan.Plan_Type,
            plan.Status,
            plan.Capacity_Status || 'Unchecked',
            plan.Priority,
            `"${plantName}"`,
            d.Line_Sequence_Number,
            `"${d.Material_ID?.name || 'Raw Component'}"`,
            d.Material_ID?.code || '',
            d.Target_Quantity,
            d.Planned_Start_Date ? new Date(d.Planned_Start_Date).toISOString().split('T')[0] : '',
            d.Planned_End_Date ? new Date(d.Planned_End_Date).toISOString().split('T')[0] : '',
            `"${plan.Notes || ''}"`
          ]);
        });
      } else {
        rows.push([
          plan.Plan_Number,
          plan.Plan_Type,
          plan.Status,
          plan.Capacity_Status || 'Unchecked',
          plan.Priority,
          `"${plantName}"`,
          '',
          '',
          '',
          '',
          '',
          '',
          `"${plan.Notes || ''}"`
        ]);
      }
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Master_Production_Schedule_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Master Production Schedule exported as CSV');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      padding: '0 0 32px 0'
    }}>
      {/* Control Header & Perspective Navigation HUD */}
      <PlanControlHeader
        summary={summary}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenCapacityModal={() => setActiveTab('capacity')}
        onOpenPrintModal={() => handleOpenPrintModal(selectedPlan || plans[0])}
        onExportCsv={handleExportCsv}
        onSeedDummy={handleSeedDummy}
        selectedPlanForDetails={selectedPlan}
      />

      {/* Main Perspective Body (Full natural document height, no double scrollbar) */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {activeTab === 'matrix' && (
          <PlanMatrixTable
            plans={plans}
            loading={loading}
            busy={busy}
            busyId={busyId}
            onValidateCapacity={handleValidateCapacity}
            onApprovePlan={handleApprovePlan}
            onReleasePlan={handleReleasePlan}
            onGenerateWos={handleGenerateWos}
            onInspectCapacity={handleInspectCapacity}
            onSelectPlanForTimeline={handleSelectPlanForTimeline}
            onOpenPrintModal={handleOpenPrintModal}
            onSeedDummy={handleSeedDummy}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            selectedPlanId={selectedPlan?._id}
          />
        )}

        {activeTab === 'timeline' && (
          <TaktTimelineStudio
            plans={plans}
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}

        {activeTab === 'capacity' && (
          <CapacityBoardView
            plans={plans}
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
            onValidateCapacity={handleValidateCapacity}
            busy={busy}
          />
        )}

        {activeTab === 'wos' && (
          <WorkOrderDispatchDeck
            plans={plans}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
          />
        )}
      </div>

      {/* Modal: Create Production Plan */}
      <PlanCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreatePlan}
        plants={plants}
        materials={materials}
        busy={busy}
      />

      {/* Modal: Printable IATF 16949 Master Production Schedule */}
      <PlanPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        plan={printPlan || selectedPlan || plans[0]}
      />
    </div>
  );
};

export default ProductionPlanning;