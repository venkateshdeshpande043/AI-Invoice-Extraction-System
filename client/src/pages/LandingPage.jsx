import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* ------------------------------------------------------------------ */
/* Shared landing helpers                                              */
/* ------------------------------------------------------------------ */

function Logo({ compact = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="w-9 h-9 bg-espresso rounded-md flex items-center justify-center shadow-soft transition-colors group-hover:bg-brown">
        <svg className="w-5 h-5 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <div className="leading-tight">
        <span className="font-display text-lg font-semibold text-espresso tracking-tight">
          Invoice <span className="text-brown">AI</span>
        </span>
        {!compact && (
          <span className="hidden sm:block text-[10px] uppercase tracking-[0.18em] text-taupe">
            Document Intelligence
          </span>
        )}
      </div>
    </Link>
  );
}

function SectionHeading({ eyebrow, title, description, align = 'center' }) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={`max-w-2xl ${alignment} mb-12 lg:mb-16`}>
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h2 className="font-display text-3xl sm:text-4xl font-semibold text-espresso tracking-tight leading-tight">
        {title}
      </h2>
      {description && <p className="mt-4 text-mocha leading-relaxed">{description}</p>}
    </div>
  );
}

function CheckItem({ children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 w-5 h-5 rounded-sm bg-beige/70 border border-sand flex items-center justify-center flex-shrink-0">
        <svg className="w-3 h-3 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M5 13l4 4L19 7" />
        </svg>
      </span>
      <span className="text-sm text-mocha leading-relaxed">{children}</span>
    </li>
  );
}

const CtaPrimary = ({ to, children, className = '' }) => (
  <Link
    to={to}
    className={`inline-flex items-center justify-center gap-2 rounded-md bg-espresso text-ivory px-6 py-3 text-base font-medium
      hover:bg-brown active:bg-espresso transition-colors duration-150 shadow-soft
      focus:outline-none focus-visible:ring-2 focus-visible:ring-taupe focus-visible:ring-offset-2 focus-visible:ring-offset-cream ${className}`}
  >
    {children}
  </Link>
);

const CtaSecondary = ({ to, children, className = '' }) => (
  <Link
    to={to}
    className={`inline-flex items-center justify-center gap-2 rounded-md border border-sand bg-white text-mocha px-6 py-3 text-base font-medium
      hover:border-taupe hover:text-espresso hover:bg-ivory/60 transition-colors duration-150
      focus:outline-none focus-visible:ring-2 focus-visible:ring-taupe focus-visible:ring-offset-2 ${className}`}
  >
    {children}
  </Link>
);

/* ------------------------------------------------------------------ */
/* 1. Navigation                                                       */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Intelligence', href: '#intelligence' },
  { label: 'Generate', href: '#generate' },
];

function LandingNav() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-cream border-b border-sand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <Logo />

          <nav className="hidden lg:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-mocha hover:text-espresso transition-colors duration-150"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-mocha hover:text-espresso transition-colors px-3 py-2"
            >
              Login
            </Link>
            <Link
              to={user ? '/dashboard' : '/register'}
              className="inline-flex items-center justify-center gap-2 bg-espresso text-ivory px-4 py-2 rounded-md text-sm font-medium hover:bg-brown transition-colors duration-150"
            >
              {user ? 'Open Dashboard' : 'Get Started'}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden p-2 -mr-2 text-espresso hover:bg-beige/60 rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            {open ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-sand bg-cream">
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-3 py-2.5 rounded-md text-sm font-medium text-mocha hover:bg-beige/60 hover:text-espresso transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-3 mt-3 border-t border-sand flex flex-col gap-2.5">
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="text-center px-4 py-2.5 rounded-md border border-sand bg-white text-mocha text-sm font-medium hover:text-espresso transition-colors"
              >
                Login
              </Link>
              <Link
                to={user ? '/dashboard' : '/register'}
                onClick={() => setOpen(false)}
                className="text-center px-4 py-2.5 rounded-md bg-espresso text-ivory text-sm font-medium hover:bg-brown transition-colors"
              >
                {user ? 'Open Dashboard' : 'Get Started'}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* 2. Hero                                                             */
/* ------------------------------------------------------------------ */

function Hero() {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden">
      {/* subtle warm wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-ivory/70 via-cream to-cream pointer-events-none" aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid lg:grid-cols-2 gap-14 lg:gap-16 items-center">
          {/* Copy */}
          <div>
            <p className="eyebrow mb-5">Document intelligence for finance teams</p>
            <h1 className="font-display text-4xl sm:text-5xl xl:text-[3.4rem] font-semibold text-espresso tracking-tight leading-[1.08]">
              Every invoice,{' '}
              <em className="text-brown not-italic font-display italic">extracted, validated</em> and
              understood.
            </h1>
            <p className="mt-6 text-lg text-mocha leading-relaxed max-w-xl">
              Invoice AI reads your invoice images and PDFs with OCR, pulls every field out with
              natural-language processing, checks the numbers for consistency — then organises
              payments, vendors, due dates and insights in one calm, professional workspace.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              {user ? (
                <>
                  <CtaPrimary to="/dashboard">Open Dashboard</CtaPrimary>
                  <CtaSecondary to="/generate">New Invoice</CtaSecondary>
                </>
              ) : (
                <>
                  <CtaPrimary to="/register">Get Started</CtaPrimary>
                  <CtaSecondary to="/login">Login</CtaSecondary>
                </>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-taupe">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                </svg>
                JPG, PNG &amp; PDF uploads
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                </svg>
                PaddleOCR-powered extraction
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                </svg>
                GST / VAT aware
              </span>
            </div>
          </div>

          {/* Document visual */}
          <div className="relative lg:pl-6" aria-hidden="true">
            <div className="hidden sm:block absolute -top-3 -right-2 w-full h-full max-w-md bg-beige border border-sand rounded-md rotate-3" />

            <div className="relative bg-white border border-sand shadow-lift rounded-md overflow-hidden">
              {/* Header band */}
              <div className="bg-ivory border-b border-sand px-6 py-5 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-taupe mb-1">Invoice</p>
                  <p className="font-display text-xl font-semibold text-espresso leading-tight">Aster &amp; Co. Trading</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-semibold text-espresso tracking-[0.1em]">INVOICE</p>
                  <p className="text-[11px] text-mocha mt-1 tabnum"># INV-2026-118</p>
                </div>
              </div>

              <div className="px-6 py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-taupe mb-1">Bill to</p>
                    <p className="text-sm font-medium text-espresso">Sable Retail Pvt Ltd</p>
                    <p className="text-[11px] text-mocha mt-0.5">GSTIN: 27AAPFU0939F1ZV</p>
                  </div>
                  <dl className="text-right text-[11px] space-y-0.5">
                    <div className="flex gap-3">
                      <dt className="text-taupe">Date</dt>
                      <dd className="text-espresso tabnum">05 Aug 2026</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="text-taupe">Due</dt>
                      <dd className="text-espresso tabnum">19 Aug 2026</dd>
                    </div>
                  </dl>
                </div>

                {/* Line items */}
                <table className="mt-4 w-full text-[11px]">
                  <thead>
                    <tr className="bg-espresso text-cream">
                      <th className="text-left font-semibold uppercase tracking-[0.1em] px-3 py-1.5">Description</th>
                      <th className="text-right font-semibold uppercase tracking-[0.1em] px-3 py-1.5">Qty</th>
                      <th className="text-right font-semibold uppercase tracking-[0.1em] px-3 py-1.5">Rate</th>
                      <th className="text-right font-semibold uppercase tracking-[0.1em] px-3 py-1.5">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand/50">
                    <tr className="bg-ivory/40">
                      <td className="px-3 py-2 text-espresso">Hardware shipment</td>
                      <td className="px-3 py-2 text-right tabnum text-espresso">12</td>
                      <td className="px-3 py-2 text-right tabnum text-espresso">3,500</td>
                      <td className="px-3 py-2 text-right tabnum font-medium text-espresso">42,000</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-espresso">Logistics &amp; freight</td>
                      <td className="px-3 py-2 text-right tabnum text-espresso">1</td>
                      <td className="px-3 py-2 text-right tabnum text-espresso">8,000</td>
                      <td className="px-3 py-2 text-right tabnum font-medium text-espresso">8,000</td>
                    </tr>
                    <tr className="bg-ivory/40">
                      <td className="px-3 py-2 text-espresso">Packaging materials</td>
                      <td className="px-3 py-2 text-right tabnum text-espresso">20</td>
                      <td className="px-3 py-2 text-right tabnum text-espresso">900</td>
                      <td className="px-3 py-2 text-right tabnum font-medium text-espresso">18,000</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div className="mt-4 flex justify-end">
                  <dl className="w-52 space-y-1 text-[11px]">
                    <div className="flex justify-between text-mocha">
                      <dt>Subtotal</dt>
                      <dd className="tabnum">₹68,000</dd>
                    </div>
                    <div className="flex justify-between text-mocha">
                      <dt>Tax (18%)</dt>
                      <dd className="tabnum">₹12,240</dd>
                    </div>
                    <div className="mt-1 flex justify-between bg-espresso text-cream font-semibold px-3 py-1.5 rounded-sm">
                      <dt>Total</dt>
                      <dd className="tabnum">₹80,240</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="px-6 py-3 border-t border-sand/60 bg-cream/60 text-center">
                <p className="text-[10px] text-taupe tracking-wide">
                  Extracted from Aster_Aug2026.pdf · validated · stored
                </p>
              </div>
            </div>

            {/* Floating extraction chips */}
            <div className="hidden md:flex absolute -left-4 top-10 items-center gap-1.5 bg-white border border-sand shadow-soft rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brown" />
              <span className="text-[11px] font-medium text-espresso">OCR · text extracted</span>
            </div>
            <div className="hidden md:flex absolute -right-3 bottom-16 items-center gap-1.5 bg-white border border-sand shadow-soft rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rust" />
              <span className="text-[11px] font-medium text-espresso">Validated · GST 18%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Capability strip                                                    */
/* ------------------------------------------------------------------ */

const CAPABILITIES = [
  { label: 'OCR Extraction' },
  { label: 'NLP Parsing' },
  { label: 'Validation' },
  { label: 'Payments' },
  { label: 'Insights' },
  { label: 'PDF Generation' },
];

function CapabilityStrip() {
  return (
    <section className="border-y border-sand bg-ivory/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
        <ul className="flex flex-wrap items-center justify-center lg:justify-between gap-x-8 gap-y-3">
          {CAPABILITIES.map((cap) => (
            <li key={cap.label} className="flex items-center gap-2 text-sm font-medium text-brown">
              <svg className="w-4 h-4 text-taupe" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 13l4 4L19 7" />
              </svg>
              {cap.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. AI Invoice Extraction                                            */
/* ------------------------------------------------------------------ */

const PIPELINE = [
  {
    step: '01',
    title: 'Upload',
    description: 'Drop in a JPG, PNG or PDF invoice — scanned or digital.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    ),
  },
  {
    step: '02',
    title: 'OCR',
    description: 'PaddleOCR reads the text from every page, including scanned PDFs.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 7V4h16v3M9 20h6M12 4v16" />
    ),
  },
  {
    step: '03',
    title: 'NLP extraction',
    description: 'Regex-based parsing maps raw text to invoice fields.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    ),
  },
  {
    step: '04',
    title: 'Validation',
    description: 'Cross-field checks flag totals, tax and date inconsistencies.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    step: '05',
    title: 'Structured data',
    description: 'A clean, searchable invoice record — ready to manage.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M4 5h16M4 10h16M4 15h10M4 20h7" />
    ),
  },
];

function ExtractionSection() {
  return (
    <section id="intelligence" className="scroll-mt-24 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="AI invoice extraction"
          title="From document to structured data"
          description="The core pipeline: your invoice enters as an image or PDF and comes out as clean, structured records — no typing, no spreadsheets, no re-keying."
        />

        {/* Pipeline */}
        <div className="flex flex-col md:flex-row items-stretch gap-3 lg:gap-0">
          {PIPELINE.map((step, idx) => (
            <div key={step.step} className="flex flex-col md:flex-row items-stretch flex-1 gap-3 lg:gap-0">
              <div className="flex-1 bg-white border border-sand rounded-md p-5 hover:border-taupe hover:shadow-soft transition-all duration-200">
                <p className="eyebrow mb-3">{step.step}</p>
                <div className="w-8 h-8 rounded-md bg-beige/70 border border-sand flex items-center justify-center text-brown mb-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {step.icon}
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-espresso mb-1">{step.title}</h3>
                <p className="text-xs text-mocha leading-relaxed">{step.description}</p>
              </div>
              {idx < PIPELINE.length - 1 && (
                <div className="hidden md:flex items-center justify-center px-1 text-taupe" aria-hidden="true">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7l5 5-5 5M6 12h12" />
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Details */}
        <div className="mt-14 grid lg:grid-cols-2 gap-10">
          <div className="bg-white border border-sand rounded-md p-7">
            <p className="eyebrow mb-4">Fields extracted automatically</p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {[
                'Invoice number',
                'Vendor name',
                'Invoice & due dates',
                'GST / VAT number & rate',
                'Line items (qty, rate, amount)',
                'Subtotal, tax & discount',
                'Total & currency',
                'PO number',
                'Customer name',
                'Payment terms',
              ].map((field) => (
                <CheckItem key={field}>{field}</CheckItem>
              ))}
            </ul>
          </div>
          <div className="bg-white border border-sand rounded-md p-7">
            <p className="eyebrow mb-4">Under the hood</p>
            <ul className="space-y-3 text-sm text-mocha leading-relaxed">
              <CheckItem>
                <strong className="text-espresso font-medium">PaddleOCR microservice</strong> — a
                dedicated OCR engine (FastAPI) that reads text from images and PDFs, with graceful
                fallback for text-based PDFs.
              </CheckItem>
              <CheckItem>
                <strong className="text-espresso font-medium">Scanned PDFs</strong> — pages are
                rendered and OCR&apos;d individually, so even scanned documents extract cleanly.
              </CheckItem>
              <CheckItem>
                <strong className="text-espresso font-medium">Multi-currency support</strong> — INR,
                USD, EUR and GBP amounts are detected and formatted per invoice.
              </CheckItem>
              <CheckItem>
                <strong className="text-espresso font-medium">No third-party OCR cloud</strong> — the
                pipeline runs in your own deployment; documents are not sent to external vision APIs.
              </CheckItem>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 4. Smart Invoice Management                                         */
/* ------------------------------------------------------------------ */

function ManagementSection() {
  const rows = [
    { number: 'INV-2026-118', vendor: 'Aster & Co. Trading', due: '19 Aug', amount: '₹80,240', status: ['Overdue', 'bg-rose-100 text-rose-900 border-rose-200'] },
    { number: 'INV-2026-117', vendor: 'Northline Supplies', due: '24 Aug', amount: '₹45,600', status: ['Partial', 'bg-amber-100 text-amber-900 border-amber-200'] },
    { number: 'INV-2026-116', vendor: 'Kaveri Textiles', due: '02 Aug', amount: '₹1,12,300', status: ['Paid', 'bg-emerald-100 text-emerald-900 border-emerald-200'] },
    { number: 'INV-2026-115', vendor: 'Meridian Freight', due: '31 Aug', amount: '₹27,850', status: ['Unpaid', 'bg-ivory text-brown border-sand'] },
  ];

  return (
    <section id="features" className="scroll-mt-24 py-20 lg:py-28 bg-ivory/40 border-y border-sand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Smart invoice management"
              title="A history you can actually work with"
              description="Every extracted or generated invoice lands in one searchable ledger — with the payment and due-date picture always in view."
            />
            <ul className="space-y-3.5 -mt-4">
              <CheckItem>Search invoices by number or vendor, and filter by status, date and amount</CheckItem>
              <CheckItem>Vendor profiles aggregated automatically from your invoices — spend, outstanding, GSTIN, history</CheckItem>
              <CheckItem>Payment tracking with paid, partial, unpaid and overdue states</CheckItem>
              <CheckItem>Due-date monitoring with upcoming and overdue alerts on the dashboard</CheckItem>
              <CheckItem>Bulk export of any filtered list as CSV or JSON</CheckItem>
            </ul>
          </div>

          {/* Ledger mock */}
          <div className="bg-white border border-sand shadow-lift rounded-md overflow-hidden">
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-sand/60">
              <div>
                <p className="eyebrow mb-1">All invoices</p>
                <p className="text-sm font-semibold text-espresso">Recent documents</p>
              </div>
              <span className="text-[11px] text-taupe border border-sand rounded-full px-2.5 py-1">Sample workspace</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-ivory/60">
                  <tr>
                    <th className="table-head">Invoice</th>
                    <th className="table-head">Vendor</th>
                    <th className="table-head">Due</th>
                    <th className="table-head text-right">Amount</th>
                    <th className="table-head">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/40">
                  {rows.map((row) => (
                    <tr key={row.number} className="hover:bg-ivory/40 transition-colors">
                      <td className="px-4 py-2.5 text-sm font-medium text-brown tabnum">{row.number}</td>
                      <td className="px-4 py-2.5 text-sm text-espresso">{row.vendor}</td>
                      <td className="px-4 py-2.5 text-sm text-mocha tabnum">{row.due}</td>
                      <td className="px-4 py-2.5 text-sm text-espresso text-right tabnum">{row.amount}</td>
                      <td className="px-4 py-2.5">
                        <span className={`status-pill ${row.status[1]}`}>{row.status[0]}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-sand/60 text-center">
              <p className="text-[11px] text-taupe">Search · filter · sort · export — just like the app</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5. Intelligent Validation                                           */
/* ------------------------------------------------------------------ */

function ValidationSection() {
  const issues = [
    { severity: 'Anomaly', chip: 'bg-amber-100 text-amber-900 border-amber-200', text: 'Total ₹80,240 differs from line-item sum by ₹40' },
    { severity: 'Warning', chip: 'bg-rose-100 text-rose-900 border-rose-200', text: 'Implied tax rate 18.2% vs declared 18% — within tolerance' },
    { severity: 'Info', chip: 'bg-ivory text-brown border-sand', text: 'Possible duplicate of INV-2026-109 — same vendor, number and amount' },
    { severity: 'Info', chip: 'bg-ivory text-brown border-sand', text: 'PO number missing on this document' },
  ];

  return (
    <section id="validation" className="scroll-mt-24 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Validation report mock */}
          <div className="bg-white border border-sand shadow-lift rounded-md overflow-hidden order-2 lg:order-1">
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-sand/60">
              <div>
                <p className="eyebrow mb-1">Validation report</p>
                <p className="text-sm font-semibold text-espresso">INV-2026-118 · needs review</p>
              </div>
              <span className="status-pill bg-amber-100 text-amber-900 border-amber-200">Review</span>
            </div>
            <ul className="divide-y divide-sand/40">
              {issues.map((issue) => (
                <li key={issue.text} className="flex items-start gap-3 px-6 py-3.5">
                  <span className={`mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2 py-0.5 border ${issue.chip}`}>
                    {issue.severity}
                  </span>
                  <p className="text-sm text-mocha leading-relaxed">{issue.text}</p>
                </li>
              ))}
            </ul>
            <div className="px-6 py-3 border-t border-sand/60 bg-cream/60">
              <p className="text-[11px] text-taupe">Checked: totals · tax · GST rate · dates · duplicates · missing fields</p>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <SectionHeading
              align="left"
              eyebrow="Intelligent validation"
              title="Numbers that check themselves"
              description="After extraction, every document passes through a validation engine that looks for the inconsistencies that cause real-world accounting pain."
            />
            <ul className="space-y-3.5 -mt-4">
              <CheckItem>Subtotal + tax − discount verified against the extracted total</CheckItem>
              <CheckItem>GST / VAT rate consistency — implied rate vs declared rate</CheckItem>
              <CheckItem>Date sanity checks on invoice and due dates</CheckItem>
              <CheckItem>Line-item math errors and suspicious values</CheckItem>
              <CheckItem>Duplicate detection across your own invoice history</CheckItem>
              <CheckItem>Missing-field flags (number, vendor, date, amount)</CheckItem>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6. Analytics                                                        */
/* ------------------------------------------------------------------ */

function AnalyticsSection() {
  const bars = [
    { month: 'Mar', count: 5 },
    { month: 'Apr', count: 8 },
    { month: 'May', count: 7 },
    { month: 'Jun', count: 11 },
    { month: 'Jul', count: 9 },
    { month: 'Aug', count: 12 },
  ];
  const vendors = [
    { name: 'Aster & Co. Trading', spend: 264000, max: 264000 },
    { name: 'Northline Supplies', spend: 158400, max: 264000 },
    { name: 'Kaveri Textiles', spend: 112300, max: 264000 },
  ];

  return (
    <section id="analytics" className="scroll-mt-24 py-20 lg:py-28 bg-ivory/40 border-y border-sand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Analytics & reporting"
              title="Know your numbers at a glance"
              description="The dashboard turns your invoice history into the figures finance actually asks about — no spreadsheet gymnastics required."
            />
            <ul className="space-y-3.5 -mt-4">
              <CheckItem>Total invoices, issued value, paid and outstanding amounts</CheckItem>
              <CheckItem>Overdue and upcoming-payment views with day counts</CheckItem>
              <CheckItem>Top vendors with spend share and concentration</CheckItem>
              <CheckItem>GST / tax summary — total tax, taxed invoices, average rate</CheckItem>
              <CheckItem>Monthly volume and issued-vs-paid cash-flow trends</CheckItem>
            </ul>
          </div>

          {/* Analytics mock */}
          <div className="bg-white border border-sand shadow-lift rounded-md overflow-hidden">
            <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-sand/60">
              <div>
                <p className="eyebrow mb-1">Dashboard</p>
                <p className="text-sm font-semibold text-espresso">Financial overview</p>
              </div>
              <span className="text-[11px] text-taupe border border-sand rounded-full px-2.5 py-1">Sample workspace</span>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Invoices', value: '42' },
                  { label: 'Outstanding', value: '₹1,86,400' },
                  { label: 'Paid', value: '₹4,02,100' },
                  { label: 'Overdue', value: '3' },
                ].map((stat) => (
                  <div key={stat.label} className="border border-sand rounded-md p-3 bg-cream/50">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-taupe">{stat.label}</p>
                    <p className="mt-1 text-base font-display font-semibold text-espresso tabnum">{stat.value}</p>
                  </div>
                ))}
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-taupe mt-6 mb-3">Invoices by month</p>
              <div className="flex items-end gap-2 h-24">
                {bars.map((bar) => {
                  const max = Math.max(...bars.map((b) => b.count));
                  return (
                    <div key={bar.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-mocha tabnum">{bar.count}</span>
                      <div
                        className="w-full bg-espresso hover:bg-brown transition-colors duration-200 rounded-sm"
                        style={{ height: `${(bar.count / max) * 100}%` }}
                      />
                      <span className="text-[10px] text-taupe">{bar.month}</span>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-taupe mt-6 mb-3">Top vendors</p>
              <ul className="space-y-3">
                {vendors.map((vendor) => (
                  <li key={vendor.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-brown font-medium">{vendor.name}</span>
                      <span className="text-espresso tabnum font-medium">₹{vendor.spend.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="h-1.5 bg-beige rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brown rounded-full transition-all duration-500"
                        style={{ width: `${(vendor.spend / vendor.max) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. Ask Invoice AI                                                   */
/* ------------------------------------------------------------------ */

function AskAiSection() {
  return (
    <section id="ask" className="scroll-mt-24 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Ask Invoice AI"
              title="Questions answered from your own data"
              description="Ask in plain language and get answers computed from your actual invoices in the workspace — not a generic chatbot with canned replies."
            />
            <ul className="space-y-3.5 -mt-4">
              <CheckItem>How much money is outstanding?</CheckItem>
              <CheckItem>Which invoices are overdue — or due this week?</CheckItem>
              <CheckItem>Which vendor has the highest invoice amount?</CheckItem>
              <CheckItem>How much GST did I pay this month?</CheckItem>
              <CheckItem>Show invoices above a certain amount</CheckItem>
            </ul>
            <p className="mt-6 text-xs text-taupe leading-relaxed max-w-md">
              Answers are derived from your invoice data with a rule-based intent engine — no
              external LLM or cloud dependency. The service is designed so a language model can be
              plugged in later without rebuilding the feature.
            </p>
          </div>

          {/* Chat mock */}
          <div className="bg-white border border-sand shadow-lift rounded-md overflow-hidden">
            <div className="px-6 pt-5 pb-3 border-b border-sand/60 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-espresso flex items-center justify-center">
                <svg className="w-4 h-4 text-ivory" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-espresso">Ask Invoice AI</p>
                <p className="text-[11px] text-taupe">Computed from your invoice data</p>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-espresso text-ivory rounded-md rounded-br-sm px-4 py-2.5">
                  <p className="text-sm">How much money is outstanding?</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-md bg-beige/70 border border-sand flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-brown" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 border border-sand/70 rounded-md p-4 bg-cream/40">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-taupe border border-sand/70 rounded-full px-2 py-0.5">
                      Outstanding balance
                    </span>
                    <span className="text-[10px] text-taupe uppercase tracking-[0.14em]">Rule-based on your data</span>
                  </div>
                  <p className="text-sm text-espresso leading-relaxed">
                    You have <strong className="font-semibold">₹2,53,300</strong> outstanding across{' '}
                    <strong className="font-semibold">3 open invoices</strong>.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pl-10">
                {['Which invoices are overdue?', 'Which vendor has the highest invoice amount?', 'How much GST did I pay this month?'].map((chip) => (
                  <span
                    key={chip}
                    className="text-xs text-brown border border-sand/80 bg-ivory/40 rounded-full px-3 py-1"
                  >
                    {chip}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 8. Create Professional Invoices                                     */
/* ------------------------------------------------------------------ */

function GenerateSection() {
  return (
    <section id="generate" className="scroll-mt-24 py-20 lg:py-28 bg-ivory/40 border-y border-sand">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <SectionHeading
              align="left"
              eyebrow="Invoice generation"
              title="Create professional invoices in minutes"
              description="Compose an invoice from scratch — or for the documents you receive. Line items, GST, discounts and totals are computed as you type, with a live preview that becomes a polished PDF."
            />
            <ul className="space-y-3.5 -mt-4">
              <CheckItem>Line items with quantity, unit price and auto-computed amounts</CheckItem>
              <CheckItem>GST / tax rates, discounts, subtotal and grand total</CheckItem>
              <CheckItem>Invoice and due dates, notes and payment terms</CheckItem>
              <CheckItem>Classic and minimal templates with live preview</CheckItem>
              <CheckItem>One-click PDF download — styled to match your documents</CheckItem>
              <CheckItem>Saved invoices flow into the same ledger, tagged as generated</CheckItem>
            </ul>
          </div>

          {/* Generated invoice preview mock */}
          <div>
            <div className="bg-white border border-sand shadow-lift rounded-md overflow-hidden">
              <div className="bg-ivory border-b border-sand/70 px-6 py-5 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-taupe mb-1">Invoice</p>
                  <p className="font-display text-xl font-semibold text-espresso">Invoice AI Inc</p>
                  <p className="mt-1 text-[11px] text-mocha">100 Finance Lane, Mumbai · billing@invoiceai.app</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-semibold text-espresso tracking-[0.1em]">INVOICE</p>
                  <p className="text-[11px] text-mocha mt-1 tabnum">INV-00101</p>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-taupe mb-1">Bill to</p>
                <p className="text-sm font-medium text-espresso">Acme Corp</p>
                <p className="text-[11px] text-mocha mt-0.5">GSTIN: 27AAPFU0939F1ZV · PO # PO-2201</p>

                <table className="mt-4 w-full text-[11px]">
                  <thead>
                    <tr className="bg-espresso text-cream">
                      <th className="text-left font-semibold uppercase tracking-[0.1em] px-3 py-1.5">Description</th>
                      <th className="text-right font-semibold uppercase tracking-[0.1em] px-3 py-1.5">Qty</th>
                      <th className="text-right font-semibold uppercase tracking-[0.1em] px-3 py-1.5">Rate</th>
                      <th className="text-right font-semibold uppercase tracking-[0.1em] px-3 py-1.5">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand/50">
                    <tr className="bg-ivory/40">
                      <td className="px-3 py-2 text-espresso">Consulting services</td>
                      <td className="px-3 py-2 text-right tabnum text-espresso">5</td>
                      <td className="px-3 py-2 text-right tabnum text-espresso">20,000</td>
                      <td className="px-3 py-2 text-right tabnum font-medium text-espresso">1,00,000</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-espresso">Design sprint</td>
                      <td className="px-3 py-2 text-right tabnum text-espresso">1</td>
                      <td className="px-3 py-2 text-right tabnum text-espresso">15,000</td>
                      <td className="px-3 py-2 text-right tabnum font-medium text-espresso">15,000</td>
                    </tr>
                  </tbody>
                </table>

                <div className="mt-4 flex justify-end">
                  <dl className="w-52 space-y-1 text-[11px]">
                    <div className="flex justify-between text-mocha">
                      <dt>Subtotal</dt>
                      <dd className="tabnum">₹1,15,000</dd>
                    </div>
                    <div className="flex justify-between text-mocha">
                      <dt>Discount</dt>
                      <dd className="tabnum">−₹500</dd>
                    </div>
                    <div className="flex justify-between text-mocha">
                      <dt>Tax (18%)</dt>
                      <dd className="tabnum">₹20,700</dd>
                    </div>
                    <div className="mt-1 flex justify-between bg-espresso text-cream font-semibold px-3 py-1.5 rounded-sm">
                      <dt>Total</dt>
                      <dd className="tabnum">₹1,35,200</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="px-6 py-3 border-t border-sand/60 bg-cream/60 flex items-center justify-between">
                <p className="text-[10px] text-taupe">Terms: Due within 30 days.</p>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-brown">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download PDF
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 9. How It Works                                                     */
/* ------------------------------------------------------------------ */

const STEPS = [
  { n: '01', title: 'Upload', text: 'Add an invoice image or PDF to your workspace.' },
  { n: '02', title: 'Extract', text: 'OCR and NLP turn the document into structured fields.' },
  { n: '03', title: 'Validate', text: 'Totals, tax and dates are checked for consistency.' },
  { n: '04', title: 'Analyze', text: 'Dashboard analytics and insights surface the trends.' },
  { n: '05', title: 'Manage & generate', text: 'Track payments, vendors, due dates — or create new invoices.' },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="scroll-mt-24 py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="Five steps from document to decisions"
          description="A workflow that matches how finance actually operates — capture it once, trust it from there."
        />
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {STEPS.map((step) => (
            <div key={step.n} className="bg-white border border-sand rounded-md p-5 hover:border-taupe hover:shadow-soft transition-all duration-200">
              <p className="font-display text-2xl font-semibold text-taupe tabnum">{step.n}</p>
              <h3 className="mt-3 text-sm font-semibold text-espresso">{step.title}</h3>
              <p className="mt-1.5 text-xs text-mocha leading-relaxed">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 10. Final CTA                                                       */
/* ------------------------------------------------------------------ */

function FinalCta() {
  const { user } = useAuth();
  return (
    <section className="pb-20 lg:pb-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-espresso rounded-lg px-6 py-14 sm:px-14 text-center relative overflow-hidden">
          <div
            className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-taupe/60 to-transparent"
            aria-hidden="true"
          />
          <p className="eyebrow mb-4 text-taupe">Invoice AI</p>
          <h2 className="font-display text-3xl sm:text-4xl font-semibold text-cream tracking-tight max-w-2xl mx-auto leading-tight">
            Start managing your invoices intelligently.
          </h2>
          <p className="mt-4 text-ivory/80 max-w-xl mx-auto leading-relaxed">
            Upload a document and Invoice AI will extract, validate and organise it — then keep
            payments, vendors, due dates and insights in one place.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <CtaPrimary to="/dashboard" className="bg-ivory text-espresso hover:bg-white">
                Open Dashboard
              </CtaPrimary>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-ivory text-espresso px-6 py-3 text-base font-medium hover:bg-white transition-colors duration-150"
              >
                Get Started
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7l5 5-5 5M6 12h12" />
                </svg>
              </Link>
            )}
            <Link
              to={user ? '/dashboard' : '/login'}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-taupe/50 text-ivory px-6 py-3 text-base font-medium hover:border-taupe hover:bg-white/5 transition-colors duration-150"
            >
              {user ? 'Go to Dashboard' : 'Login'}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 11. Footer                                                          */
/* ------------------------------------------------------------------ */

function Footer() {
  return (
    <footer className="border-t border-sand bg-ivory/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-mocha leading-relaxed max-w-sm">
              Intelligent invoice extraction and document management — OCR, validation, payments,
              analytics and generation in one warm, professional workspace.
            </p>
          </div>
          <div>
            <p className="eyebrow mb-4">Product</p>
            <ul className="space-y-2.5">
              <li><a href="#features" className="text-sm text-mocha hover:text-espresso transition-colors">Features</a></li>
              <li><a href="#intelligence" className="text-sm text-mocha hover:text-espresso transition-colors">Intelligence</a></li>
              <li><a href="#how-it-works" className="text-sm text-mocha hover:text-espresso transition-colors">How It Works</a></li>
              <li><a href="#generate" className="text-sm text-mocha hover:text-espresso transition-colors">Invoice Generation</a></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-4">Account</p>
            <ul className="space-y-2.5">
              <li><Link to="/login" className="text-sm text-mocha hover:text-espresso transition-colors">Login</Link></li>
              <li><Link to="/register" className="text-sm text-mocha hover:text-espresso transition-colors">Sign Up</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-sand/70 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-taupe">© 2026 Invoice AI. All rights reserved.</p>
          <p className="text-xs text-taupe">PaddleOCR · Node.js · Express · MongoDB</p>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function LandingPage() {
  return (
    <div className="min-h-screen bg-cream text-espresso font-sans">
      <LandingNav />
      <main>
        <Hero />
        <CapabilityStrip />
        <ExtractionSection />
        <ManagementSection />
        <ValidationSection />
        <AnalyticsSection />
        <AskAiSection />
        <GenerateSection />
        <HowItWorksSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
