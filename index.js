const interactive = require('@mixer/interactive-node');
const ws = require('ws');
const fs = require('fs');
const redis = require('redis');

const redisClient = redis.createClient();

const CLIENT_ID = '0cfe503c463c8ac90ab00cd2c6dc45a9d862afa709992af6';
const CLIENT_SECRET = fs.readFileSync('secret.key', 'utf8');

console.log(CLIENT_SECRET);