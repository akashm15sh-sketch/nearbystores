#!/bin/bash

echo "🚀 NearbyStores - MongoDB Installation Script"
echo "=============================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "❌ Please do not run as root. Run without sudo."
   exit 1
fi

echo "📦 Installing MongoDB..."
echo ""

# Import MongoDB public GPG key
echo "1️⃣ Importing MongoDB GPG key..."
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | \
   sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

# Create list file for MongoDB
echo "2️⃣ Adding MongoDB repository..."
echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | \
   sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package database
echo "3️⃣ Updating package database..."
sudo apt-get update

# Install MongoDB
echo "4️⃣ Installing MongoDB packages..."
sudo apt-get install -y mongodb-org

# Start MongoDB
echo "5️⃣ Starting MongoDB service..."
sudo systemctl start mongod
sudo systemctl enable mongod

# Check status
echo ""
echo "✅ MongoDB installation complete!"
echo ""
echo "📊 MongoDB Status:"
sudo systemctl status mongod --no-pager | head -5

echo ""
echo "🎉 MongoDB is ready!"
echo ""
echo "Next steps:"
echo "1. Run: cd backend && npm install"
echo "2. Run: npm run dev"
echo "3. In new terminal: cd frontend && npm install && npm run dev"
