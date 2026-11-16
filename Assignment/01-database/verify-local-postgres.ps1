[CmdletBinding()]
param([string]$Image = 'pgvector/pgvector:pg17')
$ErrorActionPreference = 'Stop'
$containerName = 'practice01-check-' + [guid]::NewGuid().ToString('N').Substring(0, 10)
$started = $false
function Invoke-Docker {
    & docker @args
    if ($LASTEXITCODE -ne 0) { throw "Docker failed (exit $LASTEXITCODE)" }
}
try {
    # No host port, network, persistent volume, or external DB is used.
    Invoke-Docker run --detach --rm --pull never --network none --name $containerName `
        --env POSTGRES_HOST_AUTH_METHOD=trust --env POSTGRES_DB=assignment01 `
        --mount "type=bind,source=$PSScriptRoot,target=/validation,readonly" $Image | Out-Null
    $started = $true
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        & docker exec $containerName pg_isready -U postgres -d assignment01 *> $null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw 'Local PostgreSQL did not become ready' }
    Invoke-Docker exec $containerName psql -X -U postgres -d assignment01 -v ON_ERROR_STOP=1 `
        -f /validation/tests/bootstrap.sql -f /validation/schema.sql -f /validation/tests/verify_postgres.sql `
        -f /validation/tests/test_constraints.sql
}
finally {
    if ($started) {
        & docker stop $containerName | Out-Null
        if ($LASTEXITCODE -ne 0) { Write-Warning "Temporary container cleanup failed: $containerName" }
    }
}
