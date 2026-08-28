#!/bin/bash

set -e

NAMESPACE="NPC AI SIM"
DEPLOYMENT="npc-ai-sim"

echo "=== Checking ${DEPLOYMENT} deployment in namespace ${NAMESPACE} ==="

echo -e "\n📦 Deployments:"
kubectl get deployment ${DEPLOYMENT} -n ${NAMESPACE} -o wide 2>/dev/null || echo "❌ Deployment not found"

echo -e "\n🖥️  Pods:"
kubectl get pods -n ${NAMESPACE} -l app=${DEPLOYMENT} -o wide 2>/dev/null || echo "❌ No pods found"

echo -e "\n🔗 Service:"
kubectl get service ${DEPLOYMENT} -n ${NAMESPACE} 2>/dev/null || echo "❌ Service not found"

echo -e "\n🏥 Health Check:"
POD_NAME=$(kubectl get pod -n ${NAMESPACE} -l app=${DEPLOYMENT} -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -n "$POD_NAME" ]; then
  echo "Pod: $POD_NAME"
  kubectl exec -n ${NAMESPACE} $POD_NAME -- curl -s http://localhost:3090/health 2>/dev/null || echo "❌ Health endpoint unreachable"
else
  echo "❌ No pod to check"
fi

echo -e "\n📋 Events:"
kubectl get events -n ${NAMESPACE} --sort-by='.lastTimestamp' 2>/dev/null | tail -10 || echo "❌ No events found"