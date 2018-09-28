const core = require('gls-core-service');
const Logger = core.utils.Logger;
const stats = core.services.statsClient;
const BasicService = core.services.Basic;
const BlockSubscribe = core.services.BlockSubscribe;
const Prism = require('../controllers/Prism');

class Extractor extends BasicService {
    constructor() {
        super();

        this._prism = new Prism();
        this._blockQueue = [];
        this._subscribe = new BlockSubscribe(); // TODO Add start params
        this.addNested(this._subscribe);

        this._subscribe.on('block', this._handleBlock.bind(this));
        this._subscribe.on('fork', this._handleFork.bind(this));
    }

    async start() {
        await this._subscribe.start();
        await this._runExtractorLoop();
    }

    async _handleBlock(block, blockNum) {
        this._blockQueue.push({ block, blockNum });
    }

    async _handleFork() {
        // TODO -
    }

    async stop() {
        await this.stopNested();
    }

    async _runExtractorLoop() {
        while (true) {
            try {
                await this._extractFromQueue();
                await new Promise(resolve => {
                    setImmediate(resolve);
                });
            } catch (error) {
                Logger.error(`Extractor error - ${error}`);
                process.exit(1);
            }
        }
    }

    async _extractFromQueue() {
        let blockData;

        while ((blockData = this._blockQueue.shift())) {
            const { block } = blockData;

            await this._prism.disperse(block);
        }
    }
}

module.exports = Extractor;
