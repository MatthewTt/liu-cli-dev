#! /usr/bin/env node
const importLocal = require('import-local')
// import importLocal from 'import-local';

if (importLocal(__filename)) {
  require('npmlog')('cli', '本地')
} else {
  require('../lib/core')(process.argv.slice(2))
}

