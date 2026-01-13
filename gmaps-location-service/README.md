# GMaps Location Service

A microservice that integrates with Google Maps API and location services, designed for deployment on Kubernetes.

## Features

- **Geocoding**: Convert addresses to geographic coordinates
- **Reverse Geocoding**: Convert coordinates to addresses
- **Nearby Places**: Find places near a specific location
- **Distance Matrix**: Calculate travel distances and times between locations
- **Place Autocomplete**: Get location suggestions as users type

## Prerequisites

- Node.js 18+
- Docker
- Kubernetes cluster (Minikube, Kind, or cloud provider)
- Google Maps API Key

## Setup Instructions

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd gmaps-location-service
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on the example:
```bash
cp config/.env.example .env
```

4. Add your Google Maps API key to the `.env` file:
```bash
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

5. Start the service:
```bash
npm run dev
```

The service will be available at `http://localhost:3000`

### Docker Containerization

1. Build the Docker image:
```bash
docker build -t gmaps-location-service:latest .
```

2. Run the container locally:
```bash
docker run -p 3000:3000 -e GOOGLE_MAPS_API_KEY=your_api_key gmaps-location-service:latest
```

### Kubernetes Deployment

#### Method 1: Using Raw Manifests

1. Encode your Google Maps API key in base64:
```bash
echo -n 'your_actual_api_key_here' | base64
```

2. Update the secret in `k8s/secret.yaml` with your encoded API key:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: gmaps-api-secret
type: Opaque
data:
  api-key: YOUR_BASE64_ENCODED_API_KEY
```

3. Apply the Kubernetes manifests:
```bash
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/deployment.yaml
```

#### Method 2: Using Helm (Recommended)

1. Navigate to the Helm chart directory:
```bash
cd helm/gmaps-location-service
```

2. Install the chart with your Google Maps API key:
```bash
helm install gmaps-location-service . \
  --set googleMapsApiKey='your_actual_api_key_here' \
  --create-namespace \
  --namespace gmaps-location
```

3. Or create a custom values file:
```bash
# Create a custom-values.yaml file
cat << EOF > custom-values.yaml
googleMapsApiKey: 'your_actual_api_key_here'
replicaCount: 3
resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi
EOF

# Install with custom values
helm install gmaps-location-service . \
  -f custom-values.yaml \
  --create-namespace \
  --namespace gmaps-location
```

#### Verification

Verify the deployment:
```bash
kubectl get pods -n gmaps-location
kubectl get services -n gmaps-location
kubectl get ingress -n gmaps-location
```

## API Endpoints

### GET `/`
Returns service information and available endpoints.

### GET `/health`
Health check endpoint. Returns status OK if the service is running.

### GET `/geocode`
Converts an address to geographic coordinates.
- Query parameter: `address` (required)
- Example: `GET /geocode?address=New York, NY`

### GET `/reverse-geocode`
Converts geographic coordinates to an address.
- Query parameters: `lat` (required), `lng` (required)
- Example: `GET /reverse-geocode?lat=40.7128&lng=-74.0060`

### GET `/places/nearby`
Finds places near a specified location.
- Query parameters: `lat` (required), `lng` (required), `radius` (optional), `type` (optional)
- Example: `GET /places/nearby?lat=40.7128&lng=-74.0060&type=restaurant&radius=1000`

### POST `/distance-matrix`
Calculates travel distances and times between multiple origins and destinations.
- Request body: `{ "origins": [...], "destinations": [...] }`
- Example:
```json
{
  "origins": ["New York, NY", "Boston, MA"],
  "destinations": ["Philadelphia, PA", "Washington, DC"]
}
```

### GET `/places/autocomplete`
Provides location suggestions as users type.
- Query parameter: `input` (required), `lat` (optional), `lng` (optional), `radius` (optional)
- Example: `GET /places/autocomplete?input=coffee shop&lat=40.7128&lng=-74.0060&radius=1000`

## Environment Variables

- `GOOGLE_MAPS_API_KEY`: Your Google Maps API key (required)
- `PORT`: Port to run the service on (default: 3000)
- `NODE_ENV`: Environment mode (default: production)
- `DEFAULT_RADIUS`: Default search radius for nearby places (default: 1000 meters)
- `MAX_RADIUS`: Maximum allowed search radius (default: 50000 meters)

## Security Considerations

- Store the Google Maps API key securely using Kubernetes secrets
- Limit the domains that can use your API key in the Google Cloud Console
- Enable billing alerts to monitor API usage costs
- Implement rate limiting to prevent abuse

## Scaling

The service is designed to scale horizontally. Adjust the replica count in the deployment manifest:
```yaml
spec:
  replicas: 5  # Increase or decrease as needed
```

Then apply the changes:
```bash
kubectl apply -f k8s/deployment.yaml
```

## Monitoring

Monitor the service using standard Kubernetes tools:
```bash
kubectl logs deployment/gmaps-location-service
kubectl top pods
```

## Deployment Scripts

For convenience, we provide deployment scripts for both Linux/Mac and Windows:

- `deploy.sh` - Bash script for Linux/Mac environments
- `deploy.ps1` - PowerShell script for Windows environments

These scripts automate the process of building the Docker image and deploying to Kubernetes with appropriate configurations.

## License

This project is licensed under the MIT License.