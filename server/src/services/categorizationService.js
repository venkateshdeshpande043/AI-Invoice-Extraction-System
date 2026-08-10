/**
 * Categorization service — rule-based automatic categorization of
 * invoices based on vendor name and line-item descriptions.
 */
const RULES = [
  { category: 'utilities', keywords: ['electric', 'water', 'gas', 'utility', 'power', 'energy', 'broadband', 'telecom', 'telephone', 'internet'] },
  { category: 'software', keywords: ['software', 'saas', 'cloud', 'hosting', 'aws', 'azure', 'google', 'subscription', 'licence', 'license', 'erp', 'crm'] },
  { category: 'travel', keywords: ['airline', 'flight', 'hotel', 'travel', 'booking', 'cab', 'uber', 'ola', 'railway', 'ticket'] },
  { category: 'office_supplies', keywords: ['stationery', 'office', 'paper', 'printer', 'furniture', 'equipment', 'supplies'] },
  { category: 'marketing', keywords: ['advert', 'marketing', 'social media', 'google ads', 'facebook', 'promotion', 'branding', 'seo'] },
  { category: 'professional_services', keywords: ['legal', 'consulting', 'advisory', 'accounting', 'audit', 'law', 'attorney', 'services'] },
  { category: 'rent', keywords: ['rent', 'lease', 'maintenance', 'facility', 'office space', 'coworking'] },
  { category: 'logistics', keywords: ['shipping', 'freight', 'logistics', 'courier', 'dhl', 'fedex', 'ups', 'delivery', 'transport'] },
  { category: 'food', keywords: ['restaurant', 'catering', 'food', 'lunch', 'dining', 'snacks', 'cafe', 'coffee'] },
  { category: 'hardware', keywords: ['hardware', 'laptop', 'computer', 'mobile', 'electronics', 'components', 'server', 'device'] },
  { category: 'insurance', keywords: ['insurance', 'premium', 'policy', 'coverage'] },
  { category: 'payroll', keywords: ['salary', 'payroll', 'wages', 'benefits', 'pf ', 'esi', 'gratuity'] },
];

/**
 * Categorize an invoice based on vendor + line items.
 * @returns {string} category key (defaults to 'uncategorized')
 */
function categorize({ vendorName = '', lineItems = [] }) {
  const haystack = [
    vendorName,
    ...(lineItems || []).map((li) => li.description || ''),
  ]
    .join(' ')
    .toLowerCase();

  if (!haystack.trim()) return 'uncategorized';

  for (const rule of RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      return rule.category;
    }
  }
  return 'uncategorized';
}

/** Human-readable label for a category key. */
const CATEGORY_LABELS = {
  utilities: 'Utilities',
  software: 'Software & IT',
  travel: 'Travel',
  office_supplies: 'Office Supplies',
  marketing: 'Marketing',
  professional_services: 'Professional Services',
  rent: 'Rent & Facilities',
  logistics: 'Logistics & Shipping',
  food: 'Food & Dining',
  hardware: 'Hardware & Electronics',
  insurance: 'Insurance',
  payroll: 'Payroll & Benefits',
  uncategorized: 'Uncategorized',
};

module.exports = { categorize, CATEGORY_LABELS };
