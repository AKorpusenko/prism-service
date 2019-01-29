// Описание переменных окружения смотри в Readme.
const env = process.env;

module.exports = {
    NODE_OPTIONS: env.NODE_OPTIONS,
    GLS_MAX_FEED_LIMIT: Number(env.GLS_MAX_FEED_LIMIT) || 100,
    GLS_DELEGATION_ROUND_LENGTH: Number(env.GLS_DELEGATION_ROUND_LENGTH) || 21,
    GLS_REVERT_TRACE_CLEANER_INTERVAL: Number(env.GLS_REVERT_TRACE_CLEANER_INTERVAL) || 300000,
};
