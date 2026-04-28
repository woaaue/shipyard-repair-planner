param(
    [string]$GatewayBaseUrl = "http://localhost:8088",
    [string]$MonolithPublicApiUrl = "http://localhost:8080/api/ships",
    [string]$GatewayKnownEndpoint = "/api/ships",
    [string]$GatewayUnmappedEndpoint = "/api/legacy-not-existing"
)

$ErrorActionPreference = "Stop"

function Get-StatusCodeOrZero {
    param([string]$Url)
    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing
        return [int]$response.StatusCode
    } catch {
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            return [int]$_.Exception.Response.StatusCode
        }
        return 0
    }
}

$gatewayKnownStatus = Get-StatusCodeOrZero -Url "$GatewayBaseUrl$GatewayKnownEndpoint"
$gatewayUnmappedStatus = Get-StatusCodeOrZero -Url "$GatewayBaseUrl$GatewayUnmappedEndpoint"
$monolithPublicStatus = Get-StatusCodeOrZero -Url $MonolithPublicApiUrl

$errors = @()

if ($gatewayKnownStatus -eq 0 -or $gatewayKnownStatus -ge 500) {
    $errors += "Gateway known route is unhealthy: $gatewayKnownStatus"
}

if ($gatewayUnmappedStatus -ne 410) {
    $errors += "Gateway unmapped route must return 410, got: $gatewayUnmappedStatus"
}

# Expected outcomes for retired public monolith API:
# 0  -> not reachable
# 401/403/404/410 -> no public API access
if ($monolithPublicStatus -notin @(0, 401, 403, 404, 410)) {
    $errors += "Monolith public API still appears reachable: $monolithPublicStatus"
}

Write-Host "Gateway known route status: $gatewayKnownStatus"
Write-Host "Gateway unmapped route status: $gatewayUnmappedStatus"
Write-Host "Monolith public API status: $monolithPublicStatus"

if ($errors.Count -eq 0) {
    Write-Host ""
    Write-Host "Retirement check passed."
    exit 0
}

Write-Host ""
Write-Host "Retirement check failed:"
foreach ($err in $errors) {
    Write-Host "- $err"
}
exit 1
