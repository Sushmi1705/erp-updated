import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { notify } from '../../utils/notify';
import StockHeaderTerminal from './stock/StockHeaderTerminal';
import StockBinLedger from './stock/StockBinLedger';
import StockStagingDockRunway from './stock/StockStagingDockRunway';
import StockWarehouseMap from './stock/StockWarehouseMap';
import StockPutAwayModal from './stock/StockPutAwayModal';
import StockBinLabelModal from './stock/StockBinLabelModal';

const InventoryPosting = () => {
  const location = useLocation();
  const [stocks, setStocks] = useState([]);
  const [completedInspections, setCompletedInspections] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Active Perspective: 'Ledger', 'Staging', 'Warehouses'
  const [activePerspective, setActivePerspective] = useState('Ledger');

  // Modals state
  const [isPutAwayOpen, setIsPutAwayOpen] = useState(false);
  const [preselectedLot, setPreselectedLot] = useState(null);
  const [selectedLabelStock, setSelectedLabelStock] = useState(null);

  // Warehouse filter for ledger
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState('All');

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);

  // Check if routed from inspection with a lot to put away
  useEffect(() => {
    if (location.state?.inspectionId && completedInspections.length > 0) {
      const match = completedInspections.find(i => i._id === location.state.inspectionId);
      if (match) {
        setPreselectedLot(match);
        setIsPutAwayOpen(true);
      }
    }
  }, [location.state, completedInspections]);

  const fetchDependencies = async () => {
    try {
      // 1. Warehouses
      const whRes = await axios.get('/company/warehouses').catch(() => ({ data: { data: [] } }));
      const whList = whRes.data?.data || [];
      const activeWh = whList.filter(w => w.isActive !== false && w.status !== 'Inactive');
      setWarehouses(activeWh.length > 0 ? activeWh : whList);

      // 2. Completed Inspections (Passed lots waiting for put-away)
      const inspRes = await axios.get('/receipt/inspection').catch(() => ({ data: { data: [] } }));
      const list = inspRes.data?.data || [];
      const completed = list.filter(i => {
        const isApproved = ['Completed', 'Passed', 'Approved'].includes(i.inspectionStatus) || (i.acceptedQuantity > 0);
        const isNotPosted = i.grnId?.status !== 'Posted';
        return isApproved && isNotPosted;
      });
      setCompletedInspections(completed.length > 0 ? completed : []);
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/receipt/inventory');
      setStocks(res.data.data || []);
    } catch (err) {
      console.error('Inventory fetch error', err);
      notify.error('Failed to load inventory stock ledger.');
    }
    setLoading(false);
  };

  const handleSavePutAway = async (payload) => {
    if (saving) return;
    setSaving(true);
    try {
      await axios.post('/receipt/inventory/post', payload);
      notify.success('Material successfully booked into warehouse inventory and batch number generated.');
      setIsPutAwayOpen(false);
      setPreselectedLot(null);
      await fetchData();
      await fetchDependencies();
    } catch (err) {
      console.error('Inventory post error', err);
      notify.error(err.response?.data?.message || 'Could not move this stock into the store. Please try again.');
    }
    setSaving(false);
  };

  const handleOpenPutAwayModal = (lot = null) => {
    setPreselectedLot(lot || null);
    setIsPutAwayOpen(true);
  };

  const handleOpenLabelModal = (stock = null) => {
    const target = stock || (stocks.length > 0 ? stocks[0] : null);
    if (!target) {
      notify.error('No inventory batch available to generate bin tag.');
      return;
    }
    setSelectedLabelStock(target);
  };

  const handleWarehouseFilterFromMap = (whId) => {
    setSelectedWarehouseFilter(whId);
    setActivePerspective('Ledger');
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      minHeight: '100%',
      backgroundColor: 'transparent'
    }}>
      {/* ── Top Executive Header Terminal ───────────────────────────── */}
      <StockHeaderTerminal
        stocks={stocks}
        stagingQueue={completedInspections}
        activePerspective={activePerspective}
        setActivePerspective={setActivePerspective}
        onOpenPutAwayModal={() => handleOpenPutAwayModal()}
        onOpenLabelModal={handleOpenLabelModal}
        onRefresh={() => {
          fetchData();
          fetchDependencies();
        }}
        loading={loading}
      />

      {/* ── Main Perspective View ───────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {activePerspective === 'Ledger' && (
          <StockBinLedger
            stocks={stocks}
            warehouses={warehouses}
            onOpenLabelModal={handleOpenLabelModal}
            onOpenPutAwayModal={() => handleOpenPutAwayModal()}
          />
        )}

        {activePerspective === 'Staging' && (
          <StockStagingDockRunway
            stagingQueue={completedInspections}
            onSelectLotForPutAway={(lot) => handleOpenPutAwayModal(lot)}
            onNavigateToInspection={() => {}}
          />
        )}

        {activePerspective === 'Warehouses' && (
          <StockWarehouseMap
            stocks={stocks}
            warehouses={warehouses}
            onSelectWarehouseFilter={handleWarehouseFilterFromMap}
          />
        )}
      </div>

      {/* ── Interactive Put-Away Induction Modal ─────────────────────── */}
      {isPutAwayOpen && (
        <StockPutAwayModal
          isOpen={isPutAwayOpen}
          onClose={() => {
            setIsPutAwayOpen(false);
            setPreselectedLot(null);
          }}
          completedInspections={completedInspections}
          warehouses={warehouses}
          preselectedLot={preselectedLot}
          onSave={handleSavePutAway}
          saving={saving}
        />
      )}

      {/* ── Printable Pallet / Bin Barcode Tag Modal ─────────────────── */}
      {selectedLabelStock && (
        <StockBinLabelModal
          stockItem={selectedLabelStock}
          onClose={() => setSelectedLabelStock(null)}
        />
      )}
    </div>
  );
};

export default InventoryPosting;