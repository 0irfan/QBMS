# SSH Key Flow - Visual Guide

## 🔑 How SSH Keys Work for CI/CD

### The Key Pair

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Local Machine                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  $ ssh-keygen -t ed25519 -f ~/.ssh/qbms_deploy             │
│                                                             │
│  Creates TWO files:                                         │
│                                                             │
│  1. ~/.ssh/qbms_deploy          (PRIVATE KEY) 🔒           │
│     ├─ Keep this SECRET                                     │
│     ├─ Never share                                          │
│     └─ Used to CONNECT to server                            │
│                                                             │
│  2. ~/.ssh/qbms_deploy.pub      (PUBLIC KEY) 🔓            │
│     ├─ Can be shared                                        │
│     ├─ Goes on the server                                   │
│     └─ Allows connections from matching private key         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📤 Setup Flow

### Step 1: Generate Keys (Local Machine)

```
┌──────────────────────┐
│   Your Computer      │
│                      │
│  $ ssh-keygen        │
│                      │
│  Creates:            │
│  ├─ Private Key 🔒   │
│  └─ Public Key 🔓    │
└──────────────────────┘
```

### Step 2: Copy Public Key to Server

```
┌──────────────────────┐         ┌──────────────────────┐
│   Your Computer      │         │   Server (qbms.pro)  │
│                      │         │                      │
│  Public Key 🔓       │ ──────> │  ~/.ssh/             │
│  (qbms_deploy.pub)   │  Copy   │  authorized_keys     │
│                      │         │                      │
│  $ ssh-copy-id       │         │  [Public Key 🔓]     │
│                      │         │                      │
└──────────────────────┘         └──────────────────────┘
```

### Step 3: Add Private Key to GitHub

```
┌──────────────────────┐         ┌──────────────────────┐
│   Your Computer      │         │   GitHub Secrets     │
│                      │         │                      │
│  Private Key 🔒      │ ──────> │  SSH_PRIVATE_KEY     │
│  (qbms_deploy)       │  Copy   │                      │
│                      │         │  [Private Key 🔒]    │
│  $ cat ~/.ssh/       │         │                      │
│    qbms_deploy       │         │                      │
│                      │         │                      │
└──────────────────────┘         └──────────────────────┘
```

---

## 🚀 Deployment Flow

### When GitHub Actions Runs

```
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Workflow triggered (push to main)                       │
│                                                             │
│  2. Load SSH_PRIVATE_KEY from secrets 🔒                    │
│                                                             │
│  3. Setup SSH agent with private key                        │
│                                                             │
│  4. Connect to server:                                      │
│     ssh root@qbms.pro                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SSH Connection
                            │ Using Private Key 🔒
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Server (qbms.pro)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Receives connection request                             │
│                                                             │
│  2. Checks ~/.ssh/authorized_keys                           │
│     Contains: Public Key 🔓                                 │
│                                                             │
│  3. Verifies private key matches public key                 │
│                                                             │
│  4. ✅ Connection allowed!                                  │
│                                                             │
│  5. Execute deployment commands                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## ❌ Common Mistakes

### Mistake 1: Using Public Key to Connect

```
❌ WRONG:

┌──────────────────────┐         ┌──────────────────────┐
│   GitHub Actions     │         │   Server             │
│                      │    X    │                      │
│  Public Key 🔓       │ ──────> │  Cannot connect!     │
│  (trying to connect) │         │                      │
└──────────────────────┘         └──────────────────────┘

Public key CANNOT be used to connect!
```

### Mistake 2: Private Key on Server

```
❌ WRONG:

┌──────────────────────┐         ┌──────────────────────┐
│   Your Computer      │         │   Server             │
│                      │         │                      │
│  Private Key 🔒      │ ──────> │  ~/.ssh/             │
│                      │  Copy   │  authorized_keys     │
│                      │         │                      │
│                      │         │  [Private Key 🔒]    │
└──────────────────────┘         └──────────────────────┘

Private key should NEVER be on the server!
```

### Mistake 3: Public Key in GitHub Secrets

```
❌ WRONG:

┌──────────────────────┐         ┌──────────────────────┐
│   Your Computer      │         │   GitHub Secrets     │
│                      │         │                      │
│  Public Key 🔓       │ ──────> │  SSH_PRIVATE_KEY     │
│  (qbms_deploy.pub)   │  Copy   │                      │
│                      │         │  [Public Key 🔓]     │
└──────────────────────┘         └──────────────────────┘

GitHub needs the PRIVATE key, not public!
```

---

## ✅ Correct Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    Correct Configuration                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Local Machine:                                             │
│  ├─ Private Key 🔒 (qbms_deploy)                            │
│  └─ Public Key 🔓 (qbms_deploy.pub)                         │
│                                                             │
│  Server (qbms.pro):                                         │
│  └─ ~/.ssh/authorized_keys                                  │
│     └─ Contains: Public Key 🔓                              │
│                                                             │
│  GitHub Secrets:                                            │
│  └─ SSH_PRIVATE_KEY                                         │
│     └─ Contains: Private Key 🔒                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Summary

### Private Key 🔒
- **Location**: Local machine + GitHub Secrets
- **Purpose**: Used to CONNECT to server
- **Security**: Keep SECRET, never share
- **File**: `~/.ssh/qbms_deploy` (no .pub extension)

### Public Key 🔓
- **Location**: Server's `~/.ssh/authorized_keys`
- **Purpose**: ALLOWS connections from matching private key
- **Security**: Can be shared, not sensitive
- **File**: `~/.ssh/qbms_deploy.pub` (has .pub extension)

---

## 📝 Quick Commands

### Generate Key Pair
```bash
ssh-keygen -t ed25519 -C "github-actions@qbms.pro" -f ~/.ssh/qbms_deploy
# Creates: qbms_deploy (private 🔒) and qbms_deploy.pub (public 🔓)
```

### Copy Public Key to Server
```bash
ssh-copy-id -i ~/.ssh/qbms_deploy.pub root@qbms.pro
# Copies PUBLIC key to server's authorized_keys
```

### View Private Key (for GitHub)
```bash
cat ~/.ssh/qbms_deploy
# Copy this to GitHub Secrets as SSH_PRIVATE_KEY
```

### View Public Key
```bash
cat ~/.ssh/qbms_deploy.pub
# This is what's on the server
```

### Test Connection
```bash
ssh -i ~/.ssh/qbms_deploy root@qbms.pro
# Uses PRIVATE key to connect
```

---

## 🎯 Remember

1. **Private Key** = Your identity (like a password)
   - Keep it secret
   - Use it to connect
   - Store in GitHub Secrets

2. **Public Key** = Your lock (like a username)
   - Can be shared
   - Goes on the server
   - Allows connections from matching private key

3. **Analogy**:
   - Private Key = Your house key 🔑
   - Public Key = Your door lock 🔒
   - You use your key to unlock your door
   - Anyone with a copy of your key can unlock your door
   - The lock itself is not secret, but the key is!

---

## 🆘 Troubleshooting

### "Permission denied (publickey)"

**Check**:
1. Is public key on server? `ssh root@qbms.pro "cat ~/.ssh/authorized_keys"`
2. Is private key in GitHub Secrets? Check GitHub settings
3. Are permissions correct? `ssh root@qbms.pro "ls -la ~/.ssh/"`

**Fix**:
```bash
# On server
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### "Host key verification failed"

**Fix**:
```bash
ssh-keyscan -H qbms.pro >> ~/.ssh/known_hosts
```

### Connection works locally but not from GitHub Actions

**Check**:
1. Private key in GitHub Secrets (not public key!)
2. No passphrase on private key
3. SERVER_HOST and SSH_USER secrets set correctly

---

*Visual guide for SSH key setup*
