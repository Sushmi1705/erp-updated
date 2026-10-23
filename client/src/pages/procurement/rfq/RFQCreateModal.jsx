import React from 'react';
import { 
  FileText, ShieldAlert, Clock, Users, Package, 
  Layers, Lock, Sparkles, Building2 
} from 'lucide-react';
import Modal from '../../../components/common/Modal';

const RFQCreateModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  requisitions = [],
  materials = [],
  vendors = [],
  saving = false
}) => {
  const handleRequisitionSelect = (e) => {
    const reqId = e.target.value;
    const req = requisitions.find(r => r._id === reqId);
    if (req) {
      const firstItem = req.items?.[0];
      setFormData({
        ...formData,
        requisitionId: reqId,
        title: `Tender for ${req.prNumber} (${firstItem?.itemId?.name || 'Material'})`,
        materialId: firstItem?.itemId?._id || firstItem?.itemId,
        quantity: firstItem?.qty || 100
      });
    } else {
      setFormData({
        ...formData,
        requisitionId: '',
        title: ''
      });
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Strategic Sourcing Tender (RFQ)"
    >
      <form onSubmit={onSubmit}>
        {/* Title */}
        <div className="input-group">
          <label className="input-label">Sourcing Scope Title *</label>
          <input
            type="text"
            className="input-field"
            required
            placeholder="e.g. CRCA Sheet 1.6mm — Quarterly Tender for TVS Frame Program"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* Copy from Approved Requisition (Rule 1) */}
        <div className="input-group">
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={13} color="var(--accent-primary)" />
            Copy from Approved Purchase Requisition (Optional)
          </label>
          <select
            className="input-field"
            value={formData.requisitionId || ''}
            onChange={handleRequisitionSelect}
          >
            <option value="">Create independent market tender</option>
            {requisitions.map(r => (
              <option key={r._id} value={r._id}>
                {r.prNumber} — {r.items?.[0]?.itemId?.name || 'Material'} (Qty: {r.items?.[0]?.qty || '—'})
              </option>
            ))}
          </select>
          {requisitions.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
              No approved purchase requisitions available. You can fill in the material and quantity below.
            </p>
          )}
        </div>

        {/* Protocol & Deadline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label">Sourcing Protocol *</label>
            <select
              className="input-field"
              required
              value={formData.sourcingType || 'Standard RFQ'}
              onChange={(e) => setFormData({ ...formData, sourcingType: e.target.value })}
            >
              <option value="Standard RFQ">Standard RFQ (Open — transparent quotes)</option>
              <option value="Sealed Bid">Sealed Bid (Vault — encrypted until deadline)</option>
              <option value="Reverse Auction">Reverse Auction (Real-time downward bidding)</option>
            </select>
            {formData.sourcingType === 'Sealed Bid' && (
              <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>
                * Sealed bids keep supplier prices confidential until the deadline passes.
              </p>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Quotes Due Date & Time *</label>
            <input
              type="datetime-local"
              className="input-field"
              required
              value={formData.submissionDeadline || ''}
              onChange={(e) => setFormData({ ...formData, submissionDeadline: e.target.value })}
            />
          </div>
        </div>

        {/* Material & Quantity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label">Target Material *</label>
            <select
              className="input-field"
              required
              value={formData.materialId || ''}
              onChange={(e) => setFormData({ ...formData, materialId: e.target.value })}
              disabled={!!formData.requisitionId}
            >
              <option value="" disabled>Select material from catalog</option>
              {materials.map(m => (
                <option key={m._id} value={m._id}>{m.name} ({m.code})</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Target Order Quantity *</label>
            <input
              type="number"
              min="1"
              className="input-field"
              required
              placeholder="e.g. 1000"
              value={formData.quantity || ''}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || '' })}
              disabled={!!formData.requisitionId}
            />
          </div>
        </div>

        {/* Multi-Supplier Invitation */}
        <div className="input-group">
          <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Invite Certified Suppliers *</span>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Hold Ctrl/Cmd to select multiple</span>
          </label>
          <select
            className="input-field"
            required
            multiple
            style={{ height: '90px' }}
            onChange={(e) => {
              const options = Array.from(e.target.options);
              setFormData({
                ...formData,
                invitedVendors: options.filter(o => o.selected).map(o => o.value)
              });
            }}
          >
            {vendors.map(v => (
              <option key={v._id} value={v._id}>{v.name} ({v.code || 'VEN'})</option>
            ))}
          </select>
          {vendors.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '11px', marginTop: '4px' }}>
              No active vendors found. Add suppliers under Master Data → Vendors.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Publishing Tender...' : 'Publish Tender to Suppliers'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default RFQCreateModal;
