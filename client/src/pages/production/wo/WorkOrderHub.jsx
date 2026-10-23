import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  RotateCw, 
  Sparkles, 
  Layers, 
  Table, 
  Kanban, 
  Activity, 
  FileText, 
  Boxes, 
  Lock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

import WOTelemetryBar from './WOTelemetryBar';
import WOTravelerMatrix from './WOTravelerMatrix';
import WOKanbanBoard from './WOKanbanBoard';
import WOMachineStationMonitor from './WOMachineStationMonitor';
import WOCreateModal from './WOCreateModal';
import WOProgressModal from './WOProgressModal';
import WOOfficialTravelerModal from './WOOfficialTravelerModal';
import { notify } from '../../../utils/notify';
import { confirmAction } from '../../../utils/confirmAction';

const WorkOrderHub = () => {
  const navigate = useNavigate();

  // Active view perspective: 'matrix' | 'kanban' | 'machines'
  const [activeTab, setActiveTab] = useState('matrix');

  const [workOrders, setWorkOrders] = useState([]);
  const [productionPlans, setProductionPlans] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [progressModalWO, setProgressModalWO] = useState(null);
  const [travelerModalWO, setTravelerModalWO] = useState(null);

  useEffect(() => {
    fetchDependencies();
    fetchWorkOrders();
  }, []);

  const fetchDependencies = async () => {
    try {
      const [matRes, plantRes, planAppRes, planRelRes] = await Promise.all([
        axios.get('/master/material'),
        axios.get('/company/plants'),
        axios.get('/production/v2/production-plan?status=Approved&limit=100'),
        axios.get('/production/v2/production-plan?status=Released&limit=100')
      ]);

      if (matRes.data?.data) {
        setMaterials(matRes.data.data.filter(m => m.isActive !== false && m.status !== 'Inactive'));
      }
      if (plantRes.data?.data) {
        setPlants(plantRes.data.data.filter(p => p.isActive !== false && p.status !== 'Inactive'));
      }
      const combinedPlans = [...(planAppRes.data?.data || []), ...(planRelRes.data?.data || [])];
      setProductionPlans(combinedPlans);
    } catch (err) {
      console.warn('Note on dependencies fetch:', err.message);
    }
  };

  const fetchWorkOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/production/v2/work-orders?limit=100');
      if (res.data?.data) {
        setWorkOrders(res.data.data);
      }
    } catch (err) {
      console.error('Work Orders fetch error:', err);
      notify.error(err.response?.data?.message || 'Error fetching work orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemoData = async () => {
    const ok = await confirmAction(
      'Seed Complete Automotive Work Orders? This will generate 10 job travelers across all 5 shop-floor stages (Draft, Released, Active In-Cycle, Completed, Closed) with realistic parts and routing.'
    );
    if (!ok) return;

    setSeeding(true);
    try {
      const res = await axios.post('/production/v2/work-orders/seed-dummy');
      notify.success(res.data?.message || '10 sample automotive work orders generated successfully!');
      fetchWorkOrders();
      fetchDependencies();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error seeding work orders');
    } finally {
      setSeeding(false);
    }
  };

  const handleCreateWorkOrder = async (formData) => {
    setBusyId('create-wo');
    try {
      await axios.post('/production/v2/work-orders/generate', formData);
      notify.success('Job traveler / Work Order generated successfully!');
      setIsCreateOpen(false);
      fetchWorkOrders();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to create work order');
    } finally {
      setBusyId(null);
    }
  };

  const handleUpdateProgress = async (woId, producedQty) => {
    setBusyId(`prog-${woId}`);
    try {
      await axios.put(`/production/v2/work-orders/${woId}/progress`, {
        Produced_Quantity: producedQty
      });
      notify.success(`Output booked: ${producedQty.toLocaleString()} pieces recorded`);
      setProgressModalWO(null);
      fetchWorkOrders();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error logging output');
    } finally {
      setBusyId(null);
    }
  };

  const handleRelease = async (woId) => {
    setBusyId(`rel-${woId}`);
    try {
      await axios.put(`/production/v2/work-orders/${woId}/release`);
      notify.success('Work Order released to shop floor for execution!');
      fetchWorkOrders();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error releasing work order');
    } finally {
      setBusyId(null);
    }
  };

  const handleAdvanceStatus = async (woId, newStatus) => {
    setBusyId(`st-${woId}`);
    try {
      await axios.put(`/production/v2/work-orders/${woId}/status`, { Status: newStatus });
      notify.success(`Status updated to ${newStatus}`);
      fetchWorkOrders();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating status');
    } finally {
      setBusyId(null);
    }
  };

  const handleCloseWO = async (woId) => {
    const ok = await confirmAction('Are you sure you want to close this work order? It will lock all materials, scrap, and variance cost entries permanently.');
    if (!ok) return;

    setBusyId(`close-${woId}`);
    try {
      await axios.put(`/production/v2/work-orders/${woId}/close`);
      notify.success('Work Order closed and archived.');
      fetchWorkOrders();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error closing work order');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteWO = async (woId) => {
    const ok = await confirmAction('Are you sure you want to delete this Work Order?');
    if (!ok) return;

    try {
      await axios.delete(`/production/v2/work-orders/${woId}`);
      notify.success('Work Order deleted');
      fetchWorkOrders();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error deleting work order');
    }
  };

  const handleAllocateMaterial = (wo) => {
    navigate('/production/allocation');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      paddingBottom: '24px'
    }}>
      {/* Top Industrial Command Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid #1e293b',
        paddingBottom: '16px',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Module Title & Badges */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              Work Orders & Job Travelers
            </h1>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              fontFamily: 'monospace'
            }}>
              IATF 16949 / ROUTING
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
            Shop-floor job travelers released to press lines, robotic cells, and paint bays with live cadence tracking.
          </p>
        </div>

        {/* Global Action Cluster */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Seed Demo Data Button */}
          <button
            onClick={handleSeedDemoData}
            disabled={seeding}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              backgroundColor: '#161e2c',
              border: '1px solid #334155',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: seeding ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} color="#38bdf8" />
            {seeding ? 'Seeding…' : 'Seed Sample Work Orders'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => { fetchWorkOrders(); fetchDependencies(); }}
            disabled={loading}
            style={{
              padding: '7px 12px',
              borderRadius: '6px',
              backgroundColor: '#161e2c',
              border: '1px solid #232d3f',
              color: '#cbd5e1',
              fontSize: '12px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>

          {/* Add Work Order Primary Button */}
          <button
            onClick={() => setIsCreateOpen(true)}
            style={{
              padding: '7px 16px',
              borderRadius: '6px',
              backgroundColor: '#f59e0b',
              color: '#0b0f17',
              border: 'none',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)'
            }}
          >
            <Plus size={15} /> Add Work Order
          </button>
        </div>
      </div>

      {/* Industrial Amber Telemetry Bar */}
      <WOTelemetryBar workOrders={workOrders} />

      {/* Perspective Tabs Bar */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #1e293b',
        marginBottom: '16px',
        gap: '4px'
      }}>
        <button
          onClick={() => setActiveTab('matrix')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'matrix' ? '2px solid #f59e0b' : '2px solid transparent',
            color: activeTab === 'matrix' ? '#fbbf24' : '#94a3b8',
            fontSize: '13px',
            fontWeight: activeTab === 'matrix' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Table size={15} /> Traveler Matrix
        </button>

        <button
          onClick={() => setActiveTab('kanban')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'kanban' ? '2px solid #f59e0b' : '2px solid transparent',
            color: activeTab === 'kanban' ? '#fbbf24' : '#94a3b8',
            fontSize: '13px',
            fontWeight: activeTab === 'kanban' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Kanban size={15} /> Job Traveler Board
        </button>

        <button
          onClick={() => setActiveTab('machines')}
          style={{
            padding: '8px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'machines' ? '2px solid #f59e0b' : '2px solid transparent',
            color: activeTab === 'machines' ? '#fbbf24' : '#94a3b8',
            fontSize: '13px',
            fontWeight: activeTab === 'machines' ? 700 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.15s ease'
          }}
        >
          <Activity size={15} /> Machine Station Monitor
        </button>
      </div>

      {/* Main Perspective Content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {activeTab === 'matrix' && (
          <WOTravelerMatrix
            workOrders={workOrders}
            isLoading={loading}
            onUpdateProgress={(wo) => setProgressModalWO(wo)}
            onRelease={handleRelease}
            onCloseWO={handleCloseWO}
            onDeleteWO={handleDeleteWO}
            onOpenTravelerModal={(wo) => setTravelerModalWO(wo)}
            onAllocateMaterial={handleAllocateMaterial}
            plants={plants}
            busyId={busyId}
          />
        )}

        {activeTab === 'kanban' && (
          <WOKanbanBoard
            workOrders={workOrders}
            onAdvanceStatus={handleAdvanceStatus}
            onUpdateProgress={(wo) => setProgressModalWO(wo)}
            onCloseWO={handleCloseWO}
            onOpenTravelerModal={(wo) => setTravelerModalWO(wo)}
            onRelease={handleRelease}
          />
        )}

        {activeTab === 'machines' && (
          <WOMachineStationMonitor
            workOrders={workOrders}
            onUpdateProgress={(wo) => setProgressModalWO(wo)}
            onOpenTravelerModal={(wo) => setTravelerModalWO(wo)}
          />
        )}
      </div>

      {/* Create Modal */}
      <WOCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        productionPlans={productionPlans}
        materials={materials}
        plants={plants}
        onSubmit={handleCreateWorkOrder}
        busy={busyId === 'create-wo'}
      />

      {/* Progress / Output Modal */}
      <WOProgressModal
        isOpen={!!progressModalWO}
        onClose={() => setProgressModalWO(null)}
        workOrder={progressModalWO}
        onSubmit={handleUpdateProgress}
        busy={busyId === `prog-${progressModalWO?._id}`}
      />

      {/* Official IATF Traveler Sheet Modal */}
      <WOOfficialTravelerModal
        isOpen={!!travelerModalWO}
        onClose={() => setTravelerModalWO(null)}
        workOrder={travelerModalWO}
      />
    </div>
  );
};

export default WorkOrderHub;
