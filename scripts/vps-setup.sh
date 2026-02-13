#!/bin/bash
# ═══════════════════════════════════════
# AI Marketing Factory — VPS Kurulum Scripti
# ═══════════════════════════════════════
# Bu scripti Hostinger VPS'te root olarak çalıştırın:
# curl -sSL https://raw.githubusercontent.com/atornaci/The-AI-Marketing-Factory/main/scripts/vps-setup.sh | bash

set -e

echo "🚀 AI Marketing Factory — VPS Kurulum Başlıyor..."

# ── 1. Docker yüklü mü kontrol et ──
if ! command -v docker &> /dev/null; then
    echo "📦 Docker kurulumu..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker compose &> /dev/null; then
    echo "📦 Docker Compose kurulumu..."
    apt-get update
    apt-get install -y docker-compose-plugin
fi

echo "✅ Docker: $(docker --version)"
echo "✅ Docker Compose: $(docker compose version)"

# ── 2. Proje dizini oluştur ──
PROJECT_DIR="/opt/marketing-factory"
if [ -d "$PROJECT_DIR" ]; then
    echo "📂 Mevcut proje güncelleniyor..."
    cd "$PROJECT_DIR"
    git pull origin main
else
    echo "📂 Proje klonlanıyor..."
    git clone https://github.com/atornaci/The-AI-Marketing-Factory.git "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# ── 3. .env dosyası oluştur ──
if [ ! -f ".env" ]; then
    echo "⚙️  .env dosyası oluşturuluyor..."
    cat > .env << 'ENVEOF'
# ═══ Supabase ═══
NEXT_PUBLIC_SUPABASE_URL=https://itcudzrzthbevyrlzkxo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=BURAYA_ANON_KEY_YAZIN
SUPABASE_SERVICE_ROLE_KEY=BURAYA_SERVICE_KEY_YAZIN

# ═══ n8n ═══
NEXT_PUBLIC_N8N_WEBHOOK_BASE=https://n8n.srv1140504.hstgr.cloud
N8N_USER=admin
N8N_PASSWORD=BURAYA_N8N_SIFRE_YAZIN
WEBHOOK_URL=https://n8n.srv1140504.hstgr.cloud/

# ═══ AI APIs ═══
ABACUS_AI_API_KEY=BURAYA_ABACUS_KEY_YAZIN
ELEVENLABS_API_KEY=BURAYA_ELEVENLABS_KEY_YAZIN
ENVEOF
    echo ""
    echo "⚠️  IMPORTANT: .env dosyasını düzenleyin!"
    echo "   nano /opt/marketing-factory/.env"
    echo ""
    exit 1
fi

# ── 4. Docker build & deploy ──
echo "🔨 Docker build başlıyor..."
docker compose build --no-cache frontend

echo "🚀 Containerlar başlatılıyor..."
docker compose up -d

echo ""
echo "═══════════════════════════════════════"
echo "✅ KURULUM TAMAMLANDI!"
echo "═══════════════════════════════════════"
echo ""
echo "📊 Frontend:  http://$(curl -s ifconfig.me)"
echo "📊 n8n:       https://n8n.srv1140504.hstgr.cloud"
echo ""
echo "🔍 Container durumu:"
docker compose ps
echo ""
echo "📝 Loglar için: docker compose logs -f frontend"
