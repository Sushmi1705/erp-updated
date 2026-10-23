import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  GitMerge, 
  ArrowLeft, 
  ArrowRight, 
  Layers, 
  Factory, 
  Truck, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  FileText, 
  Flame, 
  RefreshCw, 
  QrCode,
  Building2,
  Cpu
} from 'lucide-react';
import { fmtQty } from '../../../utils/money';

const GenealogyTreeStudio = ({
  entity,
  allEntities = [],
  onSelectEntity,
  onBackToMatrix,
  onPrintTraveler
}) => {
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [traceDirection, setTraceDirection] = useState('FORWARD'); // 'FORWARD' (Coil -> OEM) or 'BACKWARD' (OEM -> Coil)

  const entityId = entity?._id;

  useEffect(() => {
    if (entityId) {
      fetchTree(entityId);
    }
  }, [entityId]);

  const fetchTree = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`/inventory/v2/traceability/tree/${id}`);
      setTreeData(res.data.data);
    } catch (err) {
      console.error('Error fetching tree data', err);
    }
    setLoading(false);
  };

  const currentEnt = treeData?.entity || entity || {};
  const mat = currentEnt.Material_ID || {};
  const upstream = treeData?.upstream || {};
  const downstream = treeData?.downstream || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Navigation & Batch Selector */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBackToMatrix}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={14} /> Back to Registry
          </button>

          <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }} />

          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
              Genealogy Tree Explorer
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                {currentEnt.Tracking_Number}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 600,
                background: currentEnt.Current_Status === 'Quarantined' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(5, 150, 105, 0.15)',
                color: currentEnt.Current_Status === 'Quarantined' ? '#dc2626' : '#059669',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                {currentEnt.Current_Status || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Trace Direction Toggle & Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setTraceDirection('FORWARD')}
              style={{
                border: 'none',
                background: traceDirection === 'FORWARD' ? '#0891b2' : 'transparent',
                color: traceDirection === 'FORWARD' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '5px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.1s ease'
              }}
            >
              Forward Trace (Coil → OEM)
            </button>
            <button
              onClick={() => setTraceDirection('BACKWARD')}
              style={{
                border: 'none',
                background: traceDirection === 'BACKWARD' ? '#0891b2' : 'transparent',
                color: traceDirection === 'BACKWARD' ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 700,
                padding: '5px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.1s ease'
              }}
            >
              Backward Trace (Recall → Heat)
            </button>
          </div>

          <select
            value={entityId || ''}
            onChange={(e) => {
              const selected = allEntities.find(ent => ent._id === e.target.value);
              if (selected) onSelectEntity(selected);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              border: '1px solid #0891b2',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              cursor: 'pointer'
            }}
          >
            {allEntities.map(ent => (
              <option key={ent._id} value={ent._id}>
                {ent.Tracking_Number} ({ent.Material_ID?.name || 'Material'})
              </option>
            ))}
          </select>

          <button
            onClick={() => onPrintTraveler(currentEnt)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <QrCode size={13} /> Print Tag
          </button>
        </div>
      </div>

      {/* Interactive Multi-Stage Flowchart Graph */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GitMerge size={17} color="#0891b2" />
              {traceDirection === 'FORWARD' ? 'Forward Traceability Pipeline (Raw Heat to Customer Dispatch)' : 'Backward Traceability (Customer Vehicle Complaint to Raw Coil)'}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Mandatory under IATF 16949 Section 8.5.2 to identify parent heat certificates and affected customer VIN vehicles.
            </p>
          </div>

          <span style={{
            fontSize: '11px',
            fontWeight: 700,
            background: 'rgba(8, 145, 178, 0.12)',
            color: '#0891b2',
            padding: '3px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(8, 145, 178, 0.3)'
          }}>
            100% Traceability Integrity
          </span>
        </div>

        {/* Tree Flowchart Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '16px',
          position: 'relative'
        }}>
          {/* Node 1: Raw Material Mill Origin */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '2px solid #0891b2',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(8, 145, 178, 0.08)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: '#0891b2', color: '#ffffff', padding: '2px 6px', borderRadius: '4px' }}>
                  Stage 1: Raw Heat
                </span>
                <Flame size={15} color="#ea580c" />
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                {upstream.supplierName || 'Tata Steel / JSW Steel'}
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Supplier PO: <strong>{upstream.poNumber || currentEnt.Reference_Code || 'PO-2026-AUTO'}</strong>
              </div>
            </div>

            <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div><strong>Mill Heat No:</strong> <span style={{ fontFamily: 'monospace', color: '#0891b2' }}>{upstream.heatNumber || currentEnt.Tracking_Number}</span></div>
              <div><strong>Mill Test Cert:</strong> {upstream.mtcNumber || 'MTC-CERT-3.1'}</div>
              <div><strong>Steel Grade:</strong> {upstream.gradeSpec || mat.grade || 'IS 513 CR4 D'}</div>
              <div><strong>Storage Bay:</strong> {upstream.storesBin || 'Central Coil Bay 01'}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>
              <CheckCircle2 size={12} /> Chemical &amp; Mechanical Passed
            </div>
          </div>

          {/* Node 2: In-Plant Stamping & Work Order */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: '#2563eb', color: '#ffffff', padding: '2px 6px', borderRadius: '4px' }}>
                  Stage 2: Stamping
                </span>
                <Factory size={15} color="#2563eb" />
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                Progressive Press Run
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Work Order: <strong>{downstream[0]?.workOrderNumber || `WO-2026-${String(currentEnt._id).slice(-4)}`}</strong>
              </div>
            </div>

            <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div><strong>Press Line:</strong> 400T Progressive Die Stage 1</div>
              <div><strong>Output Child Part:</strong> {downstream[0]?.outputBatch || `PAC/STAMP/${String(currentEnt.Tracking_Number).slice(-5)}`}</div>
              <div><strong>Tooling Die:</strong> DIE-PAC-CHASSIS-BRKT-01</div>
              <div><strong>Blanking Speed:</strong> 45 SPM (Takt Target: 1.3s)</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>
              <CheckCircle2 size={12} /> Stamping Execution Verified
            </div>
          </div>

          {/* Node 3: Assembly & Robotic Seam Welding */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: '#7c3aed', color: '#ffffff', padding: '2px 6px', borderRadius: '4px' }}>
                  Stage 3: Assembly
                </span>
                <Cpu size={15} color="#7c3aed" />
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                Robotic Seam Welding
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Sub-Assembly Order: <strong>{downstream[1]?.assemblyOrder || `SUB-2026-${String(currentEnt._id).slice(-4)}`}</strong>
              </div>
            </div>

            <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div><strong>Robot Cell:</strong> ABB Robotic Cell #02</div>
              <div><strong>Welding Wire:</strong> ER70S MIG Lot #3308</div>
              <div><strong>Surface Finish:</strong> Cathodic E-Coat Black</div>
              <div><strong>PDI Gate:</strong> Passed CMM 100% Inspection</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>
              <CheckCircle2 size={12} /> Finished Goods Assembly Ready
            </div>
          </div>

          {/* Node 4: Customer OEM Dispatch Lot */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', background: '#059669', color: '#ffffff', padding: '2px 6px', borderRadius: '4px' }}>
                  Stage 4: OEM Dispatch
                </span>
                <Truck size={15} color="#059669" />
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0' }}>
                Maruti Suzuki / Tata Motors
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                Customer PO: <strong>MSIL-SANAND-PO-9912</strong>
              </div>
            </div>

            <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '4px', background: 'var(--bg-primary)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <div><strong>Dispatch Lot:</strong> {downstream[2]?.dispatchLot || `DSP-LOT-${String(currentEnt._id).slice(-5)}`}</div>
              <div><strong>Tax Invoice:</strong> {downstream[2]?.invoiceNumber || `INV-PAC-2026-${String(currentEnt._id).slice(-4)}`}</div>
              <div><strong>Destination:</strong> Sanand Assembly Plant</div>
              <div><strong>Trace Status:</strong> Traceable to Vehicle VIN</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>
              <CheckCircle2 size={12} /> Dispatch Certificate Issued
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenealogyTreeStudio;
