'use strict'

const config = require('../config')
const request = require('request')
const Trade = require('./index')

const API = 'https://api.steamapis.com/market/items'
const saPrices = `${API}/${config.appID}?format=compact&compact_value=${config.SteamApisCompactValue}&api_key=${config.SteamApisKey}`

Trade.prototype.getPrices = function getPrices(callback) {
    console.log('START GETTING PRICES step 1')
    Trade.prototype.getSteamapis(3, (err, data) => { // 3 retries 
        if (err) {
            console.log(err)
            return this.getPrices(callback)
        }
        console.log('[!] Prices are updated.')
        return callback(data)
    })
}

Trade.prototype.getSteamapis = function getSteamapis(retries, callback) {
    console.log('START GETTING PRICES step 2')
    request(saPrices, (error, response, body) => {
        const statusCode = (response) ? response.statusCode || false : false
        if(error || response.statusCode !== 200) {
            console.log(error)
            console.log(response.statusCode)
            if(retries > 0) {
                retries--
                Trade.prototype.getSteamapis(retries, callback)
            } else {
                return callback({ error, statusCode })
            }
        } else {
            const items = JSON.parse(body)
            return callback(null, items)
        }
    })
}
