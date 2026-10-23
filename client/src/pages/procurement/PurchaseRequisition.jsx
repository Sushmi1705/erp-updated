import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShoppingCart, ShieldCheck, CheckCircle2, Clock, AlertTriangle, 
  Sparkles, Printer, RefreshCw, LayoutGrid, Kanban, ListFilter, 
  Plus, Package, Building2
} from 'lucide-react';
import { notify } from '../../utils/notify';
import { fmtMoneyFull } from '../../utils/money';

// Specialized Subcomponents
import RequisitionCommandRibbon from './requisition/RequisitionCommandRibbon';
import RequisitionGuidedBuyer from './requisition/RequisitionGuidedBuyer';
import RequisitionPipelineBoard from './requisition/RequisitionPipelineBoard';
import RequisitionOperationsLedger from './requisition/RequisitionOperationsLedger';
import RequisitionFlightDeckDrawer from './requisition/RequisitionFlightDeckDrawer';
import RequisitionPrintModal from './requisition/RequisitionPrintModal';

const HIGHER_APPROVAL_LIMIT = 10000;

const PurchaseRequisition = () => {
  // Navigation & Perspective State
  const [activePerspective, setActivePerspective] = useState('Ledger'); // 'GuidedBuyer', 'Pipeline', 'Ledger'

  // Data States
  const [requisitions, setRequisitions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [mrpSuggestions, setMrpSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [decidingStepId, setDecidingStepId] = useState(null);

  // Guided Buying / Cart State
  const [cart, setCart] = useState([]);
  const [costCenterId, setCostCenterId] = useState('');

  // Modals & Drawers
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printTargetPR, setPrintTargetPR] = useState(null);

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);

  const fetchDependencies = async () => {
    try {
      const [matRes, supRes, depRes, mrpRes] = await Promise.all([
        axios.get('/master/material').catch(() => ({ data: { data: [] } })),
        axios.get('/master/vendor').catch(() => ({ data: { data: [] } })),
        axios.get('/company/departments').catch(() => ({ data: { data: [] } })),
        axios.get('/mrp/recommendations').catch(() => ({ data: { data: [] } }))
      ]);

      setMaterials(matRes.data?.data?.filter(m => m.status !== 'Inactive') || matRes.data?.data || []);
      setSuppliers(supRes.data?.data?.filter(s => s.status !== 'Inactive') || supRes.data?.data || []);
      setDepartments(depRes.data?.data || []);
      setMrpSuggestions(mrpRes.data?.data?.filter(r => r.suggestionCategory === 'Purchase' && r.status === 'Pending') || []);
    } catch (err) {
      console.error('Dependencies fetch error:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/procurement/requisition');
      setRequisitions(res.data?.data || []);
    } catch (err) {
      console.error('Requisitions fetch error:', err);
      notify.error('Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  };

  // Save new Purchase Request
  const handleSavePR = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (cart.length === 0) {
      return notify.warning('Add at least one item to the list before sending the request.');
    }
    if (!costCenterId) {
      return notify.warning('Choose which department / cost center this material is for.');
    }
    if (saving) return;

    setSaving(true);
    try {
      const payload = {
        costCenterId,
        items: cart
      };
      const res = await axios.post('/procurement/requisition', payload);
      notify.success(res.data?.message || 'Purchase request sent for approval.');
      setCart([]);
      setActivePerspective('Ledger');
      fetchData();
      fetchDependencies();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not save this purchase request. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Multi-tier Step Decision (Approve / Reject)
  const handleApproveStep = async (prId, stepId, status) => {
    if (decidingStepId) return;
    setDecidingStepId(stepId);
    try {
      await axios.put(`/procurement/requisition/${prId}/status`, {
        stepId,
        status,
        approvalNotes: status
      });
      notify.success(`Requisition decision recorded: ${status}`);
      await fetchData();

      // Refresh selected requisition if drawer is open
      if (selectedRequisition?._id === prId) {
        const updated = await axios.get('/procurement/requisition');
        const found = updated.data?.data?.find(r => r._id === prId);
        if (found) setSelectedRequisition(found);
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not record your decision. Please try again.');
    } finally {
      setDecidingStepId(null);
    }
  };

  // Convert Approved PR to Purchase Order (PO)
  const handleConvertToPO = async (pr) => {
    try {
      const res = await axios.post(`/procurement/requisition/${pr._id}/create-po`);
      notify.success(res.data?.message || 'Purchase Order generated successfully');
      fetchData();
      if (selectedRequisition?._id === pr._id) {
        setSelectedRequisition(null);
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to convert PR to Purchase Order');
    }
  };

  // Convert Approved PR to Sourcing Event (RFQ)
  const handleConvertToRFQ = async (pr) => {
    try {
      const res = await axios.post(`/procurement/requisition/${pr._id}/create-rfq`);
      notify.success(res.data?.message || 'RFQ published successfully from PR');
      fetchData();
      if (selectedRequisition?._id === pr._id) {
        setSelectedRequisition(null);
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Failed to generate RFQ from PR');
    }
  };

  // Delete / Cancel Requisition
  const handleDeletePR = async (prId) => {
    if (!window.confirm('Are you sure you want to cancel and delete this purchase request?')) {
      return;
    }
    try {
      await axios.delete(`/procurement/requisition/${prId}`);
      notify.success('Purchase request deleted successfully');
      if (selectedRequisition?._id === prId) {
        setSelectedRequisition(null);
      }
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not delete purchase request');
    }
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
      {/* 1. Procurement Command Ribbon */}
      <RequisitionCommandRibbon
        requisitions={requisitions}
        departments={departments}
        mrpSuggestions={mrpSuggestions}
        activePerspective={activePerspective}
        setActivePerspective={setActivePerspective}
        onOpenQuickBuy={() => setActivePerspective('GuidedBuyer')}
        onOpenMRPShortages={() => {
          setActivePerspective('GuidedBuyer');
        }}
        onPrintVoucher={() => {
          setPrintTargetPR(null);
          setIsPrintModalOpen(true);
        }}
        onRefresh={fetchData}
        loading={loading}
      />

      {/* 2. Perspective Navigation Toolbar */}
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
            onClick={() => setActivePerspective('GuidedBuyer')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: activePerspective === 'GuidedBuyer' ? 600 : 500,
              background: activePerspective === 'GuidedBuyer' ? '#0d9488' : 'transparent',
              color: activePerspective === 'GuidedBuyer' ? '#ffffff' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: 'none',
              transition: 'all 0.15s ease',
              cursor: 'pointer'
            }}
          >
            <ShoppingCart size={14} /> Guided Buying & Catalog
            {cart.length > 0 && (
              <span style={{
                background: '#ffffff',
                color: '#0d9488',
                borderRadius: '10px',
                padding: '1px 6px',
                fontSize: '10px',
                fontWeight: 700
              }}>
                {cart.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActivePerspective('Pipeline')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: activePerspective === 'Pipeline' ? 600 : 500,
              background: activePerspective === 'Pipeline' ? '#0d9488' : 'transparent',
              color: activePerspective === 'Pipeline' ? '#ffffff' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: 'none',
              transition: 'all 0.15s ease',
              cursor: 'pointer'
            }}
          >
            <Kanban size={14} /> Sourcing Pipeline Board
          </button>

          <button
            onClick={() => setActivePerspective('Ledger')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: activePerspective === 'Ledger' ? 600 : 500,
              background: activePerspective === 'Ledger' ? '#0d9488' : 'transparent',
              color: activePerspective === 'Ledger' ? '#ffffff' : 'var(--text-secondary)',
              borderRadius: '6px',
              border: 'none',
              transition: 'all 0.15s ease',
              cursor: 'pointer'
            }}
          >
            <ListFilter size={14} /> Requisitions Operations Ledger
          </button>
        </div>

        {/* Informative Status Tip */}
        <div style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <ShieldCheck size={13} color="#10b981" />
          <span>Department Budget Cap: <strong>₹10,000</strong> (Requests exceeding require CFO sign-off)</span>
        </div>
      </div>

      {/* 3. Main Workspace Area */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {activePerspective === 'GuidedBuyer' && (
          <RequisitionGuidedBuyer
            materials={materials}
            suppliers={suppliers}
            departments={departments}
            mrpSuggestions={mrpSuggestions}
            cart={cart}
            setCart={setCart}
            costCenterId={costCenterId}
            setCostCenterId={setCostCenterId}
            onSavePR={handleSavePR}
            saving={saving}
          />
        )}

        {activePerspective === 'Pipeline' && (
          <RequisitionPipelineBoard
            requisitions={requisitions}
            onSelectRequisition={(pr) => setSelectedRequisition(pr)}
            onApproveStep={handleApproveStep}
            onConvertToPO={handleConvertToPO}
            onOpenQuickBuy={() => setActivePerspective('GuidedBuyer')}
          />
        )}

        {activePerspective === 'Ledger' && (
          <RequisitionOperationsLedger
            requisitions={requisitions}
            departments={departments}
            onSelectRequisition={(pr) => setSelectedRequisition(pr)}
            onApproveStep={handleApproveStep}
            onConvertToPO={handleConvertToPO}
            onDeleteRequisition={handleDeletePR}
          />
        )}
      </div>

      {/* 4. Slide-Out Flight Deck Drawer */}
      <RequisitionFlightDeckDrawer
        requisition={selectedRequisition}
        isOpen={!!selectedRequisition}
        onClose={() => setSelectedRequisition(null)}
        onApproveStep={handleApproveStep}
        onConvertToPO={handleConvertToPO}
        onConvertToRFQ={handleConvertToRFQ}
        onDelete={handleDeletePR}
        onPrintVoucher={(pr) => {
          setPrintTargetPR(pr);
          setIsPrintModalOpen(true);
        }}
      />

      {/* 5. Official Requisition Printable Voucher */}
      <RequisitionPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        requisition={printTargetPR || selectedRequisition}
        allRequisitions={requisitions}
      />
    </div>
  );
};

export default PurchaseRequisition;
