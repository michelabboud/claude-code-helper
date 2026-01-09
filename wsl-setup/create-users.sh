#!/bin/bash
# Create separate WSL users for API vs Subscription

if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root (sudo ./create-users.sh)"
    exit 1
fi

echo "========================================="
echo "Creating Claude Code Users"
echo "========================================="
echo ""

# Create claude-api user
if id "claude-api" &>/dev/null; then
    echo "User claude-api already exists"
else
    echo "Creating claude-api user..."
    useradd -m -s /bin/bash claude-api
    echo "claude-api:claude-api" | chpasswd
    echo "✓ User claude-api created"
fi

# Create claude-pro user
if id "claude-pro" &>/dev/null; then
    echo "User claude-pro already exists"
else
    echo "Creating claude-pro user..."
    useradd -m -s /bin/bash claude-pro
    echo "claude-pro:claude-pro" | chpasswd
    echo "✓ User claude-pro created"
fi

# Create shared development group
if getent group devs &>/dev/null; then
    echo "Group devs already exists"
else
    echo "Creating devs group..."
    groupadd devs
    echo "✓ Group devs created"
fi

# Add users to devs group
usermod -a -G devs claude-api
usermod -a -G devs claude-pro
usermod -a -G devs $SUDO_USER

echo ""
echo "========================================="
echo "✅ Users Created Successfully"
echo "========================================="
echo ""
echo "Users created:"
echo "  • claude-api (for API usage)"
echo "  • claude-pro (for subscription)"
echo ""
echo "Default passwords:"
echo "  claude-api: claude-api"
echo "  claude-pro: claude-pro"
echo ""
echo "⚠️  IMPORTANT: Change these passwords!"
echo "  sudo passwd claude-api"
echo "  sudo passwd claude-pro"
echo ""
echo "Next steps:"
echo "  1. Run setup-api-user.sh to configure API user"
echo "  2. Run setup-pro-user.sh to configure subscription user"
echo ""
echo "To switch users:"
echo "  su - claude-api"
echo "  su - claude-pro"
echo ""
