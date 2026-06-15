// A simple in-memory cache that mimics the Redis API.
// This allows easy replacement with actual Redis client later.

const cache = {};

const redisClient = {
    setEx: async (key, seconds, value) => {
        cache[key] = {
            value,
            expiry: Date.now() + seconds * 1000
        };
        return 'OK';
    },
    get: async (key) => {
        const item = cache[key];
        if (!item) return null;
        if (Date.now() > item.expiry) {
            delete cache[key];
            return null;
        }
        return item.value;
    },
    del: async (key) => {
        delete cache[key];
        return 1;
    }
};

module.exports = redisClient;
