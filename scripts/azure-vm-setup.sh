#!/bin/bash

# QBMS Azure VM Setup Script
# Run this on your Azure VM to prepare it for deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   QBMS Azure VM Setup Script          ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Check if running as azureuser
if [ "$USER" != "azureuser" ]; then
    echo -e "${YELLOW}⚠️  Warning: This script is designed for azureuser${NC}"
    echo -e "${YELLOW}   Current user: $USER${NC}"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}🚀 Starting Azure VM setup...${NC}"
echo ""

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update
sudo apt upgrade -y
echo -e "${GREEN}✅ System updated${NC}"
echo ""

# Install Docker
echo -e "${YELLOW}🐳 Installing Docker...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm get-docker.sh
    echo -e "${GREEN}✅ Docker installed${NC}"
else
    echo -e "${GREEN}✅ Docker already installed${NC}"
fi
echo ""

# Add user to docker group
echo -e "${YELLOW}👤 Adding $USER to docker group...${NC}"
sudo usermod -aG docker $USER
echo -e "${GREEN}✅ User added to docker group${NC}"
echo -e "${YELLOW}   Note: You may need to logout and login for this to take effect${NC}"
echo ""

# Install Docker Compose
echo -e "${YELLOW}🔧 Installing Docker Compose...${NC}"
if ! command -v docker compose &> /dev/null; then
    sudo apt install docker-compose-plugin -y
    echo -e "${GREEN}✅ Docker Compose installed${NC}"
else
    echo -e "${GREEN}✅ Docker Compose already installed${NC}"
fi
echo ""

# Install Certbot
echo -e "${YELLOW}🔐 Installing Certbot...${NC}"
if ! command -v certbot &> /dev/null; then
    sudo apt install certbot -y
    echo -e "${GREEN}✅ Certbot installed${NC}"
else
    echo -e "${GREEN}✅ Certbot already installed${NC}"
fi
echo ""

# Install UFW
echo -e "${YELLOW}🔥 Installing and configuring UFW firewall...${NC}"
if ! command -v ufw &> /dev/null; then
    sudo apt install ufw -y
fi

# Configure firewall
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable
echo -e "${GREEN}✅ Firewall configured${NC}"
sudo ufw status
echo ""

# Create directories
echo -e "${YELLOW}📁 Creating deployment directories...${NC}"
sudo mkdir -p /opt/qbms
sudo mkdir -p /opt/qbms-backups
sudo mkdir -p /opt/qbms/ssl
sudo chown -R $USER:$USER /opt/qbms
sudo chown -R $USER:$USER /opt/qbms-backups
echo -e "${GREEN}✅ Directories created${NC}"
echo ""

# Install additional tools
echo -e "${YELLOW}🛠️  Installing additional tools...${NC}"
sudo apt install -y curl wget git nano htop net-tools
echo -e "${GREEN}✅ Additional tools installed${NC}"
echo ""

# Display versions
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Installation Summary                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Docker version:${NC}"
docker --version
echo ""
echo -e "${GREEN}Docker Compose version:${NC}"
docker compose version
echo ""
echo -e "${GREEN}Certbot version:${NC}"
certbot --version
echo ""
echo -e "${GREEN}UFW status:${NC}"
sudo ufw status
echo ""

# Next steps
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Next Steps                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}1. Logout and login again to apply docker group changes:${NC}"
echo -e "   ${GREEN}exit${NC}"
echo -e "   ${GREEN}ssh -i ~/Downloads/qbms_key.pem azureuser@qbms.pro${NC}"
echo ""
echo -e "${YELLOW}2. Generate SSL certificate:${NC}"
echo -e "   ${GREEN}sudo certbot certonly --standalone -d qbms.pro -d www.qbms.pro${NC}"
echo -e "   ${GREEN}sudo cp /etc/letsencrypt/live/qbms.pro/*.pem /opt/qbms/ssl/${NC}"
echo -e "   ${GREEN}sudo chown azureuser:azureuser /opt/qbms/ssl/*.pem${NC}"
echo -e "   ${GREEN}chmod 644 /opt/qbms/ssl/fullchain.pem${NC}"
echo -e "   ${GREEN}chmod 600 /opt/qbms/ssl/privkey.pem${NC}"
echo ""
echo -e "${YELLOW}3. Create .env file:${NC}"
echo -e "   ${GREEN}nano /opt/qbms/.env${NC}"
echo -e "   ${YELLOW}(Copy from .env.example and update with actual credentials)${NC}"
echo ""
echo -e "${YELLOW}4. Configure GitHub Secrets:${NC}"
echo -e "   ${GREEN}https://github.com/0irfan/QBMS/settings/secrets/actions${NC}"
echo -e "   ${YELLOW}Add: SSH_PRIVATE_KEY, SERVER_HOST, SSH_USER, etc.${NC}"
echo ""
echo -e "${YELLOW}5. Deploy:${NC}"
echo -e "   ${GREEN}git push origin main${NC}"
echo ""
echo -e "${GREEN}✅ Azure VM setup complete!${NC}"
echo ""
