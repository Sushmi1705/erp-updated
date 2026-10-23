import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { notify } from '../../utils/notify';
import TraceabilityControlHeader from './traceability/TraceabilityControlHeader';
import BatchMatrixTable from './traceability/BatchMatrixTable';
import GenealogyTreeStudio from './traceability/GenealogyTreeStudio';
import ShelfLifeRadar from './traceability/ShelfLifeRadar';
import GenealogyAuditLedger from './traceability/GenealogyAuditLedger';
import BatchRegisterModal from './traceability/BatchRegisterModal';
import BatchTravelerPrintModal from './traceability/BatchTravelerPrintModal';
import QuarantineActionModal from './traceability/QuarantineActionModal';

const TraceabilityManagement = () => {
  const [entities, setEntities] = useState([]);
  const [summary, setSummary] = useState({});
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [genealogyLogs, setGenealogyLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingGenealogy, setLoadingGenealogy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Active perspective: 'matrix' | 'tree' | 'shelflife' | 'audit'
  const [activeTab, setActiveTab] = useState('matrix');

  // Selected entity for Tree view or modals
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isQuarantineModalOpen, setIsQuarantineModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    fetchDependencies();
    fetchData();
    fetchGenealogy();
  }, []);

  const fetchDependencies = async () => {
    try {
      const [matRes, whRes] = await Promise.all([
        axios.get('/master/material'),
        axios.get('/master/warehouse')
      ]);
      setMaterials(matRes.data?.data?.filter(m => m.isActive !== false && m.status !== 'Inactive') || []);
      setWarehouses(whRes.data?.data?.filter(w => w.isActive !== false && w.status !== 'Inactive') || []);
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/inventory/v2/traceability');
      const data = res.data?.data || [];
      setEntities(data);
      setSummary(res.data?.summary || {});

      // Default select first entity if none selected
      if (data.length > 0 && !selectedEntity) {
        setSelectedEntity(data[0]);
      }
    } catch (err) {
      console.error('Traceability fetch error', err);
      notify.error('Could not load traceability registry.');
    }
    setLoading(false);
  };

  const fetchGenealogy = async () => {
    setLoadingGenealogy(true);
    try {
      const res = await axios.get('/inventory/v2/traceability/genealogy');
      setGenealogyLogs(res.data?.data || []);
    } catch (err) {
      console.error('Genealogy fetch error', err);
    }
    setLoadingGenealogy(false);
  };

  const handleRegister = async (payload) => {
    setSaving(true);
    try {
      await axios.post('/inventory/v2/traceability/register', payload);
      setIsRegisterModalOpen(false);
      notify.success(`Batch ${payload.Tracking_Number} registered successfully.`);
      await Promise.all([fetchData(), fetchGenealogy()]);
    } catch (err) {
      console.error('Error registering batch', err);
      notify.error(err.response?.data?.message || 'Could not register batch. Please try again.');
    }
    setSaving(false);
  };

  const handleUpdateStatus = async ({ id, status, reason }) => {
    setUpdatingStatus(true);
    try {
      const res = await axios.post('/inventory/v2/traceability/status', { id, status, reason });
      setIsQuarantineModalOpen(false);
      notify.success(res.data?.message || `Status updated to ${status}`);
      await Promise.all([fetchData(), fetchGenealogy()]);
    } catch (err) {
      console.error('Error updating status', err);
      notify.error(err.response?.data?.message || 'Could not update status.');
    }
    setUpdatingStatus(false);
  };

  const handleInspectTree = (entityItem) => {
    setSelectedEntity(entityItem);
    setActiveTab('tree');
  };

  const handleToggleQuarantine = (entityItem) => {
    setSelectedEntity(entityItem);
    setIsQuarantineModalOpen(true);
  };

  const handlePrintTraveler = (entityItem) => {
    setSelectedEntity(entityItem);
    setIsPrintModalOpen(true);
  };

  const handleExportCsv = () => {
    if (!entities.length) {
      notify.warning('No traceability records to export.');
      return;
    }

    const headers = [
      'Batch / Heat Number',
      'Tracking Type',
      'Material Code',
      'Material Name',
      'Grade Spec',
      'Supplier / Mill Ref',
      'Quality Status',
      'Stores Quantity',
      'UOM',
      'Inward Date',
      'Use Before / Expiry',
      'Storage Location'
    ];

    const rows = entities.map(e => {
      const m = e.Material_ID || {};
      return [
        `"${e.Tracking_Number || ''}"`,
        `"${e.Tracking_Type || ''}"`,
        `"${m.code || ''}"`,
        `"${(m.name || '').replace(/"/g, '""')}"`,
        `"${m.grade || 'Standard'}"`,
        `"${e.Reference_Code || ''}"`,
        `"${e.Current_Status || 'Active'}"`,
        e.Current_Quantity || 0,
        `"${m.uomId?.symbol || 'KG'}"`,
        `"${e.Mfg_Date ? new Date(e.Mfg_Date).toLocaleDateString('en-IN') : ''}"`,
        `"${e.Expiry_Date ? new Date(e.Expiry_Date).toLocaleDateString('en-IN') : 'No Expiry'}"`,
        `"${e.Current_WH_ID?.name || 'Stores'}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Batch_Traceability_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Traceability ledger exported successfully.');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      padding: '4px 0 24px 0'
    }}>
      {/* High-Tech Indigo / Cyber-Cyan Command Header */}
      <TraceabilityControlHeader
        summary={summary}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onOpenQuarantineModal={() => {
          if (!selectedEntity && entities.length > 0) setSelectedEntity(entities[0]);
          setIsQuarantineModalOpen(true);
        }}
        onOpenPrintModal={() => {
          if (!selectedEntity && entities.length > 0) setSelectedEntity(entities[0]);
          setIsPrintModalOpen(true);
        }}
        onExportCsv={handleExportCsv}
        selectedEntityForTree={selectedEntity}
      />

      {/* Multi-Perspective Switcher */}
      {activeTab === 'matrix' && (
        <BatchMatrixTable
          entities={entities}
          loading={loading}
          onInspectTree={handleInspectTree}
          onToggleQuarantine={handleToggleQuarantine}
          onPrintTraveler={handlePrintTraveler}
          warehouses={warehouses}
        />
      )}

      {activeTab === 'tree' && (
        <GenealogyTreeStudio
          entity={selectedEntity || entities[0]}
          allEntities={entities}
          onSelectEntity={(selected) => setSelectedEntity(selected)}
          onBackToMatrix={() => setActiveTab('matrix')}
          onPrintTraveler={handlePrintTraveler}
        />
      )}

      {activeTab === 'shelflife' && (
        <ShelfLifeRadar
          entities={entities}
          onQuarantineEntity={(ent) => {
            setSelectedEntity(ent);
            setIsQuarantineModalOpen(true);
          }}
          onInspectEntity={handleInspectTree}
        />
      )}

      {activeTab === 'audit' && (
        <GenealogyAuditLedger
          logs={genealogyLogs}
          loading={loadingGenealogy}
          onInspectEntity={(ent) => {
            setSelectedEntity(ent);
            setActiveTab('tree');
          }}
        />
      )}

      {/* Register Batch Modal */}
      <BatchRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onRegister={handleRegister}
        materials={materials}
        warehouses={warehouses}
        saving={saving}
      />

      {/* Quality Quarantine Hold Modal */}
      <QuarantineActionModal
        isOpen={isQuarantineModalOpen}
        onClose={() => setIsQuarantineModalOpen(false)}
        entity={selectedEntity}
        allEntities={entities}
        onUpdateStatus={handleUpdateStatus}
        updating={updatingStatus}
      />

      {/* Batch Traveler Tag Print Modal */}
      <BatchTravelerPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        entity={selectedEntity || entities[0]}
      />
    </div>
  );
};

export default TraceabilityManagement;