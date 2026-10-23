import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { notify } from '../../utils/notify';
import ValuationControlHeader from './valuation/ValuationControlHeader';
import ValuationMatrixTable from './valuation/ValuationMatrixTable';
import FifoLayerInspector from './valuation/FifoLayerInspector';
import CategoryAssetDeck from './valuation/CategoryAssetDeck';
import ValuationRunHistoryDeck from './valuation/ValuationRunHistoryDeck';
import ValuationMethodModal from './valuation/ValuationMethodModal';
import ValuationCertificateModal from './valuation/ValuationCertificateModal';

const InventoryValuation = () => {
  const [valuations, setValuations] = useState([]);
  const [summary, setSummary] = useState({});
  const [categories, setCategories] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Active perspective: 'matrix' | 'layers' | 'categories' | 'runs'
  const [activeTab, setActiveTab] = useState('matrix');

  // Selected material for FIFO layer drilldown
  const [selectedMaterialForLayers, setSelectedMaterialForLayers] = useState(null);

  // Modals state
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  const [selectedProfileForMethod, setSelectedProfileForMethod] = useState(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/inventory/v2/valuation');
      const data = res.data?.data || {};
      const fetchedProfiles = data.profiles || [];
      setValuations(fetchedProfiles);
      setSummary(data.summary || {});
      setCategories(data.categories || []);
      setRuns(data.runs || []);

      // If no material selected for layer drilldown, default to first item
      if (fetchedProfiles.length > 0 && !selectedMaterialForLayers) {
        setSelectedMaterialForLayers(fetchedProfiles[0]);
      }
    } catch (err) {
      console.error('Valuation fetch error', err);
      notify.error('Could not load inventory valuation data.');
    }
    setLoading(false);
  };

  const handleCalculate = async () => {
    setCalculating(true);
    try {
      const res = await axios.post('/inventory/v2/valuation/calculate');
      await fetchData();
      notify.success(res.data?.message || 'Stock values recalculated successfully from all receipts and issues.');
    } catch (err) {
      console.error('Valuation calculation error', err);
      notify.error('Could not work out the stock values. Please try again.');
    }
    setCalculating(false);
  };

  const handleInspectLayers = (profile) => {
    setSelectedMaterialForLayers(profile);
    setActiveTab('layers');
  };

  const handleOpenMethodModal = (profile) => {
    setSelectedProfileForMethod(profile);
    setIsMethodModalOpen(true);
  };

  const handleSaveMethod = async (payload) => {
    setSavingPolicy(true);
    try {
      await axios.post('/inventory/v2/valuation/method', payload);
      await fetchData();
      setIsMethodModalOpen(false);
      notify.success('Valuation policy updated successfully.');
    } catch (err) {
      console.error('Error saving valuation method', err);
      notify.error(err.response?.data?.message || 'Could not update valuation method.');
    }
    setSavingPolicy(false);
  };

  const handleExportCsv = () => {
    if (!valuations.length) {
      notify.warning('No valuation data available to export.');
      return;
    }

    const headers = [
      'Material Code',
      'Material Name',
      'Category',
      'Grade',
      'UOM',
      'Stores On Hand',
      'Available Qty',
      'Costing Method',
      'Standard Cost Rate (INR)',
      'Standard Value Total (INR)',
      'FIFO Asset Total (INR)',
      'WAC Unit Rate (INR)',
      'WAC Value Total (INR)',
      'Active Valuation (INR)',
      'Cost Variance (INR)',
      'Variance Pct (%)'
    ];

    const rows = valuations.map(p => {
      const m = p.Material_ID || {};
      return [
        `"${m.code || ''}"`,
        `"${(m.name || '').replace(/"/g, '""')}"`,
        `"${p.categoryName || ''}"`,
        `"${p.grade || ''}"`,
        `"${p.uom || ''}"`,
        p.onHand || 0,
        p.available || 0,
        `"${p.Primary_Valuation_Method || 'FIFO'}"`,
        p.standardCost || 0,
        p.standardValue || 0,
        p.fifoValue || 0,
        p.wacUnit || 0,
        p.wacValue || 0,
        p.activeValuation || 0,
        p.costVariance || 0,
        p.costVariancePct || 0
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Valuation_Schedule_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify.success('Valuation schedule exported successfully.');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100%',
      padding: '4px 0 24px 0'
    }}>
      {/* Executive Command Header & Telemetry HUD */}
      <ValuationControlHeader
        summary={summary}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onCalculate={handleCalculate}
        calculating={calculating}
        onExportCsv={handleExportCsv}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        selectedMaterialForLayers={selectedMaterialForLayers?.Material_ID}
      />

      {/* Perspective Views Switcher */}
      {activeTab === 'matrix' && (
        <ValuationMatrixTable
          profiles={valuations}
          loading={loading}
          onInspectLayers={handleInspectLayers}
          onEditPolicy={handleOpenMethodModal}
          onCalculate={handleCalculate}
        />
      )}

      {activeTab === 'layers' && (
        <FifoLayerInspector
          material={selectedMaterialForLayers}
          allProfiles={valuations}
          onSelectMaterial={(selected) => setSelectedMaterialForLayers(selected)}
          onBackToMatrix={() => setActiveTab('matrix')}
        />
      )}

      {activeTab === 'categories' && (
        <CategoryAssetDeck
          categories={categories}
          profiles={valuations}
          totalValuation={summary.Total_FIFO_Valuation || summary.Total_Active_Valuation || 0}
          onInspectMaterial={(profile) => {
            handleInspectLayers(profile);
          }}
        />
      )}

      {activeTab === 'runs' && (
        <ValuationRunHistoryDeck
          runs={runs}
          onTriggerRun={handleCalculate}
          calculating={calculating}
        />
      )}

      {/* Valuation Method & Standard Cost Configuration Modal */}
      <ValuationMethodModal
        isOpen={isMethodModalOpen}
        onClose={() => setIsMethodModalOpen(false)}
        profile={selectedProfileForMethod}
        onSave={handleSaveMethod}
        saving={savingPolicy}
      />

      {/* Official Ind AS 2 / IATF 16949 Printable Certificate Modal */}
      <ValuationCertificateModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        summary={summary}
        categories={categories}
        profiles={valuations}
      />
    </div>
  );
};

export default InventoryValuation;
