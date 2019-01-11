const core = require('gls-core-service');
const MongoDB = core.services.MongoDB;

module.exports = MongoDB.makeModel(
    'RawBlockTransaction',
    {
        blockNum: {
            type: Number,
            required: true,
        },
        orderingNum: {
            type: Number,
            required: true,
        },
    },
    {
        index: [
            // Search
            {
                fields: {
                    blockNum: -1,
                },
            },
            // Compose
            {
                fields: {
                    orderingNum: 1,
                },
            },
        ],
        schema: {
            strict: false,
        },
    }
);
