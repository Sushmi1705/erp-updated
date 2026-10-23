import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CreditCard, FileText, TrendingDown, IndianRupee, Plus } from 'lucide-react';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';
import { fmtMoneyFull } from '../../utils/money';
import { notify } from '../../utils/notify';

/* Guidance, not an error: nothing has failed — the record simply does not exist
   yet, and the sentence has to name what to create and where. Caution amber. */
const hintStyle = {
  color: 'var(--status-caution-fg)',
  fontSize: 'var(--font-caption)',
  marginTop: 'var(--space-2)',
  lineHeight: 'var(--leading-normal)'
};
const AccountsPayable = () => {
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [agingData, setAgingData] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('bills'); // bills, payments, outstanding
  // Every save here talks to the server. Naming the work in the button is what
  // stops a user pressing Save three times on a slow line.
  const [busyAction, setBusyAction] = useState(null);

  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [billForm, setBillForm] = useState({
    Vendor_ID: '',
    Vendor_Invoice_Number: '',
    Bill_Date: new Date().toISOString().split('T')[0],
    Due_Date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    Terms_ID: 'Net 30',
    lineItems: []
  });
  const [paymentForm, setPaymentForm] = useState({
    Vendor_ID: '',
    Payment_Date: new Date().toISOString().split('T')[0],
    Total_Paid: 1000,
    Payment_Method: 'NEFT',
    Reference_Number: ''
  });
  const [applyForm, setApplyForm] = useState({
    Bill_ID: '',
    Applied_Amount: 0
  });
  useEffect(() => {
    fetchDependencies();
    fetchData();
  }, [activeTab]);
  const fetchDependencies = async () => {
    try {
      const vendRes = await axios.get('/master/vendor');
      if (vendRes.data?.data) setVendors(vendRes.data.data);
    } catch (err) {
      console.error('Dependencies fetch error', err);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'bills') {
        const res = await axios.get('/finance/v2/ap/bills');
        setBills(res.data.data);
      } else if (activeTab === 'payments') {
        const res = await axios.get('/finance/v2/ap/payments');
        setPayments(res.data.data);
        const billRes = await axios.get('/finance/v2/ap/bills');
        setBills(billRes.data.data);
      } else if (activeTab === 'outstanding') {
        const res = await axios.get('/finance/v2/ap/aging');
        setAgingData(res.data.data);
      }
    } catch (err) {
      console.error('Data fetch error', err);
    }
    setLoading(false);
  };
  const handleCreateBill = async e => {
    e.preventDefault();
    if (billForm.lineItems.length === 0) {
      notify.warning('Add at least one line to the bill before saving.');
      return;
    }
    setBusyAction('bill');
    try {
      await axios.post('/finance/v2/ap/bills', billForm);
      setIsBillModalOpen(false);
      // Clear it rather than leaving the last bill in the box. Carrying a
      // supplier's invoice number over to the next entry is how the wrong
      // number ends up against the wrong bill.
      setBillForm({
        Vendor_ID: '',
        Vendor_Invoice_Number: '',
        Bill_Date: new Date().toISOString().split('T')[0],
        Due_Date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        Terms_ID: 'Net 30',
        lineItems: []
      });
      notify.success('Supplier bill recorded.');
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error creating vendor bill');
    }
    setBusyAction(null);
  };
  const addLineItem = () => {
    setBillForm({
      ...billForm,
      lineItems: [...billForm.lineItems, {
        Description: '',
        Quantity: 1,
        Unit_Price: 0,
        HSN_Code: ''
      }]
    });
  };
  const removeLineItem = index => {
    const newItems = [...billForm.lineItems];
    newItems.splice(index, 1);
    setBillForm({
      ...billForm,
      lineItems: newItems
    });
  };
  const handleRecordPayment = async e => {
    e.preventDefault();
    setBusyAction('payment');
    try {
      await axios.post('/finance/v2/ap/payments', paymentForm);
      setIsPaymentModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error recording vendor payment');
    }
    setBusyAction(null);
  };
  const handleApplyPayment = async e => {
    e.preventDefault();
    setBusyAction('apply');
    try {
      await axios.post(`/finance/v2/ap/payments/${selectedPayment._id}/apply`, applyForm);
      setIsApplyModalOpen(false);
      fetchData();
    } catch (err) {
      notify.error(err.response?.data?.message || 'Error applying payment to bill');
    }
    setBusyAction(null);
  };
  const paymentActionRenderer = row => {
    if (row.Unapplied_Amount <= 0) return <span style={{
      fontSize: '11px',
      color: 'var(--text-secondary)',
      fontWeight: 600
    }}>All of it matched to bills</span>;
    return <button onClick={async () => {
      setSelectedPayment(row);
      try {
        const billRes = await axios.get('/finance/v2/ap/bills');
        if (billRes.data?.data) setBills(billRes.data.data);
      } catch (err) {
        console.error('Error fetching open bills', err);
      }
      setApplyForm({
        Bill_ID: '',
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
        <IndianRupee size={12} /> Match to a bill
      </button>;
  };
  const getOpenBillsForPayment = pay => {
    if (!bills || bills.length === 0) return [];
    const openBills = bills.filter(b => b.Status !== 'Cancelled' && b.Status !== 'Paid' && (b.remainingBalance === undefined || b.remainingBalance > 0));
    if (!pay) return openBills;
    const payVendId = String(pay.Vendor_ID?._id || pay.Vendor_ID || '');
    const matched = openBills.filter(b => {
      const billVendId = String(b.Vendor_ID?._id || b.Vendor_ID || '');
      return payVendId && billVendId && payVendId === billVendId;
    });
    return matched.length > 0 ? matched : openBills;
  };
  const billColumns = [{
    header: 'Bill number',
    render: row => <strong>{row.Bill_Number || row.Bill_ID}</strong>
  }, {
    header: 'Supplier',
    render: row => <div>
        <strong>{row.Vendor_ID?.name || row.Vendor_ID?.companyName || 'Vendor'}</strong>
        <div style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>{row.Vendor_ID?.code || 'VEND'}</div>
      </div>
  }, {
    header: 'Bill date',
    render: row => new Date(row.Bill_Date).toLocaleDateString()
  }, {
    header: 'We must pay by',
    render: row => <span style={{
      color: new Date(row.Due_Date) < new Date() && row.Status !== 'Paid' ? 'var(--status-caution-fg)' : 'inherit',
      fontWeight: new Date(row.Due_Date) < new Date() && row.Status !== 'Paid' ? 600 : 400
    }}>
        {new Date(row.Due_Date).toLocaleDateString()}
      </span>
  }, {
    header: 'Bill amount',
    align: 'right',
    render: row => <strong>{fmtMoneyFull(row.Total_Amount)}</strong>
  }, {
    header: 'Still to pay',
    align: 'right',
    render: row => <span style={{
      color: row.remainingBalance > 0 ? 'var(--status-caution-fg)' : 'var(--text-secondary)',
      fontWeight: 600
    }}>{fmtMoneyFull(row.remainingBalance)}</span>
  }, {
    header: 'Status',
    render: row => <StatusBadge value={row.Status} />
  }];
  const paymentColumns = [{
    header: 'Payment number',
    render: row => <strong>{row.Payment_Number || row.Payment_ID}</strong>
  }, {
    header: 'Supplier',
    render: row => <span>{row.Vendor_ID?.name || row.Vendor_ID?.companyName || 'Vendor'}</span>
  }, {
    header: 'Paid on',
    render: row => new Date(row.Payment_Date).toLocaleDateString()
  }, {
    header: 'Amount paid',
    align: 'right',
    render: row => <strong>{fmtMoneyFull(row.Total_Paid)}</strong>
  }, {
    header: 'How we paid',
    render: row => <span style={{
      fontSize: '12px'
    }}>{row.Payment_Method}{row.Reference_Number ? ` (${row.Reference_Number})` : ''}</span>
  }, {
    header: 'Not yet matched to a bill',
    align: 'right',
    render: row => <strong style={{
      color: row.Unapplied_Amount > 0 ? 'var(--status-caution-fg)' : 'var(--text-secondary)'
    }}>{fmtMoneyFull(row.Unapplied_Amount)}</strong>
  }, {
    header: 'Status',
    render: row => <StatusBadge value={row.Status} />
  }];
  const outstandingColumns = [{
    header: 'Supplier',
    render: row => <div>
        <strong>{row.vendorName}</strong>
        <div style={{
        fontSize: '11px',
        color: 'var(--text-secondary)'
      }}>Code {row.vendorCode}</div>
      </div>
  }, {
    header: 'Billed to us this year',
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
    header: 'Total we owe',
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
        }}>Money Out (Payable)</h1>
          <p style={{
          fontSize: '12px',
          color: 'var(--text-secondary)'
        }}>Bills received from suppliers, payments we have made against them, and what we still owe. Used by accounts staff.</p>
        </div>
        {activeTab === 'bills' && <button className="btn btn-primary" onClick={() => setIsBillModalOpen(true)}>
            <FileText size={14} /> Record Supplier Bill
          </button>}
        {activeTab === 'payments' && <button className="btn btn-primary" onClick={() => setIsPaymentModalOpen(true)}>
            <CreditCard size={14} /> Record Payment Made
          </button>}
      </div>

      {/* Tabs matching screenshot design */}
      <div style={{
      display: 'flex',
      gap: '16px',
      marginBottom: '16px',
      borderBottom: '1px solid var(--border-color)'
    }}>
        <button role="tab" aria-selected={activeTab === 'bills'} onClick={() => setActiveTab('bills')} style={{
        padding: '8px 16px',
        background: 'none',
        border: 'none',
        borderBottom: activeTab === 'bills' ? '2px solid var(--accent-primary)' : '2px solid transparent',
        color: activeTab === 'bills' ? 'var(--accent-primary)' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontWeight: 500,
        fontSize: '13px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
          <FileText size={16} /> Bills from suppliers
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
          <CreditCard size={16} /> Payments we made
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
          <TrendingDown size={16} /> Still owed by us, by age
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
            columns={activeTab === 'bills' ? billColumns : activeTab === 'payments' ? paymentColumns : outstandingColumns}
            data={activeTab === 'bills' ? bills : activeTab === 'payments' ? payments : agingData}
            isLoading={loading}
            customActions={activeTab === 'payments' ? paymentActionRenderer : null}
            emptyTitle={activeTab === 'bills' ? 'No supplier bills yet' : activeTab === 'payments' ? 'No payments made yet' : 'Nothing outstanding'}
            emptyMessage={activeTab === 'bills'
              ? 'A bill is what a supplier charges us. Use Record Supplier Bill above to enter the first one.'
              : activeTab === 'payments'
                ? 'Record each payment we send a supplier, then match it against their open bills. Use Record Payment Made above.'
                : 'Once bills are entered, anything still unpaid shows here, grouped by how late it is.'}
          />
        </div>
      </div>

      {/* Modal 1: Create Vendor Bill */}
      <Modal isOpen={isBillModalOpen} onClose={() => setIsBillModalOpen(false)} title="Record a supplier bill">
        <form onSubmit={handleCreateBill}>
          <div className="input-group">
            <label className="input-label">Which supplier sent this bill?</label>
            <select className="input-field" required value={billForm.Vendor_ID} onChange={e => setBillForm({
            ...billForm,
            Vendor_ID: e.target.value
          })}>
              <option value="" disabled>Select a supplier</option>
              {vendors.map(v => <option key={v._id} value={v._id}>{v.name || v.companyName} ({v.code || 'VEND'})</option>)}
            </select>
        {vendors.length === 0 && <p style={hintStyle}>No suppliers yet — add one under Master Data &gt; Vendors, then come back here.</p>}
          </div>

          {/* The number printed on the supplier's own invoice. This is what
              lets the system catch the same bill being keyed twice, and what
              the GST purchase register is reconciled on. */}
          <div className="input-group">
            <label className="input-label">Supplier&apos;s invoice number</label>
            <input
              type="text"
              className="input-field"
              placeholder="As printed on their bill, e.g. KSL/26-27/4471"
              value={billForm.Vendor_Invoice_Number}
              onChange={e => setBillForm({ ...billForm, Vendor_Invoice_Number: e.target.value })}
            />
            <p style={hintStyle}>
              Their number, not ours. Recording it stops the same bill being paid twice and is what GST returns are matched on.
            </p>
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Bill date</label>
              <input type="date" className="input-field" required value={billForm.Bill_Date} onChange={e => setBillForm({
              ...billForm,
              Bill_Date: e.target.value
            })} />
            </div>

            <div className="input-group">
              <label className="input-label">We must pay by (cannot be before the bill date)</label>
              <input type="date" className="input-field" required value={billForm.Due_Date} onChange={e => setBillForm({
              ...billForm,
              Due_Date: e.target.value
            })} />
            </div>

            <div className="input-group">
              <label className="input-label">Payment terms</label>
              <select className="input-field" value={billForm.Terms_ID} onChange={e => setBillForm({
              ...billForm,
              Terms_ID: e.target.value
            })}>
                <option value="Net 30">Pay within 30 days</option>
                <option value="Net 15">Pay within 15 days</option>
                <option value="Net 60">Pay within 60 days</option>
                <option value="Due on Receipt">Pay on receipt</option>
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
            }}>What the supplier is charging for</label>
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
            {billForm.lineItems.map((item, index) => <div key={index} style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
            gap: '8px',
            marginTop: '8px',
            alignItems: 'center'
          }}>
                <input type="text" className="input-field" placeholder="What it is for" required value={item.Description} onChange={e => {
              const newItems = [...billForm.lineItems];
              newItems[index].Description = e.target.value;
              setBillForm({
                ...billForm,
                lineItems: newItems
              });
            }} />
                <input type="number" className="input-field" placeholder="Quantity" required min="1" value={item.Quantity} onChange={e => {
              const newItems = [...billForm.lineItems];
              newItems[index].Quantity = e.target.value;
              setBillForm({
                ...billForm,
                lineItems: newItems
              });
            }} />
                <input type="number" className="input-field" placeholder="Price each (₹)" required min="0" step="0.01" value={item.Unit_Price} onChange={e => {
              const newItems = [...billForm.lineItems];
              newItems[index].Unit_Price = e.target.value;
              setBillForm({
                ...billForm,
                lineItems: newItems
              });
            }} />
                <input type="text" className="input-field" placeholder="HSN code, 4 to 8 digits (optional)" value={item.HSN_Code || ''} onChange={e => {
              const newItems = [...billForm.lineItems];
              newItems[index].HSN_Code = e.target.value;
              setBillForm({
                ...billForm,
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
            {billForm.lineItems.length === 0 && <div style={{
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
              Total before tax: {fmtMoneyFull(billForm.lineItems.reduce((sum, item) => sum + Number(item.Quantity || 0) * Number(item.Unit_Price || 0), 0))}
            </div>
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsBillModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busyAction === 'bill'}>{busyAction === 'bill' ? 'Saving bill…' : 'Save supplier bill'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Record Vendor Payment */}
      <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title="Record a payment made to a supplier">
        <form onSubmit={handleRecordPayment}>
          <div className="input-group">
            <label className="input-label">Which supplier were we paying?</label>
            <select className="input-field" required value={paymentForm.Vendor_ID} onChange={e => setPaymentForm({
            ...paymentForm,
            Vendor_ID: e.target.value
          })}>
              <option value="" disabled>Select a supplier</option>
              {vendors.map(v => <option key={v._id} value={v._id}>{v.name || v.companyName}</option>)}
            </select>
        {vendors.length === 0 && <p style={hintStyle}>No suppliers yet — add one under Master Data &gt; Vendors, then come back here.</p>}
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">Date we paid</label>
              <input type="date" className="input-field" required value={paymentForm.Payment_Date} onChange={e => setPaymentForm({
              ...paymentForm,
              Payment_Date: e.target.value
            })} />
            </div>

            <div className="input-group">
              <label className="input-label">Amount paid (₹)</label>
              <input type="number" step="0.01" className="input-field" required min="0.01" value={paymentForm.Total_Paid} onChange={e => setPaymentForm({
              ...paymentForm,
              Total_Paid: e.target.value
            })} />
            </div>
          </div>

          <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
            <div className="input-group">
              <label className="input-label">How we paid</label>
              <select className="input-field" value={paymentForm.Payment_Method} onChange={e => setPaymentForm({
              ...paymentForm,
              Payment_Method: e.target.value
            })}>
                <option value="NEFT">Bank transfer (NEFT)</option>
                <option value="RTGS">Bank transfer (RTGS)</option>
                <option value="IMPS">Bank transfer (IMPS)</option>
                <option value="UPI">UPI</option>
                <option value="Cheque">Cheque</option>
                <option value="Demand Draft">Demand draft</option>
                <option value="Credit Card">Card</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Reference number (bank transaction or cheque number)</label>
              <input type="text" className="input-field" placeholder="e.g. NEFT ref or cheque number" value={paymentForm.Reference_Number} onChange={e => setPaymentForm({
              ...paymentForm,
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
            The payment is held as <strong>not yet matched</strong> until you match it against one or more open supplier bills, on the Payments we made tab.
          </div>

          <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem',
          marginTop: '2rem'
        }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPaymentModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busyAction === 'payment'}>{busyAction === 'payment' ? 'Recording…' : 'Record payment made'}</button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Apply Vendor Payment to Bill */}
      {selectedPayment && <Modal isOpen={isApplyModalOpen} onClose={() => setIsApplyModalOpen(false)} title={`Match payment ${selectedPayment.Payment_Number} to a bill`}>
          <form onSubmit={handleApplyPayment}>
            <div style={{
          backgroundColor: 'var(--bg-tertiary)',
          padding: '12px',
          borderRadius: '6px',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
              <div>Total paid: <strong>{fmtMoneyFull(selectedPayment.Total_Paid)}</strong></div>
              <div>Still to be matched: <strong style={{
              color: 'var(--status-caution-fg)'
            }}>{fmtMoneyFull(selectedPayment.Unapplied_Amount)}</strong></div>
            </div>

            <div className="input-group">
              <label className="input-label">Which bill does this payment settle?</label>
              <select className="input-field" required value={applyForm.Bill_ID} onChange={e => {
            const bill = bills.find(b => b._id === e.target.value);
            const defaultAmt = bill ? Math.min(selectedPayment.Unapplied_Amount, bill.remainingBalance) : selectedPayment.Unapplied_Amount;
            setApplyForm({
              Bill_ID: e.target.value,
              Applied_Amount: defaultAmt
            });
          }}>
                <option value="" disabled>Select an unpaid bill</option>
                {getOpenBillsForPayment(selectedPayment).map(bill => <option key={bill._id} value={bill._id}>
                    {bill.Bill_Number} - {bill.Vendor_ID?.name || bill.Vendor_ID?.companyName || 'Supplier'} - bill {fmtMoneyFull(bill.Total_Amount)}, still to pay {fmtMoneyFull(bill.remainingBalance)}
                  </option>)}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Amount to set against this bill (₹) — cannot be more than the payment</label>
              <input type="number" step="0.01" className="input-field" required min="0.01" max={selectedPayment.Unapplied_Amount} value={applyForm.Applied_Amount} onChange={e => setApplyForm({
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
              <button type="submit" className="btn btn-primary" disabled={busyAction === 'apply'}>{busyAction === 'apply' ? 'Matching…' : 'Match to this bill'}</button>
            </div>
          </form>
        </Modal>}
    </div>;
};
export default AccountsPayable;