/**
 * Cleanup helper: deletes the smoke-test invoice created during verification.
 * Usage: node scripts/cleanup-test-data.js
 */
const API = 'http://localhost:5000/api';

async function main() {
  const loginRes = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'verify.tester@example.com', password: 'Verify123!' }),
  });
  const login = await loginRes.json();
  if (!login.data || !login.data.token) {
    console.log('No token (test user may not exist) — nothing to clean.');
    return;
  }
  const token = login.data.token;

  const listRes = await fetch(`${API}/invoices?page=1&limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const list = await listRes.json();
  const invoices = (list.data && list.data.invoices) || [];
  for (const inv of invoices) {
    await fetch(`${API}/invoices/${inv._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    console.log(`Deleted invoice ${inv._id}`);
  }
  console.log(`Cleanup complete — removed ${invoices.length} test invoice(s).`);
}

main().catch((err) => {
  console.error('Cleanup failed:', err.message);
  process.exit(1);
});
