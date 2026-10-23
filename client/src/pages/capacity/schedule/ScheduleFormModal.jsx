import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  X, CheckCircle, AlertTriangle, Clock, Calendar, 
  Layers, Wrench, ShieldCheck, User, Flame 
} from 'lucide-react';
import Modal from '../../../components/common/Modal';

const ScheduleFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingId,
  activeTab,
  workCenters = [],
  products = [],
  mrpSuggestions = [],
  busy = false
}) => {
  // Real-time capacity check
  const [capacityValidation, setCapacityValidation] = useState({
    isValid: true,
    message: '',
    checking: false
  });

  useEffect(() => {
    const validateCapacity = async () => {
      if (formData.assignedWorkCenterId && formData.targetDate) {
        setCapacityValidation(prev => ({ ...prev, checking: true }));
        try {
          const periodLabel = `WEEK ${Math.ceil(new Date(formData.targetDate).getDate() / 7)}`;
          const res = await axios.get('/capacity/validate-scheduling', {
            params: {
              workCenterId: formData.assignedWorkCenterId,
              periodLabel
            }
          });
          setCapacityValidation({
            isValid: res.data.isValid,
            message: res.data.message,
            checking: false
          });
        } catch (err) {
          setCapacityValidation({
            isValid: true,
            message: '',
            checking: false
          });
        }
      } else {
        setCapacityValidation({
          isValid: true,
          message: '',
          checking: false
        });
      }
    };

    const timer = setTimeout(validateCapacity, 400);
    return () => clearTimeout(timer);
  }, [formData.assignedWorkCenterId, formData.targetDate, formData.scheduledQuantity]);

  const handleSuggestionSelect = (e) => {
    const suggId = e.target.value;
    const sugg = mrpSuggestions.find(s => s._id === suggId);
    if (sugg) {
      setFormData({
        ...formData,
        mrpRecommendationId: suggId,
        productId: sugg.itemId?._id || sugg.itemId,
        scheduledQuantity: sugg.suggestedQty
      });
    } else {
      setFormData({
        ...formData,
        mrpRecommendationId: ''
      });
    }
  };

  const isWaterfallRestricted = (formData.scheduleType === 'Monthly' || formData.scheduleType === 'Weekly');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${editingId ? 'Edit' : 'Create'} ${formData.scheduleType || activeTab} Production Schedule`}
    >
      <form onSubmit={onSubmit}>
        {/* MRP Suggestion Pull */}
        <div className="input-group">
          <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={13} color="var(--accent-primary)" />
            Pull from Material Planning (MRP) Recommendation (Optional)
          </label>
          <select
            className="input-field"
            value={formData.mrpRecommendationId || ''}
            onChange={handleSuggestionSelect}
          >
            <option value="">Enter manually / independent job</option>
            {mrpSuggestions.map(s => (
              <option key={s._id} value={s._id}>
                {s.itemId?.name} (Suggested Qty: {s.suggestedQty})
              </option>
            ))}
          </select>
          {mrpSuggestions.length === 0 && (
            <p style={{ color: 'var(--text-secondary)', fontSize: 11, marginTop: 4 }}>
              No pending MRP suggestions. You can create independent production schedules below.
            </p>
          )}
        </div>

        {/* Product & Quantity */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label">Product / Part *</label>
            <select
              className="input-field"
              required
              value={formData.productId || ''}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              disabled={!!formData.mrpRecommendationId}
            >
              <option value="" disabled>Select automotive product</option>
              {products.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Scheduled Quantity *</label>
            <input
              type="number"
              className="input-field"
              required
              min="1"
              placeholder="e.g. 5000"
              value={formData.scheduledQuantity || ''}
              onChange={(e) => setFormData({ ...formData, scheduledQuantity: parseInt(e.target.value) || '' })}
            />
          </div>
        </div>

        {/* Schedule Type, Target Date & Shift */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label">Timeline Type *</label>
            <select
              className="input-field"
              required
              value={formData.scheduleType || activeTab}
              onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
            >
              <option value="Daily">Daily Schedule</option>
              <option value="Weekly">Weekly Rough-Cut</option>
              <option value="Monthly">Monthly MPS</option>
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Target Date *</label>
            <input
              type="date"
              className="input-field"
              required
              value={formData.targetDate || ''}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Production Shift</label>
            <select
              className="input-field"
              value={formData.shift || 'Shift 1'}
              onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
            >
              <option value="Shift 1">Shift 1 (06:00 - 14:00)</option>
              <option value="Shift 2">Shift 2 (14:00 - 22:00)</option>
              <option value="Shift 3">Shift 3 (22:00 - 06:00)</option>
              <option value="General">General Shift (09:00 - 17:30)</option>
            </select>
          </div>
        </div>

        {/* Work Center & Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label">Assigned Work Center *</label>
            <select
              className="input-field"
              required
              value={formData.assignedWorkCenterId || ''}
              onChange={(e) => setFormData({ ...formData, assignedWorkCenterId: e.target.value })}
            >
              <option value="" disabled>Choose work center / line</option>
              {workCenters.map(wc => (
                <option key={wc._id} value={wc._id}>
                  {wc.name} ({wc.code})
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Priority Level</label>
            <select
              className="input-field"
              value={formData.priority || 'Normal'}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
            >
              <option value="Normal">Normal</option>
              <option value="Expedite">Expedite</option>
              <option value="Critical">Critical / Rush</option>
              <option value="Buffer">Buffer / Filler</option>
            </select>
          </div>
        </div>

        {/* Tooling (SMED) & Manning Parameters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label">Die / Tool ID</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. DIE-BRK-01"
              value={formData.dieToolId || ''}
              onChange={(e) => setFormData({ ...formData, dieToolId: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Setup Time (Hrs)</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              placeholder="0.5"
              value={formData.setupTimeHours !== undefined ? formData.setupTimeHours : 0.5}
              onChange={(e) => setFormData({ ...formData, setupTimeHours: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Run Time (Hrs)</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              placeholder="2.0"
              value={formData.runTimeHours !== undefined ? formData.runTimeHours : 2.0}
              onChange={(e) => setFormData({ ...formData, runTimeHours: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>

        {/* Real-time Capacity Validation Banner (Rule 2) */}
        {formData.assignedWorkCenterId && formData.targetDate && (
          <div style={{
            marginBottom: '14px',
            padding: '12px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            backgroundColor: capacityValidation.checking 
              ? 'var(--bg-tertiary)' 
              : capacityValidation.isValid 
                ? 'rgba(16, 185, 129, 0.1)' 
                : 'rgba(239, 68, 68, 0.1)',
            color: capacityValidation.checking 
              ? 'var(--text-secondary)' 
              : capacityValidation.isValid 
                ? '#10b981' 
                : '#ef4444',
            border: capacityValidation.isValid ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
          }}>
            {capacityValidation.checking ? (
              <Clock size={16} className="animate-spin" />
            ) : capacityValidation.isValid ? (
              <CheckCircle size={16} />
            ) : (
              <AlertTriangle size={16} />
            )}
            <div>
              <strong style={{ display: 'block', marginBottom: '2px' }}>
                CRP Dynamic Capacity Check
              </strong>
              {capacityValidation.checking 
                ? 'Validating machine load against existing shop floor dispatch...' 
                : capacityValidation.message || 'Capacity available for scheduling.'}
            </div>
          </div>
        )}

        {/* Status & Waterfall Rule (Rule 3) */}
        <div className="input-group">
          <label className="input-label">Operational Status</label>
          <select
            className="input-field"
            required
            value={formData.status || 'Draft'}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="Draft">Draft</option>
            <option value="Firm/Released" disabled={isWaterfallRestricted}>
              Firm/Released {isWaterfallRestricted ? '(Requires Daily Plan)' : ''}
            </option>
            <option value="In-Progress">In-Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
          {isWaterfallRestricted && (
            <p style={{ color: '#f59e0b', fontSize: '11px', marginTop: '4px', lineHeight: 1.4 }}>
              * Waterfall Resolution Enforced: Monthly and Weekly rough-cut plans cannot be released directly. Decompose into a Daily schedule to release to shop floor.
            </p>
          )}
          {formData.status === 'Firm/Released' && !isWaterfallRestricted && (
            <p style={{ color: '#10b981', fontSize: '11px', marginTop: '4px', lineHeight: 1.4 }}>
              ✓ Firming this schedule will generate a Shop Floor Dispatch List and lock raw materials.
            </p>
          )}
        </div>

        {/* Customer Reference & Notes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label">Customer Ref</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. TVS Motor"
              value={formData.customerReference || ''}
              onChange={(e) => setFormData({ ...formData, customerReference: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Notes & Instructions</label>
            <input
              type="text"
              className="input-field"
              placeholder="Operator notes, tooling condition, or QA checkpoints..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </div>

        {/* Form Action Buttons */}
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
            disabled={busy || (!capacityValidation.isValid && !capacityValidation.checking)}
          >
            {busy ? 'Saving…' : editingId ? 'Update Schedule' : 'Save & Allocate Schedule'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ScheduleFormModal;
