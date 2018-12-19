const core = require('gls-core-service');
const BasicService = core.services.Basic;
const Logger = core.utils.Logger;
const BlockUtils = core.utils.Block;
const BlockChainValues = core.utils.BlockChainValues;
const env = require('../data/env');
const Model = require('../models/RawBlock');

class RawBlockRestore extends BasicService {
    constructor(...args) {
        super(...args);

        this._endNum = 0;
        this._queue = null;
        this._stop = false;
    }

    async start(lastBlock) {
        const globalProps = await BlockChainValues.getDynamicGlobalProperties();
        const loaders = [];

        this._endNum = globalProps.last_irreversible_block_num;
        this._queue = this._numQueue(lastBlock);

        await this._startEndValSyncLoop();

        for (let i = 0; i < env.GLS_RAW_RESTORE_THREADS; i++) {
            loaders.push(this._load());
        }

        await Promise.all(loaders);
        await this._loadCorrupted();

        Logger.info('Raw block restore done');

        this.done();
    }

    async stop() {
        this._stop = true;
        this._endNum = 0;

        await new Promise(resolve => {
            setImmediate(() => {
                if (this.isDone()) {
                    resolve();
                }
            });
        });
    }

    async _startEndValSyncLoop() {
        try {
            await this._endValSync();
        } catch (error) {
            Logger.error(`Cant start raw block sync - end val sync error - ${error}`);
            process.exit(1);
        }

        setTimeout(async () => {
            if (this._stop) {
                return;
            }

            try {
                await this._endValSync();
            } catch (error) {
                Logger.error(`End val sync error, but continue - ${error}`);
            }
        }, env.GLS_RAW_RESTORE_END_VAL_SYNC_INTERVAL);
    }

    async _endValSync() {
        const globalProps = await BlockChainValues.getDynamicGlobalProperties();

        this._endNum = globalProps.last_irreversible_block_num;
    }

    async _load() {
        for (let blockNum of this._queue) {
            try {
                const block = await BlockUtils.getByNum(blockNum);

                block.blockNum = blockNum;

                await Model.update({ blockNum }, block, { upsert: true });

                Logger.log(`Raw block loaded - ${blockNum}`);
            } catch (error) {
                await Model.update({ blockNum }, { blockNum, corrupted: true }, { upsert: true });

                Logger.error(`Cant load raw block, but continue - ${error}`);
            }
        }
    }

    async _loadCorrupted() {
        if (this._stop) {
            return;
        }

        const corrupted = await Model.find({ corrupted: true }, { blockNum: true });

        if (!corrupted) {
            return;
        }

        for (let { blockNum } of corrupted) {
            try {
                const block = await BlockUtils.getByNum(blockNum);

                block.blockNum = blockNum;
                block.corrupted = false;

                await Model.update({ blockNum }, block);

                Logger.log(`Raw corrupted block loaded - ${blockNum}`);
            } catch (error) {
                corrupted.push({ blockNum });

                Logger.error(`Cant load corrupted raw block, but continue - ${error}`);
            }
        }
    }

    *_numQueue(current) {
        while (current <= this._endNum) {
            yield ++current;
        }
    }
}

module.exports = RawBlockRestore;
