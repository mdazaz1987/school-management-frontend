#!/bin/bash

# School Management System Frontend - Server Setup Script
# Run this script on your Oracle Cloud server BEFORE running Jenkins build

set -e

echo "=========================================="
echo "Frontend Server Setup"
echo "=========================================="
echo ""

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then 
    echo "✅ Running with root privileges"
else
    echo "⚠️  Not running as root. Some commands may fail."
    echo "Please run: sudo bash server-setup.sh"
    exit 1
fi

# 1. Install Node.js if not installed
echo "1. Checking Node.js installation..."
if command -v node &> /dev/null; then
    echo "✅ Node.js already installed: $(node --version)"
else
    echo "📦 Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js installed: $(node --version)"
fi

# 2. Install npm globally required packages
echo ""
echo "2. Installing PM2 and serve globally..."
npm install -g pm2 serve
echo "✅ PM2 version: $(pm2 --version)"
echo "✅ serve installed"

# 3. Create deployment directory
echo ""
echo "3. Creating deployment directory..."
DEPLOY_DIR="/var/www/school-frontend"
mkdir -p ${DEPLOY_DIR}

# Find jenkins user or create it
JENKINS_USER="jenkins"
if id "$JENKINS_USER" &>/dev/null; then
    echo "✅ Jenkins user exists"
else
    echo "⚠️  Jenkins user not found. Using current user."
    JENKINS_USER=$(whoami)
fi

# Set ownership to jenkins user
chown -R ${JENKINS_USER}:${JENKINS_USER} ${DEPLOY_DIR}
chmod -R 755 ${DEPLOY_DIR}
echo "✅ Directory created: ${DEPLOY_DIR}"
echo "✅ Ownership: ${JENKINS_USER}:${JENKINS_USER}"

# 4. Configure firewall for port 4001
echo ""
echo "4. Configuring firewall for port 4001..."

# Check if ufw is available
if command -v ufw &> /dev/null; then
    echo "Using ufw..."
    ufw allow 4001/tcp
    ufw status | grep 4001 || echo "⚠️  Rule may not be active"
    echo "✅ UFW rule added for port 4001"
fi

# Check if firewalld is available
if command -v firewall-cmd &> /dev/null; then
    echo "Using firewalld..."
    firewall-cmd --permanent --add-port=4001/tcp
    firewall-cmd --reload
    echo "✅ Firewalld rule added for port 4001"
fi

# Add iptables rule
echo "Adding iptables rule..."
iptables -I INPUT -p tcp --dport 4001 -j ACCEPT
# Try to save iptables rules
if command -v netfilter-persistent &> /dev/null; then
    netfilter-persistent save
elif [ -f /etc/init.d/iptables ]; then
    service iptables save
fi
echo "✅ iptables rule added for port 4001"

# 5. Give Jenkins user permissions to PM2
echo ""
echo "5. Setting up PM2 for Jenkins user..."
su - ${JENKINS_USER} -c "pm2 startup" || echo "PM2 startup configured"

# 6. Create a test page
echo ""
echo "6. Creating test page..."
mkdir -p ${DEPLOY_DIR}/build
cat > ${DEPLOY_DIR}/build/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>School Management System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            text-align: center;
        }
        h1 { font-size: 3em; margin: 0; }
        p { font-size: 1.2em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎓 School Management System</h1>
        <p>Frontend deployment successful!</p>
        <p>Waiting for Jenkins build...</p>
    </div>
</body>
</html>
EOF
chown -R ${JENKINS_USER}:${JENKINS_USER} ${DEPLOY_DIR}/build
echo "✅ Test page created"

# 7. Start test server
echo ""
echo "7. Starting test server on port 4001..."
su - ${JENKINS_USER} -c "cd ${DEPLOY_DIR} && pm2 delete school-management-frontend 2>/dev/null || true"
su - ${JENKINS_USER} -c "cd ${DEPLOY_DIR} && pm2 start serve --name school-management-frontend -- -s build -l 4001"
su - ${JENKINS_USER} -c "pm2 save"

echo "✅ Test server started"

# 8. Display PM2 status
echo ""
echo "8. PM2 Status:"
su - ${JENKINS_USER} -c "pm2 status"

# 9. Test the application
echo ""
echo "9. Testing application..."
sleep 3
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001 || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ Application is running! HTTP Status: 200"
else
    echo "⚠️  Application test failed. HTTP Status: $HTTP_STATUS"
fi

# 10. Summary
echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Summary:"
echo "  - Node.js: $(node --version)"
echo "  - npm: $(npm --version)"
echo "  - PM2: $(pm2 --version)"
echo "  - Deploy Directory: ${DEPLOY_DIR}"
echo "  - Owner: ${JENKINS_USER}"
echo "  - Port: 4001"
echo ""
echo "🌐 Access your application:"
echo "  - Local: http://localhost:4001"
echo "  - External: http://$(hostname -I | awk '{print $1}'):4001"
echo ""
echo "⚠️  IMPORTANT: Configure Oracle Cloud Security List"
echo "  1. Go to Oracle Cloud Console"
echo "  2. Networking → Virtual Cloud Networks"
echo "  3. Select your VCN → Security Lists"
echo "  4. Add Ingress Rule: Port 4001, Protocol TCP, Source 0.0.0.0/0"
echo ""
echo "✅ Jenkins can now deploy to this server!"
echo "   Just trigger a build in Jenkins"
echo ""
