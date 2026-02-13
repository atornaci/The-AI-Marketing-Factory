# 🚀 VPS Kurulum Rehberi — Hostinger + Docker + n8n

## Minimum Gereksinimler
- **CPU:** 2 vCPU
- **RAM:** 4 GB
- **Disk:** 100 GB SSD
- **OS:** Ubuntu 22.04 LTS
- **Tahmini maliyet:** ~$12/ay (Hostinger KVM 2)

---

## 1. SSH ile Bağlan

```bash
ssh root@YOUR_VPS_IP
```

---

## 2. Sistem Güncelle + Firewall

```bash
# Güncelle
apt update && apt upgrade -y

# Firewall (UFW)
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

---

## 3. Docker & Docker Compose Kur

```bash
# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose (v2 plugin)
apt install docker-compose-plugin -y

# Doğrula
docker --version
docker compose version
```

---

## 4. Proje Dosyalarını Yükle

```bash
# Proje dizini oluştur
mkdir -p /opt/ai-marketing-factory
cd /opt/ai-marketing-factory

# GitHub'dan clone (sadece Docker dosyaları)
git clone https://github.com/atornaci/The-AI-Marketing-Factory.git .

# VEYA dosyaları manuel kopyala:
# scp docker-compose.yml Caddyfile .env.docker root@YOUR_VPS_IP:/opt/ai-marketing-factory/
```

---

## 5. Environment Variables Ayarla

```bash
# .env.docker dosyasını .env olarak kopyala
cp .env.docker .env

# Düzenle
nano .env
# → N8N_PASSWORD'u güçlü bir şifre yap
# → WEBHOOK_URL'i kendi domain'inle değiştir
```

---

## 6. Domain DNS Ayarla

Hostinger veya DNS sağlayıcında:

| Tip | İsim | Değer |
|-----|------|-------|
| A | n8n.yourdomain.com | YOUR_VPS_IP |

> Caddy otomatik SSL sertifikası alacak (Let's Encrypt)

---

## 7. Caddyfile'ı Güncelle

```bash
nano Caddyfile
# → 'n8n.yourdomain.com' yerine kendi domain'ini yaz
```

---

## 8. Docker Başlat

```bash
cd /opt/ai-marketing-factory

# Başlat
docker compose up -d

# Logları izle
docker compose logs -f

# Durumu kontrol et
docker compose ps
```

---

## 9. Doğrulama

```bash
# n8n çalışıyor mu?
curl -s http://localhost:5678/healthz

# SSL çalışıyor mu?
curl -s https://n8n.yourdomain.com/healthz

# Container durumu
docker ps
```

Tarayıcıda aç:
- `https://n8n.yourdomain.com` → n8n login ekranı

---

## 10. n8n İlk Ayarlar

1. n8n admin paneline gir (N8N_USER / N8N_PASSWORD ile)
2. Settings → Credentials → Şunları ekle:
   - **Abacus.AI:** Header Auth → `apiKey: s2_922a...`
   - **ElevenLabs:** Header Auth → `xi-api-key: sk_6f26...`
   - **Supabase:** Supabase node → URL + service key
3. Webhook'ları oluştur (Faz 2'de)

---

## Sorun Giderme

```bash
# Container logları
docker compose logs n8n
docker compose logs caddy

# Yeniden başlat
docker compose restart

# Tamamen kaldırıp yeniden başlat
docker compose down && docker compose up -d

# Disk kullanımı
df -h
docker system df
```

---

## Güncelleme

```bash
cd /opt/ai-marketing-factory
docker compose pull
docker compose up -d
```
