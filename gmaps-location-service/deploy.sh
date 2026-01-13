#!/bin/bash

# Deployment script for GMaps Location Service

set -e  # Exit on any error

echo "Starting deployment of GMaps Location Service..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "kubectl is required but not installed. Aborting."
    exit 1
fi

# Check if helm is available
if ! command -v helm &> /dev/null; then
    echo "helm is required but not installed. Aborting."
    exit 1
fi

# Check if docker is available
if ! command -v docker &> /dev/null; then
    echo "docker is required but not installed. Aborting."
    exit 1
fi

# Build the Docker image
echo "Building Docker image..."
docker build -t gmaps-location-service:latest .

# Option to deploy with Helm
read -p "Do you want to deploy using Helm? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Create a temporary values file with the API key
    read -p "Enter your Google Maps API key: " google_maps_api_key
    
    # Create temporary values file
    TEMP_VALUES_FILE=$(mktemp)
    cat > "$TEMP_VALUES_FILE" << EOF
googleMapsApiKey: "$google_maps_api_key"
EOF

    echo "Deploying with Helm..."
    helm upgrade --install gmaps-location-service ./helm/gmaps-location-service \
        --values "$TEMP_VALUES_FILE" \
        --create-namespace \
        --namespace gmaps-location

    # Clean up temporary file
    rm "$TEMP_VALUES_FILE"
else
    # Deploy using raw Kubernetes manifests
    echo "Applying Kubernetes manifests..."
    
    # Prompt for API key
    read -p "Enter your Google Maps API key: " google_maps_api_key
    
    # Create secret with the API key
    kubectl create secret generic gmaps-api-secret \
        --from-literal=api-key="$google_maps_api_key" \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Apply other manifests
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/rbac.yaml
    kubectl apply -f k8s/deployment.yaml
fi

echo "Deployment completed!"
echo "To check the status, run: kubectl get pods -n gmaps-location"
echo "To view logs, run: kubectl logs deployment/gmaps-location-service -n gmaps-location"