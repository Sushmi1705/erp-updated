import React from 'react';
import {
  FileText, Building, User, Calendar, Layers, ChevronRight,
  Edit2, Copy, Check, ArrowUpRight, DollarSign
} from 'lucide-react';
import { notify } from '../../../utils/notify';

export const QuotationPortfolioList = ({
  headers = [],
  selectedHeader,
  onSelectHeader,
  onOpenEditHeaderModal,
  loading
}) => {
  const [copiedId, setCopiedId] = React.useState(null);

  const handleCopy = (e, qtnNumber, id) => {
    e.stopPropagation();
    navigator.clipboard.writeText(qtnNumber);
    setCopiedId(id);
    notify.info(`Copied ${qtnNumber} to clipboard`);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-secondary)',
      borderRadius: 8,
      border: '1px solid var(--border-color)',
      overflow: 'hidden'
    }}>
      {/* Dossier Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--surface-canvas)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <DollarSign size={14} color="#d97706" />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
            Quotation Portfolio
          </span>
        </div>
        <span style={{
          fontSize: 10.5,
          fontWeight: 700,
          padding: '1px 6px',
          borderRadius: 10,
          background: 'rgba(245, 158, 11, 0.15)',
          color: '#d97706',
          fontFamily: 'monospace'
        }}>
          {headers.length} Records
        </span>
      </div>

      {/* Scrollable list */}
      <div style={{
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 290px)',
        minHeight: 460,
        padding: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}>
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
            Loading quotations…
          </div>
        ) : headers.length === 0 ? (
          <div style={{ padding: 28, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
            No quotation contracts match your search/filter criteria.
          </div>
        ) : (
          headers.map(item => {
            const isSelected = selectedHeader?._id === item._id;

            // Sales rep name
            let repName = 'Unassigned';
            if (item.salesRepId) {
              if (typeof item.salesRepId === 'object') {
                repName = `${item.salesRepId.firstName || ''} ${item.salesRepId.lastName || ''}`.trim() || item.salesRepId.name || item.salesRepId.email;
              } else {
                repName = item.salesRepId;
              }
            }

            return (
              <div
                key={item._id}
                onClick={() => onSelectHeader(item)}
                style={{
                  padding: '11px 12px',
                  borderRadius: 6,
                  border: isSelected ? '1.5px solid #d97706' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(245, 158, 11, 0.07)' : 'var(--surface-canvas)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 7,
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                {/* Active indicator bar */}
                {isSelected && (
                  <div style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3.5,
                    background: 'linear-gradient(180deg, #f59e0b 0%, #d97706 100%)',
                    borderRadius: '4px 0 0 4px'
                  }} />
                )}

                {/* Top line: Qtn Number & Copy & Edit */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      fontSize: 12,
                      color: isSelected ? '#b45309' : 'var(--text-primary)',
                      background: isSelected ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-secondary)',
                      padding: '1px 6px',
                      borderRadius: 4
                    }}>
                      {item.quotationNumber}
                    </span>
                    <button
                      type="button"
                      title="Copy quotation number"
                      onClick={(e) => handleCopy(e, item.quotationNumber, item._id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: copiedId === item._id ? '#059669' : 'var(--text-secondary)',
                        padding: 2
                      }}
                    >
                      {copiedId === item._id ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button
                      type="button"
                      title="Edit Quotation Header"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenEditHeaderModal(item);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        padding: 2
                      }}
                    >
                      <Edit2 size={12} />
                    </button>
                    <span style={{ fontSize: 10.5, color: 'var(--text-secondary)' }}>
                      {new Date(item.createdDate || item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Customer name */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <Building size={13} color="#d97706" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontWeight: 700,
                      fontSize: 12.5,
                      color: 'var(--text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {item.customerId?.name || 'Customer Organization'}
                    </div>
                    {item.customerId?.code && (
                      <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                        [{item.customerId.code}]
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom line: Sales Rep & Inquiry Reference */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  paddingTop: 2,
                  borderTop: '1px dashed var(--border-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <User size={11} />
                    <span style={{ maxWidth: 110, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {repName}
                    </span>
                  </div>

                  {item.inquiryId ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 3,
                      padding: '1px 5px',
                      borderRadius: 4,
                      background: 'rgba(0, 180, 216, 0.1)',
                      color: '#0077b6',
                      fontWeight: 600,
                      fontSize: 10
                    }}>
                      <Layers size={10} />
                      <span>{item.inquiryId?.inquiryNumber || 'RFQ Link'}</span>
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 10,
                      color: 'var(--text-secondary)',
                      background: 'var(--bg-secondary)',
                      padding: '1px 5px',
                      borderRadius: 4
                    }}>
                      Direct Quote
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default QuotationPortfolioList;
