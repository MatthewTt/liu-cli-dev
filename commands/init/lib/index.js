'use strict';

const Command = require('@liu-cli-dev/command')

class InitCommand extends Command {

}

function init(argv) {
  // console.log('init', projectName, cmdObj.force)
  return new InitCommand()
}

module.exports = {
  init, InitCommand
};
