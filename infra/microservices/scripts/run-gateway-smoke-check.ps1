param(
    [string]$GatewayBaseUrl = "http://localhost:8088"
)

$ErrorActionPreference = "Stop"

$endpoints = @(
    "/health",
    "/api/notifications",
    "/api/audit-logs",
    "/api/work-items",
    "/api/issues",
    "/api/downtimes",
    "/api/repair-requests",
    "/api/repairs",
    "/api/ships",
    "/api/docks",
    "/api/shipyards",
    "/api/users"
)

$failed = @()

foreach ($endpoint in $endpoints) {
    $url = "$GatewayBaseUrl$endpoint"
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -UseBasicParsing
        $code = [int]$response.StatusCode
        if ($code -lt 200 -or $code -ge 500) {
            $failed += "$endpoint -> unexpected status $code"
            continue
        }
        Write-Host "[OK] $endpoint -> $code"
    } catch {
        $status = "network-error"
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $status = [int]$_.Exception.Response.StatusCode
        }
        $failed += "$endpoint -> $status"
        Write-Host "[FAIL] $endpoint -> $status"
    }
}

Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "Gateway smoke-check passed."
    exit 0
}

Write-Host "Gateway smoke-check failed."
foreach ($line in $failed) {
    Write-Host "- $line"
}
exit 1
