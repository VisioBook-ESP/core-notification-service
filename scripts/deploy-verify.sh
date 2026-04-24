#!/bin/bash

##############################################################################
# Deployment Verification Script for Core Notification Service
# 
# This script verifies that all components are properly deployed and
# functioning correctly in the specified environment.
#
# Usage: ./deploy-verify.sh [dev|staging|prod]
##############################################################################

set -euo pipefail

ENVIRONMENT=${1:-dev}
NAMESPACE="notifications-${ENVIRONMENT}"
SERVICE_NAME="core-notification"
TIMEOUT=300

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Deployment Verification: ${ENVIRONMENT}"
echo "Namespace: ${NAMESPACE}"
echo "==========================================" 

# Check if namespace exists
echo -e "\n${YELLOW}[1/10] Checking namespace...${NC}"
if kubectl get namespace "${NAMESPACE}" &> /dev/null; then
    echo -e "${GREEN}✓ Namespace ${NAMESPACE} exists${NC}"
else
    echo -e "${RED}✗ Namespace ${NAMESPACE} not found${NC}"
    exit 1
fi

# Check if Helm release exists
echo -e "\n${YELLOW}[2/10] Checking Helm release...${NC}"
if helm list -n "${NAMESPACE}" | grep -q "${SERVICE_NAME}"; then
    echo -e "${GREEN}✓ Helm release ${SERVICE_NAME} found${NC}"
    helm status "${SERVICE_NAME}" -n "${NAMESPACE}" | head -20
else
    echo -e "${RED}✗ Helm release ${SERVICE_NAME} not found${NC}"
    exit 1
fi

# Check if deployment exists
echo -e "\n${YELLOW}[3/10] Checking deployment...${NC}"
if kubectl get deployment "${SERVICE_NAME}" -n "${NAMESPACE}" &> /dev/null; then
    echo -e "${GREEN}✓ Deployment ${SERVICE_NAME} exists${NC}"
    kubectl get deployment "${SERVICE_NAME}" -n "${NAMESPACE}"
else
    echo -e "${RED}✗ Deployment ${SERVICE_NAME} not found${NC}"
    exit 1
fi

# Check pod status
echo -e "\n${YELLOW}[4/10] Checking pod status...${NC}"
READY_PODS=$(kubectl get deployment "${SERVICE_NAME}" -n "${NAMESPACE}" -o jsonpath='{.status.readyReplicas}')
DESIRED_PODS=$(kubectl get deployment "${SERVICE_NAME}" -n "${NAMESPACE}" -o jsonpath='{.spec.replicas}')

if [ "${READY_PODS:-0}" -eq "${DESIRED_PODS:-0}" ]; then
    echo -e "${GREEN}✓ All pods are ready (${READY_PODS}/${DESIRED_PODS})${NC}"
    kubectl get pods -n "${NAMESPACE}" -l app="${SERVICE_NAME}"
else
    echo -e "${YELLOW}⚠ Not all pods are ready (${READY_PODS:-0}/${DESIRED_PODS:-0})${NC}"
    kubectl get pods -n "${NAMESPACE}" -l app="${SERVICE_NAME}"
    echo -e "\nWaiting for pods to be ready (timeout: ${TIMEOUT}s)..."
    if kubectl rollout status deployment/"${SERVICE_NAME}" -n "${NAMESPACE}" --timeout="${TIMEOUT}s"; then
        echo -e "${GREEN}✓ Pods are now ready${NC}"
    else
        echo -e "${RED}✗ Pods failed to become ready${NC}"
        exit 1
    fi
fi

# Check service
echo -e "\n${YELLOW}[5/10] Checking service...${NC}"
if kubectl get svc "${SERVICE_NAME}" -n "${NAMESPACE}" &> /dev/null; then
    echo -e "${GREEN}✓ Service ${SERVICE_NAME} exists${NC}"
    kubectl get svc "${SERVICE_NAME}" -n "${NAMESPACE}"
else
    echo -e "${RED}✗ Service ${SERVICE_NAME} not found${NC}"
    exit 1
fi

# Test health endpoint
echo -e "\n${YELLOW}[6/10] Testing health endpoint...${NC}"
POD_NAME=$(kubectl get pod -n "${NAMESPACE}" -l app="${SERVICE_NAME}" -o jsonpath='{.items[0].metadata.name}')

if [ -z "${POD_NAME}" ]; then
    echo -e "${RED}✗ No pods found${NC}"
    exit 1
fi

echo "Testing with pod: ${POD_NAME}"

# Port forward in background
kubectl port-forward "pod/${POD_NAME}" 8088:8088 -n "${NAMESPACE}" 2>/dev/null &
PF_PID=$!
sleep 2

# Test health endpoint
if curl -s http://localhost:8088/api/v1/health | jq . &> /dev/null; then
    echo -e "${GREEN}✓ Health endpoint responding${NC}"
    curl -s http://localhost:8088/api/v1/health | jq .
else
    echo -e "${RED}✗ Health endpoint not responding${NC}"
    kill $PF_PID 2>/dev/null || true
    exit 1
fi

# Test readiness endpoint
if curl -s http://localhost:8088/api/v1/ready | jq . &> /dev/null; then
    echo -e "${GREEN}✓ Readiness endpoint responding${NC}"
    curl -s http://localhost:8088/api/v1/ready | jq .
else
    echo -e "${RED}✗ Readiness endpoint not responding${NC}"
    kill $PF_PID 2>/dev/null || true
    exit 1
fi

kill $PF_PID 2>/dev/null || true

# Check logs for errors
echo -e "\n${YELLOW}[7/10] Checking logs for errors...${NC}"
ERROR_COUNT=$(kubectl logs deployment/"${SERVICE_NAME}" -n "${NAMESPACE}" --tail=100 | grep -c ERROR || true)

if [ "${ERROR_COUNT}" -gt 0 ]; then
    echo -e "${YELLOW}⚠ Found ${ERROR_COUNT} errors in recent logs${NC}"
    echo "Recent errors:"
    kubectl logs deployment/"${SERVICE_NAME}" -n "${NAMESPACE}" --tail=100 | grep ERROR || true
else
    echo -e "${GREEN}✓ No errors in recent logs${NC}"
fi

# Check resource usage
echo -e "\n${YELLOW}[8/10] Checking resource usage...${NC}"
kubectl top pods -n "${NAMESPACE}" -l app="${SERVICE_NAME}" || echo "Metrics not available (Metrics Server may not be installed)"

# Check DNS resolution
echo -e "\n${YELLOW}[9/10] Checking DNS resolution...${NC}"
DNS_NAME="${SERVICE_NAME}.${NAMESPACE}.svc.cluster.local"
echo "Expected DNS name: ${DNS_NAME}"

kubectl run -it --rm dns-test --image=alpine:latest --restart=Never -- \
    nslookup "${DNS_NAME}" 2>/dev/null && \
    echo -e "${GREEN}✓ DNS resolution working${NC}" || \
    echo -e "${RED}✗ DNS resolution failed${NC}"

# Check configuration
echo -e "\n${YELLOW}[10/10] Checking configuration...${NC}"
echo "Helm values:"
helm get values "${SERVICE_NAME}" -n "${NAMESPACE}" | head -20

echo -e "\n${GREEN}=========================================="
echo "Deployment verification completed successfully!"
echo "==========================================${NC}\n"

exit 0
