$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot
try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci 실패' }
    npm run check
    if ($LASTEXITCODE -ne 0) { throw '타입 검사 실패' }
    $pythonExe = Join-Path $PSScriptRoot '.venv\Scripts\python.exe'
    if (-not (Test-Path -LiteralPath $pythonExe)) {
        uv venv .venv
        if ($LASTEXITCODE -ne 0) { throw 'Python 환경 준비 실패' }
    }
    uv pip install --python '.venv\Scripts\python.exe' 'jupyter-client==8.9.1' 'ipython==9.18.1' 'psutil==7.2.2'
    if ($LASTEXITCODE -ne 0) { throw 'Jupyter client 설치 실패' }
    $tslabExe = Join-Path $PSScriptRoot 'node_modules\.bin\tslab.cmd'
    & $tslabExe install --python $pythonExe --binary $tslabExe --sys-prefix
    if ($LASTEXITCODE -ne 0) { throw 'tslab 커널 등록 실패' }
    & $pythonExe execute_notebooks.py
    if ($LASTEXITCODE -ne 0) { throw '노트북 실행 실패. 출력과 환경을 확인하세요.' }
    & $pythonExe package_submission.py
    if ($LASTEXITCODE -ne 0) { throw '압축 실패' }
    Write-Output '타입 검사·노트북 실행·압축 완료. VS Code에서 파일을 열어 출력도 확인하세요.'
} finally {
    Pop-Location
}
