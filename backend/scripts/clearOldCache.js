require('dotenv').config();
const { Redis } = require('@upstash/redis');

const r = new Redis({
    url:   process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Delete the old v2 TCS key so the server re-fetches with v3 schema
r.del('v2:price:TCS.NS')
    .then((n) => console.log('Deleted v2:price:TCS.NS, result:', n))
    .catch((e) => console.error('Error:', e));
