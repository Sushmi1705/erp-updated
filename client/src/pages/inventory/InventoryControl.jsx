import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { 
  Table, ShieldAlert, Layers, MapPin, 
  BarChart3, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import StockControlHeader from './control/StockControlHeader';
import StockAtpMatrix from './control/StockAtpMatrix';
import StockShortageWatch from './control/StockShortageWatch';
import StockWarehouseView from './control/StockWarehouseView';
import StockAdjustModal from './control/StockAdjustModal';
import StockAuditPrintModal from './control/StockAuditPrintModal';

const InventoryControl = () => {
  // Category Tab: RAW_MATERIAL, WIP, FINISHED_GOOD, SPARE_PART
  const [activeTab, setActiveTab] = useState('RAW_MATERIAL');
  // Sub-perspective view: 'matrix' (Master Register), 'shortages' (Shortage Watch), 'warehouses' (Warehouse Bays)
  const [activePerspective, setActivePerspective] = useState('matrix');
  
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals state
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [selectedAdjustItem, setSelectedAdjustItem] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Friendly label map
  const tabLabelMap = {
    'RAW_MATERIAL': 'Raw Materials',
    'WIP': 'Half-Made Parts (WIP)',
    'FINISHED_GOOD': 'Finished Goods',
    'SPARE_PART': 'Spare Parts & Tooling'
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/inventory/control?type=${activeTab}`);
      setInventoryData(res.data.data || []);
    } catch (err) {
      console.error('Inventory control fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dynamic summary KPI calculation
  const summaryStats = useMemo(() => {
    let totalOnHand = 0;
    let totalAllocated = 0;
    let totalAtp = 0;
    let totalValuation = 0;
    let shortageCount = 0;

    inventoryData.forEach(item => {
      totalOnHand += (item.Total_On_Hand || 0);
      totalAllocated += (item.Total_Allocated || 0);
      totalAtp += (item.Available_to_Promise || 0);
      totalValuation += (item.valuation || 0);
      if (item.Exception_Flag === true || item.stockHealth === 'SAFETY_BREACH' || item.stockHealth === 'CRITICAL_OUT') {
        shortageCount += 1;
      }
    });

    return {
      totalItems: inventoryData.length,
      totalOnHand,
      totalAllocated,
      totalAtp,
      totalValuation,
      shortageCount
    };
  }, [inventoryData]);

  // Quick Physical Count Adjust Handler
  const handleOpenAdjustModal = (item = null) => {
    setSelectedAdjustItem(item);
    setAdjustModalOpen(true);
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    if (!inventoryData.length) return;

    const headers = [
      'Item Name',
      'Item Code',
      'Specification / Grade',
      'Category',
      'Store Location',
      'Physical On Hand',
      'Allocated Orders',
      'Free ATP',
      'Safety Stock',
      'UOM',
      'Standard Cost (INR)',
      'Total Valuation (INR)',
      'Status'
    ];

    const rows = inventoryData.map(item => [
      `"${(item.Product_Name || '').replace(/"/g, '""')}"`,
      `"${item.Product_Code || ''}"`,
      `"${item.grade || ''}"`,
      `"${tabLabelMap[activeTab] || activeTab}"`,
      `"${(item.Warehouse || '').replace(/"/g, '""')}"`,
      item.Total_On_Hand || 0,
      item.Total_Allocated || 0,
      item.Available_to_Promise || 0,
      item.Safety_Stock_Level || 0,
      item.uom || 'KG',
      item.standardCost || 0,
      item.valuation || 0,
      item.Exception_Flag ? 'Shortage Alert' : 'Active Buffer'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_ATP_${activeTab}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100%', boxSizing: 'border-box' }}>
      {/* Flight Deck Header & KPI Ribbon */}
      <StockControlHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        summaryStats={summaryStats}
        onRefresh={fetchData}
        loading={loading}
        onOpenAdjustModal={() => handleOpenAdjustModal(null)}
        onOpenPrintModal={() => setPrintModalOpen(true)}
        onExportCsv={handleExportCsv}
      />

      {/* Perspective View Switcher Tabs */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '14px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '10px'
        }}
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActivePerspective('matrix')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: activePerspective === 'matrix' ? '1px solid #059669' : '1px solid var(--border-color)',
              backgroundColor: activePerspective === 'matrix' ? 'rgba(5, 150, 105, 0.1)' : 'var(--bg-primary)',
              color: activePerspective === 'matrix' ? '#065f46' : 'var(--text-secondary)',
              fontWeight: activePerspective === 'matrix' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Table size={15} />
            <span>Master ATP Register</span>
            <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontWeight: 600 }}>
              {inventoryData.length}
            </span>
          </button>

          <button
            onClick={() => setActivePerspective('shortages')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: activePerspective === 'shortages' ? '1px solid #e11d48' : '1px solid var(--border-color)',
              backgroundColor: activePerspective === 'shortages' ? '#fff1f2' : 'var(--bg-primary)',
              color: activePerspective === 'shortages' ? '#be123c' : 'var(--text-secondary)',
              fontWeight: activePerspective === 'shortages' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <ShieldAlert size={15} color={summaryStats.shortageCount > 0 ? '#e11d48' : 'var(--text-secondary)'} />
            <span>Buffer Shortage Radar</span>
            {summaryStats.shortageCount > 0 ? (
              <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', background: '#ffe4e6', color: '#be123c', fontWeight: 700 }}>
                {summaryStats.shortageCount} Alert{summaryStats.shortageCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span style={{ fontSize: '11px', padding: '1px 6px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', fontWeight: 600 }}>
                0
              </span>
            )}
          </button>

          <button
            onClick={() => setActivePerspective('warehouses')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: activePerspective === 'warehouses' ? '1px solid #059669' : '1px solid var(--border-color)',
              backgroundColor: activePerspective === 'warehouses' ? 'rgba(5, 150, 105, 0.1)' : 'var(--bg-primary)',
              color: activePerspective === 'warehouses' ? '#065f46' : 'var(--text-secondary)',
              fontWeight: activePerspective === 'warehouses' ? 700 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <MapPin size={15} />
            <span>Warehouse Bay Allocation</span>
          </button>
        </div>

        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Active View: <strong>{tabLabelMap[activeTab]}</strong>
        </div>
      </div>

      {/* Primary Perspective View Body */}
      {activePerspective === 'matrix' && (
        <StockAtpMatrix
          inventoryData={inventoryData}
          loading={loading}
          onOpenAdjustModal={handleOpenAdjustModal}
          activeTabLabel={tabLabelMap[activeTab]}
        />
      )}

      {activePerspective === 'shortages' && (
        <StockShortageWatch
          inventoryData={inventoryData}
          onOpenAdjustModal={handleOpenAdjustModal}
          activeTabLabel={tabLabelMap[activeTab]}
        />
      )}

      {activePerspective === 'warehouses' && (
        <StockWarehouseView
          inventoryData={inventoryData}
          onOpenAdjustModal={handleOpenAdjustModal}
          activeTabLabel={tabLabelMap[activeTab]}
        />
      )}

      {/* Cycle Count Physical Stock Adjustment Modal */}
      <StockAdjustModal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        preselectedItem={selectedAdjustItem}
        inventoryData={inventoryData}
        onSuccess={fetchData}
      />

      {/* Printable IATF 16949 Physical Stock Audit Sheet Modal */}
      <StockAuditPrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        inventoryData={inventoryData}
        activeTabLabel={tabLabelMap[activeTab]}
        summaryStats={summaryStats}
      />
    </div>
  );
};

export default InventoryControl;
