"""Run each notebook in its own real tslab kernel and save actual Jupyter outputs."""
from pathlib import Path
import json
import sys
from queue import Empty
import psutil
from jupyter_client import KernelManager
from jupyter_client.kernelspec import KernelSpecManager

ROOT = Path(__file__).resolve().parent

def execute(path: Path):
    notebook = json.loads(path.read_text(encoding='utf-8'))
    kernel_dir = Path(sys.prefix) / 'share' / 'jupyter' / 'kernels'
    if not (kernel_dir / 'tslab' / 'kernel.json').is_file():
        raise RuntimeError('Run finish-local.ps1 to register tslab in this virtual environment.')
    manager = KernelManager(
        kernel_name='tslab', ip='127.0.0.1',
        kernel_spec_manager=KernelSpecManager(kernel_dirs=[str(kernel_dir)]),
    )
    print(f'START {path.name}',flush=True)
    manager.start_kernel(cwd=str(ROOT))
    pid = getattr(manager.provisioner, 'pid', None)
    owned_parent = psutil.Process(pid) if isinstance(pid, int) and pid > 0 else None
    client = manager.client()
    client.start_channels()
    try:
        client.wait_for_ready(timeout=30)
        for index, cell in enumerate(notebook['cells']):
            if cell['cell_type'] != 'code':
                continue
            cell['outputs'] = []
            cell['execution_count'] = None
            message_id = client.execute(''.join(cell['source']), stop_on_error=True)
            failed = False
            while True:
                try:
                    message = client.get_iopub_msg(timeout=30)
                except Empty as exc:
                    raise RuntimeError(f'{path.name} cell {index}: kernel timeout') from exc
                if message.get('parent_header', {}).get('msg_id') != message_id:
                    continue
                kind, content = message['header']['msg_type'], message['content']
                if kind == 'execute_input':
                    cell['execution_count'] = content['execution_count']
                elif kind == 'stream':
                    cell['outputs'].append({'output_type':kind,'name':content['name'],'text':content['text']})
                elif kind in ('execute_result','display_data'):
                    result = {'output_type':kind,'data':content['data'],'metadata':content['metadata']}
                    if kind == 'execute_result':
                        result['execution_count'] = content['execution_count']
                    cell['outputs'].append(result)
                elif kind == 'error':
                    cell['outputs'].append({'output_type':kind,'ename':content['ename'],'evalue':content['evalue'],'traceback':content['traceback']})
                    failed = True
                elif kind == 'status' and content['execution_state'] == 'idle':
                    break
            # tslab reports its counter and status in execute_reply, without
            # publishing execute_input. An idle message alone is not success.
            while True:
                reply = client.get_shell_msg(timeout=30)
                if reply.get('parent_header', {}).get('msg_id') == message_id:
                    break
            result = reply['content']
            cell['execution_count'] = result.get('execution_count')
            failed = failed or result.get('status') != 'ok'
            failed = failed or not isinstance(cell['execution_count'], int)
            path.write_text(json.dumps(notebook,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
            if failed:
                raise RuntimeError(f'{path.name} cell {index}: execution error (saved)')
            print(f'PASS {path.name} code cell {cell["execution_count"]}',flush=True)
    finally:
        owned = []
        if owned_parent is not None:
            try:
                owned = [owned_parent, *owned_parent.children(recursive=True)]
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                pass
        client.stop_channels()
        try:
            manager.shutdown_kernel(now=True)
        finally:
            # On Windows the launcher can exit before its Node child. Only
            # terminate identities captured from the kernel started above.
            for process in reversed(owned):
                try:
                    if process.is_running():
                        process.kill()
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            psutil.wait_procs(owned, timeout=5)

    notebook['metadata']['execution_provenance'] = {
        'engine': 'Jupyter tslab kernel',
        'transport': 'Jupyter ZeroMQ',
        'tslab_version': '1.0.22',
        'vscode_run_all_verified': False,
    }
    path.write_text(json.dumps(notebook,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__ == '__main__':
    for filename in ('01_data_modeling.ipynb','02_generics_typeguard.ipynb'):
        execute(ROOT / filename)
