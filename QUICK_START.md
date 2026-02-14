# Royal Casino - Quick Deployment Guide

## 🚀 DigitalOcean Deployment (5 minutes)

### Prerequisites
- DigitalOcean account
- Domain name (optional)
- Git installed locally

### Step 1: Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git push -u origin main
```

### Step 2: Deploy to DigitalOcean App Platform

1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. Click **Create** → **Apps**
3. Select your GitHub repository
4. Select **Docker** as build type
5. Configure services:
   - **Backend Service**: Uses Dockerfile
   - **Database**: Add MongoDB

### Step 3: Set Environment Variables

```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/royal-casino
JWT_SECRET=<generate-strong-random-string>
CLIENT_URL=https://your-app.ondigitalocean.app
```

### Step 4: Deploy

Click **Deploy** and wait 3-5 minutes.

Your casino is live! 🎰

---

## 🐳 Docker Compose (Local Testing)

### Quick Start
```bash
docker-compose up --build
```

Visit: `http://localhost:5000`

**Demo Account:**
- Username: `test`
- Password: `test`

### Troubleshooting

**Port already in use?**
```bash
docker-compose down
```

**View logs:**
```bash
docker-compose logs -f backend
```

**Reset database:**
```bash
docker-compose down -v
docker-compose up --build
```

---

## 💻 Manual Droplet Setup

### Create Droplet
- **Image**: Ubuntu 22.04 LTS
- **Size**: $5/month
- **Region**: Closest to your users

### SSH & Install

```bash
ssh root@droplet_ip
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/yourusername/royal-casino.git
cd royal-casino
```

### Configure & Run

```bash
# Create .env file
cat > .env.prod << EOF
JWT_SECRET=$(openssl rand -hex 32)
CLIENT_URL=https://your-domain.com
EOF

# Start
docker-compose --env-file .env.prod up -d
```

### Setup Domain (Optional)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generate SSL
sudo certbot --standalone -d your-domain.com

# Update nginx config and restart
```

---

## 📊 Kubernetes Deployment

### Prerequisites
```bash
# Create cluster
doctl kubernetes cluster create royal-casino --region nyc3

# Configure kubectl
doctl kubernetes cluster kubeconfig save royal-casino
```

### Deploy

```bash
# Create secrets
kubectl create secret generic casino-secrets \
  --from-literal=mongodb-uri='mongodb://...' \
  --from-literal=jwt-secret='your-secret-key'

# Deploy
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get pods
kubectl get svc
```

---

## 🔒 Security Checklist

Before going live:

- [ ] Generate strong JWT_SECRET
- [ ] Change MongoDB credentials
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Enable automatic backups
- [ ] Set up monitoring/alerts
- [ ] Update dependencies
- [ ] Test game logic thoroughly

---

## 📈 Monitoring

### View Logs
```bash
# Docker Compose
docker-compose logs -f backend

# Kubernetes
kubectl logs -f deployment/royal-casino-backend
```

### Database Backup
```bash
docker exec royal-casino-db mongodump --archive=/backup.archive
```

### Update Application
```bash
git pull
docker-compose up -d --build
```

---

## 💬 Support

- See DEPLOYMENT.md for detailed guide
- Check backend logs for errors
- MongoDB should be accessible on specified URI

**Happy deploying!** 🚀
