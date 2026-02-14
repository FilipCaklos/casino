# Royal Casino - Deployment Guide

## Prerequisites
- DigitalOcean account
- Docker and Docker Compose installed locally
- Git installed

## Local Development Setup

### 1. Clone and Install
```bash
git clone <your-repo-url>
cd royal-casino
```

### 2. Configure Environment
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your settings
```

### 3. Run with Docker Compose
```bash
docker-compose up --build
```

Access the casino at `http://localhost:5000`

---

## DigitalOcean Deployment

### Option 1: Using DigitalOcean App Platform (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Create DigitalOcean App**
   - Go to DigitalOcean Dashboard
   - Click "Create" → "Apps"
   - Select your GitHub repository
   - Choose "Docker" as the build type

3. **Configure Services**
   - Add MongoDB database service
   - Set environment variables:
     ```
     NODE_ENV=production
     JWT_SECRET=<generate-random-secret>
     MONGODB_URI=<database-connection-string>
     CLIENT_URL=https://your-domain.com
     ```

4. **Deploy**
   - Click "Deploy"
   - Monitor deployment progress

### Option 2: Using DigitalOcean Droplet

1. **Create Droplet**
   - Image: Ubuntu 22.04 LTS
   - Size: $5/month minimum recommended
   - Add your SSH key

2. **SSH into Droplet**
   ```bash
   ssh root@your_droplet_ip
   ```

3. **Install Dependencies**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

4. **Clone Repository**
   ```bash
   git clone <your-repo-url>
   cd royal-casino
   ```

5. **Create .env file**
   ```bash
   nano backend/.env
   ```
   Add production values

6. **Create .env for docker-compose**
   ```bash
   nano .env.prod
   ```
   Add:
   ```
   JWT_SECRET=<long-random-secret>
   CLIENT_URL=https://your-domain.com
   ```

7. **Run Docker Compose**
   ```bash
   docker-compose --env-file .env.prod up -d
   ```

8. **Setup Nginx as Reverse Proxy** (Optional but Recommended)
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/default
   ```

   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Restart Nginx:
   ```bash
   sudo systemctl restart nginx
   ```

9. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### Option 3: Using DigitalOcean Kubernetes

1. **Create Kubernetes Cluster**
   - Go to DigitalOcean Kubernetes
   - Create cluster in nearest region

2. **Configure kubectl**
   ```bash
   doctl kubernetes cluster kubeconfig save royal-casino
   ```

3. **Deploy Application**
   ```bash
   kubectl apply -f k8s-deployment.yaml
   ```

---

## Monitoring and Maintenance

### View Logs
```bash
# Docker Compose
docker-compose logs -f backend

# Kubernetes
kubectl logs deployment/royal-casino-backend
```

### Backup MongoDB
```bash
docker exec royal-casino-db mongodump --archive=/data/backup.archive
docker cp royal-casino-db:/data/backup.archive ./backup.archive
```

### Update Application
```bash
git pull origin main
docker-compose up -d --build
```

---

## Security Checklist

- [ ] Change MongoDB password
- [ ] Generate strong JWT_SECRET
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up firewall rules
- [ ] Enable automatic backups
- [ ] Monitor for suspicious activity
- [ ] Keep dependencies updated

---

## Troubleshooting

### Container won't start
```bash
docker-compose logs backend
docker-compose down
docker-compose up -d --build
```

### MongoDB connection issues
```bash
docker-compose exec mongo mongosh -u admin -p
# Then in MongoDB shell: use royal-casino
```

### Port already in use
```bash
docker-compose down
# or change port in docker-compose.yml
```

---

## Support
For issues, check logs and consult DigitalOcean documentation.
