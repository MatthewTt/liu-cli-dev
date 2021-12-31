'use strict';
const Package = require('@liu-cli-dev/package')
const log = require('@liu-cli-dev/log')
const path = require('path')
const cp = require('child_process')
const SETTINGS = {
  init: '@imooc-cli/init'
}

const CACHE_DIR = 'dependencies' // 缓存目录
async function index() {
  let targetPath = process.env.CLI_TARGET_PATH // 根据命令行输入的命令 --targetPath 来获取的
  const homePath = process.env.CLI_HOME_PATH
  let storeDir = ''
  const cmdObj = arguments[arguments.length - 1] // 获取命令
  const cmdName = cmdObj.name()
  const packageName = SETTINGS[cmdName] // 获取输入啥命令
  const packageVersion = 'latest'
  let pkg = ''

  if (!targetPath) { // 如果没有在命令行输入targetPath, 会默认一个
    targetPath = path.resolve(homePath, CACHE_DIR)
    storeDir = path.resolve(targetPath, 'node_modules')
    log.verbose('targetPath', targetPath)
    log.verbose('storeDir', storeDir)
    // 若不穿targetPath, 重新初始化一个对象, 把默认的安装路径传进去
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion,
      storeDir
    })

    if (await pkg.exists()) {
      // 更新package
      console.log('更新package')
      await pkg.update()
    } else {
      // 安装
      await pkg.install()
    }
  } else {
    pkg = new Package({
      targetPath,
      packageName,
      packageVersion
    })
  }
  const rootPath = pkg.getRootFile() // 返回包的js文件
  if (rootPath) {
    try {
      // require(rootPath).call(null, Array.from(arguments)) // 传入的内容会自动展开
      // 使用子进程的方式
      const o = Object.create(null)
      const args = Array.from(arguments)
      const cmd = args[args.length - 1]
      Object.keys(cmd).forEach(key => {
        if (cmd.hasOwnProperty(key) && !key.startsWith('_') && key !== 'parent') {
          o[key] = cmd[key]
        }
      })
      args[args.length - 1] = o
      const code = `require('${ rootPath }').call(null, ${ JSON.stringify(args) })`
      const child = cp.spawn('node', [ '-e', code ], {
        cwd: process.cwd(),
        stdio: 'inherit'
      })
      child.on('error', err => {
        log.error('process', err.message)
        process.exit(1)
      })
      child.on('exit', e => {
        log.verbose('命令执行成功', e)
        process.exit(e)
      })
    } catch (e) {
      log.error('exec', e.message)
    }
  }
}

module.exports = index;
