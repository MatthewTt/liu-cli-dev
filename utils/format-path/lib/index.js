'use strict';
const path = require('path')
module.exports = index;

function index(p) {
  if (p && typeof p === 'string') {
    const sep = path.sep // 获取路径分隔符
    if (sep === '/') {
      return p
    } else {
      return p.replace(/\\/g, '/')
    }
  }
  return p
}
