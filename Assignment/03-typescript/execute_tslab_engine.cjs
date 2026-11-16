/* Real tslab converter/executor, without the Jupyter ZeroMQ transport.
 * This is deliberately recorded as engine-only execution, not a VS Code Run All.
 */
const fs = require('node:fs');
const path = require('node:path');
const util = require('node:util');
const tslabRoot = process.env.TSLAB_ROOT || path.dirname(require.resolve('tslab/package.json'));
const {createConverter} = require(path.join(tslabRoot,'dist/converter.js'));
const {createExecutor} = require(path.join(tslabRoot,'dist/executor.js'));
const packageInfo = JSON.parse(fs.readFileSync(path.join(tslabRoot,'package.json'),'utf8'));
const originalLog = console.log;
const originalError = console.error;
async function run(name) {
  const file = path.join(__dirname,name);
  const notebook = JSON.parse(fs.readFileSync(file,'utf8'));
  const converter = createConverter({isJS:false,isBrowser:false});
  let currentOutputs=[];
  const capture = stream => (...args) => { currentOutputs.push({output_type:'stream',name:stream,text:util.format(...args)+'\n'}); };
  const out=capture('stdout'), err=capture('stderr');
  const executor=createExecutor(__dirname,{node:converter,get browser(){throw new Error('Browser cells are not supported');},close:()=>converter.close()},{log:out,error:err});
  try {
    let count=0;
    for (const cell of notebook.cells.filter(cell=>cell.cell_type==='code')) {
      currentOutputs=[];
      console.log=out;console.error=err;
      const passed=await executor.execute(cell.source.join(''));
      console.log=originalLog;console.error=originalError;
      cell.execution_count=++count;
      cell.outputs=currentOutputs;
      if(!passed) {
        originalError(JSON.stringify(currentOutputs));
        throw new Error(name+' cell '+count+' failed');
      }
      originalLog('PASS '+name+' cell '+count);
    }
    notebook.metadata.execution_provenance={engine:'tslab converter/executor',tslab_version:packageInfo.version,typescript_version:packageInfo.dependencies['@tslab/typescript-for-tslab'],node_version:process.version,transport:'in-process; Jupyter ZeroMQ not used',verified_at:new Date().toISOString(),vscode_run_all_verified:false};
    fs.writeFileSync(file,JSON.stringify(notebook,null,2)+'\n');
  } finally {
    console.log=originalLog;console.error=originalError;
    executor.close();
  }
}
(async()=>{await run('01_data_modeling.ipynb');await run('02_generics_typeguard.ipynb');})().catch(error=>{originalError(error);process.exitCode=1;});
