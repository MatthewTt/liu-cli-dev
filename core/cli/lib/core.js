'use strict';

module.exports = core;
const path = require('path')
const fs = require('fs')
const semver = require('semver')
const colors = require('colors')
const userHome = require('user-home')

const pkg = require('../package.json')
let log = require('@liu-cli-dev/log')
const init = require('@liu-cli-dev/init')
const exec = require('@liu-cli-dev/exec')
const constant = require('./constant')
const commander = require('commander')
const program = new commander.Command()
let args, config

async function core() {
  try {
    await prepare()
    registerCommand()
    // checkRoot()
  } catch (e) {
    // log.error(e.message)
    if (program.opts().debug) {
      log.error(e.message)
    }
  }
}

/**
 * 检查root账户
 */
function checkRoot() {
  // console.log(process.getuid())
  const checkRoot = require('root-check')
  checkRoot()
}

// 检查用户主目录, path-exists不支持require导入
function checkUserHome() {
  if (!userHome) {
    throw new Error('当前登录用户主目录不存在')
  }
}

/*
function checkNodeVersion() {
  // 获取当前版本
  const currentVersion = process.version
  // 获取最低版本
  const lowestNodeVersion = constant.LOWEST_NODE_VERSION
  if (!semver.gte(currentVersion, lowestNodeVersion)) {
    throw new Error(colors.red(`需要至少安装${ lowestNodeVersion }版本的Node.js`))
  }
}
*/

function checkPkgVersion() {
  log.info('cli', pkg.version)
}

// 校验debug入参
function checkInputArgs() {
  const minimist = require('minimist')
  args = minimist(process.argv.slice(2))
  checkArgs()
}

function checkArgs() {
  if (args.debug) {
    process.env.Log_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
}

// 检查环境变量
function checkEnv() {
  const dotenv = require('dotenv')
  const dPath = path.resolve(userHome, '.env')
  fs.access(dPath, fs.F_OK, err => {
    if (!err) {
      config = dotenv.config({
        path: dPath
      })
    } else {
      console.log(err)
    }
    createDefaultConfig()
    // log.verbose('环境变量', config)
  })
}

function createDefaultConfig() {
  const cliConfig = {
    home: userHome
  }
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLi_HOME)
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
  }
  process.env.CLI_HOME_PATH = cliConfig.cliHome
}

// 检查最新版本
async function checkGlobalVersion() {
  // 检查当前版本
  const currentVersion = pkg.version
  // 调用api, 获取所有版本号
  const { getNpmSemverVersion } = require('@liu-cli-dev/get-npm-info')
  const npmName = pkg.name

  // 提取所有版本号, 对比哪些版本号是大于当前版本号
  const newVersion = await getNpmSemverVersion(currentVersion, npmName)
  // 获取最新版本, 提示用户更新
  if (newVersion && semver.gt(newVersion, currentVersion)) {
    log.warn(colors.yellow(`请手动更新${ npmName }, 当前版本: ${ currentVersion }, 最新版本: ${ newVersion }`))
  }
}

// 检查环境集合
async function prepare() {
  checkPkgVersion()
  // checkNodeVersion()
  checkUserHome()
  // checkInputArgs()
  checkEnv()
  await checkGlobalVersion()
}

function registerCommand() {
  program
    .name(Object.keys(pkg.bin)[0])
    .usage('<command> [options]')
    .version(pkg.version)
    .option('-d, --debug', '是否开启调试模式', false)
    .option('-tp --targetPath <targetPath>', '是否指定本地调试文件路径', '')

  program
    .command('init [projectName]')
    .option('-f, --force', '是否强制初始化项目')
    .action(exec)
  // 监听是否开启debug
  program.on('option:debug', function () {
    if (this.opts().debug) {
      process.env.LOG_LEVEL = 'verbose'
    } else {
      process.env.LOG_LEVEL = 'info'
    }
    log.level = process.env.LOG_LEVEL
    log.verbose('debug test')
  })

  // 指定targetPath
  program.on('option:targetPath', function () {
    process.env.CLI_TARGET_PATH = this.opts().targetPath
  })

  // 匹配错误命令
  program.on('command:*', function (obj) {
    const availableCommands = program.commands.map(cmd => cmd.name())
    console.log(colors.red('未知的命令: ', obj[0]))
    if (availableCommands.length > 0) {
      console.log(colors.red('可用命令: ', availableCommands.join(',')))
    }
  })

  program.parse(process.argv)

  // 没输入命令, 输出帮助文档
  if (program.args && program.args.length < 1) {
    program.outputHelp()
  }
}
