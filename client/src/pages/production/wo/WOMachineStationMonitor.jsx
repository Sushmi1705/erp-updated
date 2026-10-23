import React from 'react';
import { 
  Gauge, 
  Cpu, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  User, 
  Thermometer, 
  Zap,
  Play
} from 'lucide-react';

const WOMachineStationMonitor = ({ workOrders = [], onUpdateProgress, onOpenTravelerModal }) => {
  // Map active running work orders to bays
  const activeWOs = workOrders.filter(w => ['In Progress', 'Released'].includes(w.Status));

  const stations = [
    {
      id: 'ST-01',
      name: '250T Heavy Stamping Press #01',
      model: 'Komatsu S2-250 Eccentric Mechanical Press',
      bay: 'Stamping Bay 01',
      status: 'RUNNING',
      operator: 'K. Murugan (Senior Press Setter)',
      spm: 28.5,
      pressure: '215 bar',
      temperature: '48°C',
      oee: '86.4%',
      assignedWo: activeWOs[0] || null
    },
    {
      id: 'ST-02',
      name: '150T Hydraulic Deep Draw Press #03',
      model: 'Aida HYD-150 Double Action Hydraulic',
      bay: 'Forming Bay 02',
      status: 'RUNNING',
      operator: 'R. Rajesh (Hydraulic Operator)',
      spm: 16.2,
      pressure: '185 bar',
      temperature: '52°C',
      oee: '81.9%',
      assignedWo: activeWOs[1] || null
    },
    {
      id: 'ST-03',
      name: 'ABB Robotic MIG Welding Cell #02',
      model: 'ABB IRB 2600 with Fronius TPS 400i',
      bay: 'Robotics Welding Bay 03',
      status: activeWOs.length >= 3 ? 'RUNNING' : 'STANDBY',
      operator: 'P. Arumugam (Robotics Tech)',
      spm: 34.0,
      pressure: 'Ar/CO2 18 LPM',
      temperature: '41°C',
      oee: '89.1%',
      assignedWo: activeWOs[2] || null
    },
    {
      id: 'ST-04',
      name: 'Okuma CNC Vertical Machining Center #01',
      model: 'Okuma GENOS M560-V (15,000 RPM Spindle)',
      bay: 'Precision Machining Cell 04',
      status: 'TOOLING SETUP',
      operator: 'V. Sundar (CNC Machinist)',
      spm: 12.0,
      pressure: 'Coolant 70 bar',
      temperature: '36°C',
      oee: '77.5%',
      assignedWo: activeWOs[3] || null
    },
    {
      id: 'ST-05',
      name: 'Automated Cathodic E-Coat Line #04',
      model: 'Eisenmann Automated 12-Stage CED System',
      bay: 'Surface Treatment Bay 05',
      status: 'RUNNING',
      operator: 'S. Nathan (Chemical QA)',
      spm: 45.0,
      pressure: 'Bath pH 5.8',
      temperature: '28°C',
      oee: '92.3%',
      assignedWo: activeWOs[4] || null
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Banner */}
      <div style={{
        backgroundColor: '#121722',
        border: '1px solid #232d3f',
        borderRadius: '8px',
        padding: '14px 18px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#f59e0b" />
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
              Live Shop Floor Work Center & Machine Telemetry
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
            Real-time stroke counters, hydraulic pressure monitoring, and operator station allocation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: '#161e2c',
            border: '1px solid #232d3f',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#34d399'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            4 Stations Active
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: '#161e2c',
            border: '1px solid #232d3f',
            borderRadius: '6px',
            fontSize: '11px',
            color: '#fbbf24'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b', display: 'inline-block' }} />
            1 Tooling Setup
          </div>
        </div>
      </div>

      {/* Grid of Work Centers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '14px'
      }}>
        {stations.map(st => {
          const wo = st.assignedWo;
          const detail = wo?.details?.[0] || {};
          const targetQty = Number(detail.Target_Quantity) || 5000;
          const producedQty = Number(detail.Produced_Quantity) || 0;
          const pct = wo?.Overall_Progress_Percentage || (targetQty > 0 ? (producedQty / targetQty) * 100 : 0);

          return (
            <div
              key={st.id}
              style={{
                backgroundColor: '#121722',
                border: '1px solid #232d3f',
                borderRadius: '8px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                position: 'relative'
              }}
            >
              {/* Station Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: '#1e293b',
                      color: '#94a3b8',
                      padding: '2px 5px',
                      borderRadius: '3px'
                    }}>
                      {st.id}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                      {st.name}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {st.model} • <span style={{ color: '#38bdf8' }}>{st.bay}</span>
                  </div>
                </div>

                <span style={{
                  padding: '3px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  backgroundColor: st.status === 'RUNNING' ? 'rgba(16, 185, 129, 0.15)' : (st.status === 'TOOLING SETUP' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(100, 116, 139, 0.15)'),
                  color: st.status === 'RUNNING' ? '#34d399' : (st.status === 'TOOLING SETUP' ? '#fbbf24' : '#94a3b8'),
                  border: `1px solid ${st.status === 'RUNNING' ? 'rgba(16, 185, 129, 0.3)' : (st.status === 'TOOLING SETUP' ? 'rgba(245, 158, 11, 0.3)' : '#334155')}`
                }}>
                  {st.status}
                </span>
              </div>

              {/* Active Work Order Running */}
              <div style={{
                backgroundColor: '#161e2c',
                border: '1px solid #232d3f',
                borderRadius: '6px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Clamped Job Traveler</span>
                  {wo ? (
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#f59e0b',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      padding: '1px 6px',
                      borderRadius: '3px'
                    }}>
                      {wo.WO_Number}
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#64748b' }}>No WO Clamped</span>
                  )}
                </div>

                {wo ? (
                  <>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                      {detail.Material_ID?.name || 'Brake Pedal Bracket Blank'}
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '3px' }}>
                        <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                          {producedQty.toLocaleString()} / {targetQty.toLocaleString()} pcs
                        </span>
                        <span style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace' }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ height: '4px', backgroundColor: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', backgroundColor: '#f59e0b' }} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', padding: '6px 0' }}>
                    Machine idle in standby. Release a work order to clamp die.
                  </div>
                )}
              </div>

              {/* Real-Time Machine Telemetry Strip */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                fontSize: '10px'
              }}>
                <div style={{ backgroundColor: '#161e2c', padding: '6px', borderRadius: '4px' }}>
                  <div style={{ color: '#64748b' }}>Cadence</div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace', marginTop: '1px' }}>{st.spm} SPM</div>
                </div>
                <div style={{ backgroundColor: '#161e2c', padding: '6px', borderRadius: '4px' }}>
                  <div style={{ color: '#64748b' }}>Pressure</div>
                  <div style={{ fontWeight: 700, color: '#38bdf8', fontFamily: 'monospace', marginTop: '1px' }}>{st.pressure}</div>
                </div>
                <div style={{ backgroundColor: '#161e2c', padding: '6px', borderRadius: '4px' }}>
                  <div style={{ color: '#64748b' }}>Temp</div>
                  <div style={{ fontWeight: 700, color: '#fbbf24', fontFamily: 'monospace', marginTop: '1px' }}>{st.temperature}</div>
                </div>
                <div style={{ backgroundColor: '#161e2c', padding: '6px', borderRadius: '4px' }}>
                  <div style={{ color: '#64748b' }}>OEE</div>
                  <div style={{ fontWeight: 700, color: '#34d399', fontFamily: 'monospace', marginTop: '1px' }}>{st.oee}</div>
                </div>
              </div>

              {/* Operator on Duty & Quick Punch */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderTop: '1px solid #1e293b',
                paddingTop: '10px',
                marginTop: 'auto'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
                  <User size={13} color="#64748b" />
                  <span>{st.operator}</span>
                </div>

                {wo && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => onUpdateProgress(wo)}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#f59e0b',
                        color: '#0b0f17',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Zap size={12} /> Log Cycle
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WOMachineStationMonitor;
