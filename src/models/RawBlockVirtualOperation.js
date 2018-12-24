const core = require('gls-core-service');
const MongoDB = core.services.MongoDB;

module.exports = MongoDB.makeModel(
    'RawBlockVirtualOperation',
    {
        blockNum: {
            type: Number,
            required: true,
        },
        orderingNum: {
            type: Number,
            required: true,
        },
        operationType: {
            type: String,
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
                options: {
                    unique: true,
                },
            },
        ],
        schema: {
            strict: false,
        },
    }
);
