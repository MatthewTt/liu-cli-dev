'use strict';

const Command = require('@liu-cli-dev/command')
const log = require('@liu-cli-dev/log')

class InitCommand extends Command {
  init() {
    this.projectName = this._argv[0] || ''
    this.force = !!this._cmd.force
    log.verbose('projectName', this.projectName)
    log.verbose('force', this.force)
  }

  exec() {
    console.log('init逻辑')
  }
}

function init(argv) {
  // console.log('init', projectName, cmdObj.force)
  return new InitCommand(argv)
}
module.exports = init
module.exports.InitCommand = InitCommand
