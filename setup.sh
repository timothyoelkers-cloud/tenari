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
# Ensure brew is on PATH (Apple Silicon installs to /opt/homebrew)
if [[ -f /opt/homebrew/bin/brew ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

if ! command -v brew &>/dev/null; then
  log "Installing Homebrew (you may be asked for your Mac password)..."
  # NONINTERACTIVE avoids prompts; redirect stdin from /dev/null so Homebrew
  # doesn't consume bytes from the script that bash is still reading
  NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" </dev/null
  eval "$(/opt/homebrew/bin/brew shellenv)"
  grep -qxF 'eval "$(/opt/homebrew/bin/brew shellenv)"' ~/.zprofile 2>/dev/null \
    || echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
  ok "Homebrew installed"
else
  ok "Homebrew already installed ($(brew --version | head -1))"
fi

# ─── Node.js ─────────────────────────────────────────────────────────────────
# Prefer node@22 (LTS); fall back gracefully if already on 20+
NODE_OK=false
if command -v node &>/dev/null; then
  NODE_MAJOR=$(node -v | cut -d. -f1 | tr -d 'v')
  [[ $NODE_MAJOR -ge 20 ]] && NODE_OK=true
fi

if [[ $NODE_OK == false ]]; then
  log "Installing Node.js 22 (LTS)..."
  brew install node@22 </dev/null
  export PATH="/opt/homebrew/opt/node@22/bin:$PATH"
  grep -qxF 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' ~/.zprofile 2>/dev/null \
    || echo 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' >> ~/.zprofile
  ok "Node.js $(node -v) installed"
else
  ok "Node.js $(node -v) already installed"
fi

# Make sure npm/npx from the correct node are on PATH
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/opt/node@20/bin:$PATH"

# ─── Clone repo ──────────────────────────────────────────────────────────────
REPO_DIR="$HOME/tenari"
if [[ ! -d "$REPO_DIR/.git" ]]; then
  log "Cloning Tenari from GitHub..."
  git clone https://github.com/timothyoelkers-cloud/tenari.git "$REPO_DIR"
  ok "Cloned to $REPO_DIR"
else
  log "Tenari repo already exists — pulling latest..."
  git -C "$REPO_DIR" pull --ff-only
  ok "Up to date"
fi
cd "$REPO_DIR"

# ─── Dependencies ────────────────────────────────────────────────────────────
log "Installing npm dependencies..."
npm install
ok "Dependencies installed"

# ─── Environment ─────────────────────────────────────────────────────────────
if [[ ! -f .env.local ]]; then
  cp .env.example .env.local
  ok "Created .env.local"
else
  ok ".env.local already exists"
fi

# ─── Docker infrastructure ───────────────────────────────────────────────────
log "Starting Docker services (Postgres, Redis, MinIO, Mailhog)..."
if ! docker info &>/dev/null; then
  warn "Docker Desktop isn't running — please open Docker Desktop, wait for it to start, then run this script again."
  exit 1
fi
docker compose up -d
ok "Docker services started"

# ─── Wait for Postgres ───────────────────────────────────────────────────────
log "Waiting for Postgres to be ready..."
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U tenari &>/dev/null; then
    ok "Postgres is ready"
    break
  fi
  printf "."
  sleep 2
  if [[ $i == 30 ]]; then
    echo ""
    warn "Postgres took too long — run 'npm run db:push' manually once Docker is healthy."
  fi
done
echo ""

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
echo -e "${GREEN}  ✓ All done! Tenari is starting at http://localhost:4000${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Open browser after a short delay, then start dev server (blocking)
(sleep 5 && open http://localhost:4000) &
npm run dev
