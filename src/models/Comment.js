const core = require('gls-core-service');
const MongoDB = core.services.MongoDB;

module.exports = MongoDB.makeModel(
    'Comment',
    {
        parentAuthor: {
            type: String,
        },
        parentPermlink: {
            type: String,
        },
        author: {
            type: String,
        },
        permlink: {
            type: String,
        },
        body: {
            type: String,
        },
        rawJsonMetadata: {
            type: String,
        },
        metadata: {
            app: {
                type: String,
            },
            format: {
                type: String,
            },
            tags: {
                type: [String],
            },
            images: {
                type: [String],
            },
            links: {
                type: [String],
            },
            users: {
                type: [String],
            },
        }
    },
    {
        index: [
            {
                fields: {
                    permlink: 1
                }
            }
        ],
    }
);
