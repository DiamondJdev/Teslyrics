# Teslyrics - Raspberry Pi Setup Guide

## Overview

Teslyrics is a system that displays Apple Music lyrics in your Tesla's browser using a Raspberry Pi as a local server. The iOS companion app sends lyrics to the Pi, which caches them and serves them to the Tesla browser over a local network.

## System Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│             │  WiFi   │                  │  WiFi   │             │
│  iOS App    ├────────►│  Raspberry Pi    ├────────►│    Tesla    │
│ (Apple      │ Lyrics  │  (Teslyrics      │  Web    │   Browser   │
│  Music)     │  Data   │   Server)        │  Page   │             │
└─────────────┘         └──────────────────┘         └─────────────┘
```

## Hardware Requirements

- **Raspberry Pi**: Model 3B+ or later (4 recommended)
- **MicroSD Card**: 16GB or larger, Class 10
- **Power Supply**: Official Raspberry Pi power supply or USB power source
- **Optional**: Case for protection
- **Optional**: USB power cable for Tesla USB port

## Software Requirements

- Raspberry Pi OS (Lite or Desktop)
- Node.js LTS (installed via setup script)
- Network configuration tools (installed via setup script)

## Installation Steps

### 1. Prepare the Raspberry Pi

1. **Flash Raspberry Pi OS** to your microSD card using [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
   - Choose "Raspberry Pi OS Lite" for headless operation
   - Enable SSH in the advanced options
   - Set username to `pi` and a secure password
   - Configure WiFi for initial setup (optional)

2. **Insert the microSD card** and power on the Raspberry Pi

3. **Connect to your Pi** via SSH:
   ```bash
   ssh pi@raspberrypi.local
   ```

### 2. Clone the Repository

```bash
cd ~
git clone <your-repository-url> teslyrics
cd teslyrics
```

### 3. Run Installation Script

```bash
chmod +x scripts/install-pi.sh
./scripts/install-pi.sh
```

This script will:
- Update system packages
- Install Node.js
- Install system dependencies (hostapd, dnsmasq, etc.)
- Install Node.js dependencies
- Create necessary directories and set permissions

### 4. Configure Environment

Edit the `.env` file to configure your server:

```bash
nano .env
```

Key settings:
- `PORT`: Server port (default: 3000)
- `PI_IP`: IP address of your Pi (default: 192.168.4.1 for hotspot mode)
- `CACHE_TTL`: How long to cache lyrics (default: 3600 seconds)

### 5. Set Up Auto-Start Service

```bash
npm run setup-service
```

This creates a systemd service that:
- Starts Teslyrics automatically on boot
- Restarts the service if it crashes
- Logs output to `/var/log/teslyrics/`

### 6. Configure WiFi Hotspot (Recommended)

```bash
npm run setup-hotspot
```

This configures your Pi as a WiFi access point with:
- SSID: `TeslyricsAP` (configurable)
- Password: `teslyrics2024` (configurable)
- IP Address: `192.168.4.1`

After setup, reboot:
```bash
sudo reboot
```

### 7. Start the Service

After reboot, start the Teslyrics service:

```bash
sudo systemctl start teslyrics
```

Check status:
```bash
sudo systemctl status teslyrics
```

## Network Setup Options

### Option 1: WiFi Hotspot (Recommended for Tesla)

The Pi creates its own WiFi network that both your phone and Tesla connect to.

**Pros:**
- Self-contained system
- No dependency on external WiFi
- Works anywhere in the car

**Cons:**
- Phone needs to switch networks
- No internet access while connected (unless you set up bridging)

### Option 2: Existing WiFi Network

Connect the Pi to your home WiFi or mobile hotspot.

**Pros:**
- Internet access maintained
- Simpler setup

**Cons:**
- Requires existing WiFi in the car
- Need to know the Pi's IP address

## Usage

### From Your iPhone

1. Connect to the Teslyrics WiFi network (if using hotspot mode)
2. Open your iOS companion app
3. Play a song in Apple Music
4. The app will send lyrics to the Pi at `http://192.168.4.1:3000/api/lyrics`

### From Your Tesla

1. Connect Tesla to the Teslyrics WiFi network:
   - Go to the Tesla touchscreen
   - Navigate to WiFi settings
   - Select `TeslyricsAP`
   - Enter password: `teslyrics2024`

2. Open the Tesla browser
3. Navigate to: `http://192.168.4.1:3000`
4. Lyrics will display automatically when sent from your iOS app

## API Endpoints

### Lyrics Management

- `GET /api/lyrics/:trackId` - Get lyrics for a track
- `POST /api/lyrics` - Store lyrics (from iOS app)
- `PUT /api/lyrics/:trackId` - Update lyrics
- `DELETE /api/lyrics/:trackId` - Delete lyrics from cache

### System Status

- `GET /api/status` - Get system status and info
- `GET /api/status/health` - Health check endpoint
- `GET /api/status/cache` - Cache statistics and cached songs

## Troubleshooting

### Server won't start

1. Check logs:
   ```bash
   sudo journalctl -u teslyrics -f
   ```

2. Verify Node.js is installed:
   ```bash
   node --version
   npm --version
   ```

3. Check port availability:
   ```bash
   sudo netstat -tlnp | grep 3000
   ```

### WiFi hotspot not working

1. Check hostapd status:
   ```bash
   sudo systemctl status hostapd
   ```

2. Check dnsmasq status:
   ```bash
   sudo systemctl status dnsmasq
   ```

3. Verify wireless interface:
   ```bash
   iwconfig
   ```

4. Check logs:
   ```bash
   sudo journalctl -u hostapd -f
   sudo journalctl -u dnsmasq -f
   ```

### Can't connect from Tesla

1. Verify Tesla is connected to the correct WiFi network
2. Check Pi's IP address:
   ```bash
   hostname -I
   ```
3. Test connectivity:
   ```bash
   # From another device on the network
   curl http://192.168.4.1:3000/api/status/health
   ```

### iOS app can't send lyrics

1. Verify network connection
2. Check the API endpoint in your iOS app matches the Pi's IP
3. Test the API manually:
   ```bash
   curl -X POST http://192.168.4.1:3000/api/lyrics \
     -H "Content-Type: application/json" \
     -d '{"trackId":"test","artist":"Test","title":"Test","lyrics":"Test lyrics"}'
   ```

## Power Management

### In-Car Power Options

1. **USB Power from Tesla**:
   - Connect Pi to Tesla USB port
   - Reliable power source
   - Powers off with the car

2. **Portable Battery Pack**:
   - Use a USB battery pack
   - Allows Pi to stay on when car is off
   - Good for quick startup times

3. **12V to USB Adapter**:
   - Connect to 12V outlet
   - Always-on power (if outlet is always-on)

### Auto-Shutdown (Optional)

To prevent SD card corruption, you can set up auto-shutdown when power is lost:

```bash
sudo nano /etc/rc.local
```

Add before `exit 0`:
```bash
/home/pi/teslyrics/scripts/monitor-power.sh &
```

## Maintenance

### Update Software

```bash
cd ~/teslyrics
git pull
npm install
sudo systemctl restart teslyrics
```

### Clear Cache

```bash
curl -X POST http://192.168.4.1:3000/api/status/cache/clear
```

Or restart the service:
```bash
sudo systemctl restart teslyrics
```

### View Logs

```bash
# Real-time logs
sudo journalctl -u teslyrics -f

# Log files
tail -f /var/log/teslyrics/output.log
tail -f /var/log/teslyrics/error.log
```

### Backup

```bash
# Backup cache and config
sudo systemctl stop teslyrics
tar -czf teslyrics-backup-$(date +%Y%m%d).tar.gz ~/teslyrics/.env /var/log/teslyrics
sudo systemctl start teslyrics
```

## Performance Tips

1. **Use a fast microSD card**: Class 10 or UHS-I/II
2. **Overclock the Pi** (optional): Edit `/boot/config.txt`
3. **Reduce cache check period**: Lower `CACHE_CHECK_PERIOD` in `.env`
4. **Use Raspberry Pi 4**: Better performance and dual-band WiFi

## Security Considerations

1. **Change default password**: Update WiFi password in hotspot setup
2. **Limit DHCP range**: Reduce available IPs in dnsmasq.conf
3. **Firewall**: Consider setting up iptables rules
4. **Update regularly**: Keep Raspberry Pi OS and packages updated

## Future Enhancements

See [TODO.md](TODO.md) for planned features and improvements.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review logs for error messages
3. Open an issue on GitHub

## License

MIT License - See LICENSE file for details
