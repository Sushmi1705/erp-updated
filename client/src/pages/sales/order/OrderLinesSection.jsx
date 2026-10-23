import React from 'react';
import {
  Package, Plus, Edit2, Trash2, ChevronRight, Lock,
  Factory, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import StatusBadge from '../../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../../utils/money';

export const OrderLinesSection = ({
  lines = [],
  selectedLine,
  onSelectLine,
  onOpenAddLineModal,
  onOpenEditLineModal,
  onDeleteLine,
  orderStatus
}) => {
  const isOrderClosed = ['Completed', 'Cancelled'].includes(orderStatus);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-canvas)',
      borderRadius: 8,
      border: '1px solid var(--border-color)',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={15} color="#059669" />
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              Ordered Automotive Parts & Specifications
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 8 }}>
              ({lines.length} lines — Select a part to view delivery release schedules)
            </span>
          </div>
        </div>

        {!isOrderClosed && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenAddLineModal}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 700,
              padding: '5px 12px'
            }}
          >
            <Plus size={13} /> Add Part
          </button>
        )}
      </div>

      {/* Content */}
      {lines.length === 0 ? (
        <div style={{
          padding: '36px 20px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 10
        }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Package size={22} color="#059669" />
          </div>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)' }}>
            No Parts Added to this Sales Order Yet
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 400, margin: 0 }}>
            Specify the components the customer has ordered, agreed unit prices, and supply routes (From Stock or Production Required).
          </p>
          {!isOrderClosed && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenAddLineModal}
              style={{ fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}
            >
              <Plus size={13} /> Add First Part
            </button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 12
          }}>
            <thead>
              <tr style={{
                background: 'var(--surface-canvas)',
                borderBottom: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}>
                <th style={{ padding: '8px 12px', width: 50 }}>Seq</th>
                <th style={{ padding: '8px 12px' }}>Product Component</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Unit Price (₹)</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Line Total</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Fulfillment</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>ATP Stock</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Manufacturing</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, idx) => {
                const isSelected = selectedLine?._id === line._id;

                return (
                  <tr
                    key={line._id || idx}
                    onClick={() => onSelectLine(line)}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(16, 185, 129, 0.08)'
                        : idx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.015)',
                      transition: 'background 0.15s ease'
                    }}
                  >
                    {/* Seq */}
                    <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        background: isSelected ? 'rgba(16, 185, 129, 0.25)' : 'var(--bg-secondary)',
                        color: isSelected ? '#059669' : 'var(--text-primary)',
                        padding: '1px 5px',
                        borderRadius: 4
                      }}>
                        #{line.lineSequence || idx + 1}
                      </span>
                    </td>

                    {/* Product */}
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {line.productId?.name || '—'}
                      </div>
                      {line.productId?.code && (
                        <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                          [{line.productId.code}]
                        </div>
                      )}
                    </td>

                    {/* Qty */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {Number(line.orderedQuantity).toLocaleString()} <span style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontWeight: 500 }}>{line.uomId?.name || line.uomId?.abbreviation || 'NOS'}</span>
                    </td>

                    {/* Unit Price */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {fmtMoneyFull(line.unitPrice || 0)}
                        {line.isPriceLocked && (
                          <span title="Locked from quotation">
                            <Lock size={11} color="var(--text-secondary)" />
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Line Total */}
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
                      {fmtMoneyFull(line.lineTotal || 0)}
                    </td>

                    {/* Fulfillment */}
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <StatusBadge value={line.fulfillmentType} />
                    </td>

                    {/* ATP Stock */}
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      <StatusBadge value={line.atpStatus} />
                    </td>

                    {/* Manufacturing */}
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {line.mrpOrderId ? (
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '2px 7px',
                          borderRadius: 12,
                          background: 'rgba(0, 180, 216, 0.12)',
                          color: '#0077b6',
                          fontSize: 10.5,
                          fontWeight: 700
                        }} title="Production order raised in MRP">
                          <Factory size={11} /> MRP Raised
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                        <button
                          type="button"
                          title="Inspect delivery releases"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectLine(line);
                          }}
                          style={{
                            background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.04)',
                            border: isSelected ? '1px solid #10b981' : '1px solid var(--border-color)',
                            borderRadius: 4,
                            padding: '3px 8px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            fontSize: 11,
                            color: isSelected ? '#059669' : 'var(--text-secondary)',
                            fontWeight: 600
                          }}
                        >
                          <span>Releases</span>
                          <ChevronRight size={12} />
                        </button>

                        {!isOrderClosed && (
                          <>
                            <button
                              type="button"
                              title="Edit line item"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditLineModal(line);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 3 }}
                            >
                              <Edit2 size={12} />
                            </button>
                            <button
                              type="button"
                              title="Delete line item"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteLine(line._id);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-danger)', padding: 3 }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderLinesSection;
