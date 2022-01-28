'use strict';

const Command = require('@liu-cli-dev/command')
const log = require('@liu-cli-dev/log')
const utils = require('@liu-cli-dev/utils')
const Package = require('@liu-cli-dev/package')
const getTemplate = require('./getTemplate')
const fs = require('fs')
const inquirer = require('inquirer')
const path = require('path');
const userHome = require('user-home');
const PROJECT_TYPE = 'project'
const COMPONENT_TYPE = 'component'

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
            const projectInfo = await this.prepare();
            if (projectInfo) {
                // 2下载模板
                log.verbose(projectInfo)
                this.projectInfo = projectInfo
                this.downloadTemplate()
            }


        } catch (e) {
            log.error(e.message)
        }
        // 3安装模板
    }


    async prepare() {
        const localPath = process.cwd() // 查看执行的路径
        // 0. 判断是否存在模版
        const template = await getTemplate();
        console.log(template)
        if (!template || template.length < 1) {
            throw new Error('模板不存在')
        }
        this.template = template
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

        return await this.getProjectInfo()
    }

    /**
     * 文件夹中是否存在文件
     * @returns {boolean}
     */
    isCwdEmpty(localPath) {
        let fileList = fs.readdirSync(localPath)
        // 不包含.开头的 和 node_module的文件
        fileList = fileList.filter(file => (!file.startsWith('.') && ['node_module'].indexOf(file) < 0))
        return !fileList || fileList.length <= 0
    }

    /**
     * 获取项目基本信息
     * @returns {Promise<*&{type: *}>}
     */
    async getProjectInfo() {
        // 1.询问创建项目还是组件
        const {type} = await inquirer.prompt({
            type: 'list',
            name: 'type',
            message: '请选择初始化类型',
            default: PROJECT_TYPE,
            choices: [{
                name: '项目',
                value: PROJECT_TYPE
            }, {
                name: '组件',
                value: COMPONENT_TYPE
            }]
        });
        log.verbose('type: init/index.js 97', type)
        // 2.获取项目基本信息
        let project
        if (type === PROJECT_TYPE) {
            project = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'projectName',
                    message: '请输入项目名称',
                    default: '',
                    validate: function (v) {
                        return typeof v === 'string'
                    },
                    filter: function (v) {
                        return v
                    }
                },
                {
                    type: 'input',
                    name: 'projectVersion',
                    message: '请输入项目版本',
                    default: '1.0.0',
                    validate: v => typeof v === 'string',
                    filter: v => v
                },
                {
                    type: 'list',
                    name: 'projectTemplate',
                    message: '请选择项目模板',
                    choices: this.createTemplateChoices()
                }
            ])
        } else if (type === COMPONENT_TYPE) {

        }
        // 3.返回信息
        return {type, ...project}

    }

    createTemplateChoices() {
        return this.template.map(v => ({
            name: v.name,
            value: v.npmName
        }))
    }

    async downloadTemplate() {
        // 1. 通过项目模板API获取项目模板信息
        // 2. 通过egg.js搭建后端
        // 3. 通过npm储存项目模板
        // 4. 储存到mongodb
        // 5. 从egg.js获取数据
        const projectTemplate = this.template.find(template => this.projectInfo.projectTemplate === template.npmName)
        const targetPath = path.resolve(userHome, '.liu-cli-dev', 'template')
        const storePath = path.resolve(userHome, '.liu-cli-dev', 'template', 'node_modules')
        const templateNpm = new Package({
            targetPath,
            storeDir: storePath,
            packageName: projectTemplate.npmName,
            packageVersion: projectTemplate.version
        })
        if (!await templateNpm.exists()) {
            const ora = utils.loading('正在下载...');
            try {
                await utils.sleep()
                await templateNpm.install()
            } finally {
                ora.stop()
            }
        } else {
            const ora = utils.loading('正在更新...');
            try {
                await templateNpm.update()
                await utils.sleep()
            } finally {
                ora.stop()
            }
        }
    }
}

function init(argv) {
    // console.log('init', projectName, cmdObj.force)
    return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
