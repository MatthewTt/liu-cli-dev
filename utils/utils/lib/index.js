'use strict';

const fs = require("fs");

function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]'
}

// 清空文件夹中的文件
function emptyDirSync(path) {
    const fileList = fs.readdirSync(path)
    fileList.forEach(file => {
        const filePath = `${path}/${file}`
        fs.rmSync(filePath, { force: true, recursive: true })
    })
}

/**
 * 删除路径所有空文件夹
 * @param path
 */
/*
function delEmptyDir(path) {
    const fileList = fs.readdirSync(path)
    if (fileList.length > 0) {
        let counter = 0
        fileList.forEach(file => {
            counter++
            const filePath = `${path}/${file}`
            delEmptyDir(filePath)
        })

        if (counter === fileList.length) {
            fs.rmdirSync(path)
        }
    } else {
        fs.rmdirSync(path)
    }
}
*/

function clearDirSync(path) {
    // fs.rmSync(path, { forece: true, recursive: true })
    try {
        emptyDirSync(path)
    } catch (e){
        console.log(e)
        return fs.mkdirSync(path)
    }
}
module.exports = {isObject, clearDirSync};

