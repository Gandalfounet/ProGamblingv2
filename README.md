# ProGambling v2 - Roulette for Steam Games

## [Demo](https://www.csgobing.com)
## [Full Package](https://www.pro-gambling.com/index.php/product/create-steam-gambling-site-pro-pack/)

This project is the Gambler pack from [Pro-Gambling.com](https://www.Pro-Gambling.com). It contains :
```
Roulette Game
```
```
Mongo-express as Administration Panel
```
```
Chat with admin commands
```
```
Coupon Code System
```
```
Deposit/Withdraw Panel
```
```
Documentation
```

## Getting Started

These instructions will get you a copy of the project up and running on your machine. 

### Prerequisites

Install curl, git, mongodb, nodejs, pm2 and mongo-express

```
apt-get install curl
```
```
apt-get install git
```
```
apt-get install mongodb
```
```
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
```
```
apt-get install -y nodejs
```
```
apt-get install -y build-essential
```
```
npm install -g pm2
```
```
npm install -g mongo-express
```

### Installing

A step by step series of examples that tell you have to get a development env running

Setup the config file : config.js

Modify socket in /template/gandim/static/js/app.js : line 2

```
cd /yourfolder
```
```
node index
```



## Built With

* [SteamApis.com](https://steamapis.com/) - Get Prices and Inventories
* [VueJS](https://vuejs.org/) - FrontEnd
* [MongoDB](https://www.mongodb.com/fr) - Database - NoSQL


## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

* **Tariq RIAHI** - *Initial work* - [Gandalfounet](https://github.com/Gandalfounet)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
