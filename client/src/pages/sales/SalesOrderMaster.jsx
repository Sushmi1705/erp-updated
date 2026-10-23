import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Package, Plus, Search, Truck, DollarSign,
  CheckCircle, XCircle, ChevronRight, Edit2, Lock,
  AlertTriangle, Calendar, Layers, Factory, Printer
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

// Subcomponents
import { OrderCommandBar } from './order/OrderCommandBar';
import { OrderMatrixDeck } from './order/OrderMatrixDeck';
import { OrderFlightDeck } from './order/OrderFlightDeck';
import { OrderLinesSection } from './order/OrderLinesSection';
import { OrderReleasesSection } from './order/OrderReleasesSection';
import { SalesOrderPrintModal } from './order/SalesOrderPrintModal';

const hintStyle = {
  color: 'var(--status-caution-fg)',
  fontSize: 'var(--font-caption)',
  marginTop: 'var(--space-2)',
  lineHeight: 'var(--leading-normal)'
};

const SalesOrderMaster = () => {
  // References
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [uoms, setUoms] = useState([]);
  const [quotRevs, setQuotRevs] = useState([]);
  const [invBatches, setInvBatches] = useState([]);

  // Data
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Drill-down State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [lines, setLines] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [allocations, setAllocations] = useState([]);

  // Print Modal
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Modal State
  const [modal, setModal] = useState({
    type: null,
    data: null,
    editId: null
  });
  const [saving, setSaving] = useState(false);

  // ── References ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [cu, pr, um, qr, inv] = await Promise.all([
          axios.get('/master/customer'),
          axios.get('/master/product'),
          axios.get('/master/uom'),
          axios.get('/sales/quotation-headers'),
          axios.get('/inventory/batches').catch(() => ({ data: { data: [] } }))
        ]);
        setCustomers(cu.data.data?.filter(c => c.status !== 'Inactive') || cu.data.data || []);
        setProducts(pr.data.data?.filter(p => p.status !== 'Inactive') || pr.data.data || []);
        setUoms(um.data.data || []);
        setQuotRevs(qr.data.data || []);
        setInvBatches(inv.data.data || []);
      } catch (e) {
        console.error('Refs:', e);
      }
    })();
    fetchOrders();
  }, []);

  // ── Fetchers ──────────────────────────────────────────────────────────────
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/sales/so-headers');
      const data = res.data.data || [];
      setOrders(data);
      if (data.length > 0 && !selectedOrder) {
        selectOrder(data[0]);
      } else if (selectedOrder) {
        const updated = data.find(o => o._id === selectedOrder._id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchLines = useCallback(async (orderId) => {
    try {
      const res = await axios.get(`/sales/so-headers/${orderId}/lines`);
      const lineData = res.data.data || [];
      setLines(lineData);
      if (lineData.length > 0) {
        selectLine(lineData[0]);
      } else {
        setSelectedLine(null);
        setSchedules([]);
        setSelectedSchedule(null);
        setAllocations([]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchSchedules = useCallback(async (lineId) => {
    try {
      const res = await axios.get(`/sales/so-lines/${lineId}/schedules`);
      const schedData = res.data.data || [];
      setSchedules(schedData);
      if (schedData.length > 0) {
        selectSchedule(schedData[0]);
      } else {
        setSelectedSchedule(null);
        setAllocations([]);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchAllocations = useCallback(async (scheduleId) => {
    try {
      const res = await axios.get(`/sales/so-schedules/${scheduleId}/allocations`);
      setAllocations(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  }, []);

  // ── Selectors ─────────────────────────────────────────────────────────────
  const selectOrder = (row) => {
    setSelectedOrder(row);
    fetchLines(row._id);
  };

  const selectLine = (row) => {
    setSelectedLine(row);
    fetchSchedules(row._id);
  };

  const selectSchedule = (row) => {
    setSelectedSchedule(row);
    fetchAllocations(row._id);
  };

  // ── Status Transitions ────────────────────────────────────────────────────
  const changeStatus = async (id, status) => {
    try {
      const res = await axios.put(`/sales/so-headers/${id}/status`, { status });
      if (res.data.mrpOrdersCreated > 0) {
        notify.success(`${res.data.mrpOrdersCreated} made-to-order line(s) have raised production orders in Material Planning (MRP).`);
      } else {
        notify.success(`Order status updated to ${status}`);
      }
      fetchOrders();
      if (selectedOrder?._id === id) {
        setSelectedOrder(o => ({ ...o, status }));
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error changing status');
    }
  };

  const advanceDispatchStatus = async (sched) => {
    const next = {
      Pending: 'Picked',
      Picked: 'In Transit',
      'In Transit': 'Delivered'
    };
    const nextStatus = next[sched.dispatchStatus];
    if (!nextStatus) return;

    try {
      await axios.put(`/sales/so-schedules/${sched._id}`, {
        ...sched,
        dispatchStatus: nextStatus
      });
      notify.success(`Delivery release advanced to ${nextStatus}`);
      fetchSchedules(selectedLine._id);
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error updating release status');
    }
  };

  // ── Generic Save ──────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    const { type, data, editId } = modal;
    if (saving) return;
    setSaving(true);
    try {
      if (type === 'order') {
        if (editId) {
          await axios.put(`/sales/so-headers/${editId}`, data);
          notify.success('Sales order updated');
        } else {
          const res = await axios.post('/sales/so-headers', data);
          notify.success('Sales order created');
          if (res.data?.data) {
            selectOrder(res.data.data);
          }
        }
        fetchOrders();
      } else if (type === 'line') {
        if (editId) {
          await axios.put(`/sales/so-lines/${editId}`, data);
          notify.success('Line item updated');
        } else {
          await axios.post(`/sales/so-headers/${selectedOrder._id}/lines`, data);
          notify.success('Part added to order');
        }
        fetchLines(selectedOrder._id);
        fetchOrders();
      } else if (type === 'schedule') {
        if (editId) {
          await axios.put(`/sales/so-schedules/${editId}`, data);
          notify.success('Delivery release updated');
        } else {
          await axios.post(`/sales/so-lines/${selectedLine._id}/schedules`, data);
          notify.success('Delivery release scheduled');
        }
        fetchSchedules(selectedLine._id);
      } else if (type === 'allocation') {
        await axios.post(`/sales/so-schedules/${selectedSchedule._id}/allocations`, {
          ...data,
          scheduleId: selectedSchedule._id
        });
        notify.success('Stock batch set aside for release');
        fetchAllocations(selectedSchedule._id);
        fetchLines(selectedOrder._id); // Refresh ATP status
      }
      setModal({ type: null, data: null, editId: null });
    } catch (err) {
      notify.error(err.response?.data?.message || err.message || 'Error saving');
    }
    setSaving(false);
  };

  const handleDelete = async (type, id) => {
    if (!await confirmAction('Delete this record?')) return;
    try {
      if (type === 'line') {
        await axios.delete(`/sales/so-lines/${id}`);
        fetchLines(selectedOrder._id);
        fetchOrders();
        notify.success('Line item deleted');
      }
      if (type === 'schedule') {
        await axios.delete(`/sales/so-schedules/${id}`);
        fetchSchedules(selectedLine._id);
        notify.success('Delivery release deleted');
      }
      if (type === 'allocation') {
        await axios.delete(`/sales/so-allocations/${id}`);
        fetchAllocations(selectedSchedule._id);
        notify.success('Stock allocation removed');
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error deleting');
    }
  };

  const openModal = (type, prefill = {}, editId = null) => {
    setModal({
      type,
      data: { ...prefill },
      editId
    });
  };

  const updateField = (f, v) => {
    setModal(m => ({
      ...m,
      data: {
        ...m.data,
        [f]: v
      }
    }));
  };

  const today = new Date().toISOString().split('T')[0];

  // Deep-link auto create support (?create=1)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('create') === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      openModal('order', { orderNumber: '', orderDate: today, holdStatus: 'None', status: 'Draft' });
    }
  }, [today]);

  // ── Filtered Orders ───────────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      // Status filter
      if (statusFilter === 'On Hold') {
        if (!o.holdStatus || o.holdStatus === 'None') return false;
      } else if (statusFilter !== 'All') {
        if (o.status !== statusFilter) return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const soNo = (o.orderNumber || '').toLowerCase();
        const poNo = (o.customerPONumber || '').toLowerCase();
        const custName = (o.customerId?.name || '').toLowerCase();
        const custCode = (o.customerId?.code || '').toLowerCase();
        return soNo.includes(q) || poNo.includes(q) || custName.includes(q) || custCode.includes(q);
      }
      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  const isLockedSchedule = sched => ['Picked', 'In Transit', 'Delivered'].includes(sched?.dispatchStatus);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      gap: 14
    }}>
      {/* ── 1. COMMAND & RADAR HEADER ───────────────────────────────────────── */}
      <OrderCommandBar
        orders={orders}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onOpenCreateModal={() => openModal('order', {
          orderNumber: '',
          orderDate: today,
          holdStatus: 'None',
          status: 'Draft'
        })}
        loading={loading}
      />

      {/* ── 2. ORDER MATRIX QUEUE ───────────────────────────────────────────── */}
      <OrderMatrixDeck
        orders={filteredOrders}
        selectedOrder={selectedOrder}
        onSelectOrder={selectOrder}
        onOpenEditOrderModal={(row) => openModal('order', {
          ...row,
          customerId: row.customerId?._id || row.customerId,
          quotationRevisionId: row.quotationRevisionId?._id || row.quotationRevisionId || '',
          orderDate: row.orderDate ? row.orderDate.split('T')[0] : today,
          deliveryCommitmentDate: row.deliveryCommitmentDate ? row.deliveryCommitmentDate.split('T')[0] : ''
        }, row._id)}
        onChangeStatus={changeStatus}
        loading={loading}
      />

      {/* ── 3. SELECTED ORDER FULFILLMENT DECK & WORKBENCH ──────────────────── */}
      {selectedOrder && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Flight Deck Cockpit */}
          <OrderFlightDeck
            selectedOrder={selectedOrder}
            onChangeStatus={changeStatus}
            onOpenEditOrderModal={(row) => openModal('order', {
              ...row,
              customerId: row.customerId?._id || row.customerId,
              quotationRevisionId: row.quotationRevisionId?._id || row.quotationRevisionId || '',
              orderDate: row.orderDate ? row.orderDate.split('T')[0] : today,
              deliveryCommitmentDate: row.deliveryCommitmentDate ? row.deliveryCommitmentDate.split('T')[0] : ''
            }, row._id)}
            onOpenPrintModal={() => setIsPrintOpen(true)}
            linesCount={lines.length}
          />

          {/* Ordered Parts Section */}
          <OrderLinesSection
            lines={lines}
            selectedLine={selectedLine}
            onSelectLine={selectLine}
            onOpenAddLineModal={() => openModal('line', {
              fulfillmentType: 'From Stock',
              atpStatus: 'Backordered',
              orderedQuantity: 1,
              unitPrice: 0,
              lineDiscountAmount: 0
            })}
            onOpenEditLineModal={(row) => openModal('line', {
              ...row,
              productId: row.productId?._id || row.productId || '',
              uomId: row.uomId?._id || row.uomId || ''
            }, row._id)}
            onDeleteLine={(id) => handleDelete('line', id)}
            orderStatus={selectedOrder.status}
          />

          {/* Staggered Delivery Releases & Stock Allocation */}
          <OrderReleasesSection
            selectedLine={selectedLine}
            schedules={schedules}
            selectedSchedule={selectedSchedule}
            onSelectSchedule={selectSchedule}
            onOpenAddScheduleModal={() => openModal('schedule', {
              requestedDeliveryDate: today,
              scheduledQuantity: selectedLine.orderedQuantity,
              dispatchStatus: 'Pending',
              shippedQuantity: 0
            })}
            onOpenEditScheduleModal={(row) => !isLockedSchedule(row) && openModal('schedule', {
              ...row,
              requestedDeliveryDate: row.requestedDeliveryDate?.split('T')[0] || today,
              confirmedDeliveryDate: row.confirmedDeliveryDate?.split('T')[0] || ''
            }, row._id)}
            onDeleteSchedule={(id) => handleDelete('schedule', id)}
            onAdvanceDispatchStatus={advanceDispatchStatus}
            allocations={allocations}
            onOpenAddAllocationModal={() => openModal('allocation', {
              allocatedQuantity: selectedSchedule.scheduledQuantity,
              isHardReserved: true,
              allocationDate: today
            })}
            onDeleteAllocation={(id) => handleDelete('allocation', id)}
          />
        </div>
      )}

      {/* ── 4. MODALS ───────────────────────────────────────────────────────── */}

      {/* A. Order Header Modal */}
      <Modal
        isOpen={modal.type === 'order'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Sales Order' : 'Create Confirmed Sales Order'}
      >
        <form onSubmit={handleSave}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div className="input-group">
              <label className="input-label">Order Number *</label>
              <input
                className="input-field"
                readOnly
                value={modal.data?.orderNumber || ''}
                placeholder="Sequential — assigned upon save"
                style={{ fontFamily: 'monospace' }}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Customer Organization *</label>
              <select
                className="input-field"
                required
                value={modal.data?.customerId || ''}
                onChange={e => updateField('customerId', e.target.value)}
              >
                <option value="">Select a customer</option>
                {customers.map(c => (
                  <option key={c._id} value={c._id}>
                    {c.name} ({c.code}) — Credit Limit {fmtMoneyFull(c.creditLimit)}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p style={hintStyle}>No customers found — add one under Master Data &gt; Customers first.</p>
              )}
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Accepted Quotation Reference (Optional)</label>
              <select
                className="input-field"
                value={modal.data?.quotationRevisionId || ''}
                onChange={e => updateField('quotationRevisionId', e.target.value || null)}
              >
                <option value="">Direct Order — No Prior Quotation</option>
                {quotRevs.map(q => (
                  <option key={q._id} value={q._id}>{q.quotationNumber}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Customer PO Number (Their Official PO #)</label>
              <input
                className="input-field"
                placeholder="e.g., PO-2024-9982"
                value={modal.data?.customerPONumber || ''}
                onChange={e => updateField('customerPONumber', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Order Date *</label>
              <input
                type="date"
                className="input-field"
                required
                value={modal.data?.orderDate || today}
                onChange={e => updateField('orderDate', e.target.value)}
              />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Promised Delivery Commitment Date</label>
              <input
                type="date"
                className="input-field"
                value={modal.data?.deliveryCommitmentDate || ''}
                onChange={e => updateField('deliveryCommitmentDate', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModal({ type: null, data: null, editId: null })}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : modal.editId ? 'Save Changes' : 'Create Sales Order'}
            </button>
          </div>
        </form>
      </Modal>

      {/* B. Line Item Modal */}
      <Modal
        isOpen={modal.type === 'line'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Ordered Part' : 'Add Part to Sales Order'}
      >
        <form onSubmit={handleSave}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Select Automotive Component *</label>
              <select
                className="input-field"
                required
                value={modal.data?.productId || ''}
                onChange={e => updateField('productId', e.target.value)}
              >
                <option value="" disabled>Select a component</option>
                {products.map(p => (
                  <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Quantity Ordered *</label>
              <input
                type="number"
                className="input-field"
                required
                min="0.0001"
                step="any"
                value={modal.data?.orderedQuantity || 1}
                onChange={e => updateField('orderedQuantity', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Unit of Measure (UOM)</label>
              <select
                className="input-field"
                value={modal.data?.uomId || ''}
                onChange={e => updateField('uomId', e.target.value)}
              >
                <option value="" disabled>Select unit</option>
                {uoms.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.abbreviation})</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span>Agreed Price per Piece (₹) *</span>
                {modal.data?.isPriceLocked && <Lock size={11} color="var(--text-secondary)" title="Locked from quotation" />}
              </label>
              <input
                type="number"
                className="input-field"
                required
                min="0"
                step="any"
                readOnly={!!modal.data?.isPriceLocked}
                value={modal.data?.unitPrice || 0}
                onChange={e => updateField('unitPrice', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Line Discount (₹)</label>
              <input
                type="number"
                className="input-field"
                min="0"
                step="any"
                readOnly={!!modal.data?.isPriceLocked}
                value={modal.data?.lineDiscountAmount || 0}
                onChange={e => updateField('lineDiscountAmount', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Fulfillment Supply Route</label>
              <select
                className="input-field"
                value={modal.data?.fulfillmentType || 'From Stock'}
                onChange={e => updateField('fulfillmentType', e.target.value)}
              >
                {['From Stock', 'Production Required', 'Dropship'].map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Available to Promise (ATP)</label>
              <select
                className="input-field"
                value={modal.data?.atpStatus || 'Backordered'}
                onChange={e => updateField('atpStatus', e.target.value)}
              >
                {['Fully Allocated', 'Partially Allocated', 'Backordered', 'Make-to-Order'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Total Preview */}
            <div style={{
              gridColumn: '1 / -1',
              padding: 10,
              background: 'var(--bg-secondary)',
              borderRadius: 6,
              fontSize: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>Calculated Line Total:</span>
              <strong style={{ fontSize: 15, fontFamily: 'monospace', color: '#059669' }}>
                {fmtMoneyFull((modal.data?.orderedQuantity || 0) * (modal.data?.unitPrice || 0) - (modal.data?.lineDiscountAmount || 0))}
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModal({ type: null, data: null, editId: null })}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : modal.editId ? 'Save Part' : 'Add Part'}
            </button>
          </div>
        </form>
      </Modal>

      {/* C. Schedule Modal */}
      <Modal
        isOpen={modal.type === 'schedule'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title={modal.editId ? 'Edit Delivery Release' : 'Add JIT Delivery Release'}
      >
        <form onSubmit={handleSave}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div className="input-group">
              <label className="input-label">Requested Delivery Date (Customer Date) *</label>
              <input
                type="date"
                className="input-field"
                required
                value={modal.data?.requestedDeliveryDate || today}
                onChange={e => updateField('requestedDeliveryDate', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Confirmed Delivery Date (Plant Promise)</label>
              <input
                type="date"
                className="input-field"
                value={modal.data?.confirmedDeliveryDate || ''}
                onChange={e => updateField('confirmedDeliveryDate', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Scheduled Quantity in this Lot *</label>
              <input
                type="number"
                className="input-field"
                required
                min="0.0001"
                step="any"
                readOnly={isLockedSchedule({ dispatchStatus: modal.data?.dispatchStatus })}
                value={modal.data?.scheduledQuantity || 0}
                onChange={e => updateField('scheduledQuantity', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Shipped Quantity</label>
              <input
                type="number"
                className="input-field"
                min="0"
                step="any"
                value={modal.data?.shippedQuantity || 0}
                onChange={e => updateField('shippedQuantity', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Ship-To Consignee Plant Address</label>
              <input
                className="input-field"
                placeholder="e.g., TVS Hosur Plant 2 Receiving Stores, Gate 3"
                value={modal.data?.shipToAddress || ''}
                onChange={e => updateField('shipToAddress', e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Dispatch Status Milestone</label>
              <select
                className="input-field"
                value={modal.data?.dispatchStatus || 'Pending'}
                onChange={e => updateField('dispatchStatus', e.target.value)}
              >
                {['Pending', 'Picked', 'In Transit', 'Delivered'].map(s => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModal({ type: null, data: null, editId: null })}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : modal.editId ? 'Save Release' : 'Add Release'}
            </button>
          </div>
        </form>
      </Modal>

      {/* D. Allocation Modal */}
      <Modal
        isOpen={modal.type === 'allocation'}
        onClose={() => setModal({ type: null, data: null, editId: null })}
        title="Set Finished Goods Stock Aside (ATP Allocation)"
      >
        <form onSubmit={handleSave}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div className="input-group" style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Select Finished Goods Batch *</label>
              <select
                className="input-field"
                required
                value={modal.data?.inventoryBatchId || ''}
                onChange={e => updateField('inventoryBatchId', e.target.value)}
              >
                <option value="" disabled>Select inventory stock batch</option>
                {invBatches.map(b => (
                  <option key={b._id} value={b._id}>
                    Batch {b.batchNumber} — {b.quantityAvailable} units available
                  </option>
                ))}
              </select>
              {invBatches.length === 0 && (
                <p style={hintStyle}>No stock batches found — complete goods receipt under Goods Receiving first.</p>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Quantity to Allocate *</label>
              <input
                type="number"
                className="input-field"
                required
                min="0.0001"
                step="any"
                value={modal.data?.allocatedQuantity || 0}
                onChange={e => updateField('allocatedQuantity', parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 22 }}>
              <input
                type="checkbox"
                id="hardReserveCheck"
                checked={!!modal.data?.isHardReserved}
                onChange={e => updateField('isHardReserved', e.target.checked)}
              />
              <label htmlFor="hardReserveCheck" className="input-label" style={{ margin: 0 }}>
                Hard Reserve — Stock cannot be appropriated by other orders
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setModal({ type: null, data: null, editId: null })}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Allocating…' : 'Set Stock Aside'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── 5. PRINTABLE FORMAL DISPATCH NOTE ───────────────────────────────── */}
      {isPrintOpen && selectedOrder && (
        <SalesOrderPrintModal
          order={selectedOrder}
          lines={lines}
          onClose={() => setIsPrintOpen(false)}
        />
      )}
    </div>
  );
};

export default SalesOrderMaster;