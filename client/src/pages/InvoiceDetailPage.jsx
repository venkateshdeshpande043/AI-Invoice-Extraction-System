import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import InvoiceDetail from '../components/invoice/InvoiceDetail';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Toast from '../components/common/Toast';
import PageHeader from '../components/common/PageHeader';
import { useInvoices } from '../hooks/useInvoices';
import { PAYMENT_METHODS } from '../utils/constants';
import api from '../services/api';

function InvoiceDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getInvoice, updatePayment } = useInvoices();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amountPaid: '', paidDate: '', paymentMethod: 'bank_transfer' });
  const [savingPayment, setSavingPayment] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const data = await getInvoice(id);
        setInvoice(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = async (format) => {
    try {
      const res = await api.get(`/invoices/${id}/export?format=${format}`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${id}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setToast({ visible: true, message: 'Export failed. Please try again.', type: 'error' });
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoice?.invoiceNumber || id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setToast({ visible: true, message: 'Could not generate the PDF. Please try again.', type: 'error' });
    }
  };

  const openPayment = () => {
    const remaining = Math.max((invoice.totalAmount || 0) - (invoice.amountPaid || 0), 0);
    setPaymentForm({
      amountPaid: remaining > 0 ? String(remaining) : '',
      paidDate: new Date().toISOString().slice(0, 10),
      paymentMethod: invoice.paymentMethod || 'bank_transfer',
    });
    setPaymentOpen(true);
  };

  const submitPayment = async () => {
    const amount = parseFloat(paymentForm.amountPaid);
    if (isNaN(amount) || amount < 0) {
      setToast({ visible: true, message: 'Enter a valid payment amount.', type: 'error' });
      return;
    }
    setSavingPayment(true);
    try {
      const updated = await updatePayment(id, {
        amountPaid: amount,
        paidDate: paymentForm.paidDate || new Date().toISOString(),
        paymentMethod: paymentForm.paymentMethod,
      });
      setInvoice(updated);
      setPaymentOpen(false);
      setToast({ visible: true, message: 'Payment recorded.', type: 'success' });
    } catch (err) {
      setToast({
        visible: true,
        message: err.response?.data?.message || 'Failed to record payment.',
        type: 'error',
      });
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner size="lg" message="Loading invoice..." />
      </DashboardLayout>
    );
  }

  if (error || !invoice) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-rust mb-4">{error || 'Invoice not found'}</p>
          <Button onClick={() => navigate('/invoices')}>Back to Invoices</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      <button
        onClick={() => navigate('/invoices')}
        className="text-sm text-mocha hover:text-espresso mb-6 flex items-center gap-1.5 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Invoices
      </button>

      <PageHeader
        eyebrow={invoice.source === 'generated' ? 'Document · Generated' : 'Document'}
        title={invoice.invoiceNumber || 'Unnumbered Invoice'}
        subtitle={invoice.vendorName || invoice.customerName || 'Unknown party'}
        actions={
          <Button variant="secondary" onClick={handleDownloadPdf}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download PDF
          </Button>
        }
      />

      <div className="max-w-4xl">
        <InvoiceDetail invoice={invoice} onExport={handleExport} onRecordPayment={openPayment} />
      </div>

      <Modal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        title="Record payment"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-mocha">
            Record a payment against this invoice. Enter the full balance to mark it as paid.
          </p>
          <Input
            label="Amount paid"
            name="amountPaid"
            type="number"
            min="0"
            step="0.01"
            value={paymentForm.amountPaid}
            onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
            required
          />
          <Input
            label="Payment date"
            name="paidDate"
            type="date"
            value={paymentForm.paidDate}
            onChange={(e) => setPaymentForm({ ...paymentForm, paidDate: e.target.value })}
            required
          />
          <div className="space-y-1">
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-mocha">
              Method
            </label>
            <select
              id="paymentMethod"
              value={paymentForm.paymentMethod}
              onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
              className="input-field"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setPaymentOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitPayment} disabled={savingPayment}>
              {savingPayment ? 'Saving...' : 'Save payment'}
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

export default InvoiceDetailPage;
