import React, { useState } from 'react';
import { 
  Plus, 
  XCircle, 
  GripVertical, 
  ListPlus, 
  Calendar, 
  Layers, 
  Clock, 
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';
import Modal from '../../../components/common/Modal';
import { fmtQty } from '../../../utils/money';

const LINE_GROUP = { marginBottom: 0, minWidth: 0 };
const LINE_LABEL = { fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginBottom: '4px' };

const PlanCreateModal = ({
  isOpen,
  onClose,
  onSubmit,
  plants = [],
  materials = [],
  busy = false
}) => {
  const [formData, setFormData] = useState({
    Plan_Type: 'Make-to-Stock',
    Priority: 'Normal',
    Plant_ID: plants[0]?._id || '',
    Notes: ''
  });

  const [details, setDetails] = useState([
    {
      Line_Sequence_Number: 10,
      Material_ID: '',
      Target_Quantity: 1000,
      Planned_Start_Date: new Date().toISOString().split('T')[0],
      Planned_End_Date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  ]);

  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const renumber = (rows) => rows.map((r, i) => ({ ...r, Line_Sequence_Number: (i + 1) * 10 }));

  const addLineItem = () => {
    const nextSeq = details.length > 0 ? details[details.length - 1].Line_Sequence_Number + 10 : 10;
    setDetails([
      ...details,
      {
        Line_Sequence_Number: nextSeq,
        Material_ID: '',
        Target_Quantity: 500,
        Planned_Start_Date: new Date().toISOString().split('T')[0],
        Planned_End_Date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]);
  };

  const updateLineItem = (index, field, value) => {
    const newDetails = [...details];
    newDetails[index][field] = value;
    setDetails(newDetails);
  };

  const removeLineItem = (index) => {
    if (details.length === 1) return;
    const newDetails = [...details];
    newDetails.splice(index, 1);
    setDetails(renumber(newDetails));
  };

  const moveLineItem = (from, to) => {
    if (from === to || from < 0 || to < 0 || from >= details.length || to >= details.length) return;
    const newDetails = [...details];
    const [moved] = newDetails.splice(from, 1);
    newDetails.splice(to, 0, moved);
    setDetails(renumber(newDetails));
  };

  const endDrag = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      header: formData,
      details
    });
  };

  // Live Calculations
  const totalQty = details.reduce((sum, d) => sum + (Number(d.Target_Quantity) || 0), 0);
  const estPressHours = Math.round((totalQty / 120) * 10) / 10;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Master Production Schedule (MPS)" maxWidth={980}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Header Section */}
        <div style={{
          backgroundColor: 'rgba(15, 23, 42, 0.02)',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            marginBottom: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Layers size={14} color="#e11d48" />
            Plan Header Parameters
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px'
          }}>
            <div className="input-group">
              <label className="input-label" style={LINE_LABEL}>Plan Type *</label>
              <select
                className="input-field"
                required
                value={formData.Plan_Type}
                onChange={(e) => setFormData({ ...formData, Plan_Type: e.target.value })}
              >
                <option value="Make-to-Stock">Make-to-Stock</option>
                <option value="Make-to-Order">Make-to-Order</option>
                <option value="Experimental">Experimental</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" style={LINE_LABEL}>Priority *</label>
              <select
                className="input-field"
                required
                value={formData.Priority}
                onChange={(e) => setFormData({ ...formData, Priority: e.target.value })}
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent (Expedited)</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" style={LINE_LABEL}>Manufacturing Plant *</label>
              <select
                className="input-field"
                required
                value={formData.Plant_ID}
                onChange={(e) => setFormData({ ...formData, Plant_ID: e.target.value })}
              >
                <option value="" disabled>Choose a plant</option>
                {plants.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label" style={LINE_LABEL}>Engineering Notes / PO Ref</label>
              <input
                type="text"
                className="input-field"
                value={formData.Notes}
                onChange={(e) => setFormData({ ...formData, Notes: e.target.value })}
                placeholder="Optional customer reference or remarks"
              />
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Scheduled Part Lines ({details.length})
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Drag grip or press Alt+↑ / Alt+↓ to set shop floor priority sequence
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={addLineItem}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '12px',
                padding: '5px 10px',
                borderColor: '#e11d48',
                color: '#e11d48'
              }}
            >
              <Plus size={14} />
              Add Part Line
            </button>
          </div>

          {/* Line items container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
            {details.map((row, index) => (
              <div
                key={index}
                onDragOver={(e) => {
                  if (dragIndex === null) return;
                  e.preventDefault();
                  if (overIndex !== index) setOverIndex(index);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragIndex !== null) moveLineItem(dragIndex, index);
                  endDrag();
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '24px 50px minmax(200px, 1fr) 110px 140px 140px 32px',
                  gap: '10px',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-secondary)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  opacity: dragIndex === index ? 0.45 : 1,
                  boxShadow: overIndex === index && dragIndex !== null && dragIndex !== index
                    ? (dragIndex < index ? 'inset 0 -2px 0 #e11d48' : 'inset 0 2px 0 #e11d48')
                    : 'none',
                  transition: 'opacity .12s ease'
                }}
              >
                {/* Drag Handle */}
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', String(index));
                    setDragIndex(index);
                  }}
                  onDragEnd={endDrag}
                  onKeyDown={(e) => {
                    if (!e.altKey) return;
                    if (e.key === 'ArrowUp') { e.preventDefault(); moveLineItem(index, index - 1); }
                    if (e.key === 'ArrowDown') { e.preventDefault(); moveLineItem(index, index + 1); }
                  }}
                  title="Drag to reorder (Alt+↑ / Alt+↓ on keyboard)"
                  style={{
                    height: 32,
                    width: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'none',
                    color: 'var(--text-muted)',
                    cursor: dragIndex === index ? 'grabbing' : 'grab',
                    padding: 0
                  }}
                >
                  <GripVertical size={16} />
                </button>

                {/* Sequence */}
                <div className="input-group" style={LINE_GROUP}>
                  <label className="input-label" style={LINE_LABEL}>Seq</label>
                  <input
                    type="number"
                    className="input-field"
                    readOnly
                    value={row.Line_Sequence_Number}
                    style={{ textAlign: 'center', padding: '6px 4px', fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.03)' }}
                  />
                </div>

                {/* Material Dropdown */}
                <div className="input-group" style={LINE_GROUP}>
                  <label className="input-label" style={LINE_LABEL}>Material / Part *</label>
                  <select
                    className="input-field"
                    required
                    value={row.Material_ID}
                    onChange={(e) => updateLineItem(index, 'Material_ID', e.target.value)}
                  >
                    <option value="" disabled>Choose material</option>
                    {materials.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.name} {m.code ? `(${m.code})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Qty */}
                <div className="input-group" style={LINE_GROUP}>
                  <label className="input-label" style={LINE_LABEL}>Target Qty *</label>
                  <input
                    type="number"
                    className="input-field"
                    required
                    min="1"
                    value={row.Target_Quantity}
                    onChange={(e) => updateLineItem(index, 'Target_Quantity', parseFloat(e.target.value) || 0)}
                  />
                </div>

                {/* Start Date */}
                <div className="input-group" style={LINE_GROUP}>
                  <label className="input-label" style={LINE_LABEL}>Planned Start *</label>
                  <input
                    type="date"
                    className="input-field"
                    required
                    value={row.Planned_Start_Date}
                    onChange={(e) => updateLineItem(index, 'Planned_Start_Date', e.target.value)}
                  />
                </div>

                {/* End Date */}
                <div className="input-group" style={LINE_GROUP}>
                  <label className="input-label" style={LINE_LABEL}>Planned End *</label>
                  <input
                    type="date"
                    className="input-field"
                    required
                    value={row.Planned_End_Date}
                    onChange={(e) => updateLineItem(index, 'Planned_End_Date', e.target.value)}
                  />
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => removeLineItem(index)}
                  title="Remove this line"
                  disabled={details.length === 1}
                  style={{
                    height: 32,
                    width: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    background: 'none',
                    color: '#ef4444',
                    cursor: details.length === 1 ? 'not-allowed' : 'pointer',
                    opacity: details.length === 1 ? 0.35 : 1,
                    padding: 0
                  }}
                >
                  <XCircle size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Live Calculation Preview Banner */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#fb7185" />
            <span style={{ fontSize: '12px', color: '#e2e8f0' }}>
              Planned Total: <strong>{fmtQty(totalQty)} units</strong> across <strong>{details.length} part line(s)</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px' }}>
            <span style={{ color: '#94a3b8' }}>
              Est. Press Load: <strong style={{ color: '#38bdf8' }}>{estPressHours} hrs</strong>
            </span>
            <span style={{ color: '#94a3b8' }}>
              Initial Status: <strong style={{ color: '#fbbf24' }}>Draft (Pending Capacity Check)</strong>
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '16px'
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
            disabled={busy || totalQty <= 0}
            style={{
              backgroundColor: '#e11d48',
              borderColor: '#e11d48',
              padding: '8px 18px',
              fontWeight: 600
            }}
          >
            {busy ? 'Saving Master Plan…' : 'Create Production Plan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PlanCreateModal;
