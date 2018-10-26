const core = require('gls-core-service');
const MongoDB = core.services.MongoDB;

module.exports = MongoDB.makeModel(
    'User',
    {
        name: {
            type: String,
            required: true,
        },
        metaName: {
            type: String,
        },
        profileImage: {
            type: String,
        },
        coverImage: {
            type: String,
        },
        about: {
            type: String,
        },
        location: {
            type: String,
        },
        website: {
            type: String,
        },
        pinnedPosts: {
            type: [String],
        },
        following: {
            type: [String],
        },
        votingPower: {
            type: Number,
            default: 10000,
        },
        lastVoteDate: {
            type: Date,
        },
        vesting: {
            original: {
                type: Number,
            },
            delegatedFromAnother: {
                type: Number,
            },
            delegatedToAnother: {
                type: Number,
            },
        },
    },
    {
        index: [
            {
                fields: {
                    name: 1,
                },
                options: {
                    unique: true,
                },
            },
        ],
    }
);
