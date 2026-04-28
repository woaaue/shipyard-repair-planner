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
        $status = 0
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $status = [int]$_.Exception.Response.StatusCode
        }
        # For protected routes, 4xx means upstream is reachable and auth works.
        if ($status -ge 400 -and $status -lt 500) {
            Write-Host "[OK] $endpoint -> $status"
            continue
        }

        $label = if ($status -eq 0) { "network-error" } else { [string]$status }
        $failed += "$endpoint -> $label"
        Write-Host "[FAIL] $endpoint -> $label"
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
