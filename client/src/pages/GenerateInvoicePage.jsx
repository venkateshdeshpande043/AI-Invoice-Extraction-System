import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageHeader from '../components/common/PageHeader';
import Button from '../components/common/Button';
import Toast from '../components/common/Toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import LineItemsEditor from '../components/generate/LineItemsEditor';
import InvoicePreview from '../components/generate/InvoicePreview';
import api from '../services/api';
import { API_ENDPOINTS, GST_RATES, INVOICE_TEMPLATES } from '../utils/constants';

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const EMPTY_FORM = {
  seller: { name: '', address: '', phone: '', email: '', gstVatNumber: '' },
  customerName: '',
  customerGstin: '',
  invoiceNumber: '',
  invoiceDate: today(),
  dueDate: addDays(today(), 30),
  poNumber: '',
  taxRate: '18',
  discount: '',
  currency: 'INR',
  notes: '',
  paymentTerms: 'Due within 30 days of the invoice date.',
  template: 'classic',
  lineItems: [{ description: '', quantity: 1, unitPrice: '', amount: '' }],
};

function Section({ title, subtitle, children }) {
  return (
    <section className="card p-6">
      <h2 className="text-base font-semibold text-espresso mb-1">{title}</h2>
      {subtitle && <p className="text-sm text-mocha mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </section>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-sm font-medium text-mocha">{label}</label>
      {children}
    </div>
  );
}

function GenerateInvoicePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loadingNumber, setLoadingNumber] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setSeller = (key, value) =>
    setForm((prev) => ({ ...prev, seller: { ...prev.seller, [key]: value } }));

  // Suggest the next sequential invoice number for this user.
  useEffect(() => {
    const fetchNext = async () => {
      try {
        const res = await api.get(API_ENDPOINTS.INVOICES.GENERATE_NEXT);
        set('invoiceNumber', res.data.data.invoiceNumber);
      } catch {
        // Fall back to the default placeholder if the backend is unreachable.
      } finally {
        setLoadingNumber(false);
      }
    };
    fetchNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const payload = useMemo(
    () => ({
      seller: {
        name: form.seller.name.trim(),
        address: form.seller.address.trim(),
        phone: form.seller.phone.trim(),
        email: form.seller.email.trim(),
        gstVatNumber: form.seller.gstVatNumber.trim(),
      },
      customerName: form.customerName.trim(),
      customerGstin: form.customerGstin.trim(),
      invoiceNumber: form.invoiceNumber.trim(),
      invoiceDate: form.invoiceDate,
      dueDate: form.dueDate,
      poNumber: form.poNumber.trim(),
      taxRate: form.taxRate === '' ? null : form.taxRate,
      discount: form.discount === '' ? null : form.discount,
      currency: form.currency || 'INR',
      notes: form.notes.trim(),
      paymentTerms: form.paymentTerms.trim(),
      template: form.template,
      lineItems: form.lineItems
        .map((item) => ({
          description: item.description.trim(),
          quantity: item.quantity === '' ? 0 : item.quantity,
          unitPrice: item.unitPrice === '' ? 0 : item.unitPrice,
          amount: item.amount === '' ? undefined : item.amount,
        }))
        .filter((item) => item.description || item.amount != null),
    }),
    [form]
  );

  const createInvoice = async () => {
    const res = await api.post(API_ENDPOINTS.INVOICES.GENERATE, payload);
    return res.data.data;
  };

  const downloadPdf = async (invoiceId) => {
    const res = await api.get(API_ENDPOINTS.INVOICES.PDF(invoiceId), { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoice-${payload.invoiceNumber || invoiceId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleSave = async (download = false) => {
    setSaving(true);
    try {
      const invoice = await createInvoice();
      setToast({
        visible: true,
        message: `Invoice ${invoice.invoiceNumber} saved.`,
        type: 'success',
      });
      if (download) {
        await downloadPdf(invoice._id);
      }
      setTimeout(() => navigate(`/invoices/${invoice._id}`), 700);
    } catch (err) {
      setToast({
        visible: true,
        message: err.response?.data?.message || 'Failed to save invoice.',
        type: 'error',
      });
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      <PageHeader
        eyebrow="Create"
        title="New Invoice"
        subtitle="Compose a professional invoice, preview it live, then save it or download the PDF."
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? 'Saving…' : 'Save only'}
            </Button>
            <Button variant="primary" onClick={() => handleSave(true)} disabled={saving}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              {saving ? 'Saving…' : 'Save & Download PDF'}
            </Button>
          </div>
        }
      />

      {loadingNumber && (
        <LoadingSpinner size="sm" message="Reserving next invoice number…" />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* ── Form column ─────────────────────────────────────── */}
        <div className="space-y-6">
          <Section title="Business details" subtitle="The seller shown at the top of the document.">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Business name" className="sm:col-span-2">
                <input
                  className="input-field"
                  value={form.seller.name}
                  onChange={(e) => setSeller('name', e.target.value)}
                  placeholder="Your company name"
                />
              </Field>
              <Field label="Address" className="sm:col-span-2">
                <input
                  className="input-field"
                  value={form.seller.address}
                  onChange={(e) => setSeller('address', e.target.value)}
                  placeholder="Street, city, state"
                />
              </Field>
              <Field label="Phone">
                <input
                  className="input-field"
                  value={form.seller.phone}
                  onChange={(e) => setSeller('phone', e.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  className="input-field"
                  type="email"
                  value={form.seller.email}
                  onChange={(e) => setSeller('email', e.target.value)}
                />
              </Field>
              <Field label="GSTIN / VAT number" className="sm:col-span-2">
                <input
                  className="input-field"
                  value={form.seller.gstVatNumber}
                  onChange={(e) => setSeller('gstVatNumber', e.target.value)}
                  placeholder="e.g. 27AABCU9603R1ZM"
                />
              </Field>
            </div>
          </Section>

          <Section title="Customer" subtitle="Who is this invoice billed to?">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Customer name" className="sm:col-span-2">
                <input
                  className="input-field"
                  value={form.customerName}
                  onChange={(e) => set('customerName', e.target.value)}
                  placeholder="Client / company name"
                  required
                />
              </Field>
              <Field label="Customer GSTIN">
                <input
                  className="input-field"
                  value={form.customerGstin}
                  onChange={(e) => set('customerGstin', e.target.value)}
                />
              </Field>
              <Field label="PO number">
                <input
                  className="input-field"
                  value={form.poNumber}
                  onChange={(e) => set('poNumber', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Invoice details">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Invoice number">
                <input
                  className="input-field"
                  value={form.invoiceNumber}
                  onChange={(e) => set('invoiceNumber', e.target.value)}
                  placeholder="INV-00001"
                />
              </Field>
              <Field label="Currency">
                <select
                  className="input-field"
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                >
                  <option value="INR">INR — Indian Rupee</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
              </Field>
              <Field label="Invoice date">
                <input
                  type="date"
                  className="input-field"
                  value={form.invoiceDate}
                  onChange={(e) => set('invoiceDate', e.target.value)}
                />
              </Field>
              <Field label="Due date">
                <input
                  type="date"
                  className="input-field"
                  value={form.dueDate}
                  onChange={(e) => set('dueDate', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          <Section title="Line items" subtitle="Quantities and rates are computed automatically.">
            <LineItemsEditor
              items={form.lineItems}
              onChange={(items) => set('lineItems', items)}
              currency={form.currency}
            />
            <div className="mt-5 grid sm:grid-cols-3 gap-4 border-t border-sand/60 pt-4">
              <Field label="GST rate">
                <select
                  className="input-field"
                  value={form.taxRate}
                  onChange={(e) => set('taxRate', e.target.value)}
                >
                  {GST_RATES.map((rate) => (
                    <option key={rate.value} value={rate.value}>
                      {rate.label}
                    </option>
                  ))}
                  <option value="">No tax</option>
                </select>
              </Field>
              <Field label="Discount">
                <input
                  type="number"
                  min="0"
                  step="any"
                  className="input-field tabnum"
                  value={form.discount}
                  onChange={(e) => set('discount', e.target.value)}
                  placeholder="0"
                />
              </Field>
              <Field label="Template">
                <select
                  className="input-field"
                  value={form.template}
                  onChange={(e) => set('template', e.target.value)}
                >
                  {INVOICE_TEMPLATES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-3 text-xs text-taupe">
              {INVOICE_TEMPLATES.find((t) => t.value === form.template)?.description}
            </div>
          </Section>

          <Section title="Notes & terms">
            <div className="space-y-4">
              <Field label="Notes (optional)">
                <textarea
                  className="input-field min-h-[72px]"
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="Thank you for your business…"
                />
              </Field>
              <Field label="Payment terms">
                <input
                  className="input-field"
                  value={form.paymentTerms}
                  onChange={(e) => set('paymentTerms', e.target.value)}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* ── Preview column ──────────────────────────────────── */}
        <div className="xl:sticky xl:top-24 self-start">
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow">Live preview</p>
            <span className="text-[11px] text-taupe uppercase tracking-[0.12em]">
              {INVOICE_TEMPLATES.find((t) => t.value === form.template)?.label} template
            </span>
          </div>
          <InvoicePreview data={payload} />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default GenerateInvoicePage;
