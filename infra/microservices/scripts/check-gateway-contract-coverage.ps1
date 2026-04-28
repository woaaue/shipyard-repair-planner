param(
    [string]$ContractPath = "docs/api-contract-stage1.md",
    [string]$GatewayConfigPath = "infra/microservices/gateway/default.conf"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $ContractPath)) {
    throw "Contract file not found: $ContractPath"
}
if (-not (Test-Path $GatewayConfigPath)) {
    throw "Gateway config file not found: $GatewayConfigPath"
}

$contractLines = Get-Content $ContractPath
$gatewayLines = Get-Content $GatewayConfigPath

$contractEndpoints = New-Object System.Collections.Generic.HashSet[string]
foreach ($line in $contractLines) {
    if ($line -match '^\s*-\s*`[A-Z]+\s+(/api/[^`? ]+)') {
        [void]$contractEndpoints.Add($matches[1])
    }
}

$gatewayPrefixes = New-Object System.Collections.Generic.HashSet[string]
foreach ($line in $gatewayLines) {
    if ($line -match '^\s*location\s+(/api/[^{\s]+)\s*\{') {
        [void]$gatewayPrefixes.Add($matches[1])
    }
}

$missing = @()
foreach ($endpoint in $contractEndpoints) {
    $covered = $false
    foreach ($prefix in $gatewayPrefixes) {
        if ($endpoint.StartsWith($prefix)) {
            $covered = $true
            break
        }
    }
    if (-not $covered) {
        $missing += $endpoint
    }
}

Write-Host "Contract endpoints: $($contractEndpoints.Count)"
Write-Host "Gateway API prefixes: $($gatewayPrefixes.Count)"

if ($missing.Count -eq 0) {
    Write-Host "Gateway contract coverage check passed."
    exit 0
}

Write-Host "Gateway contract coverage check failed. Missing endpoint prefixes:"
foreach ($endpoint in ($missing | Sort-Object)) {
    Write-Host "- $endpoint"
}
exit 1
