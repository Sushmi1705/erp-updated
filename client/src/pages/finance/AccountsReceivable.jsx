import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { IndianRupee, FileText, TrendingUp, Ban, Plus } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';
import { confirmAction } from '../../utils/confirmAction';

/* Guidance, not an error: nothing has failed — the record simply does not exist
   yet, and the sentence has to name what to create and where. Caution amber. */
const hintStyle = {
  color: 'var(--status-caution-fg)',
  fontSize: 'var(--font-caption)',
  marginTop: 'var(--space-2)',
  lineHeight: 'var(--leading-normal)'
};
const AccountsReceivable = () => {
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [agingData, setAgingData] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('invoices'); // invoices, payments, outstanding
  // Every save here talks to the server. Naming the work in the button is what
  // stops a store keeper pressing Save three times on a slow line.
  const [busyAction, setBusyAction] = useState(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [invoiceForm, setInvoiceForm] = useState({
    Customer_ID: '',
    Issue_Date: new Date().toISOString().split('T')[0],
    Due_Date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    Terms_ID: 'Net 30',
    lineItems: []
  });
  const [receiptForm, setReceiptForm] = useState({
    Customer_ID: '',
    Payment_Date: new Date().toISOString().split('T')[0],
    Total_Received: 1500,
    Payment_Method: 'NEFT',
    Reference_Number: ''
  });
  const [applyForm, setApplyForm] = useState({
    Invoice_ID: '',
    Applied_Amount: 0
  });
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, [activeTab]);
  // Launchpad quick-create deep link (?create=1)
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('create') === '1') {
      window.history.replaceState({}, '', window.location.pathname);
      setIsInvoiceModalOpen(true);
    }
  }, []);
  const fetchDependencies = async () => {
    try {
      const custRes = await axios.get('/master/customer');
      if (custRes.data?.data) setCustomers(custRes.data.data);
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'invoices') {
        const res = await axios.get('/finance/v2/ar/invoices');
        setInvoices(res.data.data);
      } else if (activeTab === 'payments') {
        const res = await axios.get('/finance/v2/ar/receipts');
        setReceipts(res.data.data);
        const invRes = await axios.get('/finance/v2/ar/invoices');
        setInvoices(invRes.data.data);
      } else if (activeTab === 'outstanding') {
        const res = await axios.get('/finance/v2/ar/aging');
        setAgingData(res.data.data);
      }
    } catch (err) {
      console.error('Data fetch error', err);
    }
    setLoading(false);
  };
  const handleCreateInvoice = async e => {
    e.preventDefault();
    if (invoiceForm.lineItems.length === 0) {
      notify.warning('Add at least one line to the invoice before saving.');
      return;
    }
    setBusyAction('invoice');
    try {
      await axios.post('/finance/v2/ar/invoices', invoiceForm);
      setIsInvoiceModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error creating invoice');
    }
    setBusyAction(null);
  };
  const addLineItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      lineItems: [...invoiceForm.lineItems, {
        Description: '',
        Quantity: 1,
        Unit_Price: 0,
        HSN_Code: ''
      }]
    });
  };
  const removeLineItem = index => {
    const newItems = [...invoiceForm.lineItems];
    newItems.splice(index, 1);
    setInvoiceForm({
      ...invoiceForm,
      lineItems: newItems
    });
  };
  const handleVoidInvoice = async invoiceId => {
    if (!await confirmAction('Cancel this invoice? It stays on record but no longer counts as money owed to us.')) return;
    setBusyAction('void-' + invoiceId);
    try {
      await axios.put(`/finance/v2/ar/invoices/${invoiceId}/void`);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error voiding invoice');
    }
    setBusyAction(null);
  };
  const handleRecordReceipt = async e => {
    e.preventDefault();
    setBusyAction('receipt');
    try {
      await axios.post('/finance/v2/ar/receipts', receiptForm);
      setIsReceiptModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error recording receipt');
    }
    setBusyAction(null);
  };
  const handleApplyPayment = async e => {
    e.preventDefault();
    setBusyAction('apply');
    try {
      await axios.post(`/finance/v2/ar/receipts/${selectedReceipt._id}/apply`, applyForm);
      setIsApplyModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error applying payment');
    }
    setBusyAction(null);
  };
  const invoiceActionRenderer = row => {
    if (row.Status === 'Cancelled/Void' || row.Status === 'Paid') return null;
    const voiding = busyAction === 'void-' + row._id;
    return <button onClick={() => handleVoidInvoice(row._id)} disabled={voiding} className="btn-icon" style={{
      fontSize: '11px',
      color: 'var(--status-negative-fg)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontWeight: 600
    }}>
        <Ban size={12} /> {voiding ? 'Cancelling…' : 'Cancel invoice'}
      </button>;
  };
  const receiptActionRenderer = row => {
    if (row.Unapplied_Amount <= 0) return <span style={{
      fontSize: '11px',
      color: 'var(--text-secondary)',
      fontWeight: 600
    }}>All of it matched to invoices</span>;
    return <button onClick={async () => {
      setSelectedReceipt(row);
      try {
        const invRes = await axios.get('/finance/v2/ar/invoices');
        if (invRes.data?.data) setInvoices(invRes.data.data);
      } catch (err) {
        console.error('Error fetching open invoices', err);
      }
      setApplyForm({
        Invoice_ID: '',
        Applied_Amount: row.Unapplied_Amount
      });
      setIsApplyModalOpen(true);
    }} className="btn-icon" style={{
      fontSize: '11px',
      color: 'var(--accent-text)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontWeight: 600
    }}>
        <IndianRupee size={12} /> Match to an invoice
      </button>;
  };
  const getOpenInvoicesForReceipt = rec => {
    if (!invoices || invoices.length === 0) return [];
    const openInvoices = invoices.filter(i => i.Status !== 'Cancelled/Void' && i.Status !== 'Paid' && (i.remainingBalance === undefined || i.remainingBalance > 0));
    if (!rec) return openInvoices;
    const recCustId = String(rec.Customer_ID?._id || rec.Customer_ID || '');
    const matched = openInvoices.filter(i => {
      const invCustId = String(i.Customer_ID?._id || i.Customer_ID || '');
      return recCustId && invCustId && recCustId === invCustId;
    });
    return matched.length > 0 ? matched : openInvoices;
  };
  const invoiceColumns = [{
    header: 'Invoice number',
    render: row => <strong>{row.Invoice_Number || row.Invoice_ID}</strong>
  }, {
    header: 'Customer',
    render: row => <div>
        <strong>{row.Customer_ID?.name || row.Customer_ID?.companyName || 'Customer'}</strong>
        <div style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>{row.Customer_ID?.code || 'CUST'}</div>
      </div>
  }, {
    header: 'Invoice date',
    render: row => new Date(row.Issue_Date).toLocaleDateString()
  }, {
    header: 'Payment due by',
    render: row => <span style={{
      color: new Date(row.Due_Date) < new Date() && row.Status !== 'Paid' ? 'var(--status-caution-fg)' : 'inherit',
      fontWeight: new Date(row.Due_Date) < new Date() && row.Status !== 'Paid' ? 600 : 400
    }}>
        {new Date(row.Due_Date).toLocaleDateString()}
      </span>
  }, {
    header: 'Invoice amount',
    align: 'right',
    render: row => <strong>{fmtMoneyFull(row.Total_Amount)}</strong>
  }, {
    header: 'Still to be paid',
    align: 'right',
    render: row => <span style={{
      color: row.remainingBalance > 0 ? 'var(--status-caution-fg)' : 'var(--text-secondary)',
      fontWeight: 600
    }}>{fmtMoneyFull(row.remainingBalance)}</span>
  }, {
    header: 'Status',
    render: row => <StatusBadge value={row.Status} />
  }];
  const receiptColumns = [{
    header: 'Receipt number',
    render: row => <strong>{row.Receipt_Number || row.Receipt_ID}</strong>
  }, {
    header: 'Customer',
    render: row => <span>{row.Customer_ID?.name || row.Customer_ID?.companyName || 'Customer'}</span>
  }, {
    header: 'Money received on',
    render: row => new Date(row.Payment_Date).toLocaleDateString()
  }, {
    header: 'Amount received',
    align: 'right',
    render: row => <strong>{fmtMoneyFull(row.Total_Received)}</strong>
  }, {
    header: 'How they paid',
    render: row => <span style={{
      fontSize: '12px'
    }}>{row.Payment_Method}{row.Reference_Number ? ` (${row.Reference_Number})` : ''}</span>
  }, {
    header: 'Not yet matched to an invoice',
    align: 'right',
    render: row => <strong style={{
      color: row.Unapplied_Amount > 0 ? 'var(--status-caution-fg)' : 'var(--text-secondary)'
    }}>{fmtMoneyFull(row.Unapplied_Amount)}</strong>
  }, {
    header: 'Status',
    render: row => <StatusBadge value={row.Status} />
  }];
  const outstandingColumns = [{
    header: 'Customer',
    render: row => <div>
        <strong>{row.customerName}</strong>
        <div style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>Code {row.customerCode}</div>
      </div>
  }, {
    header: 'Billed this year',
    align: 'right',
    render: row => <span>{fmtMoneyFull(row.totalBilledYTD)}</span>
  }, {
    header: 'Not due yet',
    align: 'right',
    render: row => <span>{fmtMoneyFull(row.currentBalance)}</span>
  }, {
    header: 'Late by 1 to 30 days',
    align: 'right',
    render: row => <span style={{
      color: row.days1_30_Past_Due > 0 ? 'var(--status-caution-fg)' : 'inherit'
    }}>{fmtMoneyFull(row.days1_30_Past_Due)}</span>
  }, {
    header: 'Late by 31 to 60 days',
    align: 'right',
    render: row => <span style={{
      color: row.days31_60_Past_Due > 0 ? 'var(--status-caution-fg)' : 'inherit'
    }}>{fmtMoneyFull(row.days31_60_Past_Due)}</span>
  }, {
    header: 'Late by 61 to 90 days',
    align: 'right',
    render: row => <span style={{
      color: row.days61_90_Past_Due > 0 ? 'var(--status-negative-fg)' : 'inherit'
    }}>{fmtMoneyFull(row.days61_90_Past_Due)}</span>
  }, {
    header: 'Late by more than 90 days',
    align: 'right',
    render: row => <strong style={{
      color: row.daysOver90_Past_Due > 0 ? 'var(--status-negative-fg)' : 'inherit'
    }}>{fmtMoneyFull(row.daysOver90_Past_Due)}</strong>
  }, {
    header: 'Total owed to us',
    align: 'right',
    render: row => <strong>{fmtMoneyFull(row.totalOutstanding)}</strong>
  }];
  return <div style={{
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  }}>
      <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingBottom: '16px',
      borderBottom: '1px solid var(--border-color)',
      marginBottom: '16px'
    }}>
        <div>
          <h1 style={{
          fontSize: '18px',
          fontWeight: 600
        }}>Money In (Receivable)</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Invoices raised on customers, money received against them, and what is still owed to us. Used by accounts staff.</p>
        </div>
        {activeTab === 'invoices' && <button className="btn btn-primary" onClick={() => setIsInvoiceModalOpen(true)}>
            <FileText size={14} /> Raise Invoice
          </button>}
        {activeTab === 'payments' && <button className="btn btn-primary" onClick={() => setIsReceiptModalOpen(true)}>
            <IndianRupee size={14} /> Record Money Received
          </button>}
      </div>

      {/* Tabs matching screenshot design */}
      <div style={{
      display: 'flex',
      gap: '16px',
      marginBottom: '16px',
      borderBottom: '1px solid var(--border-color)'
    }}>
        <button role="tab" aria-selected={activeTab === 'invoices'} onClick={() => setActiveTab('invoices')} style={{
        padding: '8px 16px',
        background: 'none',
        border: 'none',
        borderBottom: activeTab === 'invoices' ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: activeTab === 'invoices' ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <FileText size={16} /> Invoices to customers
        </button>
        <button role="tab" aria-selected={activeTab === 'payments'} onClick={() => setActiveTab('payments')} style={{
        padding: '8px 16px',
        background: 'none',
        border: 'none',
        borderBottom: activeTab === 'payments' ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: activeTab === 'payments' ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <IndianRupee size={16} /> Money received
        </button>
        <button role="tab" aria-selected={activeTab === 'outstanding'} onClick={() => setActiveTab('outstanding')} style={{
        padding: '8px 16px',
        background: 'none',
        border: 'none',
        borderBottom: activeTab === 'outstanding' ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: activeTab === 'outstanding' ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <TrendingUp size={16} /> Still owed to us, by age
        </button>
      </div>

      <div style={{
      flex: 1,
      minHeight: 0,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)'
    }}>
        <div style={{
        padding: '16px',
        flex: 1,
        overflowY: 'auto',
        backgroundColor: 'var(--bg-primary)'
      }}>
          <DataTable
            columns={activeTab === 'invoices' ? invoiceColumns : activeTab === 'payments' ? receiptColumns : outstandingColumns}
            data={activeTab === 'invoices' ? invoices : activeTab === 'payments' ? receipts : agingData}
            isLoading={loading}
            customActions={activeTab === 'invoices' ? invoiceActionRenderer : activeTab === 'payments' ? receiptActionRenderer : null}
            emptyTitle={activeTab === 'invoices' ? 'No customer invoices yet' : activeTab === 'payments' ? 'No money received yet' : 'Nothing outstanding'}
            emptyMessage={activeTab === 'invoices'
              ? 'An invoice is the bill we send a customer. Use Raise Invoice above to make the first one.'
              : activeTab === 'payments'
                ? 'Record each payment a customer sends, then match it against their open invoices. Use Record Money Received above.'
                : 'Once invoices are raised, anything still unpaid shows here, grouped by how late it is.'}
          />
        </div>
      </div>

      {/* Modal 1: Create Customer Invoice */}
      <Modal isOpen={isInvoiceModalOpen} onClose={() => setIsInvoiceModalOpen(false)} title="Raise a customer invoice">
        <form onSubmit={handleCreateInvoice}>
          <div className="input-group">
            <label className="input-label">Which customer is this invoice for?</label>
            <select className="input-field" required value={invoiceForm.Customer_ID} onChange={e => setInvoiceForm({
            ...invoiceForm,
            Customer_ID: e.target.value
          })}>
              <option value="" disabled>Select a customer</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name || c.companyName} ({c.code || 'CUST'})</option>)}
            </select>
        {customers.length === 0 && <p style={hintStyle}>No customers yet — add one under Master Data &gt; Customers, then come back here.</p>}
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Invoice date</label>
              <input type="date" className="input-field" required value={invoiceForm.Issue_Date} onChange={e => setInvoiceForm({
              ...invoiceForm,
              Issue_Date: e.target.value
            })} />
            </div>

            <div className="input-group">
              <label className="input-label">Payment due by (cannot be before the invoice date)</label>
              <input type="date" className="input-field" required value={invoiceForm.Due_Date} onChange={e => setInvoiceForm({
              ...invoiceForm,
              Due_Date: e.target.value
            })} />
            </div>

            <div className="input-group">
              <label className="input-label">Payment terms</label>
              <select className="input-field" value={invoiceForm.Terms_ID} onChange={e => setInvoiceForm({
              ...invoiceForm,
              Terms_ID: e.target.value
            })}>
                <option value="Net 30">Pay within 30 days</option>
                <option value="Net 15">Pay within 15 days</option>
                <option value="Net 60">Pay within 60 days</option>
                <option value="Immediate">Pay on delivery</option>
              </select>
            </div>
          </div>

          {/* Line Items Section */}
          <div style={{
          border: '1px solid var(--border-color)',
          padding: '12px',
          borderRadius: '6px',
          marginTop: '12px'
        }}>
            <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
              <label className="input-label" style={{
              fontWeight: 600
            }}>What we are billing for</label>
              <button type="button" onClick={addLineItem} className="btn-icon" style={{
              fontSize: '12px',
              color: 'var(--accent-text)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
                <Plus size={14} /> Add line
              </button>
            </div>
            {invoiceForm.lineItems.map((item, index) => <div key={index} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
            gap: '8px',
            marginTop: '8px',
            alignItems: 'center'
          }}>
                <input type="text" className="input-field" placeholder="What it is for" required value={item.Description} onChange={e => {
              const newItems = [...invoiceForm.lineItems];
              newItems[index].Description = e.target.value;
              setInvoiceForm({
                ...invoiceForm,
                lineItems: newItems
              });
            }} />
                <input type="number" className="input-field" placeholder="Quantity" required min="1" value={item.Quantity} onChange={e => {
              const newItems = [...invoiceForm.lineItems];
              newItems[index].Quantity = e.target.value;
              setInvoiceForm({
                ...invoiceForm,
                lineItems: newItems
              });
            }} />
                <input type="number" className="input-field" placeholder="Price each (₹)" required min="0" step="0.01" value={item.Unit_Price} onChange={e => {
              const newItems = [...invoiceForm.lineItems];
              newItems[index].Unit_Price = e.target.value;
              setInvoiceForm({
                ...invoiceForm,
                lineItems: newItems
              });
            }} />
                <input type="text" className="input-field" placeholder="HSN code, 4 to 8 digits (optional)" value={item.HSN_Code || ''} onChange={e => {
              const newItems = [...invoiceForm.lineItems];
              newItems[index].HSN_Code = e.target.value;
              setInvoiceForm({
                ...invoiceForm,
                lineItems: newItems
              });
            }} />
                <button type="button" onClick={() => removeLineItem(index)} style={{
              background: 'none',
              border: 'none',
              color: 'var(--status-negative-fg)',
              cursor: 'pointer',
              padding: '4px'
            }} title="Remove this line">×</button>
              </div>)}
            {invoiceForm.lineItems.length === 0 && <div style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            padding: '12px 0'
          }}>No lines added yet. Use Add line above.</div>}
            
            <div style={{
            fontSize: '14px',
            marginTop: '16px',
            textAlign: 'right',
            fontWeight: 600
          }}>
              Total before tax: {fmtMoneyFull(invoiceForm.lineItems.reduce((sum, item) => sum + Number(item.Quantity || 0) * Number(item.Unit_Price || 0), 0))}
            </div>
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsInvoiceModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busyAction === 'invoice'}>{busyAction === 'invoice' ? 'Raising invoice…' : 'Raise invoice'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Record Payment Receipt */}
      <Modal isOpen={isReceiptModalOpen} onClose={() => setIsReceiptModalOpen(false)} title="Record money received from a customer">
        <form onSubmit={handleRecordReceipt}>
          <div className="input-group">
            <label className="input-label">Which customer paid?</label>
            <select className="input-field" required value={receiptForm.Customer_ID} onChange={e => setReceiptForm({
            ...receiptForm,
            Customer_ID: e.target.value
          })}>
              <option value="" disabled>Select a customer</option>
              {customers.map(c => <option key={c._id} value={c._id}>{c.name || c.companyName}</option>)}
            </select>
        {customers.length === 0 && <p style={hintStyle}>No customers yet — add one under Master Data &gt; Customers, then come back here.</p>}
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Date the money came in</label>
              <input type="date" className="input-field" required value={receiptForm.Payment_Date} onChange={e => setReceiptForm({
              ...receiptForm,
              Payment_Date: e.target.value
            })} />
            </div>

            <div className="input-group">
              <label className="input-label">Amount received (₹)</label>
              <input type="number" step="0.01" className="input-field" required min="0.01" value={receiptForm.Total_Received} onChange={e => setReceiptForm({
              ...receiptForm,
              Total_Received: e.target.value
            })} />
            </div>
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">How did they pay?</label>
              <select className="input-field" value={receiptForm.Payment_Method} onChange={e => setReceiptForm({
              ...receiptForm,
              Payment_Method: e.target.value
            })}>
                <option value="NEFT">Bank transfer (NEFT)</option>
                <option value="RTGS">Bank transfer (RTGS)</option>
                <option value="IMPS">Bank transfer (IMPS)</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Demand Draft">Demand draft</option>
                <option value="Credit Card">Card</option>
                <option value="Cash">Cash</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Reference number (bank transaction or cheque number)</label>
              <input type="text" className="input-field" placeholder="e.g. NEFT ref or cheque number" value={receiptForm.Reference_Number} onChange={e => setReceiptForm({
              ...receiptForm,
              Reference_Number: e.target.value
            })} />
            </div>
          </div>

          <div style={{
          backgroundColor: 'var(--status-info-bg)',
          border: '1px solid var(--status-info-border)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--font-caption)',
          color: 'var(--status-info-fg)',
          marginTop: 'var(--space-3)'
        }}>
            The money is held as <strong>not yet matched</strong> until you match it against one or more open invoices, on the Money received tab.
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsReceiptModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busyAction === 'receipt'}>{busyAction === 'receipt' ? 'Recording…' : 'Record money received'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Apply Payment Receipt to Invoice */}
      {selectedReceipt && <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title={`Match receipt ${selectedReceipt.Receipt_Number} to an invoice`}>
          <form onSubmit={handleApplyPayment}>
            <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
              <div>Total received: <strong>{fmtMoneyFull(selectedReceipt.Total_Received)}</strong></div>
              <div>Still to be matched: <strong style={{
              color: 'var(--status-caution-fg)'
            }}>{fmtMoneyFull(selectedReceipt.Unapplied_Amount)}</strong></div>
            </div>

            <div className="input-group">
              <label className="input-label">Which invoice does this payment settle?</label>
              <select className="input-field" required value={applyForm.Invoice_ID} onChange={e => {
            const inv = invoices.find(i => i._id === e.target.value);
            const defaultAmt = inv ? Math.min(selectedReceipt.Unapplied_Amount, inv.remainingBalance) : selectedReceipt.Unapplied_Amount;
            setApplyForm({
              Invoice_ID: e.target.value,
              Applied_Amount: defaultAmt
            });
          }}>
                <option value="" disabled>Select an unpaid invoice</option>
                {getOpenInvoicesForReceipt(selectedReceipt).map(inv => <option key={inv._id} value={inv._id}>
                    {inv.Invoice_Number} - {inv.Customer_ID?.name || inv.Customer_ID?.companyName || 'Customer'} - invoice {fmtMoneyFull(inv.Total_Amount)}, still to pay {fmtMoneyFull(inv.remainingBalance)}
                  </option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Amount to set against this invoice (₹) — cannot be more than the receipt</label>
              <input type="number" step="0.01" className="input-field" required min="0.01" max={selectedReceipt.Unapplied_Amount} value={applyForm.Applied_Amount} onChange={e => setApplyForm({
            ...applyForm,
            Applied_Amount: e.target.value
          })} />
            </div>

            <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsApplyModalOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={busyAction === 'apply'}>{busyAction === 'apply' ? 'Matching…' : 'Match to this invoice'}</button>
            </div>
          </form>
        </Modal>}
    </div>;
};
export default AccountsReceivable;