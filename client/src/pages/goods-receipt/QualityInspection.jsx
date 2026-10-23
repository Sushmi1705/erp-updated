import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { notify } from '../../utils/notify';
import InspectionHeaderBar from './inspection/InspectionHeaderBar';
import InspectionWorkbench from './inspection/InspectionWorkbench';
import InspectionRegisterLedger from './inspection/InspectionRegisterLedger';
import InspectionNcrRunway from './inspection/InspectionNcrRunway';
import InspectionPrintModal from './inspection/InspectionPrintModal';

const QualityInspection = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState([]);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [activePerspective, setActivePerspective] = useState('Workbench'); // 'Workbench', 'Register', 'NCR'
  const [printModalItem, setPrintModalItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/receipt/inspection');
      const data = res.data.data || [];
      setInspections(data);

      // Preserve or set selected inspection
      if (data.length > 0) {
        setSelectedInspection(prev => {
          if (!prev) {
            // Default to first pending or first item
            const firstPending = data.find(i => i.inspectionStatus === 'Pending' || i.inspectionStatus === 'In-Progress');
            return firstPending || data[0];
          }
          const updated = data.find(i => i._id === prev._id);
          return updated || data[0];
        });
      } else {
        setSelectedInspection(null);
      }
    } catch (err) {
      console.error('Inspection fetch error', err);
      notify.error('Failed to load quality inspection queue.');
    }
    setLoading(false);
  };

  const handleSaveInspection = async (formData) => {
    if (saving || !formData?._id) return;

    const accepted = Number(formData.acceptedQuantity || 0);
    const rejected = Number(formData.rejectedQuantity || 0);
    const hold = Number(formData.holdQuantity || 0);
    const lotSize = Number(formData.inspectedQuantity || 0);
    const total = accepted + rejected + hold;

    // Automotive RQA validation rule: If completed, totals must balance
    if (formData.inspectionStatus === 'Completed' && total !== lotSize) {
      notify.error(`Disposition total (${total}) does not match received lot size (${lotSize}). Accepted (${accepted}) + Rejected (${rejected}) + Hold (${hold}) must equal ${lotSize}.`);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        acceptedQuantity: accepted,
        rejectedQuantity: rejected,
        holdQuantity: hold,
        inspectorName: formData.inspectorName?.trim() || 'RQA Inspector 1',
        inspectionStatus: formData.inspectionStatus || 'Pending',
        defectCategory: formData.defectCategory || 'None',
        aqlStandard: formData.aqlStandard || 'MIL-STD-105E Level II (AQL 0.65)',
        sampleSize: Number(formData.sampleSize) || Math.min(125, lotSize),
        remarks: formData.remarks?.trim() || ''
      };

      const res = await axios.put(`/receipt/inspection/${formData._id}`, payload);
      notify.success(`Inspection ${formData.inspectionNumber || ''} updated successfully.`);
      
      // Update local state smoothly
      const updatedItem = res.data.data;
      setInspections(prev => prev.map(item => item._id === formData._id ? updatedItem : item));
      setSelectedInspection(updatedItem);

      // Re-fetch to ensure all populated fields remain up to date
      fetchData();
    } catch (err) {
      console.error('Inspection update error', err);
      notify.error(err.response?.data?.message || 'Could not update inspection disposition.');
    }
    setSaving(false);
  };

  const handleOpenPrintModal = (item) => {
    const target = item || selectedInspection || (inspections.length > 0 ? inspections[0] : null);
    if (!target) {
      notify.error('No inspection record available to generate release certificate.');
      return;
    }
    setPrintModalItem(target);
  };

  const handleNavigateToStock = () => {
    navigate('/receipt/stock');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '100%',
      backgroundColor: 'transparent'
    }}>
      {/* ── Top Executive Header Bar with Metrics & Perspective Switcher ─── */}
      <InspectionHeaderBar
        inspections={inspections}
        activePerspective={activePerspective}
        setActivePerspective={setActivePerspective}
        onOpenPrintModal={() => handleOpenPrintModal(selectedInspection)}
        onRefresh={fetchData}
        loading={loading}
      />

      {/* ── Main Perspective Content ─── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {activePerspective === 'Workbench' && (
          <InspectionWorkbench
            inspections={inspections}
            selectedInspection={selectedInspection}
            onSelectInspection={setSelectedInspection}
            onSaveInspection={handleSaveInspection}
            onOpenPrintModal={handleOpenPrintModal}
            onNavigateToStock={handleNavigateToStock}
            saving={saving}
          />
        )}

        {activePerspective === 'Register' && (
          <InspectionRegisterLedger
            inspections={inspections}
            onSelectInspection={(item) => {
              setSelectedInspection(item);
              setActivePerspective('Workbench');
            }}
            onOpenWorkbench={() => setActivePerspective('Workbench')}
            onOpenPrintModal={handleOpenPrintModal}
          />
        )}

        {activePerspective === 'NCR' && (
          <InspectionNcrRunway
            inspections={inspections}
            onSelectInspection={(item) => {
              setSelectedInspection(item);
              setActivePerspective('Workbench');
            }}
            onOpenWorkbench={() => setActivePerspective('Workbench')}
            onOpenPrintModal={handleOpenPrintModal}
            onNavigateToStock={handleNavigateToStock}
          />
        )}
      </div>

      {/* ── Official Printable Material Release Certificate Modal ─── */}
      {printModalItem && (
        <InspectionPrintModal
          inspection={printModalItem}
          onClose={() => setPrintModalItem(null)}
        />
      )}
    </div>
  );
};

export default QualityInspection;
