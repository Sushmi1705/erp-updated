import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
  Scale, BarChart3, AlertTriangle, Layers, 
  Settings, Activity, Plus, Printer, Download 
} from 'lucide-react';
import { notify } from '../../utils/notify';
import { useToast } from '../../components/common/Toast';
import OptimizationControlHeader from './optimization/OptimizationControlHeader';
import ReorderMatrixTable from './optimization/ReorderMatrixTable';
import AbcParetoDeck from './optimization/AbcParetoDeck';
import DeadStockRadar from './optimization/DeadStockRadar';
import ReorderProfileModal from './optimization/ReorderProfileModal';
import ReorderRulesModal from './optimization/ReorderRulesModal';
import ReorderPrintModal from './optimization/ReorderPrintModal';

const InventoryOptimization = () => {
  const { addToast } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [parameters, setParameters] = useState({
    ABC_Class_A_Percentage: 70,
    ABC_Class_B_Percentage: 20,
    ABC_Class_C_Percentage: 10,
    Dead_Stock_Threshold_Days: 180,
    Default_Service_Level_Percent: 95
  });
  const [runs, setRuns] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Active perspective: 'matrix' (Master Reorder Matrix), 'pareto' (ABC Pareto Deck), 'dormant' (Dead Stock Radar)
  const [activePerspective, setActivePerspective] = useState('matrix');

  // Modal States
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfileRow, setSelectedProfileRow] = useState(null);
  const [isParamModalOpen, setIsParamModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);

  const fetchDependencies = async () => {
    try {
      const matRes = await axios.get('/master/material');
      setMaterials(matRes.data.data.filter(m => m.isActive !== false && m.status !== 'Inactive'));
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/inventory/v2/optimization');
      const data = res.data.data || {};
      setProfiles(data.profiles || []);
      if (data.parameters) setParameters(data.parameters);
      setRuns(data.runs || []);
    } catch (err) {
      console.error('Optimization fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Global ABC Analysis Run
  const handleRunAnalysis = async () => {
    if (analyzing) return;
    setAnalyzing(true);
    try {
      await axios.post('/inventory/v2/optimization/analyze');
      await fetchData();
      addToast({
        type: 'success',
        title: 'Analysis Completed',
        message: 'All plant materials classified into ABC classes and scanned for slow-moving risk.'
      });
    } catch (err) {
      console.error('Run analysis error:', err);
      notify.error(err.response?.data?.message || 'Could not complete analysis run.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Open Edit Profile Modal
  const handleOpenProfileModal = (row = null) => {
    setSelectedProfileRow(row);
    setIsProfileModalOpen(true);
  };

  // Summary Metrics Calculation
  const summaryStats = useMemo(() => {
    let reorderTriggerCount = 0;
    let safetyBreachCount = 0;
    let classACount = 0;
    let classBCount = 0;
    let classCCount = 0;
    let deadStockCount = 0;
    let manualOverrideCount = 0;
    let totalValuation = 0;

    profiles.forEach(p => {
      totalValuation += (p.valuation || 0);
      if (p.isReorderTriggered) reorderTriggerCount += 1;
      if (p.isSafetyBreached) safetyBreachCount += 1;
      if (p.ABC_Class === 'A') classACount += 1;
      else if (p.ABC_Class === 'B') classBCount += 1;
      else classCCount += 1;

      if (p.Dead_Stock_Risk === 'Dead' || p.Dead_Stock_Risk === 'High Risk') {
        deadStockCount += 1;
      }
      if (p.Is_Manual_Override) manualOverrideCount += 1;
    });

    return {
      totalCount: profiles.length,
      reorderTriggerCount,
      safetyBreachCount,
      classACount,
      classBCount,
      classCCount,
      deadStockCount,
      manualOverrideCount,
      totalValuation
    };
  }, [profiles]);

  // CSV Export Handler
  const handleExportCsv = () => {
    if (!profiles.length) return;

    const headers = [
      'Material Name',
      'Part Code',
      'Category',
      'Free ATP',
      'Gross On Hand',
      'Reorder Level (ROP)',
      'Safety Stock Buffer',
      'UOM',
      'ABC Classification',
      'Movement Velocity',
      'Set by Hand (Manual)',
      'Standard Cost (INR)',
      'Valuation (INR)'
    ];

    const rows = profiles.map(p => {
      const mat = p.Material_ID || {};
      return [
        `"${(mat.name || '').replace(/"/g, '""')}"`,
        `"${mat.code || ''}"`,
        `"${p.categoryName || 'Raw Material'}"`,
        p.atp || 0,
        p.onHand || 0,
        p.Reorder_Level || 0,
        p.Safety_Stock || 0,
        p.uom || 'KG',
        `Class ${p.ABC_Class || 'C'}`,
        p.Dead_Stock_Risk || 'Low Risk',
        p.Is_Manual_Override ? 'Yes' : 'No',
        p.standardCost || 0,
        p.valuation || 0
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reorder_Levels_Policy_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100%', boxSizing: 'border-box' }}>
      {/* Optimization Control Header & Gauges */}
      <OptimizationControlHeader
        activePerspective={activePerspective}
        setActivePerspective={setActivePerspective}
        summaryStats={summaryStats}
        onRunAnalysis={handleRunAnalysis}
        analyzing={analyzing}
        onOpenParamModal={() => setIsParamModalOpen(true)}
        onOpenProfileModal={() => handleOpenProfileModal(null)}
        onOpenPrintModal={() => setIsPrintModalOpen(true)}
        onExportCsv={handleExportCsv}
        parameters={parameters}
        lastRunInfo={runs.length > 0 ? runs[0] : null}
      />

      {/* Perspective View 1: Master Reorder Matrix */}
      {activePerspective === 'matrix' && (
        <ReorderMatrixTable
          profiles={profiles}
          loading={loading}
          onOpenProfileModal={handleOpenProfileModal}
          onOpenParamModal={() => setIsParamModalOpen(true)}
        />
      )}

      {/* Perspective View 2: ABC Pareto Capital Deck */}
      {activePerspective === 'pareto' && (
        <AbcParetoDeck
          profiles={profiles}
          parameters={parameters}
          onOpenParamModal={() => setIsParamModalOpen(true)}
        />
      )}

      {/* Perspective View 3: Dormant & Dead Stock Radar */}
      {activePerspective === 'dormant' && (
        <DeadStockRadar
          profiles={profiles}
          parameters={parameters}
          onOpenProfileModal={handleOpenProfileModal}
        />
      )}

      {/* Material Reorder Level Modal */}
      <ReorderProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        preselectedRow={selectedProfileRow}
        materials={materials}
        onSuccess={fetchData}
      />

      {/* Global Optimization Rules Modal */}
      <ReorderRulesModal
        isOpen={isParamModalOpen}
        onClose={() => setIsParamModalOpen(false)}
        parameters={parameters}
        onSuccess={fetchData}
      />

      {/* Printable IATF 16949 Policy Certificate Modal */}
      <ReorderPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        profiles={profiles}
        parameters={parameters}
        summaryStats={summaryStats}
      />
    </div>
  );
};

export default InventoryOptimization;