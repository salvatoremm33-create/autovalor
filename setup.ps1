# AutoValor Setup Script for Windows
Write-Host "=== AutoValor Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
    exit 1
}
$nodeVersion = (node --version)
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green

# Check psql
if (-not (Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "WARNING: psql not in PATH. Make sure PostgreSQL is installed." -ForegroundColor Yellow
} else {
    Write-Host "PostgreSQL: $(psql --version)" -ForegroundColor Green
}

Write-Host ""
Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
Set-Location backend
npm install
if (-not $?) { Write-Host "Backend npm install failed" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
Set-Location ..\frontend
npm install
if (-not $?) { Write-Host "Frontend npm install failed" -ForegroundColor Red; exit 1 }
Set-Location ..

Write-Host ""
Write-Host "=== Setup Complete! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend/.env and set your DATABASE_URL"
Write-Host "2. Create the PostgreSQL database: psql -U postgres -c 'CREATE DATABASE autovalor;'"
Write-Host "3. Run migrations: cd backend; npm run migrate"
Write-Host "4. Seed data: cd backend; npm run seed"
Write-Host "5. Start backend: cd backend; npm run dev"
Write-Host "6. Start frontend (new terminal): cd frontend; npm start"
Write-Host ""
Write-Host "The app will be at http://localhost:3000" -ForegroundColor Green
