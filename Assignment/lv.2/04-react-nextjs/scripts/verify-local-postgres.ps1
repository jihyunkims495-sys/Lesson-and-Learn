[CmdletBinding()]
param(
    [string]$Image = 'pgvector/pgvector:pg17',
    [ValidateSet('practice', 'original')][string]$Schema = 'practice'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$containerName = 'practice04-check-' + [guid]::NewGuid().ToString('N').Substring(0, 10)
$started = $false
function Invoke-Docker {
    & docker @args
    if ($LASTEXITCODE -ne 0) { throw "Docker failed (exit $LASTEXITCODE)" }
}
try {
    Invoke-Docker run --detach --rm --pull never --network none --name $containerName `
        --env POSTGRES_HOST_AUTH_METHOD=trust --env POSTGRES_DB=assignment04 `
        --mount "type=bind,source=$projectRoot,target=/validation,readonly" $Image | Out-Null
    $started = $true
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        & docker exec $containerName pg_isready -U postgres -d assignment04 *> $null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw 'Local PostgreSQL did not become ready' }
    if ($Schema -eq 'original') {
        Invoke-Docker exec $containerName psql -X -U postgres -d assignment04 -v ON_ERROR_STOP=1 `
            -f /validation/tests/postgres-bootstrap.sql -f /validation/schema.sql -f /validation/tests/verify-postgres.sql
    }
    else {
        Invoke-Docker exec $containerName psql -X -U postgres -d assignment04 -v ON_ERROR_STOP=1 `
            -f /validation/tests/postgres-bootstrap.sql -f /validation/tests/legacy-todo-fixture.sql `
            -f /validation/schema-practice.sql -f /validation/tests/verify-practice-postgres.sql
        foreach ($kind in @('table', 'function', 'trigger')) {
            $database = 'assignment04_collision_' + $kind
            $tableCollision = if ($kind -eq 'table') { 'true' } else { 'false' }
            $triggerCollision = if ($kind -eq 'trigger') { 'true' } else { 'false' }
            $expectedState = switch ($kind) { 'table' { '42P07' } 'function' { '42723' } 'trigger' { '42710' } }
            Invoke-Docker exec $containerName createdb -U postgres $database
            Invoke-Docker exec $containerName psql -X -U postgres -d $database -v ON_ERROR_STOP=1 `
                -v "collision_table=$tableCollision" -v "collision_trigger=$triggerCollision" `
                -f /validation/tests/postgres-bootstrap-database.sql `
                -f /validation/tests/legacy-todo-fixture.sql -f /validation/tests/prepare-schema-collision.sql
            # Failure is required here: an existing object must never be replaced.
            $failureOutput = & docker exec $containerName psql -X -U postgres -d $database `
                -v ON_ERROR_STOP=1 -v VERBOSITY=verbose -f /validation/schema-practice.sql 2>&1
            if ($LASTEXITCODE -eq 0) { throw "Existing $kind conflict unexpectedly accepted" }
            if (($failureOutput -join "`n") -notmatch [regex]::Escape($expectedState)) {
                throw "Existing $kind conflict did not return expected SQLSTATE $expectedState"
            }
            Invoke-Docker exec $containerName psql -X -U postgres -d $database -v ON_ERROR_STOP=1 `
                -v "collision_table=$tableCollision" -v "collision_trigger=$triggerCollision" `
                -f /validation/tests/verify-schema-collision.sql
        }
    }
}
finally {
    if ($started) {
        & docker stop $containerName | Out-Null
        if ($LASTEXITCODE -ne 0) { Write-Warning "Temporary container cleanup failed: $containerName" }
    }
}
