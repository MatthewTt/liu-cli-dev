'use strict';

const Command = require('@liu-cli-dev/command')
const log = require('@liu-cli-dev/log')
const fs = require('fs')

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._cmd.force
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }

  exec() {
    console.log('init逻辑')
    // 准备阶段
    try {
      this.prepare()
    } catch (e) {
      log.error(e.message)
    }
    // 下载模板
    // 安装模板
  }

  prepare() {
    // 判断当前目录是否为空


    // 是否启动强制更新 force
    // 选择创建项目或组件
    // 获取项目基本信息
  }

  isCwdEmpty() {
    const localPath = process.cwd() // 查看执行的路径
    let fileList = fs.readFileSync(localPath)
    fileList = fileList.filter(file => (!file.startsWith('.') && [ 'node_module' ].indexOf(file) < 0))
    return fileList.length <= 0
  }
}

function init(argv) {
  // console.log('init', projectName, cmdObj.force)
  return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
