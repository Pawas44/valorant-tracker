Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "    PUSH VALORANT TRACKER TO GITHUB       " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Navigate to the project directory first to ensure git commands run inside the repo
Set-Location "C:\Users\Administrator\Desktop\ValorantTracker"

$repoUrl = Read-Host "Paste your GitHub Repository URL (e.g., https://github.com/username/repo-name.git)"

if (-not $repoUrl) {
    Write-Host "Error: Repository URL is required." -ForegroundColor Red
    Exit
}

Write-Host "Setting remote origin..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin $repoUrl
git branch -M main

Write-Host "Pushing code to GitHub main branch..." -ForegroundColor Yellow
Write-Host "NOTE: A login window will popup in your browser. Please login to authorize Git." -ForegroundColor Green
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Code pushed to GitHub." -ForegroundColor Green
    Write-Host "Go to your GitHub Repo -> Actions to check the APK build progress!" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Failed to push code. Make sure you entered the correct URL and authorized the login." -ForegroundColor Red
}
Read-Host "Press Enter to exit..."
