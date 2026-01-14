#!/bin/bash

# Teslyrics - WiFi Hotspot Setup Script
# This script configures the Raspberry Pi as a WiFi hotspot for in-car use

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          Teslyrics WiFi Hotspot Setup                    ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Configuration
SSID="${TESLYRICS_SSID:-TeslyricsAP}"
PASSWORD="${TESLYRICS_PASSWORD:-teslyrics2024}"
CHANNEL="${TESLYRICS_CHANNEL:-7}"
INTERFACE="${TESLYRICS_INTERFACE:-wlan0}"
IP_ADDRESS="192.168.4.1"

echo "Configuration:"
echo "  SSID: $SSID"
echo "  Password: $PASSWORD"
echo "  Channel: $CHANNEL"
echo "  Interface: $INTERFACE"
echo "  IP Address: $IP_ADDRESS"
echo ""

read -p "Continue with this configuration? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Setup cancelled."
    exit 1
fi

# Stop services
echo "🛑 Stopping services..."
systemctl stop hostapd dnsmasq 2>/dev/null || true

# Configure hostapd
echo "📝 Configuring hostapd..."
cat > /etc/hostapd/hostapd.conf << EOF
# Interface configuration
interface=$INTERFACE
driver=nl80211

# Network configuration
ssid=$SSID
hw_mode=g
channel=$CHANNEL
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0

# Security configuration
wpa=2
wpa_passphrase=$PASSWORD
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
EOF

# Update hostapd default config
echo 'DAEMON_CONF="/etc/hostapd/hostapd.conf"' > /etc/default/hostapd

# Configure dnsmasq
echo "📝 Configuring dnsmasq..."
if [ -f /etc/dnsmasq.conf ]; then
    BACKUP_FILE="/etc/dnsmasq.conf.backup.$(date +%Y%m%d-%H%M%S)"
    mv /etc/dnsmasq.conf "$BACKUP_FILE"
    echo "   Original config backed up to $BACKUP_FILE"
fi

cat > /etc/dnsmasq.conf << EOF
# Interface to listen on
interface=$INTERFACE

# DHCP configuration
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h

# DNS configuration
server=8.8.8.8
server=8.8.4.4

# Domain
domain=teslyrics.local
address=/teslyrics.local/$IP_ADDRESS
EOF

# Configure static IP for wireless interface
echo "📝 Configuring static IP..."
cat > /etc/network/interfaces.d/$INTERFACE << EOF
auto $INTERFACE
iface $INTERFACE inet static
    address $IP_ADDRESS
    netmask 255.255.255.0
EOF

# Unmask and enable services
echo "✅ Enabling services..."
systemctl unmask hostapd
systemctl enable hostapd
systemctl enable dnsmasq

# Update .env file if it exists
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
if [ -f "$PROJECT_DIR/.env" ]; then
    echo "📝 Updating .env file..."
    sed -i "s/^PI_IP=.*/PI_IP=$IP_ADDRESS/" "$PROJECT_DIR/.env"
fi

echo ""
echo "✅ WiFi Hotspot setup complete!"
echo ""
echo "To activate the hotspot, you need to:"
echo "1. Reboot the Raspberry Pi: sudo reboot"
echo "2. After reboot, start services:"
echo "   sudo systemctl start hostapd"
echo "   sudo systemctl start dnsmasq"
echo ""
echo "WiFi Network Details:"
echo "  SSID: $SSID"
echo "  Password: $PASSWORD"
echo "  Server URL: http://$IP_ADDRESS:3000"
echo ""
echo "To change SSID/password, edit /etc/hostapd/hostapd.conf"
echo ""
