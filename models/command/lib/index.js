'use strict';

const semver = require('semver');
const colors = require('colors');
const LOWEST_NODE_VERSION = '12.0.0'

class Command {
  constructor(argv) {
    if (!Array.isArray(argv)) {
      throw new Error('参数必须是数组')
    }
    if (argv.length < 1) {
      throw new Error('参数列表为空')
    }
    console.log(argv)
    this._argv = argv
    let runner = new Promise(((resolve, reject) => {
      let chain = Promise.resolve()
      chain = chain.then(() => this.checkNodeVersion())
      chain = chain.then(() => this.initArgs())
      chain = chain.then(() => this.init())
      chain = chain.then(() => this.exec())
      chain.catch(err => console.error(err))
    }))
  }
  initArgs() {
    this._cmd = this._argv[this._argv.length - 1]
    this._argv = this._argv.slice(0, this._argv.length - 1)
  }
  init() {
    throw new Error('init必须实现')
  }
  exec() {
    throw new Error('exec必须实现')
  }

  checkNodeVersion() {
    // 获取当前版本
    const currentVersion = process.version
    // 获取最低版本
    const lowestNodeVersion = LOWEST_NODE_VERSION
    if (!semver.gte(currentVersion, lowestNodeVersion)) {
      throw new Error(colors.red(`需要至少安装${ lowestNodeVersion }版本的Node.js`))
    }
  }

}
module.exports = Command
