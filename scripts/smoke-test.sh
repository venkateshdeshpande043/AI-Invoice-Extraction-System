#!/bin/bash
# End-to-end smoke test for the Invoice Extractor Phase A-E API contract.
# Usage: bash scripts/smoke-test.sh
set -u
API=http://localhost:5000/api

TOKEN=$(curl -s --max-time 10 -X POST $API/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"verify.tester@example.com","password":"Verify123!"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).data.token)}catch(e){console.log('')}})")
echo "token length: ${#TOKEN}"
if [ -z "$TOKEN" ]; then echo "LOGIN FAILED"; exit 1; fi

AUTH="Authorization: Bearer $TOKEN"

echo
echo '=== 1. Upload an invoice image (OCR -> NLP -> validate -> categorize -> duplicate) ==='
PNG=$(ls /home/daytona/codebase/server/src/uploads/2026/08/*.png 2>/dev/null | head -1)
echo "using sample: $PNG"
UPLOAD=$(curl -s --max-time 60 -X POST $API/invoices/upload \
  -H "$AUTH" \
  -F "file=@$PNG")
echo "$UPLOAD" | head -c 600
INV_ID=$(echo "$UPLOAD" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).data._id||'')}catch(e){console.log('')}})")
echo
echo "invoice id: $INV_ID"

echo
echo '=== 2. Invoice detail (validation + payment status + category) ==='
if [ -n "$INV_ID" ]; then
  curl -s --max-time 10 $API/invoices/$INV_ID -H "$AUTH" \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const x=JSON.parse(d).data;console.log(JSON.stringify({invoiceNumber:x.invoiceNumber,vendorName:x.vendorName,totalAmount:x.totalAmount,paymentStatus:x.paymentStatus,category:x.category,validationStatus:x.validation&&x.validation.status,issues:(x.validation&&x.validation.issues||[]).length,lineItems:x.lineItems.length},null,2))})"

  echo
  echo '=== 3. Record a payment (PATCH /invoices/:id/payment) ==='
  curl -s --max-time 10 -X PATCH $API/invoices/$INV_ID/payment -H "$AUTH" \
    -H 'Content-Type: application/json' \
    -d '{"amountPaid":100,"paidDate":"2026-08-10","paymentMethod":"bank_transfer"}' \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const x=JSON.parse(d).data;console.log(JSON.stringify({paymentStatus:x.paymentStatus,amountPaid:x.amountPaid,payments:x.payments},null,2))})"

  echo
  echo '=== 4. Pay in full (mark paid) ==='
  curl -s --max-time 10 -X PATCH $API/invoices/$INV_ID/payment -H "$AUTH" \
    -H 'Content-Type: application/json' \
    -d '{"amountPaid":999999,"paidDate":"2026-08-10","paymentMethod":"upi"}' \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const x=JSON.parse(d).data;console.log(JSON.stringify({paymentStatus:x.paymentStatus,amountPaid:x.amountPaid,history:x.payments.length},null,2))})"
fi

echo
echo '=== 5. Invoice list (data.invoices + pagination) ==='
curl -s --max-time 10 "$API/invoices?page=1&limit=5" -H "$AUTH" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const x=JSON.parse(d).data;console.log(JSON.stringify({count:x.invoices.length,pagination:x.pagination},null,2))})"

echo
echo '=== 6. Bulk export CSV (GET /invoices/export) ==='
curl -s --max-time 10 "$API/invoices/export?format=csv" -H "$AUTH" -o /tmp/export.csv -w "http %{http_code}, bytes %{size_download}\n"
head -2 /tmp/export.csv

echo
echo '=== 7. Dashboard stats (Phase A contract) ==='
curl -s --max-time 10 $API/dashboard/stats -H "$AUTH" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const x=JSON.parse(d).data;console.log(JSON.stringify({totalInvoices:x.totalInvoices,outstandingTotal:x.outstandingTotal,paidCount:x.paidCount,paidTotal:x.paidTotal,overdueCount:x.overdueCount,processed:x.processedCount,gstSummary:x.gstSummary,topVendors:x.topVendors.length,paymentTrends:x.paymentTrends.length,upcomingDue:x.upcomingDue.length,overdueAlerts:x.overdueAlerts.length},null,2))})"

echo
echo '=== 8. Vendors list (data.vendors + pagination) ==='
curl -s --max-time 10 "$API/vendors?page=1&limit=10&sortBy=spend" -H "$AUTH" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const x=JSON.parse(d).data;console.log(JSON.stringify({count:x.vendors.length,pagination:x.pagination,vendor:(x.vendors[0]||{}).vendorName},null,2))})"

echo
echo '=== 9. Vendor detail 404 for unknown vendor ==='
curl -s --max-time 10 "$API/vendors/NoSuchVendorXYZ" -H "$AUTH" -w " http %{http_code}\n" | head -c 200

echo
echo '=== SMOKE TEST COMPLETE ==='
