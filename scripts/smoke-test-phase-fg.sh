#!/bin/bash
# End-to-end smoke test for Phase F (invoice generation + PDF) and
# Phase G (Ask Invoice AI + insights). Requires a running stack.
# Usage: bash scripts/smoke-test-phase-fg.sh
set -u
API=http://localhost:5000/api

EMAIL="fg.tester@example.com"
PASS="Verify123!"

echo '=== 0. Register a fresh test user ==='
curl -s --max-time 10 -X POST $API/auth/register \
  -H 'Content-Type: application/json' \
  -d "{\"name\":\"FG Tester\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  | head -c 200
echo

TOKEN=$(curl -s --max-time 10 -X POST $API/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).data.token)}catch(e){console.log('')}})")
echo "token length: ${#TOKEN}"
if [ -z "$TOKEN" ]; then echo "LOGIN FAILED"; exit 1; fi
AUTH="Authorization: Bearer $TOKEN"

echo
echo '=== 1. Ask AI with no data yet (expect fallback guidance) ==='
curl -s --max-time 10 -X POST $API/ai/ask -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"question":"How much is outstanding?"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const x=JSON.parse(d).data;console.log(JSON.stringify({intent:x.intent,answer:x.answer.slice(0,80)+'...'},null,2))})"

echo
echo '=== 2. Next invoice number suggestion ==='
curl -s --max-time 10 $API/invoices/generate/next -H "$AUTH" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{console.log(JSON.parse(d).data)})"

echo
echo '=== 3. Upload one invoice through the full OCR -> NLP pipeline ==='
PNG=$(ls /home/daytona/codebase/server/src/uploads/2026/08/*.png 2>/dev/null | head -1)
echo "using sample: $PNG"
UPLOAD=$(curl -s --max-time 60 -X POST $API/invoices/upload -H "$AUTH" -F "file=@$PNG")
echo "$UPLOAD" | head -c 300
echo

echo
echo '=== 4. Generate an invoice (Phase F) ==='
GEN=$(curl -s --max-time 15 -X POST $API/invoices/generate -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{
    "seller": {"name":"Invoice AI Inc","address":"100 Finance Lane, Mumbai","email":"billing@invoiceai.app","gstVatNumber":"27AABCU9603R1ZM"},
    "customerName":"Acme Corp","customerGstin":"27AAPFU0939F1ZV",
    "invoiceDate":"2026-08-10","dueDate":"2026-09-10",
    "taxRate":18,"discount":500,
    "template":"classic","currency":"INR",
    "notes":"Thank you for your business.","paymentTerms":"Due within 30 days.",
    "lineItems":[
      {"description":"Consulting services","quantity":5,"unitPrice":20000},
      {"description":"Design sprint","quantity":1,"unitPrice":15000}
    ]
  }')
GEN_ID=$(echo "$GEN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{console.log(JSON.parse(d).data._id||'')}catch(e){console.log('')}})")
echo "$GEN" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const x=JSON.parse(d).data;console.log(JSON.stringify({id:x._id,number:x.invoiceNumber,source:x.source,vendorName:x.vendorName,customerName:x.customerName,subtotal:x.subtotal,tax:x.tax,discount:x.discount,totalAmount:x.totalAmount,paymentStatus:x.paymentStatus,lineItems:x.lineItems.length,validation:x.validation.status},null,2))})"
echo "generated id: $GEN_ID"

echo
echo '=== 5. Duplicate invoice number rejected ==='
curl -s --max-time 10 -X POST $API/invoices/generate -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"customerName":"Other Co","invoiceNumber":"INV-00001","lineItems":[{"description":"X","quantity":1,"unitPrice":100}]}' \
  -w '\nhttp %{http_code}\n' | tail -2

echo
echo '=== 6. Download the generated invoice as PDF ==='
curl -s --max-time 20 "$API/invoices/$GEN_ID/pdf" -H "$AUTH" -o /tmp/gen-invoice.pdf -w "http %{http_code}, bytes %{size_download}\n"
head -c 8 /tmp/gen-invoice.pdf | od -c | head -1
echo "(expected: %PDF- magic header)"

echo
echo '=== 7. Ask Invoice AI — real data questions (Phase G) ==='
for Q in "How much money is outstanding?" "Which invoices are overdue?" "Which vendor has the highest invoice amount?" "What was my total invoice value this month?" "Show invoices above ₹50,000." "How much GST did I pay this month?" "How many invoices do I have?"; do
  echo "--- Q: $Q"
  curl -s --max-time 10 -X POST $API/ai/ask -H "$AUTH" -H 'Content-Type: application/json' \
    -d "{\"question\":\"$Q\"}" \
    | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const x=JSON.parse(d).data;console.log('  intent:',x.intent);console.log('  answer:',x.answer)})"
done

echo
echo '=== 8. Validation: invoice number missing is auto-suggested ==='
curl -s --max-time 10 -X POST $API/invoices/generate -H "$AUTH" -H 'Content-Type: application/json' \
  -d '{"customerName":"Beta Ltd","lineItems":[{"description":"Support","quantity":1,"unitPrice":5000}],"template":"minimal"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const x=JSON.parse(d).data;console.log(JSON.stringify({number:x.invoiceNumber,source:x.source,template:x.template,totalAmount:x.totalAmount},null,2))})"

echo
echo '=== 9. Insights endpoint (Phase G) ==='
curl -s --max-time 10 $API/insights -H "$AUTH" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const x=JSON.parse(d).data;console.log('insights:',x.insights.length);x.insights.forEach(i=>console.log('  -',i.severity,'|',i.title))})"

echo
echo '=== 10. AI suggestions endpoint ==='
curl -s --max-time 10 $API/ai/suggestions -H "$AUTH" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const x=JSON.parse(d).data;console.log('suggestions:',x.suggestions.length);x.suggestions.slice(0,3).forEach(s=>console.log('  -',s))})"

echo
echo '=== 11. Generated invoice appears in list with source flag ==='
curl -s --max-time 10 "$API/invoices?page=1&limit=10" -H "$AUTH" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const x=JSON.parse(d).data;const gen=x.invoices.filter(i=>i.source==='generated');console.log(JSON.stringify({total:x.pagination.totalCount,generated:gen.map(i=>({n:i.invoiceNumber,src:i.source}))},null,2))})"

echo
echo '=== PHASE F/G SMOKE TEST COMPLETE ==='
