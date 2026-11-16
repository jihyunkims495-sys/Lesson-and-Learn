from pathlib import Path
import json
import zipfile

root = Path(__file__).resolve().parent
PUBLIC_FILES = (
    '01_data_modeling.ipynb',
    '02_generics_typeguard.ipynb',
    'README.md',
    'verify.ts',
    'type-errors.ts',
    'tsconfig.json',
    'package.json',
    'package-lock.json',
    'execute_notebooks.py',
    'execute_tslab_engine.cjs',
    'finish-local.ps1',
    'package_submission.py',
    '.gitignore',
)

# Validate and archive the same in-memory snapshot, even if an editor saves later.
contents = {}
for name in PUBLIC_FILES:
    file = root / name
    if not file.is_file() or file.is_symlink():
        raise SystemExit(f'제출 파일을 확인하세요: {name}')
    contents[name] = file.read_bytes()

for name in PUBLIC_FILES[:2]:
    nb = json.loads(contents[name].decode('utf-8'))
    code_cells = [cell for cell in nb['cells'] if cell['cell_type'] == 'code']
    if not code_cells:
        raise SystemExit(f'코드 셀이 없는 노트북: {name}')
    for cell in code_cells:
        count = cell.get('execution_count')
        if isinstance(count, bool) or not isinstance(count, int) or count < 1 or not cell.get('outputs'):
            raise SystemExit(f'실행/출력이 없는 셀: {name}')
        if any(output.get('output_type') == 'error' for output in cell['outputs']):
            raise SystemExit(f'실행 오류가 남은 셀: {name}')
    nb['metadata'] = {key: value for key, value in nb.get('metadata', {}).items()
                      if key in {'kernelspec', 'language_info'}}
    for cell in nb['cells']:
        cell['metadata'] = {key: value for key, value in cell.get('metadata', {}).items()
                            if key == 'tags'}
    contents[name] = (json.dumps(nb, ensure_ascii=False, indent=2) + '\n').encode('utf-8')
archive = root/'typescript-assignment.zip'
temporary = root/'typescript-assignment.zip.tmp'
try:
    with zipfile.ZipFile(temporary,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as bundle:
        for name in PUBLIC_FILES:
            info = zipfile.ZipInfo(name, date_time=(1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            bundle.writestr(info, contents[name], compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    temporary.replace(archive)
finally:
    temporary.unlink(missing_ok=True)
print(f'Created: {archive.name} ({archive.stat().st_size} bytes)')
