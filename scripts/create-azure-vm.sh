#!/bin/bash

# QBMS Azure VM Creation Script
# This script creates an Azure VM for QBMS deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   QBMS Azure VM Creation Script       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Configuration
RESOURCE_GROUP="qbms-rg"
VM_NAME="qbms-vm"
LOCATION="eastus"
VM_SIZE="Standard_B2s"
IMAGE="Ubuntu2204"
ADMIN_USERNAME="azureuser"
SSH_KEY_NAME="qbms-key"

echo -e "${GREEN}Configuration:${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  VM Name: $VM_NAME"
echo "  Location: $LOCATION"
echo "  Size: $VM_SIZE (2 vCPU, 4GB RAM)"
echo "  Image: Ubuntu 22.04 LTS"
echo "  Username: $ADMIN_USERNAME"
echo ""

# Check if logged in
echo -e "${YELLOW}Checking Azure login...${NC}"
if ! az account show &> /dev/null; then
    echo -e "${RED}Not logged in to Azure. Please run: az login${NC}"
    exit 1
fi

SUBSCRIPTION=$(az account show --query name -o tsv)
echo -e "${GREEN}✅ Logged in to Azure${NC}"
echo "   Subscription: $SUBSCRIPTION"
echo ""

# Create resource group
echo -e "${YELLOW}Creating resource group...${NC}"
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo -e "${GREEN}✅ Resource group already exists${NC}"
else
    az group create --name $RESOURCE_GROUP --location $LOCATION
    echo -e "${GREEN}✅ Resource group created${NC}"
fi
echo ""

# Create VM
echo -e "${YELLOW}Creating virtual machine...${NC}"
echo "This may take 3-5 minutes..."
echo ""

az vm create \
  --resource-group $RESOURCE_GROUP \
  --name $VM_NAME \
  --image $IMAGE \
  --size $VM_SIZE \
  --admin-username $ADMIN_USERNAME \
  --generate-ssh-keys \
  --public-ip-sku Standard \
  --public-ip-address-allocation static \
  --output json > vm-output.json

echo -e "${GREEN}✅ Virtual machine created${NC}"
echo ""

# Open ports
echo -e "${YELLOW}Opening ports...${NC}"
az vm open-port --resource-group $RESOURCE_GROUP --name $VM_NAME --port 80 --priority 1001
az vm open-port --resource-group $RESOURCE_GROUP --name $VM_NAME --port 443 --priority 1002
echo -e "${GREEN}✅ Ports opened (22, 80, 443)${NC}"
echo ""

# Get VM details
echo -e "${YELLOW}Getting VM details...${NC}"
PUBLIC_IP=$(az vm show --resource-group $RESOURCE_GROUP --name $VM_NAME --show-details --query publicIps -o tsv)
PRIVATE_IP=$(az vm show --resource-group $RESOURCE_GROUP --name $VM_NAME --show-details --query privateIps -o tsv)

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   VM Created Successfully!             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}VM Details:${NC}"
echo "  Name: $VM_NAME"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Size: $VM_SIZE"
echo "  Username: $ADMIN_USERNAME"
echo "  Public IP: $PUBLIC_IP"
echo "  Private IP: $PRIVATE_IP"
echo ""

# SSH key location
SSH_KEY_PATH="$HOME/.ssh/id_rsa"
if [ -f "$HOME/.ssh/id_ed25519" ]; then
    SSH_KEY_PATH="$HOME/.ssh/id_ed25519"
fi

echo -e "${GREEN}SSH Connection:${NC}"
echo "  ssh $ADMIN_USERNAME@$PUBLIC_IP"
echo ""
echo -e "${GREEN}SSH Key Location:${NC}"
echo "  $SSH_KEY_PATH"
echo ""

# Test SSH connection
echo -e "${YELLOW}Testing SSH connection...${NC}"
sleep 5
if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 $ADMIN_USERNAME@$PUBLIC_IP "echo 'SSH connection successful'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  SSH connection not ready yet. Wait a minute and try:${NC}"
    echo "   ssh $ADMIN_USERNAME@$PUBLIC_IP"
fi
echo ""

# Next steps
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Next Steps                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}1. Configure DNS for qbms.pro:${NC}"
echo "   Add A record: qbms.pro → $PUBLIC_IP"
echo "   Add A record: www.qbms.pro → $PUBLIC_IP"
echo ""
echo -e "${YELLOW}2. Add SSH key to GitHub Secrets:${NC}"
echo "   cat $SSH_KEY_PATH"
echo "   Copy output to: https://github.com/0irfan/QBMS/settings/secrets/actions"
echo "   Secret name: SSH_PRIVATE_KEY"
echo ""
echo -e "${YELLOW}3. Add other GitHub Secrets:${NC}"
echo "   SSH_USER = azureuser"
echo "   SERVER_HOST = $PUBLIC_IP (or qbms.pro after DNS)"
echo ""
echo -e "${YELLOW}4. Setup VM:${NC}"
echo "   ssh $ADMIN_USERNAME@$PUBLIC_IP"
echo "   curl -fsSL https://raw.githubusercontent.com/0irfan/QBMS/main/scripts/azure-vm-setup.sh | bash"
echo ""
echo -e "${GREEN}✅ Azure VM creation complete!${NC}"
echo ""

# Save details to file
cat > vm-details.txt << EOF
QBMS Azure VM Details
=====================

Resource Group: $RESOURCE_GROUP
VM Name: $VM_NAME
Location: $LOCATION
Size: $VM_SIZE
Image: Ubuntu 22.04 LTS
Username: $ADMIN_USERNAME

Public IP: $PUBLIC_IP
Private IP: $PRIVATE_IP

SSH Connection:
ssh $ADMIN_USERNAME@$PUBLIC_IP

SSH Key Location:
$SSH_KEY_PATH

GitHub Secrets to Configure:
- SSH_PRIVATE_KEY: Content of $SSH_KEY_PATH
- SSH_USER: azureuser
- SERVER_HOST: $PUBLIC_IP (or qbms.pro after DNS)

DNS Configuration:
- A record: qbms.pro → $PUBLIC_IP
- A record: www.qbms.pro → $PUBLIC_IP

Created: $(date)
EOF

echo -e "${GREEN}VM details saved to: vm-details.txt${NC}"
