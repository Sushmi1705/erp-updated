import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { notify } from '../../utils/notify';

// Specialized Light-Mode Subcomponents
import RFQHeaderBar from './rfq/RFQHeaderBar';
import RFQComparativeStudio from './rfq/RFQComparativeStudio';
import RFQLedger from './rfq/RFQLedger';
import RFQPipelineBoard from './rfq/RFQPipelineBoard';
import RFQCreateModal from './rfq/RFQCreateModal';
import RFQPrintModal from './rfq/RFQPrintModal';

const RFQManagement = () => {
  // Navigation & Perspective State: 'Studio' (default), 'Ledger', 'Pipeline'
  const [activePerspective, setActivePerspective] = useState('Studio');

  // Data States
  const [rfqs, setRfqs] = useState([]);
  const [requisitions, setRequisitions] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    sourcingType: 'Standard RFQ'
  });

  // Action Guards
  const [savingRfq, setSavingRfq] = useState(false);
  const [savingQuote, setSavingQuote] = useState(false);
  const [awardingBidId, setAwardingBidId] = useState(null);

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);

  const fetchDependencies = async () => {
    try {
      const [matRes, reqRes, venRes] = await Promise.all([
        axios.get('/master/material').catch(() => ({ data: { data: [] } })),
        axios.get('/procurement/requisition').catch(() => ({ data: { data: [] } })),
        axios.get('/master/vendor').catch(() => ({ data: { data: [] } }))
      ]);

      setMaterials(matRes.data?.data?.filter(m => m.isActive !== false && m.status !== 'Inactive') || []);
      setRequisitions(reqRes.data?.data?.filter(r => r.status === 'Approved') || []);
      setVendors(venRes.data?.data?.filter(v => v.isActive !== false && v.status !== 'Inactive') || []);
    } catch (err) {
      console.error('Dependencies fetch error:', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/procurement/rfq');
      const list = res.data?.data || [];
      setRfqs(list);
      
      // Keep selected RFQ in sync
      if (selectedRfq) {
        const found = list.find(r => r._id === selectedRfq._id);
        setSelectedRfq(found || list[0] || null);
      } else if (list.length > 0) {
        setSelectedRfq(list[0]);
      }
    } catch (err) {
      console.error('RFQ fetch error:', err);
      notify.error('Failed to load supplier price requests');
    } finally {
      setLoading(false);
    }
  };

  // Create new RFQ Tender
  const handleSaveRFQ = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (savingRfq) return;
    setSavingRfq(true);
    try {
      const res = await axios.post('/procurement/rfq', formData);
      notify.success('Tender published to suppliers successfully');
      setIsModalOpen(false);
      setFormData({ sourcingType: 'Standard RFQ' });
      await fetchData();
      if (res.data?.data) {
        setSelectedRfq(res.data.data);
        setActivePerspective('Studio');
      }
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not save price request');
    } finally {
      setSavingRfq(false);
    }
  };

  // Record a Supplier Quote
  const handleSaveQuote = async (quoteData) => {
    if (!selectedRfq) return;
    if (savingQuote) return;
    setSavingQuote(true);
    try {
      await axios.post(`/procurement/rfq/${selectedRfq._id}/quotation`, quoteData);
      notify.success('Supplier quote logged and auto-scored');
      await fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not save quote');
    } finally {
      setSavingQuote(false);
    }
  };

  // Award winning bid and auto-generate Purchase Order
  const handleSelectQuote = async (rfqId, quoteId) => {
    if (awardingBidId) return;
    setAwardingBidId(quoteId);
    try {
      const res = await axios.put(`/procurement/rfq/${rfqId}/quotation/${quoteId}/select`);
      notify.success(res.data?.message || 'Contract awarded! Purchase Order generated successfully.');
      await fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not award quote');
    } finally {
      setAwardingBidId(null);
    }
  };

  // Delete RFQ
  const handleDeleteRFQ = async (rfqId) => {
    if (!window.confirm('Are you sure you want to delete this price request?')) {
      return;
    }
    try {
      await axios.delete(`/procurement/rfq/${rfqId}`);
      notify.success('Price request deleted successfully');
      await fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not delete price request');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: '100%',
      padding: '16px 20px',
      overflowY: 'auto',
      backgroundColor: 'var(--bg-primary)'
    }}>
      {/* 1. Light-Mode Executive Header Bar */}
      <RFQHeaderBar
        rfqs={rfqs}
        activePerspective={activePerspective}
        setActivePerspective={setActivePerspective}
        onAddNew={() => {
          setFormData({ sourcingType: 'Standard RFQ' });
          setIsModalOpen(true);
        }}
        onPrintReport={() => setIsPrintModalOpen(true)}
        onRefresh={fetchData}
        loading={loading}
      />

      {/* 2. Main Content Perspective Display */}
      {activePerspective === 'Studio' && (
        <RFQComparativeStudio
          rfqs={rfqs}
          selectedRfq={selectedRfq}
          onSelectRfq={setSelectedRfq}
          onSaveQuote={handleSaveQuote}
          onSelectWinningQuote={handleSelectQuote}
          onAddNew={() => {
            setFormData({ sourcingType: 'Standard RFQ' });
            setIsModalOpen(true);
          }}
          onPrintReport={() => setIsPrintModalOpen(true)}
          onDeleteRfq={handleDeleteRFQ}
          vendors={vendors}
          awardingBidId={awardingBidId}
          savingQuote={savingQuote}
        />
      )}

      {activePerspective === 'Ledger' && (
        <RFQLedger
          rfqs={rfqs}
          onSelectRfq={setSelectedRfq}
          onOpenCompare={() => setActivePerspective('Studio')}
          onDeleteRfq={handleDeleteRFQ}
          onAddNew={() => {
            setFormData({ sourcingType: 'Standard RFQ' });
            setIsModalOpen(true);
          }}
        />
      )}

      {activePerspective === 'Pipeline' && (
        <RFQPipelineBoard
          rfqs={rfqs}
          onSelectRfq={setSelectedRfq}
          onOpenDeck={() => setActivePerspective('Studio')}
        />
      )}

      {/* 3. New RFQ Sourcing Modal */}
      <RFQCreateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSaveRFQ}
        saving={savingRfq}
        requisitions={requisitions}
        materials={materials}
        vendors={vendors}
      />

      {/* 4. Comparative Quotation Statement (CQS) Print Preview Modal */}
      <RFQPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        selectedRfq={selectedRfq}
      />
    </div>
  );
};

export default RFQManagement;