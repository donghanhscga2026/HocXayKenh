# Script tự động cập nhật API URL trong các file HTML
# Cách dùng: .\update_api_url.ps1 "https://script.google.com/macros/s/YOUR_ACTUAL_ID/exec"

param(
    [Parameter(Mandatory=$true)]
    [string]$NewApiUrl
)

$files = @(
    "hocxaykenh\dangky_account.html",
    "hocxaykenh\login.html",
    "hocxaykenh\forgot_password.html"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $fullPath) {
        $content = Get-Content $fullPath -Raw
        $updated = $content -replace 'const API_URL = "https://script\.google\.com/macros/s/YOUR_DEPLOYMENT_ID/exec";', "const API_URL = `"$NewApiUrl`";"
        
        Set-Content $fullPath -Value $updated -NoNewline
        Write-Host "✅ Updated: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ Not found: $file" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Done! All files updated with new API URL." -ForegroundColor Cyan
