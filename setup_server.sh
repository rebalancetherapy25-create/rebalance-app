#!/bin/bash
set -e

echo "Updating packages..."
sudo apt update && sudo DEBIAN_FRONTEND=noninteractive apt upgrade -y
sudo apt install -y curl dirmngr apt-transport-https lsb-release ca-certificates git nginx

echo "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "Installing PM2..."
sudo npm install -g pm2

echo "Allowing Nginx through firewall..."
sudo ufw allow 'Nginx Full' || true

echo "Setup complete! Verifying versions:"
node -v
pm2 -v
nginx -v
