import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { notify } from '../../utils/notify';
import PerformanceHeaderBar from './performance/PerformanceHeaderBar';
import ScorecardStudio from './performance/ScorecardStudio';
import PerformanceLedger from './performance/PerformanceLedger';
import IncidentSimulatorLab from './performance/IncidentSimulatorLab';
import PerformancePrintModal from './performance/PerformancePrintModal';

const VendorPerformance = () => {
  const [scorecards, setScorecards] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePerspective, setActivePerspective] = useState('Studio'); // 'Studio', 'Ledger', 'Simulator'
  const [selectedScorecard, setSelectedScorecard] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTargetScorecard, setPrintTargetScorecard] = useState(null);

  // Firing indicator for mock events
  const [firing, setFiring] = useState(null);

  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, []);

  const fetchDependencies = async () => {
    try {
      const res = await axios.get('/master/vendor');
      const activeList = (res.data?.data || []).filter(v => v.isActive !== false && v.status !== 'Inactive');
      setVendors(activeList);
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/procurement/performance');
      const data = res.data?.data || [];
      setScorecards(data);
      
      // Update or preserve selectedScorecard
      if (selectedScorecard) {
        const updated = data.find(s => 
          (s.vendorId?._id || s.vendorId) === (selectedScorecard.vendorId?._id || selectedScorecard.vendorId)
        );
        if (updated) setSelectedScorecard(updated);
      } else if (data.length > 0) {
        setSelectedScorecard(data[0]);
      }
    } catch (err) {
      console.error('Performance fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const fireMockEvent = async (endpoint, payload) => {
    if (firing) return;
    setFiring(endpoint);
    try {
      const res = await axios.post(`/procurement/performance/${endpoint}`, payload);
      notify.success(res.data?.message || 'Event recorded and scorecard updated');
      await fetchData(); // Refresh scorecards and metrics
    } catch (err) {
      notify.error(err.response?.data?.message || 'Could not record event. Please try again.');
    } finally {
      setFiring(null);
    }
  };

  const handleOpenPrintModal = (scorecard = null) => {
    setPrintTargetScorecard(scorecard || selectedScorecard || scorecards[0]);
    setShowPrintModal(true);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
      padding: '4px',
      overflow: 'hidden'
    }}>
      {/* ── Executive Header Command Bar ────────────────────────────────────── */}
      <PerformanceHeaderBar
        scorecards={scorecards}
        activePerspective={activePerspective}
        setActivePerspective={setActivePerspective}
        onPrintAudit={() => handleOpenPrintModal(null)}
        onRefresh={fetchData}
        loading={loading}
      />

      {/* ── Active Perspective Workspace ────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {activePerspective === 'Studio' && (
          <ScorecardStudio
            scorecards={scorecards}
            selectedScorecard={selectedScorecard}
            onSelectScorecard={setSelectedScorecard}
            onFireMockEvent={fireMockEvent}
            onRefresh={fetchData}
            firing={firing}
          />
        )}

        {activePerspective === 'Ledger' && (
          <PerformanceLedger
            scorecards={scorecards}
            onSelectScorecard={setSelectedScorecard}
            onOpenStudio={() => setActivePerspective('Studio')}
            onOpenSimulator={() => setActivePerspective('Simulator')}
            onPrintAudit={(sc) => handleOpenPrintModal(sc)}
          />
        )}

        {activePerspective === 'Simulator' && (
          <IncidentSimulatorLab
            scorecards={scorecards}
            vendors={vendors}
            selectedScorecard={selectedScorecard}
            onSelectScorecard={setSelectedScorecard}
            onFireMockEvent={fireMockEvent}
            onRefresh={fetchData}
            firing={firing}
          />
        )}
      </div>

      {/* ── Official VDA 6.3 / IATF 16949 Audit Report Print Modal ──────────── */}
      {showPrintModal && (
        <PerformancePrintModal
          scorecard={printTargetScorecard || selectedScorecard || scorecards[0]}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
};

export default VendorPerformance;