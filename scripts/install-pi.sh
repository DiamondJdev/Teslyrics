#!/bin/bash

# Teslyrics - Raspberry Pi Installation Script
# This script installs all dependencies and sets up the Teslyrics system

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║           Teslyrics Raspberry Pi Installation            ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if running on Raspberry Pi
if ! grep -q "Raspberry Pi" /proc/cpuinfo 2>/dev/null; then
    echo "⚠️  Warning: This doesn't appear to be a Raspberry Pi"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Update system
echo "📦 Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js (using NodeSource repository for latest LTS)
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✓ Node.js already installed ($(node --version))"
fi

# Install Git if not present
echo "📦 Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt-get install -y git
else
    echo "✓ Git already installed"
fi

# Install additional system dependencies
echo "📦 Installing system dependencies..."
sudo apt-get install -y \
    hostapd \
    dnsmasq \
    network-manager \
    wireless-tools \
    wpasupplicant

# Navigate to project directory
PROJECT_DIR="${PROJECT_DIR:-$HOME/teslyrics}"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "⚠️  Project directory not found at $PROJECT_DIR"
    echo "Please clone the repository first:"
    echo "  git clone <repository-url> $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created. Please configure it as needed."
fi

# Create log directory
echo "📁 Creating log directory..."
CURRENT_USER="${SUDO_USER:-$USER}"
sudo mkdir -p /var/log/teslyrics
sudo chown $CURRENT_USER:$CURRENT_USER /var/log/teslyrics

# Set correct permissions
echo "🔒 Setting permissions..."
chmod +x scripts/*.sh

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file: nano $PROJECT_DIR/.env"
echo "2. Set up the systemd service: npm run setup-service"
echo "3. (Optional) Set up WiFi hotspot: npm run setup-hotspot"
echo "4. Start the service: sudo systemctl start teslyrics"
echo ""
