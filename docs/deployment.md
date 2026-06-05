# Deployment Guide

## Overview

The Core Notification Service is designed for production deployment on Kubernetes (CNPG + Helm) with Docker containerization. This guide covers local Docker setup, Kubernetes deployment, and production configuration.

## Table of Contents

1. [Local Development with Docker](#local-development-with-docker)
2. [Docker Images](#docker-images)
3. [Environment Configuration](#environment-configuration)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [Health Checks & Monitoring](#health-checks--monitoring)
6. [Production Deployment](#production-deployment)
7. [Troubleshooting](#troubleshooting)

## Local Development with Docker

### Quick Start

```bash
# Clone repository
git clone <repo-url>
cd core-notification-service

# Create .env file
cp .env.example .env

# Set required environment variables
export SENDGRID_API_KEY=your_sendgrid_key
export FIREBASE_PROJECT_ID=your_firebase_project
export FIREBASE_PRIVATE_KEY=your_firebase_private_key
export FIREBASE_CLIENT_EMAIL=your_firebase_email

# Start all services
docker-compose up -d

# Verify services are running
docker-compose ps

# Check logs
docker-compose logs -f core-notification-service
```

### Docker Compose Services

**core-notification-service**
- Build: Dockerfile.dev (with hot-reload)
- Port: 8088
- Depends on: PostgreSQL, Redis
- Health check: `/api/v1/health` endpoint

**PostgreSQL** (postgres:15-alpine)
- Port: 5432
- Database: notifications_db
- User: visiobook
- Health check: Built-in PostgreSQL health check

**Redis** (redis:7-alpine)
- Port: 6379
- Health check: PING command
- Used for: Bull queue storage

### Stopping Services

```bash
# Stop all services (keep data)
docker-compose down

# Stop and remove volumes (clean data)
docker-compose down -v

# Stop specific service
docker-compose down core-notification-service
```

### Volumes

```
.:/app                    # Source code hot-reload
/app/node_modules        # Node modules persistence
postgres_data:           # PostgreSQL data persistence
redis_data:              # Redis data persistence (if configured)
```

## Docker Images

### Production Image (Dockerfile)

Multi-stage build optimized for production:

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 8088
HEALTHCHECK --interval=10s --timeout=3s --retries=10 \
  CMD npm run healthcheck || exit 1
CMD ["npm", "run", "start:prod"]
```

**Size**: ~200MB (vs. ~500MB with dev dependencies)

**Build**:
```bash
docker build -f Dockerfile -t notifications-service:latest .
```

### Development Image (Dockerfile.dev)

Development image with hot-reload and debugging:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 8088 9229
CMD ["npm", "run", "start:dev"]
```

**Size**: ~500MB (includes dev dependencies)

**Build**:
```bash
docker build -f Dockerfile.dev -t notifications-service:dev .
```

## Environment Configuration

### .env File (Development)

```bash
NODE_ENV=development
PORT=8088

# Database
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=visiobook
DATABASE_PASSWORD=visiobook_dev_password
DATABASE_NAME=notifications_db

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key_dev

# SendGrid (required for email)
SENDGRID_API_KEY=your_sendgrid_api_key

# Firebase (required for push notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_service_account_email

# API Keys for service-to-service auth
VALID_API_KEYS=sk-service-email,sk-service-push,sk-admin-templates

# CORS
CORS_ORIGIN=http://localhost:3000,https://app.visiobook.com
```

### .env.example

Template for required environment variables (committed to repo).

### Environment Variables by Service

**Core Notification Service**:
- `NODE_ENV` - development|staging|production
- `PORT` - Server port (default: 8088)
- `JWT_SECRET` - Secret key for JWT signing
- `VALID_API_KEYS` - Comma-separated service API keys

**Database**:
- `DATABASE_HOST` - PostgreSQL hostname
- `DATABASE_PORT` - PostgreSQL port
- `DATABASE_USER` - PostgreSQL user
- `DATABASE_PASSWORD` - PostgreSQL password
- `DATABASE_NAME` - Database name

**Redis/Queue**:
- `REDIS_HOST` - Redis hostname
- `REDIS_PORT` - Redis port

**External Services**:
- `SENDGRID_API_KEY` - SendGrid API key
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_PRIVATE_KEY` - Firebase private key
- `FIREBASE_CLIENT_EMAIL` - Firebase service account email

## Kubernetes Deployment

### Prerequisites

- Kubernetes cluster (v1.24+)
- Helm 3.x installed
- kubectl configured
- PostgreSQL with CNPG operator (or managed service)
- Redis instance (or managed service)

### Helm Chart Structure

```
helm/
├── Chart.yaml                 # Chart metadata
├── values.yaml               # Default values
├── values-dev.yaml           # Development overrides
├── values-staging.yaml       # Staging overrides
├── values-prod.yaml          # Production overrides
└── templates/
    ├── deployment.yaml       # Deployment spec
    ├── service.yaml          # Service spec
    ├── configmap.yaml        # Configuration
    ├── secret.yaml           # Secrets (encrypted)
    ├── hpa.yaml              # Horizontal Pod Autoscaler
    └── servicemonitor.yaml   # Prometheus monitoring
```

### Deployment Environments

#### Development

```bash
helm install core-notification helm/ \
  -f helm/values-dev.yaml \
  -n notifications-dev \
  --create-namespace

# Or upgrade
helm upgrade core-notification helm/ \
  -f helm/values-dev.yaml \
  -n notifications-dev
```

**values-dev.yaml**:
```yaml
replicaCount: 1

image:
  tag: dev
  pullPolicy: Always

resources:
  limits:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: false

ingress:
  enabled: true
  host: notifications-dev.visiobook.local
```

#### Staging

```bash
helm install core-notification helm/ \
  -f helm/values-staging.yaml \
  -n notifications-staging \
  --create-namespace
```

**values-staging.yaml**:
```yaml
replicaCount: 2

image:
  tag: latest
  pullPolicy: IfNotPresent

resources:
  limits:
    cpu: 1000m
    memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 5
  targetCPUUtilizationPercentage: 70

ingress:
  enabled: true
  host: notifications-staging.visiobook.dev
```

#### Production

```bash
helm install core-notification helm/ \
  -f helm/values-prod.yaml \
  -n notifications-prod \
  --create-namespace
```

**values-prod.yaml**:
```yaml
replicaCount: 3

image:
  tag: v1.0.0  # Use specific version tags
  pullPolicy: IfNotPresent

resources:
  limits:
    cpu: 2000m
    memory: 2Gi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilizationPercentage: 75

affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app
                operator: In
                values:
                  - core-notification
          topologyKey: kubernetes.io/hostname

ingress:
  enabled: true
  host: notifications.visiobook.com
  tls:
    enabled: true
    issuer: letsencrypt-prod
```

### Deployment Commands

**Install**:
```bash
helm install core-notification helm/ \
  -f helm/values-prod.yaml \
  -n notifications-prod \
  --create-namespace
```

**Upgrade**:
```bash
helm upgrade core-notification helm/ \
  -f helm/values-prod.yaml \
  -n notifications-prod
```

**Rollback**:
```bash
helm rollback core-notification 1 -n notifications-prod
```

**Status**:
```bash
helm status core-notification -n notifications-prod
helm get values core-notification -n notifications-prod
helm history core-notification -n notifications-prod
```

**Uninstall**:
```bash
helm uninstall core-notification -n notifications-prod
```

## Health Checks & Monitoring

### Health Check Endpoints

**Liveness Probe** - Service is running
```
GET /api/v1/health
Expected: 200 OK
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-04-17T10:30:00Z"
}
```

**Readiness Probe** - Service is ready to handle traffic
```
GET /api/v1/ready
Expected: 200 OK if ready, 503 if not
```

Response:
```json
{
  "status": "ready",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2024-04-17T10:30:00Z"
}
```

### Kubernetes Probes

In deployment.yaml:

```yaml
livenessProbe:
  httpGet:
    path: /api/v1/health
    port: 8088
  initialDelaySeconds: 10
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/v1/ready
    port: 8088
  initialDelaySeconds: 5
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 3
```

### Monitoring

**Prometheus ServiceMonitor** (servicemonitor.yaml):
```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: core-notification
spec:
  selector:
    matchLabels:
      app: core-notification
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
```

**Metrics Endpoints**:
- `/metrics` - Prometheus metrics
- Queue stats
- Email/push processing times
- Error rates

## Production Deployment

### Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run
- [ ] Redis instance available
- [ ] SendGrid API key validated
- [ ] Firebase credentials valid
- [ ] SSL certificate configured
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured
- [ ] Logging aggregation setup
- [ ] Rate limiting configured

### Deployment Steps

#### 1. Build and Push Image

```bash
# Build
docker build -t notifications-service:v1.0.0 .

# Tag for registry
docker tag notifications-service:v1.0.0 \
  registry.visiobook.com/notifications-service:v1.0.0

# Push to registry
docker push registry.visiobook.com/notifications-service:v1.0.0
```

#### 2. Database Migration

```bash
# On staging first
kubectl exec -it notifications-staging-0 -- \
  npm run db:migrate

# Then on production
kubectl exec -it notifications-prod-0 -- \
  npm run db:migrate
```

#### 3. Deploy with Helm

```bash
# Staging deployment
helm upgrade --install core-notification helm/ \
  -f helm/values-staging.yaml \
  -n notifications-staging

# Wait for rollout
kubectl rollout status deployment/core-notification \
  -n notifications-staging

# Production deployment
helm upgrade --install core-notification helm/ \
  -f helm/values-prod.yaml \
  -n notifications-prod \
  -n notifications-prod
```

#### 4. Verify Deployment

```bash
# Check pods
kubectl get pods -n notifications-prod

# Check services
kubectl get svc -n notifications-prod

# Check logs
kubectl logs -f deployment/core-notification -n notifications-prod

# Port forward for local testing
kubectl port-forward svc/core-notification 8088:8088 -n notifications-prod

# Test endpoints
curl http://localhost:8088/api/v1/health
```

### Scaling

```bash
# Manual scaling
kubectl scale deployment core-notification \
  --replicas=5 -n notifications-prod

# Or update HPA
kubectl patch hpa core-notification \
  -p '{"spec":{"maxReplicas":15}}' \
  -n notifications-prod
```

### Rolling Update

```bash
# Kubernetes handles rolling updates automatically
kubectl set image deployment/core-notification \
  core-notification=registry.visiobook.com/notifications-service:v1.0.1 \
  -n notifications-prod

# Monitor rollout
kubectl rollout status deployment/core-notification -n notifications-prod
```

## Troubleshooting

### Pod Not Starting

```bash
# Check pod status
kubectl describe pod <pod-name> -n notifications-prod

# Check logs
kubectl logs <pod-name> -n notifications-prod

# Check events
kubectl get events -n notifications-prod --sort-by='.lastTimestamp'
```

### Database Connection Issues

```bash
# Verify database service
kubectl get endpoints postgres -n notifications-prod

# Test connection
kubectl run -it --rm debug --image=postgres:15-alpine \
  --command -- psql -h postgres-notifications \
  -U visiobook -d notifications_db
```

### Redis Connection Issues

```bash
# Check Redis connectivity
kubectl exec -it <pod-name> -- \
  redis-cli -h redis ping

# Monitor Redis
kubectl exec -it <pod-name> -- \
  redis-cli MONITOR
```

### Volume Mount Issues

```bash
# Check persistent volumes
kubectl get pv

# Check persistent volume claims
kubectl get pvc -n notifications-prod

# Check volume mounts
kubectl describe pod <pod-name> -n notifications-prod | grep -A 5 Mounts
```

### High Memory Usage

```bash
# Check resource usage
kubectl top pods -n notifications-prod

# Increase limits in values.yaml
resources:
  limits:
    memory: 4Gi

# Apply changes
helm upgrade core-notification helm/ \
  -f helm/values-prod.yaml -n notifications-prod
```

## Rollback Procedure

If deployment issues occur:

```bash
# View release history
helm history core-notification -n notifications-prod

# Rollback to previous version
helm rollback core-notification 1 -n notifications-prod

# Verify rollback
kubectl rollout status deployment/core-notification -n notifications-prod

# Check if service is healthy
curl https://notifications.visiobook.com/api/v1/health
```

## Secrets Management

### Using Sealed Secrets (Recommended)

```bash
# Install sealed-secrets controller
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.18.0/controller.yaml

# Create secret
kubectl create secret generic notification-secrets \
  --from-literal=jwt-secret=<SECRET> \
  --from-literal=sendgrid-api-key=<KEY> \
  -n notifications-prod -o yaml | kubeseal -f - > secret-sealed.yaml

# Apply sealed secret
kubectl apply -f secret-sealed.yaml -n notifications-prod
```

### Using HashiCorp Vault (Enterprise)

```bash
# Configure Vault agent
kubectl apply -f vault/agent-config.yaml

# Vault will inject secrets at runtime
```

## Backup & Disaster Recovery

### Database Backups

```bash
# Periodic backups (automated with CNPG)
kubectl get pg -n notifications-prod

# Manual backup
kubectl exec postgres-notifications-0 -- \
  pg_dump -U visiobook notifications_db > backup.sql

# Restore
kubectl exec postgres-notifications-0 -- \
  psql -U visiobook notifications_db < backup.sql
```

### Point-in-time Recovery

```bash
# Check backup timeline
kubectl logs postgres-notifications-0 \
  -c postgres -n notifications-prod

# Restore to specific time
# Use CNPG's recovery features
```

## Performance Optimization

### Resource Limits

```yaml
resources:
  requests:
    cpu: 500m
    memory: 512Mi
  limits:
    cpu: 2000m
    memory: 2Gi
```

### Pod Disruption Budget

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: core-notification
spec:
  minAvailable: 1
  selector:
    matchLabels:
      app: core-notification
```

### Cache Configuration

- Enable Redis caching for templates
- Implement cache invalidation
- Use CDN for static assets

## References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Helm Documentation](https://helm.sh/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [PostgreSQL CNPG Operator](https://cloudnative-pg.io/)

## Support & Issues

For deployment issues:
1. Check logs: `kubectl logs <pod> -n <namespace>`
2. Check events: `kubectl get events -n <namespace>`
3. Verify configuration: `helm get values <release> -n <namespace>`
4. Check status: `kubectl describe pod <pod> -n <namespace>`
