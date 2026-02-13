#!/bin/bash
# ═══════════════════════════════════════
# n8n Workflow Import Script
# ═══════════════════════════════════════
# Bu scripti VPS'te çalıştırarak n8n'e workflow'ları import edin
# Kullanım: bash scripts/n8n-import.sh

set -e

N8N_URL="${N8N_URL:-https://n8n.srv1140504.hstgr.cloud}"
WORKFLOW_DIR="$(dirname "$0")/../n8n-workflows"

echo "🔄 n8n Workflow Import — $N8N_URL"
echo ""

# n8n API key gerekli
if [ -z "$N8N_API_KEY" ]; then
    echo "⚠️  N8N_API_KEY gerekli!"
    echo ""
    echo "n8n'de API key oluşturmak için:"
    echo "1. https://n8n.srv1140504.hstgr.cloud adresine gidin"
    echo "2. Settings → API → Create API Key"
    echo "3. API Key'i kopyalayın"
    echo "4. Bu komutu çalıştırın:"
    echo "   N8N_API_KEY=your_key_here bash scripts/n8n-import.sh"
    echo ""
    exit 1
fi

# Her workflow dosyasını import et
for file in "$WORKFLOW_DIR"/*.json; do
    name=$(basename "$file" .json)
    echo "📥 Importing: $name..."
    
    response=$(curl -s -w "\n%{http_code}" \
        -X POST "$N8N_URL/api/v1/workflows" \
        -H "X-N8N-API-KEY: $N8N_API_KEY" \
        -H "Content-Type: application/json" \
        -d @"$file")
    
    http_code=$(echo "$response" | tail -1)
    body=$(echo "$response" | head -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        workflow_id=$(echo "$body" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "   ✅ Created: $name (ID: $workflow_id)"
        
        # Workflow'u aktive et
        curl -s -X PATCH "$N8N_URL/api/v1/workflows/$workflow_id" \
            -H "X-N8N-API-KEY: $N8N_API_KEY" \
            -H "Content-Type: application/json" \
            -d '{"active": true}' > /dev/null
        echo "   🟢 Activated: $name"
    else
        echo "   ❌ Error ($http_code): $body"
    fi
    echo ""
done

echo "═══════════════════════════════════════"
echo "✅ Import tamamlandı!"
echo "═══════════════════════════════════════"
echo ""
echo "Webhook URL'leri:"
echo "  POST  $N8N_URL/webhook/generate-image"
echo "  POST  $N8N_URL/webhook/competitor-analysis"
echo "  POST  $N8N_URL/webhook/ad-copy"
echo "  GET   $N8N_URL/webhook/list-images"
echo "  DEL   $N8N_URL/webhook/delete-image"
echo "  DEL   $N8N_URL/webhook/delete-video"
echo "  DEL   $N8N_URL/webhook/delete-influencer"
