import React from 'react';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Calendar, 
  Package, 
  Layers, 
  Flame,
  ArrowRight
} from 'lucide-react';
import { fmtQty } from '../../../utils/money';

const ShelfLifeRadar = ({
  entities = [],
  onQuarantineEntity,
  onInspectEntity
}) => {
  const currentDate = new Date();
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);

  const expiredEntities = [];
  const expiringSoonEntities = [];
  const safeEntities = [];
  const durableEntities = []; // Materials without expiry (steel sheets, etc.)

  entities.forEach(ent => {
    if (!ent.Expiry_Date) {
      durableEntities.push(ent);
      return;
    }

    const expDate = new Date(ent.Expiry_Date);
    if (expDate < currentDate) {
      expiredEntities.push({ ...ent, daysDiff: Math.floor((currentDate - expDate) / (1000 * 60 * 60 * 24)) });
    } else if (expDate <= thirtyDaysAhead) {
      expiringSoonEntities.push({ ...ent, daysDiff: Math.floor((expDate - currentDate) / (1000 * 60 * 60 * 24)) });
    } else {
      safeEntities.push({ ...ent, daysDiff: Math.floor((expDate - currentDate) / (1000 * 60 * 60 * 24)) });
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Shelf-Life Radar Banner */}
      <div style={{
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Clock size={18} color="#0891b2" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Shelf-Life &amp; Degradation Countdown Radar
              </h2>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, maxWidth: '750px', lineHeight: '1.4' }}>
              Real-time expiration countdown and preservative maintenance tracking for consumables, welding flux, coatings, and perishable chemical stores under IATF 16949 storage rules.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{
              background: expiredEntities.length > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)',
              border: expiredEntities.length > 0 ? '1px solid #ef4444' : '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 14px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '10px', color: expiredEntities.length > 0 ? '#dc2626' : 'var(--text-secondary)', fontWeight: 600 }}>Expired Stock</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: expiredEntities.length > 0 ? '#dc2626' : 'var(--text-primary)' }}>
                {expiredEntities.length}
              </div>
            </div>

            <div style={{
              background: expiringSoonEntities.length > 0 ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-secondary)',
              border: expiringSoonEntities.length > 0 ? '1px solid #f59e0b' : '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 14px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '10px', color: expiringSoonEntities.length > 0 ? '#d97706' : 'var(--text-secondary)', fontWeight: 600 }}>Expiring &lt; 30d</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: expiringSoonEntities.length > 0 ? '#d97706' : 'var(--text-primary)' }}>
                {expiringSoonEntities.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Expiry Alert Categories */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px'
      }}>
        {/* Category 1: Expired Batches */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#dc2626' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#dc2626', margin: 0 }}>
                Expired Batches (Immediate Action)
              </h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626', padding: '2px 8px', borderRadius: '4px' }}>
              {expiredEntities.length} Items
            </span>
          </div>

          {expiredEntities.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
              <CheckCircle2 size={24} color="#059669" style={{ marginBottom: '6px' }} />
              <div>Zero expired inventory in plant stores.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {expiredEntities.map(ent => (
                <div
                  key={ent._id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {ent.Tracking_Number}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {ent.Material_ID?.name} • {fmtQty(ent.Current_Quantity)} {ent.Material_ID?.uomId?.symbol || 'KG'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600, marginTop: '2px' }}>
                      Expired {ent.daysDiff} days ago
                    </div>
                  </div>

                  <button
                    onClick={() => onQuarantineEntity(ent)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#dc2626',
                      color: '#ffffff',
                      border: 'none',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <ShieldAlert size={12} /> Quarantine
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category 2: Expiring Soon (< 30d) */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#d97706', margin: 0 }}>
                Expiring Soon (&lt; 30 Days Warning)
              </h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', padding: '2px 8px', borderRadius: '4px' }}>
              {expiringSoonEntities.length} Items
            </span>
          </div>

          {expiringSoonEntities.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
              <CheckCircle2 size={24} color="#059669" style={{ marginBottom: '6px' }} />
              <div>All perishable consumables have safe shelf life.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {expiringSoonEntities.map(ent => (
                <div
                  key={ent._id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    background: 'rgba(245, 158, 11, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace' }}>
                      {ent.Tracking_Number}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {ent.Material_ID?.name} • {fmtQty(ent.Current_Quantity)} {ent.Material_ID?.uomId?.symbol || 'KG'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#d97706', fontWeight: 600, marginTop: '2px' }}>
                      Expires in {ent.daysDiff} days ({new Date(ent.Expiry_Date).toLocaleDateString('en-IN')})
                    </div>
                  </div>

                  <button
                    onClick={() => onInspectEntity(ent)}
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#0891b2',
                      background: 'transparent',
                      border: '1px solid #0891b2',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    Prioritize Issue
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category 3: Durable Steel & Active Consumables */}
        <div style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#059669' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#059669', margin: 0 }}>
                Durable Coils &amp; Safe Consumables
              </h3>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(5, 150, 105, 0.15)', color: '#059669', padding: '2px 8px', borderRadius: '4px' }}>
              {durableEntities.length + safeEntities.length} Batches
            </span>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Steel coils (CRCA, HR, GI, SS) maintain indefinite shelf-life under standard climate-controlled storage with anti-rust oil preservation.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {durableEntities.slice(0, 4).map(ent => (
              <div
                key={ent._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  fontSize: '11px'
                }}
              >
                <div>
                  <strong style={{ fontFamily: 'monospace' }}>{ent.Tracking_Number}</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>{ent.Material_ID?.name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: '#059669', fontWeight: 600 }}>Active Steel</span>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{fmtQty(ent.Current_Quantity)} {ent.Material_ID?.uomId?.symbol || 'KG'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShelfLifeRadar;
