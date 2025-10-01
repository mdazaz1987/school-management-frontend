# Jenkins Setup Guide - Frontend Deployment

## 📋 Overview

This guide will help you set up Jenkins CI/CD pipeline for the School Management System frontend on Oracle Cloud.

**Deployment Details:**
- **Platform:** Oracle Cloud
- **Port:** 4001
- **Deployment Method:** PM2 + serve
- **Auto-trigger:** GitHub webhook + SCM polling
- **No Docker required**

---

## 🔧 Prerequisites

### 1. Jenkins Server (Oracle Cloud)
- Jenkins installed and running
- Jenkins user has sudo privileges
- Node.js 18+ installed
- Git installed

### 2. Global Tools Configuration

#### Configure Node.js in Jenkins
1. Go to **Jenkins → Manage Jenkins → Global Tool Configuration**
2. Scroll to **NodeJS**
3. Click **Add NodeJS**
4. Configure:
   - **Name:** `NodeJS-18`
   - **Version:** NodeJS 18.x or later
   - **Global npm packages:** (optional) `pm2 serve`
   - Click **Save**

---

## 🚀 Jenkins Job Setup

### Step 1: Create New Pipeline Job

1. **Jenkins Dashboard → New Item**
2. **Item name:** `school-management-frontend`
3. **Type:** Pipeline
4. Click **OK**

### Step 2: Configure Job

#### General Settings
- ✅ **GitHub project:** `https://github.com/mdazaz1987/school-management-frontend`
- ✅ **Description:** "School Management System Frontend - React Application"

#### Build Triggers
Enable **BOTH** options:

1. **GitHub hook trigger for GITScm polling**
   - ✅ Check this box
   - This enables webhook triggers

2. **Poll SCM**
   - ✅ Check this box
   - **Schedule:** `H/2 * * * *` (polls every 2 minutes)

#### Pipeline Configuration
- **Definition:** Pipeline script from SCM
- **SCM:** Git
- **Repository URL:** `https://github.com/mdazaz1987/school-management-frontend.git`
- **Credentials:** (Add your GitHub credentials)
- **Branch Specifier:** `*/main` or `*/develop`
- **Script Path:** `Jenkinsfile`

Click **Save**

---

## 🔐 Setup Jenkins Credentials

### GitHub Credentials

1. **Jenkins → Manage Jenkins → Manage Credentials**
2. **Click:** (global) → Add Credentials
3. **Kind:** Username with password
4. **Username:** mdazaz1987
5. **Password:** Your GitHub Personal Access Token
6. **ID:** `github-credentials`
7. Click **OK**

---

## 🌐 Setup GitHub Webhook (Auto-trigger)

### Step 1: Get Jenkins Webhook URL

Your webhook URL format:
```
http://YOUR_ORACLE_CLOUD_IP:8080/github-webhook/
```

Example:
```
http://123.456.78.90:8080/github-webhook/
```

### Step 2: Configure GitHub Webhook

1. Go to **GitHub Repository:**
   https://github.com/mdazaz1987/school-management-frontend

2. **Settings → Webhooks → Add webhook**

3. **Configure:**
   - **Payload URL:** `http://YOUR_JENKINS_IP:8080/github-webhook/`
   - **Content type:** `application/json`
   - **Secret:** (leave empty or add if needed)
   - **Which events?** 
     - ✅ Just the push event
   - **Active:** ✅ Checked
   
4. Click **Add webhook**

5. **Test:** 
   - Click on the webhook
   - Click **Recent Deliveries**
   - Click **Redeliver** to test
   - Should see green checkmark ✅

---

## 💻 Oracle Cloud Server Setup

### 1. Install Required Software

```bash
# SSH into your Oracle Cloud instance
ssh your-user@your-oracle-cloud-ip

# Install Node.js 18 (if not installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install serve globally
sudo npm install -g serve

# Verify installations
pm2 --version
serve --version
```

### 2. Create Deployment Directory

```bash
# Create directory for frontend deployment
sudo mkdir -p /var/www/school-frontend
sudo chown -R jenkins:jenkins /var/www/school-frontend
sudo chmod 755 /var/www/school-frontend
```

### 3. Configure Firewall (Open Port 4001)

```bash
# For Ubuntu/Debian with ufw
sudo ufw allow 4001/tcp
sudo ufw status

# For Oracle Cloud specific (iptables)
sudo iptables -I INPUT -p tcp --dport 4001 -j ACCEPT
sudo service iptables save

# For firewalld
sudo firewall-cmd --permanent --add-port=4001/tcp
sudo firewall-cmd --reload
```

### 4. Configure Oracle Cloud Security List

1. **Oracle Cloud Console**
2. **Networking → Virtual Cloud Networks**
3. **Select your VCN → Security Lists**
4. **Add Ingress Rule:**
   - **Source CIDR:** `0.0.0.0/0`
   - **IP Protocol:** TCP
   - **Destination Port Range:** `4001`
   - Click **Add Ingress Rule**

### 5. Grant Jenkins User Sudo Permissions

```bash
# Edit sudoers file
sudo visudo

# Add this line (allow jenkins user to run specific commands without password)
jenkins ALL=(ALL) NOPASSWD: /bin/mkdir, /bin/cp, /bin/mv, /bin/rm, /bin/chown, /usr/bin/npm

# Or grant full sudo access (less secure)
jenkins ALL=(ALL) NOPASSWD: ALL
```

---

## ⚙️ Environment Variables

Update Jenkinsfile environment variables:

```groovy
environment {
    APP_PORT = '4001'
    DEPLOY_DIR = '/var/www/school-frontend'
    APP_NAME = 'school-management-frontend'
    REACT_APP_API_URL = 'http://YOUR_BACKEND_IP:8080/api'  // Update this!
}
```

**Important:** Update `REACT_APP_API_URL` with your actual backend URL!

---

## 🧪 Test the Pipeline

### Manual Trigger

1. Go to Jenkins job: `school-management-frontend`
2. Click **Build Now**
3. Watch the **Console Output**
4. Pipeline should complete successfully

### Automatic Trigger (Push to GitHub)

```bash
# Make a small change
cd "/Users/mohammedazaz/Documents/School Management System/frontend"
echo "# Test change" >> README.md
git add README.md
git commit -m "test: Trigger Jenkins build"
git push origin main
```

Jenkins should automatically start building within 2 minutes!

---

## 📊 Pipeline Stages

The pipeline includes these stages:

1. **Checkout** - Clone code from GitHub
2. **Environment Info** - Display Node/npm versions
3. **Install Dependencies** - `npm ci`
4. **Lint Code** - ESLint checks
5. **Run Tests** - Unit tests with coverage
6. **Build Application** - `npm run build`
7. **Deploy to Oracle Cloud** - Copy to `/var/www/school-frontend`
8. **Health Check** - Verify app is running on port 4001
9. **Cleanup Old Builds** - Keep only last 3 backups

---

## 🔍 Verify Deployment

### Check Application Status

```bash
# SSH into Oracle Cloud
ssh your-user@your-oracle-cloud-ip

# Check PM2 status
pm2 status

# Should show:
# ┌─────┬──────────────────────────────┬─────────┬─────────┐
# │ id  │ name                         │ status  │ port    │
# ├─────┼──────────────────────────────┼─────────┼─────────┤
# │ 0   │ school-management-frontend   │ online  │ 4001    │
# └─────┴──────────────────────────────┴─────────┴─────────┘

# Check application logs
pm2 logs school-management-frontend

# Check if port 4001 is listening
sudo netstat -tlnp | grep 4001
# or
sudo ss -tlnp | grep 4001
```

### Access Application

```bash
# From server
curl http://localhost:4001

# From browser (replace with your IP)
http://YOUR_ORACLE_CLOUD_IP:4001
```

---

## 🛠️ PM2 Commands

```bash
# View all apps
pm2 list

# View logs
pm2 logs school-management-frontend

# Restart app
pm2 restart school-management-frontend

# Stop app
pm2 stop school-management-frontend

# Delete app
pm2 delete school-management-frontend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
```

---

## 📧 Email Notifications (Optional)

### Configure Jenkins Email

1. **Jenkins → Manage Jenkins → Configure System**
2. **Scroll to Extended E-mail Notification**
3. **Configure:**
   - **SMTP server:** smtp.gmail.com
   - **SMTP Port:** 465
   - **Use SSL:** ✅
   - **Credentials:** Add Gmail credentials
   - **Default Recipients:** rahat.azaz1@gmail.com

4. **Test email configuration**

---

## 🔄 Rollback Process

### Automatic Rollback
If deployment fails, Jenkins automatically rolls back to the previous build.

### Manual Rollback

```bash
# SSH into server
cd /var/www/school-frontend

# List available backups
ls -lh build.backup.*

# Restore a specific backup
sudo rm -rf build
sudo cp -r build.backup.YYYYMMDD_HHMMSS build
pm2 restart school-management-frontend
```

---

## 🐛 Troubleshooting

### Issue: Port 4001 already in use

```bash
# Find process using port 4001
sudo lsof -i :4001
# or
sudo netstat -tlnp | grep 4001

# Kill the process
sudo kill -9 PID

# Restart application
pm2 restart school-management-frontend
```

### Issue: Permission denied

```bash
# Fix ownership
sudo chown -R jenkins:jenkins /var/www/school-frontend

# Fix permissions
sudo chmod -R 755 /var/www/school-frontend
```

### Issue: Build fails - npm install error

```bash
# Clear npm cache on Jenkins server
npm cache clean --force

# Or in Jenkins job, add before npm ci:
npm cache verify
```

### Issue: Health check fails

```bash
# Check if app is running
pm2 status

# Check application logs
pm2 logs school-management-frontend

# Check if port is open
curl http://localhost:4001

# Restart application
pm2 restart school-management-frontend
```

### Issue: Webhook not triggering

1. **Check webhook delivery on GitHub:**
   - Repo → Settings → Webhooks → Recent Deliveries
   - Should show green checkmark

2. **Verify Jenkins URL is accessible:**
   ```bash
   curl http://YOUR_JENKINS_IP:8080/github-webhook/
   ```

3. **Check Jenkins system log:**
   - Jenkins → Manage Jenkins → System Log

---

## 📝 Jenkins Job Configuration Summary

```groovy
// Jenkinsfile key configurations:
- Node.js: NodeJS-18
- Deployment Port: 4001
- Deploy Directory: /var/www/school-frontend
- Process Manager: PM2
- Web Server: serve
- Auto-trigger: GitHub webhook + SCM polling
- Health Check: 5 retries with 5s interval
- Backup: Keeps last 3 builds
- Rollback: Automatic on failure
```

---

## ✅ Deployment Checklist

- [ ] Jenkins installed and configured on Oracle Cloud
- [ ] Node.js 18+ installed
- [ ] NodeJS-18 configured in Jenkins Global Tools
- [ ] PM2 and serve installed globally
- [ ] Deployment directory created (`/var/www/school-frontend`)
- [ ] Port 4001 opened in firewall
- [ ] Oracle Cloud Security List configured
- [ ] Jenkins user has sudo permissions
- [ ] GitHub credentials added to Jenkins
- [ ] Jenkins pipeline job created
- [ ] GitHub webhook configured
- [ ] Jenkinsfile environment variables updated
- [ ] Backend API URL configured
- [ ] First build tested successfully
- [ ] Application accessible on port 4001
- [ ] Auto-trigger tested (git push)

---

## 🎯 Expected Results

After setup:
- ✅ Jenkins monitors GitHub for changes
- ✅ Auto-builds on every git push
- ✅ Deploys to `/var/www/school-frontend`
- ✅ Serves on port 4001
- ✅ PM2 manages process
- ✅ Auto-restarts on failure
- ✅ Keeps backups for rollback
- ✅ Email notifications sent

---

## 📞 Support

If you encounter issues:
1. Check Jenkins console output
2. Check PM2 logs: `pm2 logs school-management-frontend`
3. Check system logs: `/var/log/jenkins/jenkins.log`
4. Verify firewall rules
5. Test port accessibility

---

**Your frontend CI/CD pipeline is now ready!** 🚀

Any code push to GitHub will automatically trigger Jenkins to build and deploy your React application to port 4001 on Oracle Cloud.
