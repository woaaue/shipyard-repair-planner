param(
    [string]$MonolithBaseUrl = "http://localhost:8080",
    [string]$GatewayBaseUrl = "http://localhost:8088",
    [string]$OutputPath = "infra/microservices/shadow-parity-report.json"
)

$ErrorActionPreference = "Stop"

$endpoints = @(
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

function Invoke-Endpoint {
    param(
        [string]$Url
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing
        $body = ""
        if ($null -ne $response.Content) {
            $body = [string]$response.Content
        }

        return [PSCustomObject]@{
            ok         = $true
            statusCode = [int]$response.StatusCode
            body       = $body
            bodyHash   = if ($body.Length -gt 0) { (Get-FileHash -InputStream ([System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($body))) -Algorithm SHA256).Hash } else { "" }
            error      = $null
        }
    } catch {
        $statusCode = 0
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        return [PSCustomObject]@{
            ok         = $false
            statusCode = $statusCode
            body       = ""
            bodyHash   = ""
            error      = $_.Exception.Message
        }
    }
}

$results = @()

foreach ($endpoint in $endpoints) {
    $monolithUrl = "$MonolithBaseUrl$endpoint"
    $gatewayUrl = "$GatewayBaseUrl$endpoint"

    $monolith = Invoke-Endpoint -Url $monolithUrl
    $gateway = Invoke-Endpoint -Url $gatewayUrl

    $statusMatches = $monolith.statusCode -eq $gateway.statusCode
    $bodyMatches = $monolith.bodyHash -eq $gateway.bodyHash

    $results += [PSCustomObject]@{
        endpoint      = $endpoint
        monolithUrl   = $monolithUrl
        gatewayUrl    = $gatewayUrl
        monolith      = $monolith
        gateway       = $gateway
        statusMatches = $statusMatches
        bodyMatches   = $bodyMatches
        matches       = $statusMatches -and $bodyMatches
    }
}

$summary = [PSCustomObject]@{
    generatedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
    monolithBaseUrl = $MonolithBaseUrl
    gatewayBaseUrl = $GatewayBaseUrl
    totalEndpoints = $results.Count
    matchedEndpoints = ($results | Where-Object { $_.matches }).Count
    mismatchedEndpoints = ($results | Where-Object { -not $_.matches }).Count
}

$report = [PSCustomObject]@{
    summary = $summary
    results = $results
}

$outputDir = Split-Path -Path $OutputPath -Parent
if ($outputDir -and -not (Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir | Out-Null
}

$report | ConvertTo-Json -Depth 8 | Set-Content -Path $OutputPath -Encoding UTF8

Write-Host ""
Write-Host "Shadow parity check complete."
Write-Host "Matched: $($summary.matchedEndpoints) / $($summary.totalEndpoints)"
Write-Host "Mismatched: $($summary.mismatchedEndpoints)"
Write-Host "Report: $OutputPath"

$mismatches = $results | Where-Object { -not $_.matches }
if ($mismatches.Count -gt 0) {
    Write-Host ""
    Write-Host "Mismatches:"
    foreach ($item in $mismatches) {
        Write-Host "- $($item.endpoint): monolith=$($item.monolith.statusCode), gateway=$($item.gateway.statusCode), bodyMatches=$($item.bodyMatches)"
    }
    exit 1
}

exit 0
