'use strict';

const Command = require('@liu-cli-dev/command')
const log = require('@liu-cli-dev/log')
const utils = require('@liu-cli-dev/utils')
const Package = require('@liu-cli-dev/package')
const getTemplate = require('./getTemplate')
const fs = require('fs')
const fse = require('fs-extra')
const inquirer = require('inquirer')
const path = require('path');
const userHome = require('user-home');
const ejs = require('ejs')
const PROJECT_TYPE = 'project'
const COMPONENT_TYPE = 'component'


const TEMPLATE_TYPE_NORMAL = 'normal'
const TEMPLATE_TYPE_CUSTOM = 'custom'

const WHITE_LIST = ['pnpm', 'npm', 'cnpm'] // 命令白名单
console.log('test')
class InitCommand extends Command {
    init() {
        this.projectName = this._argv[0] || ''
        this.force = !!this._cmd.force
        // console.log(this, 'force')
        log.verbose('projectName', this.projectName)
        log.verbose('force', this._cmd.force)
    }

    async exec() {
        // 1.准备阶段
        try {
            const projectInfo = await this.prepare();
            if (projectInfo) {
                // 2.下载模板
                log.verbose(projectInfo)
                this.projectInfo = projectInfo
                await this.downloadTemplate()

                // 3.安装模板
                this.installTemplate()
            }


        } catch (e) {
            log.error(e.message)
        }
    }


    async prepare() {
        const localPath = process.cwd() // 查看执行的路径
        // 0. 判断是否存在模版
        const template = await getTemplate();
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
        this.template = this.template.filter(tmp => tmp.tag.includes(type))
        // 2.获取项目基本信息
        let project
        const title = type === PROJECT_TYPE ? '项目' : '组件'
        const promptList = [{
            type: 'input',
            name: 'projectVersion',
            message: `请输入${title}版本`,
            default: '1.0.0',
            validate: v => typeof v === 'string',
            filter: v => v
        },
            {
                type: 'list',
                name: 'projectTemplate',
                message: `请选择${title}模板`,
                choices: this.createTemplateChoices()
            }]
        if (!this.projectName) {
            promptList.unshift({
                type: 'input',
                name: 'projectName',
                message: `请输入${title}名称`,
                default: '',
                validate: function (v) {
                    return typeof v === 'string'
                },
                filter: function (v) {
                    return v
                }
            })
        }
        if (type === PROJECT_TYPE) {

            project = await inquirer.prompt(promptList)
        } else if (type === COMPONENT_TYPE) {
            project = await inquirer.prompt(promptList)

        }

        // 生成className
        if (project.projectName || this.projectName) {
            project.className = require('kebab-case')(project.projectName || this.projectName).replace(/^-/, '') // 转换成小写
        }
        if (project.projectVersion) {
            project.version = project.projectVersion
        }

        // this.selectProject = project
        // 3.返回信息
        return {projectName: this.projectName, type, ...project}

    }

    createTemplateChoices() {
        return this.template.map(v => ({
            name: v.name,
            value: v.npmName
        }))
    }

    /**
     * 下载模板
     * @returns {Promise<void>}
     */
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
        this.templateInfo = projectTemplate
        this.templateNpm = templateNpm
        log.verbose('package', templateNpm)
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

    installTemplate() {
        if (this.templateInfo) {
            if (!this.templateInfo.type) {
                this.templateInfo.type = TEMPLATE_TYPE_NORMAL
            }
            if (this.templateInfo.type === TEMPLATE_TYPE_NORMAL) {
                // 标准安装
                this.installNormalTemplate()
            } else if (this.templateInfo.type === TEMPLATE_TYPE_CUSTOM) {
                // 自定义安装
                this.installCustomTemplate()
            } else {
                throw new Error('无法识别模板类型')
            }
        } else {
            throw new Error('模板类型不存在')
        }
    }

    async installNormalTemplate() {
        const ora = utils.loading('正在安装模板...')
        try {
            const templatePath = path.resolve(this.templateNpm.cacheFilePath, 'template')
            const currentPath = process.cwd()
            fse.ensureDirSync(templatePath)
            fse.ensureDirSync(currentPath)
            fse.copySync(templatePath, currentPath, {})
        } catch (e) {
            throw e
        } finally {
            ora.stop()
            log.success('模板安装完成')
        }
        const files = await this.ejsRender({ignore: ['node_modules/*', 'public/**', ...(this.templateInfo.ignore || [])]})
        // 依赖安装
        const {installCommand, startCommand} = this.templateInfo;
        await this.execCommand(installCommand, '依赖安装失败')
        // 运行项目
        await this.execCommand(startCommand, '项目运行失败')
    }

    installCustomTemplate() {
    }

    // 校验命令是否白名单中
    commandIsVerb(command) {
        if (WHITE_LIST.indexOf(command) > -1) {
            return command
        }

        return null
    }

    async execCommand(command, errMsg) {
        let result
        if (command) {
            const execCmd = command.split(' ')
            const cmd = this.commandIsVerb(execCmd[0])
            if (!cmd) {
                throw new Error(`（${command}）命令不存在`)
            }
            const args = execCmd.slice(1)
            result = await utils.execSync(cmd, args, {
                cwd: process.cwd(),
                stdio: 'inherit'
            })
        }
        if (result !== 0) {
            throw new Error(errMsg)
        }
    }

    /**
     * ejs 渲染模板
     * @param options
     * @returns {Promise<unknown>}
     */
    ejsRender(options) {
        const cwd = process.cwd()
        const templateInfo = this.projectInfo;
        return new Promise(((resolve, reject) => {
            require('glob')('**', {
                cwd,
                nodir: true,
                ignore: options.ignore || ''
            }, (err, files) => {
                if (err) {
                    reject(err)
                }
                Promise.all(files.map(file => {
                    const filePath = path.resolve(cwd, file)
                    return new Promise(((resolve1, reject1) => {
                        ejs.renderFile(filePath, templateInfo, {}, (err, result) => {
                            if (err) {
                                reject1(err)
                            } else {
                                // result只是数据，并不会替换原有文件，所以要覆盖数据
                                fs.writeFileSync(filePath, result)
                                resolve1(result)
                            }
                        })
                    }))
                })).then((result) => resolve(result))
                    .catch(err => reject(err))
            })
        }))
    }

}

function init(argv) {
    return new InitCommand(argv)
}

module.exports = init
module.exports.InitCommand = InitCommand
