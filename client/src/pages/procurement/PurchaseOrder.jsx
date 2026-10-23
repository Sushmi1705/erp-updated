import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { notify } from '../../utils/notify';

// Specialized Subcomponents
import POHeaderBar from './po/POHeaderBar';
import POFulfillmentWorkbench from './po/POFulfillmentWorkbench';
import POLedger from './po/POLedger';
import POPipelineBoard from './po/POPipelineBoard';
import POCreateModal from './po/POCreateModal';
import POChangeOrderModal from './po/POChangeOrderModal';
import POInvoiceMatchModal from './po/POInvoiceMatchModal';
import POPrintModal from './po/POPrintModal';

const PurchaseOrder = () => {
  // Navigation & Perspective State: 'Workbench' (default), 'Ledger', 'Pipeline'
  const [activePerspective, setActivePerspective] = useState('Workbench');

  // Data States
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [rfqs, setRfqs] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPo, setSelectedPo] = useState(null);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChangeOrderModalOpen, setIsChangeOrderModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form States
  const [formData, setFormData] = useState({
    paymentTerms: 'Net30',
    incoterms: 'DDP',
    items: [{}]
  });
  const [changeOrderData, setChangeOrderData] = useState({});
  const [invoiceData, setInvoiceData] = useState({});

  // Action Guards & Busy State
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);

  // Launchpad deep-link quick create (?create=1)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('create') === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      setFormData({ paymentTerms: 'Net30', incoterms: 'DDP', items: [{}] });
      setIsModalOpen(true);
    }
  }, []);

  const fetchDependencies = async () => {
    try {
      const [venRes, matRes, rfqRes] = await Promise.all([
        axios.get('/master/vendor').catch(() => ({ data: { data: [] } })),
        axios.get('/master/material').catch(() => ({ data: { data: [] } })),
        axios.get('/procurement/rfq').catch(() => ({ data: { data: [] } }))
      ]);

      setVendors(venRes.data?.data?.filter(v => v.isActive !== false && v.status !== 'Inactive') || []);
      setMaterials(matRes.data?.data?.filter(m => m.isActive !== false && m.status !== 'Inactive') || []);
      setRfqs(rfqRes.data?.data?.filter(r => r.status === 'Closed' || r.status === 'Awarded') || []);
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/procurement/po');
      const list = res.data?.data || [];
      setPurchaseOrders(list);
      
      // Keep selected PO synchronized
      if (selectedPo) {
        const found = list.find(p => p._id === selectedPo._id);
        setSelectedPo(found || list[0] || null);
      } else if (list.length > 0) {
        setSelectedPo(list[0]);
      }
    } catch (err) {
      console.error('PO fetch error', err);
      notify.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  // Create Purchase Order
  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (busy) return;
    setBusy('save');
    try {
      const res = await axios.post('/procurement/po', formData);
      notify.success('Purchase Order raised successfully');
      setIsModalOpen(false);
      setFormData({
        paymentTerms: 'Net30',
        incoterms: 'DDP',
        items: [{}]
      });
      await fetchData();
      if (res.data?.data) {
        setSelectedPo(res.data.data);
        setActivePerspective('Workbench');
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not save purchase order');
    } finally {
      setBusy(null);
    }
  };

  // Internal Approval Decision
  const handleStatusUpdate = async (id, status) => {
    if (busy) return;
    setBusy(status === 'Approved' ? 'approve' : 'reject');
    try {
      await axios.put(`/procurement/po/${id}/status`, { status });
      notify.success(status === 'Approved' ? 'Order approved and sent to supplier via B2B EDI.' : 'Order rejected.');
      await fetchData();
    } catch (err) {
      notify.error('Could not record your decision. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  // Supplier Portal Simulation: Acknowledge PO
  const handleAcknowledge = async () => {
    if (!selectedPo || busy) return;
    setBusy('acknowledge');
    try {
      await axios.put(`/procurement/po/${selectedPo._id}/acknowledge`);
      notify.success('Recorded: Supplier has accepted this order via B2B EDI.');
      await fetchData();
    } catch (err) {
      notify.error('Could not record supplier acceptance');
    } finally {
      setBusy(null);
    }
  };

  // Supplier Portal Simulation: Submit ASN (Truck in-transit)
  const handleASN = async () => {
    if (!selectedPo || busy) return;
    setBusy('asn');
    try {
      await axios.put(`/procurement/po/${selectedPo._id}/asn`);
      notify.success('Recorded: Supplier has dispatched the shipment. Status changed to In-Transit.');
      await fetchData();
    } catch (err) {
      notify.error('Could not record dispatch ASN');
    } finally {
      setBusy(null);
    }
  };

  // Warehouse Goods Receipt (GRN)
  const handleMockGoodsReceipt = async () => {
    if (!selectedPo || busy) return;
    setBusy('receive');
    try {
      await axios.put(`/procurement/po/${selectedPo._id}/receive`);
      notify.success('Receipt recorded: Material has been booked into stores against this order.');
      await fetchData();
    } catch (err) {
      notify.error('Could not record receipt');
    } finally {
      setBusy(null);
    }
  };

  // 3-Way Match Simulation
  const handleInvoice = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedPo || busy) return;
    setBusy('invoice');
    try {
      await axios.post(`/procurement/po/${selectedPo._id}/invoice`, invoiceData);
      notify.success('3-Way Match Verified! Bill matches order and receipt. Approved for payment.');
      setIsInvoiceModalOpen(false);
      setInvoiceData({});
      await fetchData();
    } catch (err) {
      notify.warning(err.response?.data?.message || 'Bill tolerance mismatch: Bill placed on hold.');
    } finally {
      setBusy(null);
    }
  };

  // Change Order Revision
  const handleChangeOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedPo || busy) return;
    setBusy('change');
    try {
      await axios.post(`/procurement/po/${selectedPo._id}/change-order`, changeOrderData);
      setIsChangeOrderModalOpen(false);
      setChangeOrderData({});
      notify.success('Change Order processed. This order is now on a new version.');
      await fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not process change order');
    } finally {
      setBusy(null);
    }
  };

  // Delete Purchase Order
  const handleDeletePo = async (poId) => {
    try {
      await axios.delete(`/procurement/po/${poId}`);
      notify.success('Purchase order deleted successfully');
      await fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not delete purchase order');
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
      {/* 1. Light-Mode Executive Header Bar */}
      <POHeaderBar
        purchaseOrders={purchaseOrders}
        activePerspective={activePerspective}
        setActivePerspective={setActivePerspective}
        selectedPo={selectedPo}
        onAddNew={() => {
          setFormData({
            paymentTerms: 'Net30',
            incoterms: 'DDP',
            items: [{}]
          });
          setIsModalOpen(true);
        }}
        onPrintVoucher={() => setIsPrintModalOpen(true)}
        onRefresh={fetchData}
        loading={loading}
      />

      {/* 2. Main Content Perspective Display */}
      {activePerspective === 'Workbench' && (
        <POFulfillmentWorkbench
          purchaseOrders={purchaseOrders}
          selectedPo={selectedPo}
          onSelectPo={setSelectedPo}
          onStatusUpdate={handleStatusUpdate}
          onAcknowledge={handleAcknowledge}
          onASN={handleASN}
          onMockGoodsReceipt={handleMockGoodsReceipt}
          onOpenChangeOrderModal={(initial) => {
            setChangeOrderData(initial);
            setIsChangeOrderModalOpen(true);
          }}
          onOpenInvoiceModal={(initial) => {
            setInvoiceData(initial);
            setIsInvoiceModalOpen(true);
          }}
          onPrintVoucher={() => setIsPrintModalOpen(true)}
          onDeletePo={handleDeletePo}
          onAddNew={() => {
            setFormData({
              paymentTerms: 'Net30',
              incoterms: 'DDP',
              items: [{}]
            });
            setIsModalOpen(true);
          }}
          busy={busy}
        />
      )}

      {activePerspective === 'Ledger' && (
        <POLedger
          purchaseOrders={purchaseOrders}
          onSelectPo={setSelectedPo}
          onOpenWorkbench={() => setActivePerspective('Workbench')}
          onPrintVoucher={() => setIsPrintModalOpen(true)}
          onDeletePo={handleDeletePo}
          onAddNew={() => {
            setFormData({
              paymentTerms: 'Net30',
              incoterms: 'DDP',
              items: [{}]
            });
            setIsModalOpen(true);
          }}
        />
      )}

      {activePerspective === 'Pipeline' && (
        <POPipelineBoard
          purchaseOrders={purchaseOrders}
          onSelectPo={setSelectedPo}
          onOpenWorkbench={() => setActivePerspective('Workbench')}
        />
      )}

      {/* 3. Modals */}
      {/* Raise New PO Modal */}
      <POCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        saving={busy === 'save'}
        rfqs={rfqs}
        vendors={vendors}
        materials={materials}
      />

      {/* Change Order Revision Modal */}
      <POChangeOrderModal
        isOpen={isChangeOrderModalOpen}
        onClose={() => setIsChangeOrderModalOpen(false)}
        changeOrderData={changeOrderData}
        setChangeOrderData={setChangeOrderData}
        onSave={handleChangeOrder}
        saving={busy === 'change'}
        selectedPo={selectedPo}
      />

      {/* 3-Way Match Invoice Clearance Modal */}
      <POInvoiceMatchModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoiceData={invoiceData}
        setInvoiceData={setInvoiceData}
        onSave={handleInvoice}
        saving={busy === 'invoice'}
        selectedPo={selectedPo}
      />

      {/* Official Printable PO Voucher Modal */}
      <POPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        selectedPo={selectedPo}
      />
    </div>
  );
};

export default PurchaseOrder;