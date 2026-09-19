'use strict';

const path = require('node:path');
const fs = require('node:fs');

// The same files must be uploaded next to this adapter in the Daytona sandbox.
function loadModel(siteDirectory) {
  const directory = path.resolve(siteDirectory);
  const createModel = require(path.join(directory, 'workbench-model.js'));
  const snapshot = JSON.parse(fs.readFileSync(path.join(directory, 'data-snapshot.json'), 'utf8'));
  return { createModel, snapshot };
}

function analyze(source, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected an input object.');
  const { sku, horizon = 'D+14', promotionUnits, weekdayFactors, manualBaseQty = null } = input;
  if (typeof sku !== 'string' || !source.snapshot.products.some(p => p.code === sku)) throw new Error('Unknown SKU.');
  if (!['D+3', 'D+7', 'D+14', 'D+21', 'ALL'].includes(horizon)) throw new Error('Unsupported horizon.');
  if (manualBaseQty !== null && (!Number.isSafeInteger(manualBaseQty) || manualBaseQty < 0 || manualBaseQty > 1000000)) throw new Error('Invalid manual quantity.');
  const overrides = {};
  if (promotionUnits !== undefined) overrides.promotionUnits = promotionUnits;
  if (weekdayFactors !== undefined) overrides.weekdayFactors = weekdayFactors;
  const model = source.createModel(source.snapshot, overrides);
  const analysis = model.analysis(sku);
  const scenarios = model.scenarios.map(({ id }) => {
    const result = model.simulate(sku, id, horizon, manualBaseQty);
    return Object.fromEntries(['id', 'name', 'quantity', 'cost', 'forecastRevenue', 'additionalRevenue',
      'grossProfit', 'lostUnits', 'endingInventory', 'allowed', 'blockers', 'risks', 'reasons',
      'from', 'to', 'days', 'simulationOnly', 'approvalQuantity'].map(key => [key, result[key]]));
  });
  return {
    schemaVersion: 1,
    dataBoundary: 'DEMONSTRATION_FIXTURE_NOT_LIVE_SALES',
    approvalRequired: true,
    supplierOrderSent: false,
    sku, horizon, model: model.meta,
    observed: { last7Units: analysis.observed.last7Units, prev7Units: analysis.observed.prev7Units },
    recommendation: analysis.recommendation,
    scenarios,
  };
}

module.exports = { loadModel, analyze };

if (require.main === module) {
  try {
    const directory = process.env.ORDO_SITE_DIRECTORY || path.join(__dirname, '../app');
    const input = JSON.parse(fs.readFileSync(0, 'utf8'));
    process.stdout.write(JSON.stringify(analyze(loadModel(directory), input)) + '\n');
  } catch (error) {
    // Do not log environment variables, HTTP headers, or credentials.
    process.stderr.write(`Ordo analysis failed: ${error.message}\n`);
    process.exitCode = 1;
  }
}
