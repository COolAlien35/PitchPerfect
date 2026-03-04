#!/usr/bin/env bash
# =============================================================================
# PitchPerfect – Production Environment Setup & Hardening Script
# Run as root or with sudo on the target server before first deployment.
# Usage:  sudo bash scripts/setup-production.sh
# =============================================================================
set -euo pipefail

# ---- Config -----------------------------------------------------------------
APP_DIR="/opt/pitchperfect"
APP_USER="pitchperfect"
APP_GROUP="pitchperfect"
LOG_DIR="/var/log/pitchperfect"
DATA_DIR="/var/data/pitchperfect"
NGINX_CONF_DIR="/etc/nginx"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# ---- Root guard -------------------------------------------------------------
if [[ "${EUID}" -ne 0 ]]; then
    log_error "This script must be run as root."; exit 1
fi

# ---- System update ----------------------------------------------------------
log_info "Updating system packages …"
apt-get update -qq && apt-get upgrade -y -qq

# ---- Install required packages ----------------------------------------------
log_info "Installing runtime dependencies …"
apt-get install -y -qq \
    curl \
    wget \
    git \
    ca-certificates \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    nginx \
    openssl

# ---- Docker -----------------------------------------------------------------
if ! command -v docker &>/dev/null; then
    log_info "Installing Docker …"
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
        gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        > /etc/apt/sources.list.d/docker.list
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
    systemctl enable --now docker
    log_info "Docker installed: $(docker --version)"
else
    log_info "Docker already present: $(docker --version)"
fi

# ---- Application user -------------------------------------------------------
log_info "Creating application user '${APP_USER}' …"
if ! id "${APP_USER}" &>/dev/null; then
    groupadd --system "${APP_GROUP}"
    useradd  --system --no-create-home --gid "${APP_GROUP}" \
             --shell /bin/false "${APP_USER}"
fi
usermod -aG docker "${APP_USER}"

# ---- Directory structure ----------------------------------------------------
log_info "Creating directory structure …"
declare -a DIR_LIST=(
    "${APP_DIR}"
    "${APP_DIR}/nginx"
    "${APP_DIR}/nginx/certs"
    "${LOG_DIR}"
    "${DATA_DIR}/postgres"
    "${DATA_DIR}/redis"
)
for dir in "${DIR_LIST[@]}"; do
    mkdir -p "${dir}"
done

chown -R "${APP_USER}:${APP_GROUP}" "${APP_DIR}" "${LOG_DIR}" "${DATA_DIR}"
chmod 750 "${APP_DIR}" "${LOG_DIR}" "${DATA_DIR}"
chmod 700 "${APP_DIR}/nginx/certs"        # certs must be root-readable only

# ---- Docker networks --------------------------------------------------------
log_info "Creating Docker overlay networks …"
for net in pitchperfect_internal pitchperfect_external; do
    if ! docker network inspect "${net}" &>/dev/null; then
        docker network create "${net}"
        log_info "  Created: ${net}"
    else
        log_info "  Already exists: ${net}"
    fi
done

# ---- TLS self-signed cert (replace with Let's Encrypt in production) --------
CERT_PATH="${APP_DIR}/nginx/certs"
if [[ ! -f "${CERT_PATH}/server.crt" ]]; then
    log_warn "Generating self-signed TLS certificate (replace with CA-signed cert) …"
    openssl req -x509 -nodes -days 365 -newkey rsa:4096 \
        -keyout "${CERT_PATH}/server.key" \
        -out    "${CERT_PATH}/server.crt" \
        -subj   "/C=US/ST=CA/O=PitchPerfect/CN=pitchperfect.app"
    chmod 400 "${CERT_PATH}/server.key"
    chmod 444 "${CERT_PATH}/server.crt"
fi

# ---- UFW Firewall -----------------------------------------------------------
log_info "Configuring UFW firewall …"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
log_info "UFW status:"
ufw status verbose

# ---- Fail2Ban ---------------------------------------------------------------
log_info "Configuring Fail2Ban …"
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5
backend  = systemd

[sshd]
enabled = true
port    = ssh
filter  = sshd
maxretry = 3

[nginx-http-auth]
enabled = true
EOF
systemctl enable --now fail2ban

# ---- Kernel hardening (sysctl) ---------------------------------------------
log_info "Applying sysctl hardening …"
cat > /etc/sysctl.d/99-pitchperfect.conf <<'EOF'
net.ipv4.ip_forward                  = 1   # required for Docker
net.ipv4.conf.all.rp_filter          = 1
net.ipv4.conf.all.accept_redirects   = 0
net.ipv4.conf.all.send_redirects     = 0
net.ipv4.conf.all.accept_source_route= 0
net.ipv4.tcp_syncookies              = 1
net.ipv4.tcp_max_syn_backlog         = 2048
net.core.somaxconn                   = 65535
fs.file-max                          = 2097152
EOF
sysctl --system -q

# ---- Logrotate --------------------------------------------------------------
log_info "Configuring logrotate for application logs …"
cat > /etc/logrotate.d/pitchperfect <<EOF
${LOG_DIR}/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 640 ${APP_USER} adm
    sharedscripts
    postrotate
        docker compose -f ${APP_DIR}/docker-compose.prod.yml restart app > /dev/null 2>&1 || true
    endscript
}
EOF

# ---- .env.prod reminder -----------------------------------------------------
if [[ ! -f "${APP_DIR}/.env.prod" ]]; then
    log_warn "No .env.prod found at ${APP_DIR}/.env.prod"
    log_warn "Copy the template and fill in secrets before starting services:"
    log_warn "  cp ${APP_DIR}/.env.example ${APP_DIR}/.env.prod && vim ${APP_DIR}/.env.prod"
fi

# ---- Done -------------------------------------------------------------------
log_info "============================================================"
log_info " Setup complete.  Next steps:"
log_info "  1. Place docker-compose.prod.yml in ${APP_DIR}/"
log_info "  2. Fill in ${APP_DIR}/.env.prod"
log_info "  3. Replace self-signed cert in ${CERT_PATH}/"
log_info "  4. docker compose -f ${APP_DIR}/docker-compose.prod.yml up -d"
log_info "============================================================"
