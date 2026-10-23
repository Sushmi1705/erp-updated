import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';
import GrnHeaderBar from './grn/GrnHeaderBar';
import GrnDockTerminal from './grn/GrnDockTerminal';
import GrnRegisterLedger from './grn/GrnRegisterLedger';
import GrnPendingPoRunway from './grn/GrnPendingPoRunway';
import GrnFormModal from './grn/GrnFormModal';
import GrnPrintModal from './grn/GrnPrintModal';

const GoodsReceiptNote = () => {
  const [grns, setGrns] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePerspective, setActivePerspective] = useState('Dock'); // 'Dock', 'Ledger', 'ExpectedPO'
  const [selectedGrn, setSelectedGrn] = useState(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [formInitialData, setFormInitialData] = useState({});
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTargetGrn, setPrintTargetGrn] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);

  const fetchDependencies = async () => {
    try {
      const poRes = await axios.get('/procurement/po');
      const allPOs = poRes.data?.data || [];
      const validPOs = allPOs.filter(po => 
        po.approvalStatus === 'Approved' || 
        po.approvalStatus === 'Pending' || 
        po.deliveryStatus === 'In-Transit' || 
        !po.approvalStatus
      );
      setPurchaseOrders(validPOs.length > 0 ? validPOs : allPOs);
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/receipt/grn');
      const data = res.data?.data || [];
      setGrns(data);

      if (selectedGrn) {
        const updated = data.find(g => g._id === selectedGrn._id);
        if (updated) setSelectedGrn(updated);
      } else if (data.length > 0) {
        setSelectedGrn(data[0]);
      }
    } catch (err) {
      console.error('GRN fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSave = async (data) => {
    if (saving) return;
    setSaving(true);
    try {
      if (formMode === 'create') {
        const res = await axios.post('/receipt/grn', data);
        notify.success(`Goods receipt ${res.data?.data?.grnNumber || ''} recorded successfully! Inspection ticket generated.`);
      } else {
        await axios.put(`/receipt/grn/${data._id}`, {
          receivedQuantity: data.receivedQuantity,
          notes: data.notes,
          status: data.status,
          challanNumber: data.challanNumber,
          vehicleNumber: data.vehicleNumber,
          transporterName: data.transporterName,
          gatePassNo: data.gatePassNo,
          storageLocation: data.storageLocation,
          packagingCondition: data.packagingCondition
        });
        notify.success(`Goods receipt ${data.grnNumber} updated successfully.`);
      }
      setIsFormModalOpen(false);
      setFormInitialData({});
      await fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not save receipt record. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!await confirmAction(`Delete goods receipt ${row.grnNumber}? This will remove the gate entry record.`)) return;
    try {
      await axios.delete(`/receipt/grn/${row._id}`);
      notify.info(`Goods receipt ${row.grnNumber} deleted.`);
      if (selectedGrn?._id === row._id) {
        setSelectedGrn(null);
      }
      await fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not delete this receipt.');
    }
  };

  const handleOpenCreateModal = (po = null) => {
    setFormMode('create');
    setFormInitialData(po ? { purchaseOrderId: po._id } : {});
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (grn) => {
    setFormMode('edit');
    setFormInitialData(grn);
    setIsFormModalOpen(true);
  };

  const handleOpenPrintModal = (grn = null) => {
    setPrintTargetGrn(grn || selectedGrn || grns[0]);
    setIsPrintModalOpen(true);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      padding: '4px',
      overflow: 'hidden'
    }}>
      {/* ── Executive Header Command Bar ────────────────────────────────────── */}
      <GrnHeaderBar
        grns={grns}
        activePerspective={activePerspective}
        setActivePerspective={setActivePerspective}
        onOpenCreateModal={() => handleOpenCreateModal(null)}
        onOpenPrintModal={() => handleOpenPrintModal(null)}
        onRefresh={fetchData}
        loading={loading}
      />

      {/* ── Perspective Workspaces ─────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {activePerspective === 'Dock' && (
          <GrnDockTerminal
            grns={grns}
            selectedGrn={selectedGrn}
            onSelectGrn={setSelectedGrn}
            onOpenEditModal={handleOpenEditModal}
            onDeleteGrn={handleDelete}
            onOpenPrintModal={handleOpenPrintModal}
          />
        )}

        {activePerspective === 'Ledger' && (
          <GrnRegisterLedger
            grns={grns}
            onSelectGrn={setSelectedGrn}
            onOpenDossier={() => setActivePerspective('Dock')}
            onOpenEditModal={handleOpenEditModal}
            onDeleteGrn={handleDelete}
            onOpenPrintModal={handleOpenPrintModal}
          />
        )}

        {activePerspective === 'ExpectedPO' && (
          <GrnPendingPoRunway
            purchaseOrders={purchaseOrders}
            grns={grns}
            onReceivePo={(po) => handleOpenCreateModal(po)}
          />
        )}
      </div>

      {/* ── Form Modal (Create / Edit) ──────────────────────────────────────── */}
      {isFormModalOpen && (
        <GrnFormModal
          isOpen={isFormModalOpen}
          mode={formMode}
          initialData={formInitialData}
          purchaseOrders={purchaseOrders}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleFormSave}
          onDelete={handleDelete}
          saving={saving}
        />
      )}

      {/* ── Official GRN Slip Print Modal ───────────────────────────────────── */}
      {isPrintModalOpen && (
        <GrnPrintModal
          grn={printTargetGrn || selectedGrn || grns[0]}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};

export default GoodsReceiptNote;