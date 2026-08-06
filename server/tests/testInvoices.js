/**
 * Test invoice OCR text scenarios.
 * Each scenario has:
 *   - name:        human-readable description
 *   - text:        simulated OCR output
 *   - expected:    ground-truth fields that should be extracted
 *   - optional:    fields that may or may not be present (not penalized)
 *
 * Covers: Acme, TechCorp, GlobalShip, GreenEnergy, and other vendors
 * Layouts: standard, minimalist, dense (multicolumn), table-free, image-only
 */

const testInvoices = [
  // ---------------------------------------------------------------------------
  // 1. Standard Acme Corporation invoice (the baseline)
  // ---------------------------------------------------------------------------
  {
    name: 'Standard Acme Invoice',
    text: [
      'INVOICE #INV-2024-001',
      'Bill From: Acme Corporation',
      '123 Business Street, City, State 12345',
      'GSTIN: 27AABCU9603R1ZX',
      'Invoice Date: 15/01/2024',
      'Due Date: 14/02/2024',
      '',
      'Description         Qty   Rate   Amount',
      'Widget A             10   50.00  500.00',
      'Widget B              5   30.00  150.00',
      '',
      'Subtotal: 650.00',
      'Tax (10%): 65.00',
      'Total: 715.00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-2024-001',
      vendorName: 'Acme Corporation',
      invoiceDate: '2024-01-15',
      dueDate: '2024-02-14',
      gstVatNumber: '27AABCU9603R1ZX',
      gstRate: 10,
      subtotal: 650,
      tax: 65,
      totalAmount: 715,
      currency: 'INR',
      lineItems: [
        { description: 'Widget A', quantity: 10, unitPrice: 50, amount: 500 },
        { description: 'Widget B', quantity: 5, unitPrice: 30, amount: 150 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 2. TechCorp — USD, multiple line items, PO number
  // ---------------------------------------------------------------------------
  {
    name: 'TechCorp PO with USD',
    text: [
      'TECHCORP SOLUTIONS',
      '123 Tech Drive, San Francisco, CA 94105',
      'INVOICE: INV-2024-0456',
      'PO Number: PO-2024-7890',
      'Bill To: XYZ Corp',
      '',
      'Invoice Date: 03/12/2024',
      'Due Date: 02/01/2025',
      '',
      'Item                   Qty     Price     Amount',
      'Server Rack              2  1500.00   3000.00',
      'Switch 48-Port           4   450.00   1800.00',
      'Cable Cat6 (100ft)      10    12.50    125.00',
      '',
      'Subtotal: 4925.00',
      'Tax (8.5%): 418.63',
      'Total: $5,343.63',
      '',
      'VAT: GB123456789',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-2024-0456',
      vendorName: 'Techcorp Solutions',
      invoiceDate: '2024-12-03',
      dueDate: '2025-01-02',
      gstVatNumber: 'GB123456789',
      gstRate: 8.5,
      subtotal: 4925,
      tax: 418.63,
      totalAmount: 5343.63,
      currency: 'USD',
      poNumber: 'PO-2024-7890',
      customerName: 'XYZ Corp',
      lineItems: [
        { description: 'Server Rack', quantity: 2, unitPrice: 1500, amount: 3000 },
        { description: 'Switch 48-Port', quantity: 4, unitPrice: 450, amount: 1800 },
        { description: 'Cable Cat6 (100ft)', quantity: 10, unitPrice: 12.5, amount: 125 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 3. GlobalShip Logistics — EUR, discount, multi-currency
  // ---------------------------------------------------------------------------
  {
    name: 'GlobalShip Logistics with Discount',
    text: [
      'GlobalShip Logistics GmbH',
      'Hafenstrasse 42, Hamburg, Germany',
      '',
      'Rechnung # GS-EU-2024-331',
      'Invoice Date: 22.11.2024',
      'Due Date: 22.12.2024',
      'Customer: Musterfirma AG',
      'PO Ref: PO-2024-1122',
      '',
      'Service                   Qty     Rate     Amount',
      'Sea Freight FCL 40ft        1  2500.00   2500.00',
      'Customs Clearance           1   450.00    450.00',
      'Warehousing (days)         10    75.00    750.00',
      '',
      'Subtotal: 3700.00',
      'Discount (5%): -185.00',
      'Tax (19%): 667.85',
      'Total: 4182.85',
      '',
      'VAT: DE123456789',
    ].join('\n'),
    expected: {
      invoiceNumber: 'GS-EU-2024-331',
      vendorName: 'GlobalShip Logistics GmbH',
      invoiceDate: '2024-11-22',
      dueDate: '2024-12-22',
      gstVatNumber: 'DE123456789',
      gstRate: 19,
      subtotal: 3700,
      discount: 185,
      tax: 667.85,
      totalAmount: 4182.85,
      currency: 'EUR',
      poNumber: 'PO-2024-1122',
      customerName: 'Musterfirma AG',
      lineItems: [
        { description: 'Sea Freight FCL 40ft', quantity: 1, unitPrice: 2500, amount: 2500 },
        { description: 'Customs Clearance', quantity: 1, unitPrice: 450, amount: 450 },
        { description: 'Warehousing (days)', quantity: 10, unitPrice: 75, amount: 750 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 4. GreenEnergy Ltd — GBP, no line items table (paragraph style)
  // ---------------------------------------------------------------------------
  {
    name: 'GreenEnergy Paragraph Style',
    text: [
      'INVOICE',
      'GreenEnergy Ltd',
      '12 Solar Avenue, Oxford, UK',
      'Invoice Number: INV-GE-2024-889',
      'Invoice Date: 01/08/2024',
      'Due Date: 31/08/2024',
      'Customer: Oxford Uni',
      '',
      'Installation of 24 solar panels at South Lab: 24 x £450.00 = £10,800.00',
      'Battery storage system: 2 x £2,500.00 = £5,000.00',
      '',
      'Subtotal: GBP 15,800.00',
      'VAT (20%): 3,160.00',
      'Total Due: £18,960.00',
      '',
      'VAT Reg: GB123456789',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-GE-2024-889',
      vendorName: 'GreenEnergy Ltd',
      invoiceDate: '2024-08-01',
      dueDate: '2024-08-31',
      gstVatNumber: 'GB123456789',
      gstRate: 20,
      subtotal: 15800,
      tax: 3160,
      totalAmount: 18960,
      currency: 'GBP',
      customerName: 'Oxford Uni',
    },
  },

  // ---------------------------------------------------------------------------
  // 5. Minimalist — labels on same line, no table headers
  // ---------------------------------------------------------------------------
  {
    name: 'Minimalist Invoice',
    text: [
      'INV-2024-MIN-001',
      'Vendor: MiniMart Supplies',
      'Date: 2024-06-15  Due: 2024-07-15',
      'GST: 29ABCDE1234F1Z5',
      '',
      'Pens 100 2.50 250.00',
      'Notebooks 50 5.00 250.00',
      '',
      'Subtotal 500.00',
      'GST @12% 60.00',
      'Total 560.00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-2024-MIN-001',
      vendorName: 'MiniMart Supplies',
      invoiceDate: '2024-06-15',
      dueDate: '2024-07-15',
      gstVatNumber: '29ABCDE1234F1Z5',
      gstRate: 12,
      subtotal: 500,
      tax: 60,
      totalAmount: 560,
      currency: 'INR',
      lineItems: [
        { description: 'Pens', quantity: 100, unitPrice: 2.5, amount: 250 },
        { description: 'Notebooks', quantity: 50, unitPrice: 5, amount: 250 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 6. Dense table — no header row, multi-word descriptions with spaces
  // ---------------------------------------------------------------------------
  {
    name: 'Dense Table No Header',
    text: [
      'INVOICE NO: INV-24-999',
      'From: OfficeDepot Inc.',
      'Date: 12/12/2024 Due: 11/01/2025',
      '',
      'Premium Paper Box   20   8.50   170.00',
      'Toner Cartridge      5  45.00   225.00',
      'Stapler Set         15   6.00    90.00',
      '',
      'Subtotal: 485.00',
      'Tax: 38.80',
      'Total: 523.80',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-24-999',
      vendorName: 'OfficeDepot Inc.',
      invoiceDate: '2024-12-12',
      dueDate: '2025-01-11',
      subtotal: 485,
      tax: 38.8,
      totalAmount: 523.8,
      currency: 'INR',
      lineItems: [
        { description: 'Premium Paper Box', quantity: 20, unitPrice: 8.5, amount: 170 },
        { description: 'Toner Cartridge', quantity: 5, unitPrice: 45, amount: 225 },
        { description: 'Stapler Set', quantity: 15, unitPrice: 6, amount: 90 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 7. Indian GST format with HSN codes
  // ---------------------------------------------------------------------------
  {
    name: 'Indian GST Invoice with HSN',
    text: [
      'TAX INVOICE',
      'Seller: Bharat Electronics',
      'GSTIN: 27AABCU9603R1ZX',
      'Invoice No: GST-2024-0056',
      'Date: 05/05/2024',
      '',
      'HSN Code    Desc            Qty  Rate   Amount',
      '84713000    Laptop            5  45000  225000',
      '84716000    Keyboard         10   1500   15000',
      '',
      'Subtotal: 240000',
      'CGST @9%: 21600',
      'SGST @9%: 21600',
      'Total: 283200',
      '',
      'PO: PO-BH-2024-123',
    ].join('\n'),
    expected: {
      invoiceNumber: 'GST-2024-0056',
      vendorName: 'Bharat Electronics',
      invoiceDate: '2024-05-05',
      gstVatNumber: '27AABCU9603R1ZX',
      gstRate: 18,
      subtotal: 240000,
      tax: 43200,
      totalAmount: 283200,
      currency: 'INR',
      poNumber: 'PO-BH-2024-123',
      lineItems: [
        { description: 'Laptop', quantity: 5, unitPrice: 45000, amount: 225000 },
        { description: 'Keyboard', quantity: 10, unitPrice: 1500, amount: 15000 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 8. Due date as Net30
  // ---------------------------------------------------------------------------
  {
    name: 'Net30 Payment Terms',
    text: [
      'INV-2024-NET-001',
      'Supplier: Quality Parts Co.',
      'Invoice Date: January 15, 2024',
      'Terms: Net 30',
      '',
      'Item         Qty  Price   Total',
      'Bolt M10     500   0.50   250.00',
      'Nut M10      500   0.30   150.00',
      'Washer M10  1000   0.10   100.00',
      '',
      'Subtotal: 500.00',
      'Tax: 40.00',
      'Total: 540.00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-2024-NET-001',
      vendorName: 'Quality Parts Co.',
      invoiceDate: '2024-01-15',
      dueDate: '2024-02-14',
      subtotal: 500,
      tax: 40,
      totalAmount: 540,
      currency: 'INR',
      lineItems: [
        { description: 'Bolt M10', quantity: 500, unitPrice: 0.5, amount: 250 },
        { description: 'Nut M10', quantity: 500, unitPrice: 0.3, amount: 150 },
        { description: 'Washer M10', quantity: 1000, unitPrice: 0.1, amount: 100 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 9. Single line item, no line item table
  // ---------------------------------------------------------------------------
  {
    name: 'Single Line Item Flat',
    text: [
      'INVOICE: SI-001',
      'Vendor: Simple Services Ltd',
      'Date: 20/03/2024',
      'Description: Web development services for March 2024',
      'Amount: 5,000.00',
      'GST (18%): 900.00',
      'Total: 5,900.00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'SI-001',
      vendorName: 'Simple Services Ltd',
      invoiceDate: '2024-03-20',
      gstRate: 18,
      subtotal: 5000,
      tax: 900,
      totalAmount: 5900,
      currency: 'INR',
    },
  },

  // ---------------------------------------------------------------------------
  // 10. Customer name with multiple labels
  // ---------------------------------------------------------------------------
  {
    name: 'Multiple Customer Labels',
    text: [
      'INV-2024-CUST-005',
      'From: MegaCorp Industries',
      'Bill To: Acme Retail Store',
      'Ship To: Acme Warehouse #3',
      'Date: 10/10/2024',
      'PO: PO-ACME-2024-456',
      '',
      'Items             Qty    Rate    Amount',
      'Office Chairs       10  120.00   1200.00',
      'Desk Lamps          20   25.00    500.00',
      '',
      'Subtotal: 1700.00',
      'Tax (10%): 170.00',
      'Total Due: 1,870.00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-2024-CUST-005',
      vendorName: 'MegaCorp Industries',
      customerName: 'Acme Retail Store',
      invoiceDate: '2024-10-10',
      poNumber: 'PO-ACME-2024-456',
      subtotal: 1700,
      tax: 170,
      totalAmount: 1870,
      currency: 'INR',
      lineItems: [
        { description: 'Office Chairs', quantity: 10, unitPrice: 120, amount: 1200 },
        { description: 'Desk Lamps', quantity: 20, unitPrice: 25, amount: 500 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 11. USD with $ symbol in amounts
  // ---------------------------------------------------------------------------
  {
    name: 'USD Dollar Amounts',
    text: [
      'Invoice: INV-USD-2024-001',
      'Vendor: CloudHost Inc.',
      'Date: 06/06/2024',
      'Due: 06/07/2024',
      '',
      'Service              Hours   Rate     Amount',
      'AWS Architecture        10   $200    $2,000.00',
      'Security Audit           5   $350    $1,750.00',
      '',
      'Subtotal: $3,750.00',
      'Tax (0%): $0.00',
      'Total: $3,750.00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-USD-2024-001',
      vendorName: 'CloudHost Inc.',
      invoiceDate: '2024-06-06',
      dueDate: '2024-07-06',
      subtotal: 3750,
      tax: 0,
      totalAmount: 3750,
      currency: 'USD',
      lineItems: [
        { description: 'AWS Architecture', quantity: 10, unitPrice: 200, amount: 2000 },
        { description: 'Security Audit', quantity: 5, unitPrice: 350, amount: 1750 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 12. Zero tax
  // ---------------------------------------------------------------------------
  {
    name: 'Zero Tax Invoice',
    text: [
      'INV-2024-ZERO-001',
      'Vendor: NonProfit Org',
      'Date: 14/04/2024',
      'Exempted Sale',
      '',
      'Donation Books        100   15.00   1500.00',
      'Awareness Kits         50   25.00   1250.00',
      '',
      'Subtotal: 2750.00',
      'Tax: 0.00',
      'Total: 2,750.00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-2024-ZERO-001',
      vendorName: 'NonProfit Org',
      invoiceDate: '2024-04-14',
      subtotal: 2750,
      tax: 0,
      totalAmount: 2750,
      currency: 'INR',
      lineItems: [
        { description: 'Donation Books', quantity: 100, unitPrice: 15, amount: 1500 },
        { description: 'Awareness Kits', quantity: 50, unitPrice: 25, amount: 1250 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 13. Missing fields — only total, no line items
  // ---------------------------------------------------------------------------
  {
    name: 'Minimal Total Only',
    text: [
      'INV-MIN-001',
      'From: QuickFix Repairs',
      'Date: 2024-09-01',
      'Total: 750.00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-MIN-001',
      vendorName: 'QuickFix Repairs',
      invoiceDate: '2024-09-01',
      totalAmount: 750,
      currency: 'INR',
    },
  },

  // ---------------------------------------------------------------------------
  // 14. Euro € format
  // ---------------------------------------------------------------------------
  {
    name: 'Euro Format',
    text: [
      'INVOICE: EU-2024-777',
      'Vendor: Paris Design SARL',
      'Date: 15/10/2024',
      'Due: 15/11/2024',
      '',
      'Article              Qté  Prix    Total',
      'Chaises Design         10  125,50  1.255,00',
      'Tables en Bois          5  450,00  2.250,00',
      '',
      'Subtotal: 3.505,00',
      'TVA 20%: 701,00',
      'Total: 4.206,00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'EU-2024-777',
      vendorName: 'Paris Design SARL',
      invoiceDate: '2024-10-15',
      dueDate: '2024-11-15',
      gstRate: 20,
      subtotal: 3505,
      tax: 701,
      totalAmount: 4206,
      currency: 'EUR',
      lineItems: [
        { description: 'Chaises Design', quantity: 10, unitPrice: 125.5, amount: 1255 },
        { description: 'Tables en Bois', quantity: 5, unitPrice: 450, amount: 2250 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 15. Australian GST
  // ---------------------------------------------------------------------------
  {
    name: 'Australian GST Invoice',
    text: [
      'TAX INVOICE',
      'ABN: 12 345 678 901',
      'Seller: DownUnder Supplies',
      'Invoice: INV-AU-2024-123',
      'Date: 2024-03-15',
      '',
      'Item            Qty  Price   Total',
      'Sunscreen 50+    50   8.50   425.00',
      'Beach Towels     30  12.00   360.00',
      '',
      'GST (10%): 78.50',
      'Total AUD: 863.50',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-AU-2024-123',
      vendorName: 'DownUnder Supplies',
      invoiceDate: '2024-03-15',
      gstRate: 10,
      subtotal: 785,
      tax: 78.5,
      totalAmount: 863.5,
      currency: 'AUD',
      lineItems: [
        { description: 'Sunscreen 50+', quantity: 50, unitPrice: 8.5, amount: 425 },
        { description: 'Beach Towels', quantity: 30, unitPrice: 12, amount: 360 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 16. SGST/CGST split (Indian format)
  // ---------------------------------------------------------------------------
  {
    name: 'Indian SGST CGST Split',
    text: [
      'GST INVOICE',
      'Seller: Mumbai Traders',
      'GSTIN: 27ABCDE1234F1Z5',
      'Inv No: MT-2024-890',
      'Date: 2024-07-20',
      'PO: PO-MT-099',
      '',
      'Product          Qty  Rate    Amount',
      'Cotton Fabric     100   80     8000',
      'Silk Fabric        50  200    10000',
      '',
      'Subtotal: 18000',
      'CGST 2.5%: 450',
      'SGST 2.5%: 450',
      'Total: 18900',
    ].join('\n'),
    expected: {
      invoiceNumber: 'MT-2024-890',
      vendorName: 'Mumbai Traders',
      invoiceDate: '2024-07-20',
      gstVatNumber: '27ABCDE1234F1Z5',
      gstRate: 5,
      subtotal: 18000,
      tax: 900,
      totalAmount: 18900,
      currency: 'INR',
      poNumber: 'PO-MT-099',
      lineItems: [
        { description: 'Cotton Fabric', quantity: 100, unitPrice: 80, amount: 8000 },
        { description: 'Silk Fabric', quantity: 50, unitPrice: 200, amount: 10000 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 17. Invoice with both discount and tax, negative discount line
  // ---------------------------------------------------------------------------
  {
    name: 'Bulk Discount with Negative',
    text: [
      'INV-2024-BULK-001',
      'From: Wholesale Depot',
      'Date: 18/06/2024',
      '',
      'Item             Qty    Price    Amount',
      'LED Bulbs 10W     200   15.00    3000.00',
      'LED Bulbs 20W     150   25.00    3750.00',
      '',
      'Subtotal: 6750.00',
      'Bulk Discount: -675.00',
      'Tax (12%): 729.00',
      'Total: 6804.00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-2024-BULK-001',
      vendorName: 'Wholesale Depot',
      invoiceDate: '2024-06-18',
      gstRate: 12,
      subtotal: 6750,
      discount: 675,
      tax: 729,
      totalAmount: 6804,
      currency: 'INR',
      lineItems: [
        { description: 'LED Bulbs 10W', quantity: 200, unitPrice: 15, amount: 3000 },
        { description: 'LED Bulbs 20W', quantity: 150, unitPrice: 25, amount: 3750 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 18. No invoice number (unnumbered)
  // ---------------------------------------------------------------------------
  {
    name: 'Unnumbered Invoice',
    text: [
      'Consulting Invoice',
      'From: Freelance Solutions',
      'Date: 05/05/2024',
      'Bill To: StartupXYZ',
      '',
      'Consulting (40 hrs @ $150): $6,000.00',
      '',
      'Total: $6,000.00',
    ].join('\n'),
    expected: {
      vendorName: 'Freelance Solutions',
      invoiceDate: '2024-05-05',
      customerName: 'StartupXYZ',
      totalAmount: 6000,
      currency: 'USD',
    },
  },

  // ---------------------------------------------------------------------------
  // 19. Customer name via "Customer:" and "Client:" labels
  // ---------------------------------------------------------------------------
  {
    name: 'Client Label Customer',
    text: [
      'INV-2024-CLI-001',
      'Vendor: Agency Pro',
      'Client: BigCorp International',
      'Date: 2024-08-15',
      'PO: PO-BC-2024-567',
      '',
      'Social Media Mgmt     1  2500.00  2500.00',
      'Content Creation       5   800.00  4000.00',
      '',
      'Subtotal: 6500.00',
      'Tax (0%): 0.00',
      'Total: 6500.00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-2024-CLI-001',
      vendorName: 'Agency Pro',
      customerName: 'BigCorp International',
      invoiceDate: '2024-08-15',
      poNumber: 'PO-BC-2024-567',
      subtotal: 6500,
      tax: 0,
      totalAmount: 6500,
      currency: 'INR',
      lineItems: [
        { description: 'Social Media Mgmt', quantity: 1, unitPrice: 2500, amount: 2500 },
        { description: 'Content Creation', quantity: 5, unitPrice: 800, amount: 4000 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 20. UK VAT format with "VAT Registration"
  // ---------------------------------------------------------------------------
  {
    name: 'UK VAT Registration',
    text: [
      'INVOICE: UK-2024-321',
      'Supplier: London Consulting Ltd',
      'Address: 21 Baker Street, London',
      'VAT Registration: GB 123 4567 89',
      '',
      'Invoice Date: 01/04/2024',
      'Due Date: 01/05/2024',
      '',
      'Service                Hours   Rate    Total',
      'Business Analysis         20   £150   £3,000.00',
      'Software Dev              40   £200   £8,000.00',
      '',
      'Subtotal: £11,000.00',
      'VAT (20%): £2,200.00',
      'Total: £13,200.00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'UK-2024-321',
      vendorName: 'London Consulting Ltd',
      invoiceDate: '2024-04-01',
      dueDate: '2024-05-01',
      gstVatNumber: 'GB 123 4567 89',
      gstRate: 20,
      subtotal: 11000,
      tax: 2200,
      totalAmount: 13200,
      currency: 'GBP',
      lineItems: [
        { description: 'Business Analysis', quantity: 20, unitPrice: 150, amount: 3000 },
        { description: 'Software Dev', quantity: 40, unitPrice: 200, amount: 8000 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 21. Invoice with rounding and cents
  // ---------------------------------------------------------------------------
  {
    name: 'Cents and Rounding',
    text: [
      'INV-2024-CENTS-001',
      'From: Precision Parts GmbH',
      'Date: 20/02/2024',
      '',
      'Part No.         Desc              Qty   Price    Total',
      'X-1000           Precision Bearing    8  125.50  1004.00',
      'X-2000           Shaft Seal          12   45.75   549.00',
      '',
      'Subtotal: 1553.00',
      'Tax (7.5%): 116.48',
      'Total: 1669.48',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-2024-CENTS-001',
      vendorName: 'Precision Parts GmbH',
      invoiceDate: '2024-02-20',
      gstRate: 7.5,
      subtotal: 1553,
      tax: 116.48,
      totalAmount: 1669.48,
      currency: 'INR',
      lineItems: [
        { description: 'Precision Bearing', quantity: 8, unitPrice: 125.5, amount: 1004 },
        { description: 'Shaft Seal', quantity: 12, unitPrice: 45.75, amount: 549 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 22. Currency symbol in total line only
  // ---------------------------------------------------------------------------
  {
    name: 'Currency Only in Total',
    text: [
      'INVOICE: INV-CUR-001',
      'From: Global Tech HK',
      'Date: 2024-11-01',
      'Due Date: 2024-12-01',
      '',
      'Firewall Appliance          2   8000.00  16000.00',
      'VPN License                 10     50.00    500.00',
      '',
      'Subtotal: 16500.00',
      'Tax: 0.00',
      'Total HKD: 16,500.00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-CUR-001',
      vendorName: 'Global Tech HK',
      invoiceDate: '2024-11-01',
      dueDate: '2024-12-01',
      subtotal: 16500,
      tax: 0,
      totalAmount: 16500,
      currency: 'HKD',
      lineItems: [
        { description: 'Firewall Appliance', quantity: 2, unitPrice: 8000, amount: 16000 },
        { description: 'VPN License', quantity: 10, unitPrice: 50, amount: 500 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 23. Multiple pages / extra whitespace
  // ---------------------------------------------------------------------------
  {
    name: 'Extra Whitespace (simulates second page)',
    text: [
      'PAGE 1 OF 2',
      'INVOICE # INV-WS-001',
      'Vendor: Whitespace Corp',
      'Date: 01/01/2024',
      '',
      'Item                Qty   Rate  Amount',
      'Widget C              2   5.00   10.00',
      '',
      'Page 1 total carried forward...',
      '',
      '',
      'PAGE 2 OF 2',
      'Continued from page 1',
      'Widget D              3   7.00   21.00',
      '',
      'Subtotal: 31.00',
      'Tax: 2.48',
      'Total: 33.48',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-WS-001',
      vendorName: 'Whitespace Corp',
      invoiceDate: '2024-01-01',
      subtotal: 31,
      tax: 2.48,
      totalAmount: 33.48,
      currency: 'INR',
      lineItems: [
        { description: 'Widget C', quantity: 2, unitPrice: 5, amount: 10 },
        { description: 'Widget D', quantity: 3, unitPrice: 7, amount: 21 },
      ],
    },
  },

  // ---------------------------------------------------------------------------
  // 24. With HSN in line items
  // ---------------------------------------------------------------------------
  {
    name: 'HSN Codes in Line Items',
    text: [
      'INV-2024-HSN-001',
      'From: Hardware Mart',
      'GST: 33ABCDE1234F1Z5',
      'Date: 15/09/2024',
      '',
      'HSN        Product        Qty    Rate    Amount',
      '73181500   Bolts 12mm        500    2.50   1250.00',
      '73181600   Nuts 12mm         500    1.80    900.00',
      '73182200   Washers 12mm      500    0.75    375.00',
      '',
      'Subtotal: 2525.00',
      'IGST @12%: 303.00',
      'Total: 2828.00',
    ].join('\n'),
    expected: {
      invoiceNumber: 'INV-2024-HSN-001',
      vendorName: 'Hardware Mart',
      invoiceDate: '2024-09-15',
      gstVatNumber: '33ABCDE1234F1Z5',
      gstRate: 12,
      subtotal: 2525,
      tax: 303,
      totalAmount: 2828,
      currency: 'INR',
      lineItems: [
        { description: 'Bolts 12mm', quantity: 500, unitPrice: 2.5, amount: 1250 },
        { description: 'Nuts 12mm', quantity: 500, unitPrice: 1.8, amount: 900 },
        { description: 'Washers 12mm', quantity: 500, unitPrice: 0.75, amount: 375 },
      ],
    },
  },
];

module.exports = { testInvoices };
