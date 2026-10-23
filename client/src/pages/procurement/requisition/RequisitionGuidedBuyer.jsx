import React, { useState } from 'react';
import { 
  Search, ShoppingCart, Plus, Trash2, AlertTriangle, ShieldCheck, 
  Sparkles, Package, Building2, Calendar, Tag, ArrowRight, Check
} from 'lucide-react';
import { fmtMoneyFull } from '../../../utils/money';

const HIGHER_APPROVAL_LIMIT = 10000;

const RequisitionGuidedBuyer = ({
  materials = [],
  suppliers = [],
  departments = [],
  mrpSuggestions = [],
  cart = [],
  setCart,
  costCenterId,
  setCostCenterId,
  onSavePR,
  saving = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeCatalogTab, setActiveCatalogTab] = useState('Catalog'); // 'Catalog' or 'MRP'

  // Extract unique material categories
  const categories = ['All', ...new Set(materials.map(m => m.category).filter(Boolean))];

  const filteredMaterials = materials.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || m.name?.toLowerCase().includes(q) || m.code?.toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'All' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const cartTotal = cart.reduce((sum, item) => sum + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0), 0);
  const budgetWarning = cartTotal > HIGHER_APPROVAL_LIMIT;

  const handleAddToCart = (item) => {
    // Check if already in cart
    const existing = cart.find(c => c.itemId === item._id);
    if (existing) {
      setCart(cart.map(c => c.itemId === item._id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([
        ...cart,
        {
          id: Date.now() + Math.random(),
          itemId: item._id,
          name: item.name,
          code: item.code,
          supplierId: item.preferredSupplier?._id || item.preferredSupplier || '',
          qty: 1,
          unitPrice: item.standardCost || 0,
          requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      ]);
    }
  };

  const handleAddMrpSuggestion = (sugg) => {
    setCart([
      ...cart,
      {
        id: Date.now() + Math.random(),
        itemId: sugg.itemId?._id || sugg.itemId,
        name: sugg.itemId?.name || 'MRP Recommended Material',
        code: sugg.itemId?.code || 'MRP-RAW',
        supplierId: sugg.preferredVendorId || '',
        qty: sugg.suggestedQty || 100,
        unitPrice: sugg.estimatedCost || 50,
        requiredDate: sugg.requiredDate ? new Date(sugg.requiredDate).toISOString().split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]);
  };

  const handleAddCustomItem = () => {
    const itemName = searchQuery.trim() || 'One-off Industrial Spare';
    setCart([
      ...cart,
      {
        id: Date.now() + Math.random(),
        itemId: null,
        name: itemName,
        freeTextDesc: itemName,
        code: 'OFF-CATALOG',
        supplierId: '',
        qty: 1,
        unitPrice: 0,
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    ]);
    setSearchQuery('');
  };

  const handleRemoveFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateCartItem = (id, field, value) => {
    setCart(cart.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1.4fr 1fr',
      gap: '18px',
      minHeight: '620px'
    }}>
      {/* Left: Guided Catalog & Search Experience */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
      }}>
        {/* Catalog Navigation Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '10px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveCatalogTab('Catalog')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: activeCatalogTab === 'Catalog' ? 600 : 500,
                borderRadius: '6px',
                background: activeCatalogTab === 'Catalog' ? 'var(--accent-primary)' : 'transparent',
                color: activeCatalogTab === 'Catalog' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Package size={14} /> Approved Materials Catalog
            </button>

            <button
              onClick={() => setActiveCatalogTab('MRP')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: activeCatalogTab === 'MRP' ? 600 : 500,
                borderRadius: '6px',
                background: activeCatalogTab === 'MRP' ? '#6366f1' : 'transparent',
                color: activeCatalogTab === 'MRP' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={14} /> MRP Recommendations ({mrpSuggestions.length})
            </button>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            {materials.length} Master Items Registered
          </span>
        </div>

        {activeCatalogTab === 'Catalog' ? (
          <>
            {/* Search Input & Off-Catalog Button */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '7px 12px',
                flex: 1
              }}>
                <Search size={15} color="var(--text-secondary)" />
                <input
                  type="text"
                  placeholder="Search raw material, hardware, sheet coil, lubricant, or part code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                    width: '100%'
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '11px' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {searchQuery && (
                <button
                  onClick={handleAddCustomItem}
                  title="Add item not listed in Master Catalog"
                  style={{
                    padding: '7px 12px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: '#0d9488',
                    color: '#ffffff',
                    borderRadius: '8px',
                    border: 'none',
                    whiteSpace: 'nowrap'
                  }}
                >
                  + Add "{searchQuery}" Off-Catalog
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            {categories.length > 1 && (
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '10px' }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      borderRadius: '16px',
                      background: selectedCategory === cat ? 'var(--bg-tertiary)' : 'transparent',
                      color: selectedCategory === cat ? 'var(--text-primary)' : 'var(--text-secondary)',
                      border: selectedCategory === cat ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      fontWeight: selectedCategory === cat ? 600 : 500,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Catalog Grid Cards */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '10px',
              paddingRight: '4px'
            }}>
              {filteredMaterials.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: 'var(--text-secondary)'
                }}>
                  <Package size={32} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                  <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 600 }}>
                    No materials matching your search.
                  </p>
                  <p style={{ margin: '0 0 14px 0', fontSize: '11px' }}>
                    You can add one under Master Data → Materials We Buy, or add this item as an off-catalog one-off request.
                  </p>
                  {searchQuery && (
                    <button
                      onClick={handleAddCustomItem}
                      className="btn btn-primary"
                      style={{ fontSize: '11px', padding: '6px 14px' }}
                    >
                      + Add "{searchQuery}" as One-Off Item
                    </button>
                  )}
                </div>
              ) : (
                filteredMaterials.map(mat => {
                  const supplierName = mat.preferredSupplier 
                    ? (suppliers.find(s => s._id === (mat.preferredSupplier?._id || mat.preferredSupplier))?.name || 'Assigned Supplier')
                    : 'Standard Vendor';

                  const inCartCount = cart.find(c => c.itemId === mat._id)?.qty || 0;

                  return (
                    <div
                      key={mat._id}
                      style={{
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '8px',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent-primary)';
                        e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.03)';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{
                            fontSize: '10px',
                            fontFamily: 'monospace',
                            color: 'var(--text-secondary)',
                            background: 'var(--bg-secondary)',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            {mat.code}
                          </span>
                          {inCartCount > 0 && (
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: '#10b981',
                              background: '#ecfdf5',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              ✓ {inCartCount} in cart
                            </span>
                          )}
                        </div>

                        <div style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginTop: '6px',
                          lineHeight: 1.3
                        }}>
                          {mat.name}
                        </div>

                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          Supplier: {supplierName}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-color)',
                        marginTop: '4px'
                      }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {fmtMoneyFull(mat.standardCost || 0)} <span style={{ fontSize: '10px', fontWeight: 400, color: 'var(--text-secondary)' }}>/ unit</span>
                        </div>

                        <button
                          onClick={() => handleAddToCart(mat)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            background: inCartCount > 0 ? '#10b981' : 'var(--accent-primary)',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          <Plus size={12} /> {inCartCount > 0 ? 'Add more' : 'Add'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : (
          /* MRP Recommendations Tab */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto' }}>
            {mrpSuggestions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No pending purchase suggestions from MRP. Run a material plan under Material Planning (MRP).
              </div>
            ) : (
              mrpSuggestions.map(sugg => (
                <div
                  key={sugg._id}
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {sugg.itemId?.name || 'Raw Material Component'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      MRP Suggestion: <strong>{sugg.suggestedQty} units</strong> • Reason: {sugg.reasonCode || 'Safety stock shortage'}
                    </div>
                  </div>

                  <button
                    onClick={() => handleAddMrpSuggestion(sugg)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: '#6366f1',
                      color: '#ffffff',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={12} /> Add to Requisition
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right: The Cart & Multi-Tier Submission Deck */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
      }}>
        {/* Cart Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
          paddingBottom: '10px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={16} color="var(--accent-primary)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Requisition Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
            </span>
          </div>

          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {fmtMoneyFull(cartTotal)}
          </div>
        </div>

        {/* Cart Items List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          marginBottom: '14px',
          paddingRight: '4px'
        }}>
          {cart.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '50px 20px',
              color: 'var(--text-secondary)',
              fontSize: '12px'
            }}>
              <ShoppingCart size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <p style={{ margin: '0 0 4px 0', fontWeight: 600 }}>Your cart is empty.</p>
              <p style={{ margin: 0 }}>Select materials from the catalog or pull from MRP suggestions on the left.</p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.name}
                    </div>
                    {item.code && (
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        {item.code}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemoveFromCart(item.id)}
                    title="Remove item"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '2px'
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Inline Editing Controls */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', alignItems: 'center' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                      Quantity:
                    </label>
                    <input
                      type="number"
                      min="1"
                      className="input-field"
                      style={{ padding: '4px 6px', fontSize: '12px' }}
                      value={item.qty}
                      onChange={(e) => updateCartItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                      Rate (₹):
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="input-field"
                      style={{ padding: '4px 6px', fontSize: '12px' }}
                      value={item.unitPrice}
                      onChange={(e) => updateCartItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <label style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>
                      Subtotal:
                    </label>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {fmtMoneyFull(item.qty * item.unitPrice)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cost Center / Department Form */}
        <form onSubmit={onSavePR} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
          <div className="input-group" style={{ marginBottom: '10px' }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={13} color="var(--accent-primary)" />
              Allocated Cost Center / Department *
            </label>
            <select
              className="input-field"
              required
              value={costCenterId}
              onChange={(e) => setCostCenterId(e.target.value)}
            >
              <option value="">Choose department / plant cost center</option>
              {departments.map(d => (
                <option key={d._id} value={d._id}>{d.name} ({d.code || 'CC'})</option>
              ))}
            </select>
          </div>

          {/* Budget Warning Banner (Rule 2) */}
          {budgetWarning && (
            <div style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <strong style={{ display: 'block', marginBottom: '1px' }}>
                  Higher Executive Authorization Required
                </strong>
                Total value exceeds {fmtMoneyFull(HIGHER_APPROVAL_LIMIT)}. In accordance with PAC financial controls, this will be automatically routed to the <strong>CFO</strong> following Manager review.
              </div>
            </div>
          )}

          {/* Submission Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={cart.length === 0 || !costCenterId || saving}
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
              boxShadow: '0 4px 12px rgba(13, 148, 136, 0.35)'
            }}
          >
            <ArrowRight size={15} />
            {saving ? 'Transmitting Request...' : `Submit Request (${fmtMoneyFull(cartTotal)})`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RequisitionGuidedBuyer;
