'use strict'

module.exports = {
    theme: "gandim",
    appID: 730, // 730 - CS:GO 252490 - Rust
    contextID: 2, // ContextID
    bots: {
        // bot_1: {
        //     siteName: 'Bot 1',  // Will be displayed under the "All bots" tab e.g. "Keys Only"
        //     accountName: '',    // bot_1 username
        //     password: '',       // bot_1  password
        //     twoFactorCode: '',  // shared_secret value
        //     identitySecret: '', // identity_secret value
        //     steamID64: '',  // SteamID64 of bot account can be found here: "https://steamid.io/"
        //     personaName: 'BOT#1[CSGOBing.com]',   // Nickname for bot account, will change on restart
        // },
        // bot_2: {
        //     siteName: 'Bot 2',  // Will be displayed under the "All bots" tab e.g. "Keys Only"
        //     accountName: '',    // bot_1 username
        //     password: '',       // bot_1  password
        //     twoFactorCode: '',  // shared_secret value
        //     identitySecret: '', // identity_secret value
        //     steamID64: '',  // SteamID64 of bot account can be found here: "https://steamid.io/"
        //     personaName: 'BOT#2[CSGOBing.com]',   // Nickname for bot account, will change on restart
        // },
        bot_3: {
            siteName: 'Bot 3',  // Will be displayed under the "All bots" tab e.g. "Keys Only"
            accountName: '',    // bot_1 username
            password: '',       // bot_1  password
            twoFactorCode: '',  // shared_secret value
            identitySecret: '', // identity_secret value
            steamID64: '',  // SteamID64 of bot account can be found here: "https://steamid.io/"
            personaName: 'BOT#3',   // Nickname for bot account, will change on restart
        },
    },
    admins: ['76561197971996493', '76561197971996493'],
    youtubers: ['76561198388539484'], //youtubers cant withdraw
    steamApiKey: '',    // Your Steam API key, get it here: https://steamcommunity.com/dev/apikey
    SteamApisKey: '',   // Your SteamApis.com key, get it here: https://steamapis.com
    SteamApisCompactValue: 'safe_ts.last_30d', // Use safe price calculated from 30 days of data, more info: https://steamapis.com/developers (Market Items - Optional Query Parameters "compact_value")
    site: {
        header: 'CsgoBing', // Name/header/title of website. Prefix for  <title></title> (For more: /index.html line: 9) 
        steamGroup: '#',
        copyrights: 'Copyright © csgobing.com 2018',  // Copyright text
        twitter: 'https://twitter.com/ProGamblingDev',
    },
    domain: 'csgobing.com',    // Domain name only, follow the example (no http:// & no www & no /)
    website: 'https://csgobing.com',    // Website URL, follow the example (do not add / at the end), https is automatic
    websitePort: 443,    // Website PORT, don't change it unless you're using a reverse proxy
    tradeMessage: 'Trade offer from CsgoBing | If you did not request this offer or the offer looks invalid please decline.', // Quite obvious
    fee: 0.1,
    fee_reduc: 0.05,
    max_item: 10,
    min_deposit: 0,
    max_deposit: 2000,
    site_name: 'csgobing.com',
    admin_trade_link : 'https://steamcommunity.com/tradeoffer/new/?partner=11730765&token=Ow6Vv_1I',
    rates: {
        ignoreItemsBelow: 0, // Ignore items below this price (price * rate < ignoreItemsBelow) - shows (Too Low) for user
        trashPriceBelow: 0,   // Items below this price are considered trash, the trash rate modifier will be applied
        // Items
        user: {
            key: 1,
            knife: 0.95,
            rare_skin: 0.95,
            weapon: 0.9,
            misc: 0.85,
            trash: 0.7,
        },
        bot: {
            key: 1.05,
            knife: 1,
            rare_skin: 1,
            weapon: 0.95,
            misc: 0.9,
            trash: 0.8,
        },
    },
}
