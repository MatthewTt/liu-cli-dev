'use strict';

const Command = require('@liu-cli-dev/command')
const log = require('@liu-cli-dev/log')
const utils = require('@liu-cli-dev/utils')
const fs = require('fs')
const inquirer = require('inquirer')

class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._cmd.force
        // console.log(this, 'force')
        log.verbose('projectName', this.projectName)
        log.verbose('force', this._cmd.force)
    }

    async exec() {
        // 1准备阶段
        try {
            await this.prepare()
        } catch (e) {
            log.error(e.message)
        }
        // 2下载模板
        // 3安装模板
    }

    async prepare() {
        const localPath = process.cwd() // 查看执行的路径
        // 1.判断当前目录是否为空
        if (!this.isCwdEmpty(localPath)) {
            let ifContinue = false
            // 2.是否启动强制更新 force
            if (!this.force) {
                // 查询是否要继续创建
                ifContinue = (await inquirer.prompt({
                    type: 'confirm',
                    name: 'ifContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续?'
                })).ifContinue

                console.log(ifContinue, 9999)
                if (!ifContinue) return // 不继续直接跳出
            }

            if (ifContinue || this.force) {
                // 如果要继续创建，二次询问是否删除原有文件
                const {isDelete} = await inquirer.prompt({
                    type: 'confirm',
                    name: 'isDelete',
                    default: false,
                    message: '是否要强制删除原有文件？'
                });

                if (isDelete) {
                    utils.clearDirSync(localPath)
                }
            }
        }
        // 3.选择创建项目或组件
        // 4.获取项目基本信息
    }

    /**
     * 文件夹中是否存在文件
     * @returns {boolean}
     */
    isCwdEmpty(localPath) {
        let fileList = fs.readdirSync(localPath)
        fs.readdirSync
        // 不包含.开头的 和 node_module的文件
        fileList = fileList.filter(file => (!file.startsWith('.') && ['node_module'].indexOf(file) < 0))
        return !fileList || fileList.length <= 0
    }
}

function init(argv) {
    // console.log('init', projectName, cmdObj.force)
    return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand