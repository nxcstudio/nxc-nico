# ==============================================================================
# NXC-NICO Google Cloud Run One-Click Deployment Script
# Provisions NICO on GCP Always Free Tier (2M free requests/month, zero idle cost)
# ==============================================================================

$PROJECT_ID = "project-00b1e2ac-35ac-4532-94c"
$REGION = "us-central1"
$SERVICE_NAME = "nxc-nico"

Write-Host "1. Setting active GCP project to $PROJECT_ID..." -ForegroundColor Cyan
gcloud config set project $PROJECT_ID

Write-Host "2. Deploying NICO to Google Cloud Run..." -ForegroundColor Cyan
gcloud run deploy $SERVICE_NAME `
  --source . `
  --platform managed `
  --region $REGION `
  --allow-unauthenticated `
  --port 3100 `
  --set-env-vars="NODE_ENV=production,LLM_PROVIDER=mock,MAIL_PROVIDER=console"

Write-Host "3. Retrieving Cloud Run Service URL..." -ForegroundColor Cyan
$SERVICE_URL = (gcloud run services describe $SERVICE_NAME --platform managed --region $REGION --format 'value(status.url)')
Write-Host "Deployment Complete! Live URL: $SERVICE_URL" -ForegroundColor Green
Write-Host "Health Check: $SERVICE_URL/health" -ForegroundColor Green
