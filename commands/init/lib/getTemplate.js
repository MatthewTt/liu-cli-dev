const request = require('@liu-cli-dev/request');

module.exports = function getTemplate() {
    return request({
        url: '/project/template'
    })
}
