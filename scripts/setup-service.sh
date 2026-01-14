#!/bin/bash

# Teslyrics - Systemd Service Setup Script
# This script creates and enables a systemd service for automatic startup

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          Teslyrics Systemd Service Setup                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Get the project directory
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
echo "Project directory: $PROJECT_DIR"

# Get the user who should run the service (usually 'pi')
SERVICE_USER="${SUDO_USER:-pi}"
echo "Service will run as user: $SERVICE_USER"

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/teslyrics.service"
echo "📝 Creating systemd service file at $SERVICE_FILE..."

cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Teslyrics - Tesla Lyrics Display Server
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR
Environment=NODE_ENV=production
EnvironmentFile=-$PROJECT_DIR/.env
ExecStart=/usr/bin/node $PROJECT_DIR/backend/server.js
Restart=always
RestartSec=10
StandardOutput=append:/var/log/teslyrics/output.log
StandardError=append:/var/log/teslyrics/error.log

# Security settings
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

echo "✓ Service file created"

# Reload systemd daemon
echo "🔄 Reloading systemd daemon..."
systemctl daemon-reload

# Enable the service
echo "✅ Enabling teslyrics service..."
systemctl enable teslyrics.service

echo ""
echo "✅ Systemd service setup complete!"
echo ""
echo "Service commands:"
echo "  Start:   sudo systemctl start teslyrics"
echo "  Stop:    sudo systemctl stop teslyrics"
echo "  Restart: sudo systemctl restart teslyrics"
echo "  Status:  sudo systemctl status teslyrics"
echo "  Logs:    sudo journalctl -u teslyrics -f"
echo ""
echo "The service will now start automatically on boot."
echo ""
