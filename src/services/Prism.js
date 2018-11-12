const core = require('gls-core-service');
const Logger = core.utils.Logger;
const stats = core.utils.statsClient;
const BasicService = core.services.Basic;
const BlockSubscribe = core.services.BlockSubscribe;
const Controller = require('../controllers/prism/Main');
const RawBlockRestore = require('../services/RawBlockRestore'); // TODO -

class Prism extends BasicService {
    constructor() {
        super();

        this._controller = new Controller();
        this._blockQueue = [];
        this._subscribe = new BlockSubscribe(); // TODO Add start params
        this.addNested(this._subscribe);

        this._subscribe.on('block', this._handleBlock.bind(this));
        this._subscribe.on('fork', this._handleFork.bind(this));
    }

    async start() {
        await this._subscribe.start();
        this._runExtractorLoop().catch(error => {
            Logger.error(`Prism error - ${error}`);
            process.exit(1);
        });
    }

    async _handleBlock(block, blockNum) {
        this._blockQueue.push([block, blockNum]);
    }

    async _handleFork() {
        // TODO -
    }

    async stop() {
        await this.stopNested();
    }

    async _runExtractorLoop() {
        while (true) {
            await this._extractFromQueue();
            await new Promise(resolve => {
                setImmediate(resolve);
            });
        }
    }

    async _extractFromQueue() {
        let blockData;

        while ((blockData = this._blockQueue.shift())) {
            const timer = new Date();

            await this._controller.disperse(blockData);
            stats.timing('block_disperse', new Date() - timer);
        }
    }
}

module.exports = Prism;
