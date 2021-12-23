'use strict';
const utils = require('@liu-cli-dev/utils')
const formatPath = require('@liu-cli-dev/format-path')
const pkgDir = require('pkg-dir').sync
const path = require('path')
const npmInstall = require('npminstall')
const { getDefaultRegistry } = require('@liu-cli-dev/get-npm-info')
const { getNpmSemverVersion, getNpmLatestVersion } = require('../../../utils/get-npm-info')
const fs = require('fs')

class Package {
  constructor(options) {
    // 判断是否为空cd
    if (!options) {
      throw new Error('options参数不能为空')
    }
    if (!utils.isObject(options)) {
      throw new Error('Object options 必须是对象')
    }
    this.targetPath = options.targetPath
    this.storePath = options.storeDir
    this.packageName = options.packageName
    this.packageVersion = options.packageVersion
    this.cacheFilePathPrefix = options.packageName.replace('/', '_')

  }

  async prepare() {
    if (this.storePath && !fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true })
    }
    if (this.packageVersion === 'latest') {
      this.packageVersion = await getNpmLatestVersion(this.packageName)
    }
  }

  get cacheFilePath() { // 生成缓存路径
    return path.resolve(this.storePath, `_${ this.cacheFilePathPrefix }@${ this.packageVersion }@${ this.packageName }`)
  }

  getSpecificPath(version) {
    return path.resolve(this.storePath, `_${ this.cacheFilePathPrefix }@${ version }@${ this.packageName }`)
  }

  // 判断package是否存在
  async exists() {
    if (this.storePath) {
      await this.prepare()
      return fs.existsSync(this.cacheFilePath) // 查看缓存文件是否存在, 不存在会返回true 执行更新操作
    } else {
      return fs.existsSync(this.targetPath)
    }
  }

  // 安装
  async install() {
    await this.prepare()
    return npmInstall({
      root: this.targetPath,
      storeDir: this.storePath,
      registry: getDefaultRegistry(),
      pkgs: [ {
        name: this.packageName,
        version: this.packageVersion
      } ]
    })
  }

  // 更新
  async update() {
    await this.prepare()
    // 如果最新版本已存在就不更新
    // 1. 获取最新版本号
    const latestVersion = await getNpmLatestVersion(this.packageName)
    // 查看缓存中有没有最新版本号的包
    const latestFilePath = this.getSpecificPath(latestVersion)
    // 如果不存在直接安装
    if (!fs.existsSync(latestFilePath)) {
      await npmInstall({
        root: this.targetPath,
        storeDir: this.storePath,
        registry: getDefaultRegistry(),
        pkgs: [ {
          name: this.packageName,
          version: latestVersion
        } ]
      })
    }
    // return latestFilePath
    this.packageVersion = latestVersion // 如果更新了, 覆盖值
  }

  // 获取package入口文件路径
  getRootFile() {
    function _getRootFilePath(targetPath) {
      // 获取package.json所在目录
      const rootPath = pkgDir(targetPath)
      if (rootPath) {
        // 读取package.json
        const pkgFile = require(path.resolve(rootPath, 'package.json'))
        // console.log(pkgFile)
        // 寻找main.lib 的文件
        if (pkgFile && pkgFile.main) {
          // 路径兼容(mac & window)
          return formatPath(path.resolve(rootPath, pkgFile.main)) // 最终获取的是package.json中 main/lib/index.js文件
        }
      }
    }
    // 兼容处理: 没输入targetPath返回缓存
    if (this.storePath) {
      return _getRootFilePath(this.cacheFilePath)
    } else {
      return _getRootFilePath(this.targetPath)
    }
  }
}

module.exports = Package;
