#!/bin/bash
set -e

# ─── Colours ────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; BLUE='\033[0;34m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${BLUE}▶${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Tenari — local setup for Apple Silicon Mac${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ─── Homebrew ────────────────────────────────────────────────────────────────
if ! command -v brew &>/dev/null; then
  log "Installing Homebrew (you may be asked for your Mac password)..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  fi
  ok "Homebrew installed"
else
  ok "Homebrew already installed"
fi

# Ensure brew is on PATH for Apple Silicon
if [[ -f /opt/homebrew/bin/brew ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# ─── Node.js 20 ─────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null || [[ $(node -v | cut -d. -f1 | tr -d 'v') -lt 20 ]]; then
  log "Installing Node.js 20..."
  brew install node@20
  export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
  echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zprofile
  ok "Node.js $(node -v) installed"
else
  ok "Node.js $(node -v) already installed"
fi

# ─── Clone repo ──────────────────────────────────────────────────────────────
REPO_DIR="$HOME/tenari"
if [[ ! -d "$REPO_DIR/.git" ]]; then
  log "Cloning Tenari from GitHub..."
  git clone https://github.com/timothyoelkers-cloud/tenari.git "$REPO_DIR"
  ok "Cloned to $REPO_DIR"
else
  log "Tenari repo already exists — pulling latest..."
  git -C "$REPO_DIR" pull
  ok "Up to date"
fi
cd "$REPO_DIR"

# ─── Dependencies ────────────────────────────────────────────────────────────
log "Installing npm dependencies..."
npm install --silent
ok "Dependencies installed"

# ─── Environment ─────────────────────────────────────────────────────────────
if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  ok "Created .env.local from .env.example"
else
  ok ".env.local already exists"
fi

# ─── Docker infrastructure ───────────────────────────────────────────────────
log "Starting Docker services (Postgres, Redis, MinIO, Mailhog)..."
if ! docker info &>/dev/null; then
  warn "Docker Desktop doesn't appear to be running — please start it, then re-run this script."
  exit 1
fi
docker compose up -d
ok "Docker services started"

# ─── Wait for Postgres ───────────────────────────────────────────────────────
log "Waiting for Postgres to be ready..."
for i in {1..20}; do
  if docker compose exec -T postgres pg_isready -U tenari &>/dev/null; then
    ok "Postgres is ready"
    break
  fi
  sleep 2
  if [[ $i == 20 ]]; then
    warn "Postgres didn't come up in time — try running 'npm run db:push' manually."
  fi
done

# ─── Database schema ─────────────────────────────────────────────────────────
log "Pushing database schema..."
npm run db:push
ok "Database schema ready"

# ─── Open in VS Code ─────────────────────────────────────────────────────────
if command -v code &>/dev/null; then
  log "Opening project in VS Code..."
  code "$REPO_DIR"
fi

# ─── Launch ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  ✓ All done! Starting Tenari at http://localhost:4000${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Open browser after a short delay then start dev server
(sleep 4 && open http://localhost:4000) &
npm run dev
