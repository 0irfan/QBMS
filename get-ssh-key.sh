#!/bin/bash

# Script to find and display your SSH private key for GitHub Secrets

echo "🔍 Looking for SSH private keys..."
echo ""

# Check for different key types
if [ -f ~/.ssh/id_ed25519 ]; then
    echo "✅ Found ED25519 key: ~/.ssh/id_ed25519"
    echo ""
    echo "📋 Copy this ENTIRE output for GitHub Secrets:"
    echo "================================================"
    cat ~/.ssh/id_ed25519
    echo "================================================"
    echo ""
    echo "✅ This is your SSH_PRIVATE_KEY for GitHub Secrets"
elif [ -f ~/.ssh/id_rsa ]; then
    echo "✅ Found RSA key: ~/.ssh/id_rsa"
    echo ""
    echo "📋 Copy this ENTIRE output for GitHub Secrets:"
    echo "================================================"
    cat ~/.ssh/id_rsa
    echo "================================================"
    echo ""
    echo "✅ This is your SSH_PRIVATE_KEY for GitHub Secrets"
elif [ -f ~/.ssh/id_ecdsa ]; then
    echo "✅ Found ECDSA key: ~/.ssh/id_ecdsa"
    echo ""
    echo "📋 Copy this ENTIRE output for GitHub Secrets:"
    echo "================================================"
    cat ~/.ssh/id_ecdsa
    echo "================================================"
    echo ""
    echo "✅ This is your SSH_PRIVATE_KEY for GitHub Secrets"
else
    echo "❌ No SSH private key found in ~/.ssh/"
    echo ""
    echo "Available files in ~/.ssh/:"
    ls -la ~/.ssh/
    echo ""
    echo "The key might have been generated with a custom name."
    echo "Check the output above for any private key files."
fi

echo ""
echo "📝 Next steps:"
echo "1. Copy the key content above (including BEGIN and END lines)"
echo "2. Go to: https://github.com/0irfan/QBMS/settings/secrets/actions"
echo "3. Click 'New repository secret'"
echo "4. Name: SSH_PRIVATE_KEY"
echo "5. Value: Paste the key content"
echo "6. Click 'Add secret'"
