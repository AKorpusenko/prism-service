const core = require('gls-core-service');
const BigNum = core.types.BigNum;
const MongoDB = core.services.MongoDB;
const BigNumType = MongoDB.type.MongoBigNum;

const BLOCKCHAIN_DEFAULT_MAX_ACCEPTED_PAYOUT = new BigNum(1000000.000);
const BLOCKCHAIN_DEFAULT_GBG_PERCENT = new BigNum(5000);
const GOLOS_100_PERCENT = new BigNum(10000);

module.exports = MongoDB.makeModel(
    'Post',
    {
        parentPermlink: {
            type: String,
        },
        author: {
            type: String,
        },
        permlink: {
            type: String,
        },
        title: {
            type: String,
        },
        body: {
            full: {
                type: String,
            },
            cut: {
                type: String,
            },
        },
        createdInBlockchain: {
            type: Date,
        },
        scoring: {
            actual: {
                type: Number,
                default: 0,
            },
            popular: {
                type: Number,
                default: 0,
            }
        },
        promote: {
            balance: {
                type: BigNumType,
                default: new BigNum(0),
            },
        },
        bandwidth: {
            lastUpdate: {
                type: Date,
            },
            averageBandwidth: {
                type: BigNumType,
                default: GOLOS_100_PERCENT,
            },
        },
        options: {
            maxAcceptedPayout: {
                type: BigNumType,
                default: BLOCKCHAIN_DEFAULT_MAX_ACCEPTED_PAYOUT,
            },
            gbgPercent: {
                type: BigNumType,
                default: BLOCKCHAIN_DEFAULT_GBG_PERCENT,
            },
            allowCurationRewards: {
                type: Boolean,
                default: true,
            },
            beneficiaries: {
                type: [
                    {
                        name: {
                            type: String,
                        },
                        weight: {
                            type: Number,
                        },
                    },
                ],
            },
        },
        payout: {
            date: {
                type: Date,
            },
            isDone: {
                type: Boolean,
                default: false,
            },
            rewardWeight: {
                type: BigNumType,
                default: GOLOS_100_PERCENT,
            },
            netRshares: {
                type: BigNumType,
                default: new BigNum(0),
            },
            pending: {
                authorValue: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                authorGolos: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                authorGbg: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                authorGests: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                curatorValue: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                curatorGests: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                benefactorValue: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                benefactorGests: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                totalValue: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
            },
            final: {
                authorGolos: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                authorGbg: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                authorGests: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                curatorValue: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                curatorGests: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                benefactorValue: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                benefactorGests: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
                totalValue: {
                    type: BigNumType,
                    default: new BigNum(0),
                },
            },
        },
        vote: {
            likes: {
                type: Object,
            },
            dislikes: {
                type: Object,
            },
            rshares: {
                type: BigNumType,
                default: new BigNum(0),
            },
            totalWeight: {
                type: BigNumType,
                default: new BigNum(0),
            },
            totalRealWeight: {
                type: BigNumType,
                default: new BigNum(0),
            },
        },
        comments: {
            count: {
                type: Number,
                default: 0,
            },
        },
        metadata: {
            rawJson: {
                type: String,
            },
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
        },
    },
    {
        index: [
            {
                fields: {
                    author: 1,
                    permlink: 1,
                },
                options: {
                    unique: true,
                },
            },
            {
                fields: {
                    author: 1,
                },
            },
            {
                fields: {
                    createdInBlockchain: 1,
                },
            },
        ],
    }
);
