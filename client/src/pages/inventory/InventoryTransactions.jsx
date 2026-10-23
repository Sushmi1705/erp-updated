import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import MovementControlHeader from './movements/MovementControlHeader';
import MovementLedgerTable from './movements/MovementLedgerTable';
import MovementModal from './movements/MovementModal';
import MovementVoucherModal from './movements/MovementVoucherModal';

const InventoryTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Category Filter: 'ALL', 'Material Issue', 'Transfer', 'Return', 'Adjustment'
  const [activeType, setActiveType] = useState('ALL');

  // Modal States
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedVoucherTxn, setSelectedVoucherTxn] = useState(null);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);

  const fetchDependencies = async () => {
    try {
      const matRes = await axios.get('/master/material');
      setMaterials(matRes.data.data.filter(m => m.isActive !== false && m.status !== 'Inactive'));
      const whRes = await axios.get('/company/warehouses');
      setWarehouses(whRes.data.data.filter(w => w.isActive !== false && w.status !== 'Inactive'));
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('/inventory/v2/transactions');
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error('Transactions fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Summary Metrics Calculation
  const summaryStats = useMemo(() => {
    let issueCount = 0;
    let issueQuantity = 0;
    let transferCount = 0;
    let transferQuantity = 0;
    let returnCount = 0;
    let returnQuantity = 0;
    let adjustmentCount = 0;
    let totalValuation = 0;

    transactions.forEach(t => {
      const tQty = t.totalQuantity || (t.lines ? t.lines.reduce((s, l) => s + (l.Quantity || 0), 0) : 0);
      const tVal = t.totalValuation || 0;
      totalValuation += tVal;

      if (t.Txn_Type === 'Material Issue') {
        issueCount += 1;
        issueQuantity += tQty;
      } else if (t.Txn_Type === 'Transfer') {
        transferCount += 1;
        transferQuantity += tQty;
      } else if (t.Txn_Type === 'Return') {
        returnCount += 1;
        returnQuantity += tQty;
      } else if (t.Txn_Type === 'Adjustment') {
        adjustmentCount += 1;
      }
    });

    return {
      totalCount: transactions.length,
      issueCount,
      issueQuantity,
      transferCount,
      transferQuantity,
      returnCount,
      returnQuantity,
      adjustmentCount,
      totalValuation
    };
  }, [transactions]);

  // Open Voucher / MIN Modal Handler
  const handleOpenVoucher = (txn) => {
    setSelectedVoucherTxn(txn);
    setIsVoucherModalOpen(true);
  };

  // CSV Export Handler
  const handleExportCsv = () => {
    if (!transactions.length) return;

    const headers = [
      'Movement Number',
      'Date & Time',
      'Movement Type',
      'Reference Document Type',
      'Reference Document Number',
      'Status',
      'Total Lines',
      'Total Quantity',
      'Valuation (INR)'
    ];

    const rows = transactions.map(t => [
      `"${t.Txn_Number || ''}"`,
      `"${new Date(t.Txn_Date || t.createdAt).toLocaleString('en-IN')}"`,
      `"${t.Txn_Type || ''}"`,
      `"${t.Ref_Doc_Type || 'None'}"`,
      `"${t.Ref_Doc_Number || ''}"`,
      `"${t.Status || 'Executed'}"`,
      t.Total_Lines || t.lines?.length || 1,
      t.totalQuantity || 0,
      t.totalValuation || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Stock_Movements_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100%', boxSizing: 'border-box' }}>
      {/* Velocity Header & Category Selector */}
      <MovementControlHeader
        activeType={activeType}
        setActiveType={setActiveType}
        summaryStats={summaryStats}
        onRefresh={fetchData}
        loading={loading}
        onOpenRecordModal={() => setIsRecordModalOpen(true)}
        onExportCsv={handleExportCsv}
      />

      {/* Main Stock Movements Ledger Table with zero double scrollbars */}
      <MovementLedgerTable
        transactions={transactions}
        loading={loading}
        activeType={activeType}
        onOpenVoucherModal={handleOpenVoucher}
      />

      {/* Record Stock Movement Modal */}
      <MovementModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        materials={materials}
        warehouses={warehouses}
        onSuccess={fetchData}
      />

      {/* Printable Material Issue Note (MIN) / Gate Pass Voucher Modal */}
      <MovementVoucherModal
        isOpen={isVoucherModalOpen}
        onClose={() => setIsVoucherModalOpen(false)}
        transaction={selectedVoucherTxn}
      />
    </div>
  );
};

export default InventoryTransactions;