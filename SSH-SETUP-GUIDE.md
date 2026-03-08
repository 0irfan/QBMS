# SSH Key Setup Guide for CI/CD

Complete guide for setting up SSH keys for GitHub Actions to deploy to your server.

---

## 🔑 Understanding SSH Keys

### Key Pair Components

```
┌─────────────────────────────────────────────────────────┐
│                    SSH Key Pair                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Private Key (id_ed25519)          Public Key (.pub)   │
│  ├─ KEEP SECRET                    ├─ Can be shared    │
│  ├─ On local machine               ├─ On server        │
│  ├─ In GitHub Secrets              ├─ In authorized_keys│
│  └─ Used to connect                └─ Allows connection │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Important**: 
- ❌ Public key CANNOT connect to server
- ✅ Private key is used to connect
- ✅ Public key is placed on server to allow connections

---

## 📝 Step-by-Step Setup

### Step 1: Generate SSH Key Pair

On your **local machine** (Windows, Mac, or Linux):

```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -C "github-actions@qbms.pro" -f ~/.ssh/qbms_deploy

# You'll be asked for a passphrase - press Enter for no passphrase
# (GitHub Actions can't use passphrase-protected keys)
```

This creates two files:
- `~/.ssh/qbms_deploy` - **Private key** (keep secret!)
- `~/.ssh/qbms_deploy.pub` - **Public key** (can share)

### Step 2: Copy Public Key to Server

**Option A: Using ssh-copy-id (Easiest)**

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/qbms_deploy.pub root@qbms.pro

# Test connection
ssh -i ~/.ssh/qbms_deploy root@qbms.pro
```

**Option B: Manual Copy**

```bash
# 1. Display your public key
cat ~/.ssh/qbms_deploy.pub

# 2. SSH into your server
ssh root@qbms.pro

# 3. Add public key to authorized_keys
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
# Paste the public key content (entire line)
# Save and exit (Ctrl+X, Y, Enter)

# 4. Set correct permissions
chmod 600 ~/.ssh/authorized_keys

# 5. Exit server
exit

# 6. Test connection
ssh -i ~/.ssh/qbms_deploy root@qbms.pro
```

### Step 3: Add Private Key to GitHub Secrets

```bash
# Display your PRIVATE key
cat ~/.ssh/qbms_deploy

# Copy the ENTIRE output including:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... (all the content)
# -----END OPENSSH PRIVATE KEY-----
```

**Add to GitHub**:
1. Go to: https://github.com/0irfan/QBMS/settings/secrets/actions
2. Click "New repository secret"
3. Name: `SSH_PRIVATE_KEY`
4. Value: Paste the entire private key content
5. Click "Add secret"

---

## 🔍 Verification

### Test SSH Connection from Local Machine

```bash
# Test with private key
ssh -i ~/.ssh/qbms_deploy root@qbms.pro

# If successful, you should be logged into the server
# Type 'exit' to disconnect
```

### Test GitHub Actions Connection

Create a test workflow to verify:

```yaml
# .github/workflows/test-ssh.yml
name: Test SSH Connection

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Setup SSH
        uses: webfactory/ssh-agent@v0.8.0
        with:
          ssh-private-key: ${{ secrets.SSH_PRIVATE_KEY }}
      
      - name: Test connection
        run: |
          ssh-keyscan -H ${{ secrets.SERVER_HOST }} >> ~/.ssh/known_hosts
          ssh ${{ secrets.SSH_USER }}@${{ secrets.SERVER_HOST }} "echo 'SSH connection successful!'"
```

Run this workflow manually to test the connection.

---

## 🛠️ Troubleshooting

### Issue 1: "Permission denied (publickey)"

**Cause**: Private key not properly configured or public key not on server

**Solution**:
```bash
# On server, check authorized_keys
cat ~/.ssh/authorized_keys

# Verify permissions
ls -la ~/.ssh/
# Should show:
# drwx------ (700) for .ssh directory
# -rw------- (600) for authorized_keys file

# Fix permissions if needed
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Issue 2: "Host key verification failed"

**Cause**: Server's host key not in known_hosts

**Solution**:
```bash
# Add server to known_hosts
ssh-keyscan -H qbms.pro >> ~/.ssh/known_hosts

# Or in GitHub Actions (already handled in deploy.yml):
ssh-keyscan -H ${{ secrets.SERVER_HOST }} >> ~/.ssh/known_hosts
```

### Issue 3: "Bad permissions" on private key

**Cause**: Private key file has wrong permissions

**Solution**:
```bash
# Fix private key permissions
chmod 600 ~/.ssh/qbms_deploy
```

### Issue 4: GitHub Actions can't connect

**Possible causes**:
1. Private key not added to GitHub Secrets
2. Private key has passphrase (not supported)
3. Public key not on server
4. Wrong username or hostname

**Solution**:
```bash
# 1. Verify private key in GitHub Secrets
# Go to: https://github.com/0irfan/QBMS/settings/secrets/actions
# Check SSH_PRIVATE_KEY exists

# 2. Regenerate key without passphrase
ssh-keygen -t ed25519 -C "github-actions@qbms.pro" -f ~/.ssh/qbms_deploy -N ""

# 3. Copy public key to server again
ssh-copy-id -i ~/.ssh/qbms_deploy.pub root@qbms.pro

# 4. Update private key in GitHub Secrets
cat ~/.ssh/qbms_deploy
# Copy and update in GitHub
```

---

## 📋 Complete Setup Checklist

### On Local Machine
- [ ] Generate SSH key pair: `ssh-keygen -t ed25519 -C "github-actions@qbms.pro" -f ~/.ssh/qbms_deploy`
- [ ] Key generated without passphrase
- [ ] Private key exists: `~/.ssh/qbms_deploy`
- [ ] Public key exists: `~/.ssh/qbms_deploy.pub`

### On Server
- [ ] SSH access working: `ssh root@qbms.pro`
- [ ] `.ssh` directory exists with correct permissions (700)
- [ ] Public key added to `~/.ssh/authorized_keys`
- [ ] `authorized_keys` has correct permissions (600)
- [ ] Test connection works: `ssh -i ~/.ssh/qbms_deploy root@qbms.pro`

### On GitHub
- [ ] Private key added to GitHub Secrets as `SSH_PRIVATE_KEY`
- [ ] `SERVER_HOST` secret set to `qbms.pro`
- [ ] `SSH_USER` secret set to `root` (or your user)
- [ ] Test workflow runs successfully

---

## 🔐 Security Best Practices

### 1. Use Dedicated Deployment User (Recommended)

Instead of using `root`, create a dedicated user:

```bash
# On server
adduser deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# Setup SSH for deploy user
mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# Copy public key
cat ~/.ssh/qbms_deploy.pub | ssh root@qbms.pro "cat >> /home/deploy/.ssh/authorized_keys"

# Set permissions
ssh root@qbms.pro "chmod 600 /home/deploy/.ssh/authorized_keys && chown -R deploy:deploy /home/deploy/.ssh"

# Update GitHub Secret SSH_USER to 'deploy'
```

### 2. Disable Password Authentication

```bash
# On server
sudo nano /etc/ssh/sshd_config

# Change these lines:
PasswordAuthentication no
PubkeyAuthentication yes
PermitRootLogin prohibit-password

# Restart SSH
sudo systemctl restart sshd
```

### 3. Use SSH Key with Restrictions

Add restrictions to authorized_keys:

```bash
# On server
nano ~/.ssh/authorized_keys

# Add before the key:
command="/opt/qbms/deploy.sh",no-port-forwarding,no-X11-forwarding,no-agent-forwarding ssh-ed25519 AAAA...
```

### 4. Rotate Keys Regularly

```bash
# Generate new key pair
ssh-keygen -t ed25519 -C "github-actions@qbms.pro" -f ~/.ssh/qbms_deploy_new

# Add new public key to server
ssh-copy-id -i ~/.ssh/qbms_deploy_new.pub root@qbms.pro

# Update GitHub Secret with new private key
cat ~/.ssh/qbms_deploy_new

# Test deployment with new key
# If successful, remove old key from server
```

---

## 📖 Quick Reference

### Generate Key
```bash
ssh-keygen -t ed25519 -C "github-actions@qbms.pro" -f ~/.ssh/qbms_deploy
```

### Copy Public Key to Server
```bash
ssh-copy-id -i ~/.ssh/qbms_deploy.pub root@qbms.pro
```

### View Private Key (for GitHub Secret)
```bash
cat ~/.ssh/qbms_deploy
```

### View Public Key
```bash
cat ~/.ssh/qbms_deploy.pub
```

### Test Connection
```bash
ssh -i ~/.ssh/qbms_deploy root@qbms.pro
```

### Check Server Authorized Keys
```bash
ssh root@qbms.pro "cat ~/.ssh/authorized_keys"
```

### Fix Permissions
```bash
# On server
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

---

## ❓ FAQ

**Q: Can I use my existing SSH key?**  
A: Yes, but it's better to create a dedicated key for GitHub Actions.

**Q: Should the private key have a passphrase?**  
A: No, GitHub Actions can't use passphrase-protected keys.

**Q: Can I use the same key for multiple servers?**  
A: Yes, but it's more secure to use different keys for different purposes.

**Q: What if I lose the private key?**  
A: Generate a new key pair and update the public key on the server and private key in GitHub Secrets.

**Q: Is it safe to store the private key in GitHub Secrets?**  
A: Yes, GitHub Secrets are encrypted and only accessible to workflows in your repository.

**Q: Can I use RSA keys instead of ed25519?**  
A: Yes, but ed25519 is more secure and recommended:
```bash
ssh-keygen -t rsa -b 4096 -C "github-actions@qbms.pro" -f ~/.ssh/qbms_deploy
```

---

## 🎯 Summary

**What you need**:
1. ✅ Generate SSH key pair (private + public)
2. ✅ Copy **public key** to server (`~/.ssh/authorized_keys`)
3. ✅ Add **private key** to GitHub Secrets (`SSH_PRIVATE_KEY`)
4. ✅ Test connection works

**Remember**:
- 🔒 Private key = Used to connect (keep secret!)
- 🔓 Public key = Placed on server (can share)
- ❌ Public key CANNOT connect to server
- ✅ Private key is what GitHub Actions uses

---

*Last updated: [Current Date]*
