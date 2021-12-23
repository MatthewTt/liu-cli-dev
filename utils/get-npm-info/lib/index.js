'use strict';

/*import axios from 'axios';
import semver from 'semver';
import urlJoin from 'url-join';*/
const axios = require('axios')
const semver = require('semver')
const urlJoin = require('url-join')

function getNpmInfo(npmName, url) {
  if (!npmName) return null
  const registerUrl = url || getDefaultRegistry()
  const npmInfoUrl = urlJoin(registerUrl, npmName)
  return axios.get(npmInfoUrl).then(response => {
    if (response.status === 200) {
      // console.log(response.data)
      return response.data
    }
    return null
  }).catch(e => {
    return Promise.reject(e)
  })
}

/**
 * 是否原生镜像
 * @param isOriginal true 淘宝镜像
 */
function getDefaultRegistry(isOriginal = false) {
  return isOriginal ? 'https://registry.npmjs.org' : 'https://registry.npm.taobao.org'
}

// 获取远程版本号
async function getVersions(npmName) {
  const npmInfo = await getNpmInfo(npmName)
  return Object.keys(npmInfo.versions)
}

/**
 * 获取比当前版本新的版本
 * @param baseVersion 当前版本
 * @param versions 所有版本
 * @returns {Array} >=当前版本的数组
 */
function getSemverVersions(baseVersion, versions) {
  return versions
    .filter(version => semver.satisfies(version, `^${ baseVersion }`))
    .sort((a, b) => semver.gt(b, a))
}

// 获取最新的版本, 过滤其他版本
async function getNpmSemverVersion(baseVersion, npmName) {
  const versions = await getVersions(npmName)
  const semverVersions = getSemverVersions(baseVersion, versions)
  if (semverVersions && semverVersions.length) {
    return semverVersions[0]
  }
}

async function getNpmLatestVersion(packageName) {
  const versions = await getVersions(packageName)
  if (versions) {
    return versions.sort((a, b) => semver.gt(b, a))[0]
  }
  return null
}

module.exports = {
  getNpmInfo,
  getVersions,
  getNpmSemverVersion,
  getDefaultRegistry,
  getNpmLatestVersion
};
