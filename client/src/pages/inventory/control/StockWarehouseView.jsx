import React, { useMemo } from 'react';
import { MapPin, Boxes, Package, ShieldCheck, IndianRupee, Layers } from 'lucide-react';

const StockWarehouseView = ({
  inventoryData = [],
  onOpenAdjustModal,
  activeTabLabel = 'Raw Material'
}) => {
  // Aggregate data by warehouse
  const bayAggregates = useMemo(() => {
    const map = {};

    inventoryData.forEach(item => {
      const wh = item.Warehouse || 'Main Warehouse';
      if (!map[wh]) {
        map[wh] = {
          name: wh,
          items: [],
          totalOnHand: 0,
          totalAllocated: 0,
          totalAtp: 0,
          totalValuation: 0,
          shortages: 0
        };
      }

      map[wh].items.push(item);
      map[wh].totalOnHand += (item.Total_On_Hand || 0);
      map[wh].totalAllocated += (item.Total_Allocated || 0);
      map[wh].totalAtp += (item.Available_to_Promise || 0);
      map[wh].totalValuation += (item.valuation || 0);
      if (item.Exception_Flag) {
        map[wh].shortages += 1;
      }
    });

    return Object.values(map);
  }, [inventoryData]);

  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} Lakh`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '16px'
        }}
      >
        {bayAggregates.map((bay) => (
          <div
            key={bay.name}
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Bay Header */}
            <div 
              style={{
                padding: '16px 18px',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {bay.name}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {bay.items.length} distinct {activeTabLabel.toLowerCase()} SKUs stored
                  </div>
                </div>
              </div>

              {bay.shortages > 0 ? (
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', backgroundColor: '#ffe4e6', color: '#be123c', fontWeight: 700 }}>
                  {bay.shortages} Shortages
                </span>
              ) : (
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', backgroundColor: '#ecfdf5', color: '#059669', fontWeight: 600 }}>
                  Buffers Safe
                </span>
              )}
            </div>

            {/* Bay Telemetry Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', padding: '14px 18px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Gross On-Hand</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{bay.totalOnHand.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Allocated</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#d97706' }}>{bay.totalAllocated.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Net Free ATP</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#059669' }}>{bay.totalAtp.toLocaleString()}</div>
              </div>
            </div>

            {/* Valuation Strip */}
            <div style={{ padding: '8px 18px', backgroundColor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Total Bay Valuation:</span>
              <strong style={{ color: '#059669' }}>{formatCurrency(bay.totalValuation)}</strong>
            </div>

            {/* Micro Items Ledger */}
            <div style={{ padding: '12px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                SKUs In This Warehouse Bay
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {bay.items.slice(0, 5).map((item) => (
                  <div 
                    key={item._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-secondary)',
                      fontSize: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.Product_Name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{item.Product_Code}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: item.Exception_Flag ? '#dc2626' : '#059669' }}>
                        {item.Available_to_Promise.toLocaleString()} {item.uom} ATP
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                        On Hand: {item.Total_On_Hand.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                {bay.items.length > 5 && (
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', paddingTop: '4px' }}>
                    + {bay.items.length - 5} more items in this bay
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StockWarehouseView;
