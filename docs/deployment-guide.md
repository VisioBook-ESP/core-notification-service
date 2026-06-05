# Deployment Guide

## Production Deployment

This guide covers deploying the Core Notification Service to production environments.

## 🏗️ Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│ Load Balancer (Nginx/AWS ALB)                   │
│ - Rate limiting                                 │
│ - SSL/TLS termination                           │
│ - Health checks                                 │
└────────────┬────────────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌──────────┐    ┌──────────┐
│  Pod 1   │    │  Pod 2   │  (Kubernetes replicas)
│  Service │    │  Service │
└────┬─────┘    └────┬─────┘
     └────────┬──────┘
              ▼
     ┌─────────────────────┐
     │ PostgreSQL (Managed)│
     │ - AWS RDS           │
     │ - Auto backups      │
     └─────────────────────┘
              │
     ┌─────────────────────┐
     │ Redis (Managed)     │
     │ - AWS ElastiCache   │
     │ - Auto failover     │
     └─────────────────────┘
              │
     ┌─────────────────────┐
     │ SendGrid            │
     │ - SMTP Relay        │
     └─────────────────────┘
              │
     ┌─────────────────────┐
     │ Firebase            │
     │ - Cloud Messaging   │
     └─────────────────────┘
```

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] SendGrid API key obtained and verified
- [ ] Firebase credentials downloaded
- [ ] Database backups scheduled
- [ ] Redis persistence enabled
- [ ] SSL certificates ready
- [ ] API keys generated for service-to-service auth
- [ ] Monitoring/logging configured
- [ ] Team trained on monitoring dashboard

## 🌥️ Cloud Deployment (AWS)

### 1. Create RDS PostgreSQL Database

```bash
aws rds create-db-instance \
  --db-instance-identifier visiobook-notifications-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username visioadmin \
  --master-user-password <strong-password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --backup-retention-period 30 \
  --multi-az \
  --no-publicly-accessible
```

### 2. Create ElastiCache Redis Cluster

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id visiobook-notifications-cache \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 2 \
  --automatic-failover-enabled \
  --preferred-availability-zones us-east-1a us-east-1b
```

### 3. Create ECR Repository

```bash
aws ecr create-repository \
  --repository-name visiobook/core-notification-service \
  --region us-east-1
```

### 4. Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t visiobook/core-notification-service:v1.0.0 .

# Tag for ECR
docker tag visiobook/core-notification-service:v1.0.0 \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/visiobook/core-notification-service:v1.0.0

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/visiobook/core-notification-service:v1.0.0
```

## 🐳 Kubernetes Deployment

### Create Namespace

```bash
kubectl create namespace visiobook
```

### Create Secrets

```bash
kubectl create secret generic notification-service-secrets \
  --from-literal=sendgrid-api-key=SG.xxxxx \
  --from-literal=firebase-private-key='-----BEGIN PRIVATE KEY-----...' \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=valid-api-keys=service1-key,service2-key \
  -n visiobook
```

### Deploy with Helm

```bash
helm install notification-service ./helm \
  --namespace visiobook \
  --values ./helm/values-prod.yaml
```

### Helm values-prod.yaml

```yaml
replicaCount: 3

image:
  repository: <account-id>.dkr.ecr.us-east-1.amazonaws.com/visiobook/core-notification-service
  tag: v1.0.0

env:
  NODE_ENV: production
  LOG_LEVEL: info
  DATABASE_HOST: visiobook-notifications-db.xxxxxx.us-east-1.rds.amazonaws.com
  DATABASE_PORT: 5432
  DATABASE_NAME: notifications_prod
  REDIS_HOST: visiobook-notifications-cache.xxxxxx.ng.0001.use1.cache.amazonaws.com
  REDIS_PORT: 6379

resources:
  requests:
    cpu: 250m
    memory: 512Mi
  limits:
    cpu: 500m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: notifications-api.visiobook.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: notifications-api-tls
      hosts:
        - notifications-api.visiobook.com
```

## 📊 Environment Variables (Production)

```bash
# Server
NODE_ENV=production
PORT=8088
LOG_LEVEL=info

# Database
DATABASE_HOST=visiobook-notifications-db.xxxxxx.rds.amazonaws.com
DATABASE_PORT=5432
DATABASE_USER=visioadmin
DATABASE_PASSWORD=<strong-password-from-secrets>
DATABASE_NAME=notifications_prod
DATABASE_SSL=true
DATABASE_POOL_MIN=5
DATABASE_POOL_MAX=20

# Redis
REDIS_HOST=visiobook-notifications-cache.xxxxxx.cache.amazonaws.com
REDIS_PORT=6379
REDIS_PASSWORD=<redis-auth-token>
REDIS_TLS=true

# JWT
JWT_SECRET=<secure-random-key>
JWT_EXPIRATION=24h

# SendGrid
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=notifications@visiobook.com

# Firebase
FIREBASE_PROJECT_ID=visiobook-prod
FIREBASE_PRIVATE_KEY=<from-secrets>
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@visiobook-prod.iam.gserviceaccount.com

# API Keys
VALID_API_KEYS=<generated-service-keys>

# Monitoring
NEW_RELIC_LICENSE_KEY=<key>
DATA_DOG_API_KEY=<key>
```

## 🔄 Database Migrations

Automatic on startup (TypeORM synchronize is disabled in production):

```bash
# Manual migration if needed
npm run migration:run

# Revert migrations
npm run migration:revert
```

## 📈 Monitoring & Logging

### CloudWatch Logs

```bash
# View logs
aws logs tail /ecs/visiobook-notifications --follow
```

### Application Performance Monitoring

Integrated with:
- **New Relic** - APM and error tracking
- **DataDog** - Metrics and alerting
- **Prometheus** - Metrics scraping

### Key Metrics to Monitor

- Email queue depth
- Push queue depth
- Email delivery success rate
- Push delivery success rate
- API response times
- Database connection pool utilization
- Redis memory usage
- Error rates by type

## 🔐 Security Checklist

- [ ] HTTPS/TLS enabled
- [ ] Database connections encrypted
- [ ] Redis connections encrypted
- [ ] Secrets in AWS Secrets Manager
- [ ] API keys rotated regularly
- [ ] Rate limiting enabled
- [ ] CORS configured correctly
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (TypeORM with parameterized queries)
- [ ] Audit logging enabled
- [ ] Network policies configured

## 🚨 High Availability

### Multi-Region Failover

```bash
# Primary region: us-east-1
# Failover region: us-west-2

# RDS Multi-AZ with Read Replicas
aws rds create-db-instance-read-replica \
  --db-instance-identifier visiobook-notifications-db-replica \
  --source-db-instance-identifier visiobook-notifications-db \
  --db-instance-class db.t3.medium \
  --availability-zone us-west-2a
```

### Auto-Scaling Configuration

```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: notification-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: notification-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 🔄 Continuous Deployment

### GitHub Actions CI/CD

```yaml
# .github/workflows/deploy.yml
name: Deploy Notification Service

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push Docker image
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
      - name: Update Kubernetes deployment
        run: |
          kubectl set image deployment/notification-service \
            notification-service=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
```

## 📞 Support & Rollback

### Rollback a Deployment

```bash
# View deployment history
kubectl rollout history deployment/notification-service

# Rollback to previous version
kubectl rollout undo deployment/notification-service

# Rollback to specific revision
kubectl rollout undo deployment/notification-service --to-revision=2
```

### Contact On-Call

For deployment issues, contact the platform team or check the runbook: `/docs/runbook.md`
