'use strict';

const axios = require('axios');
const BASE_URL = process.env.LIU_CLI_BASE_URL || 'http://127.0.0.1:7001'
console.log(BASE_URL, 'baseURL')
const request = axios.create({
    baseURL: BASE_URL,
    timeout: 5000
});

request.interceptors.response.use(response => {
    return response.data
})
module.exports = request
