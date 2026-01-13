# PowerShell deployment script for GMaps Location Service

Write-Host "Starting deployment of GMaps Location Service..." -ForegroundColor Green

# Check if kubectl is available
if (!(Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "kubectl is required but not installed. Aborting." -ForegroundColor Red
    exit 1
}

# Check if docker is available
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "docker is required but not installed. Aborting." -ForegroundColor Red
    exit 1
}

# Build the Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
docker build -t gmaps-location-service:latest .

# Prompt for Google Maps API key
$googleMapsApiKey = Read-Host -Prompt "Enter your Google Maps API key"

# Create secret with the API key
Write-Host "Creating Kubernetes secret..." -ForegroundColor Yellow
$encodedApiKey = [System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($googleMapsApiKey))
$secretYaml = @"
apiVersion: v1
kind: Secret
metadata:
  name: gmaps-api-secret
type: Opaque
data:
  api-key: $encodedApiKey
"@

$secretYaml | kubectl apply -f -

# Apply other manifests
Write-Host "Applying Kubernetes manifests..." -ForegroundColor Yellow
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/deployment.yaml

Write-Host "Deployment completed!" -ForegroundColor Green
Write-Host "To check the status, run: kubectl get pods" -ForegroundColor Cyan
Write-Host "To view logs, run: kubectl logs deployment/gmaps-location-service" -ForegroundColor Cyan