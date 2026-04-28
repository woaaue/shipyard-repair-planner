param(
    [string]$MonolithBaseUrl = "http://localhost:8080",
    [string]$GatewayBaseUrl = "http://localhost:8088",
    [switch]$SkipRetirement
)

$ErrorActionPreference = "Stop"

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Resolve-Path (Join-Path $scriptRoot "..\..\..")

function Run-Step {
    param(
        [string]$Name,
        [string]$Command
    )

    Write-Host ""
    Write-Host "=== $Name ==="
    Invoke-Expression $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
    Write-Host "$Name passed."
}

try {
    Set-Location $projectRoot

    Run-Step -Name "Shadow parity-check" -Command (
        "powershell -ExecutionPolicy Bypass -File infra/microservices/scripts/run-shadow-parity-check.ps1 " +
        "-MonolithBaseUrl `"$MonolithBaseUrl`" -GatewayBaseUrl `"$GatewayBaseUrl`""
    )

    Run-Step -Name "Gateway smoke-check" -Command (
        "powershell -ExecutionPolicy Bypass -File infra/microservices/scripts/run-gateway-smoke-check.ps1 " +
        "-GatewayBaseUrl `"$GatewayBaseUrl`""
    )

    if (-not $SkipRetirement) {
        Run-Step -Name "Retirement check" -Command (
            "powershell -ExecutionPolicy Bypass -File infra/microservices/scripts/run-retirement-check.ps1 " +
            "-GatewayBaseUrl `"$GatewayBaseUrl`" -MonolithPublicApiUrl `"$MonolithBaseUrl/api/ships`""
        )
    } else {
        Write-Host ""
        Write-Host "Retirement check skipped."
    }

    Write-Host ""
    Write-Host "Cutover E2E check passed."
    exit 0
}
catch {
    Write-Host ""
    Write-Host "Cutover E2E check failed:"
    Write-Host "- $($_.Exception.Message)"
    exit 1
}
