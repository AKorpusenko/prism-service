const core = require('gls-core-service');
const Logger = core.utils.Logger;
const Abstract = require('./Abstract');
const Comment = require('../../models/Comment');
const Post = require('../../models/Post');
const ContentPendingPayout = require('../../utils/ContentPendingPayout');

const POST_BODY_CUT_LENGTH = 600;

class Content extends Abstract {
    async handleMakeOrModify(data, { blockTime }) {
        const [Model, isPost] = this._selectModelClassAndType(data);
        const idObject = { author: data.author, permlink: data.permlink };
        const model = await this._getOrCreateModelWithTrace(Model, idObject, idObject);

        this._applyBasicData(model, data, isPost);
        this._applyMetaData(model, data);

        if (!model.payout.isDone) {
            await this._applyPendingPayout(model, isPost);
        }

        model.createdInBlockchain = blockTime;

        await model.save();

        if (!isPost) {
            await this._incrementPostComments(model.parentPermlink);
        }
    }

    async handleDelete(data) {
        const [Model, isPost] = this._selectModelClassAndType(data);
        const idObject = { author: data.author, permlink: data.permlink };
        const model = await this._getOrCreateModelWithTrace(Model, idObject, idObject);

        if (!model) {
            Logger.log(`Model not found, skip - ${data.permlink}`);
            return;
        }

        if (!isPost) {
            await this._decrementPostComments(model.parentPermlink);
        }

        await model.remove();
    }

    async handleOptions(data) {
        const query = { author: data.author, permlink: data.permlink };
        const [post, comment] = await Promise.all([Post.findOne(query), Comment.findOne(query)]);
        let modelClass;
        let model;

        if (post) {
            modelClass = Post;
            model = post;
        } else if (comment) {
            modelClass = Comment;
            model = comment;
        } else {
            return;
        }

        await this._updateRevertTrace({
            command: 'swap',
            modelBody: model.toObject(),
            modelClassName: modelClass.modelName,
        });

        model.maxAcceptedPayout = data.max_accepted_payout;
        model.gbgPercent = data.percent_steem_dollars;
        model.allowCurationRewards = data.allow_curation_rewards;

        this._handleOptionsExtensions(data, model);

        await model.save();
    }

    async handlePromoteTransfer({ from, to, amount, memo }) {
        let author;
        let permlink;

        if (to !== 'null') {
            return;
        }

        try {
            [author, permlink] = memo.slice(1).split('/');

            if (!author || !permlink) {
                return;
            }

            const currency = amount.split(' ')[1];

            if (currency !== 'GBG') {
                return;
            }
        } catch (e) {
            // Not a promote, do nothing
            return;
        }

        const model = await Post.findOne({ author, permlink });

        if (!model) {
            return;
        }

        model.promote.balance = model.promote.balance.plus(amount);

        await model.save();
    }

    _handleOptionsExtensions(data, model) {
        data.extensions = data.extensions || [];

        for (let extensionPair of data.extensions) {
            const extensions = extensionPair[1] || {};

            for (let type of Object.keys(extensions)) {
                this._applyOptionsExtensionByType(type, extensions[type], model);
            }
        }
    }

    _applyOptionsExtensionByType(type, extension, model) {
        switch (type) {
            case 'beneficiaries':
                this._applyBeneficiaries(model, extension);
                break;
        }
    }

    _applyBeneficiaries(model, beneficiaries) {
        for (let beneficiary of beneficiaries) {
            if (
                typeof beneficiary.account === 'string' &&
                beneficiary.account.length > 0 &&
                typeof beneficiary.weight === 'number' &&
                beneficiary.weight >= 0 &&
                beneficiary.weight <= 10000
            ) {
                // Dev alert - do not change to `model.beneficiaries = beneficiary`, not secure
                model.beneficiaries = { account: beneficiary.account, weight: beneficiary.weight };
            }
        }
    }

    _applyBasicData(model, data, isPost) {
        model.parentPermlink = data.parent_permlink;
        model.author = data.author;
        model.permlink = data.permlink;
        model.metadata.rawJson = data.json_metadata;

        if (isPost) {
            model.title = data.title;
            model.body = {
                full: data.body,
                cut: data.body.slice(0, POST_BODY_CUT_LENGTH),
            };
        } else {
            model.parentAuthor = data.parent_author;
            model.body = data.body;
        }
    }

    _applyMetaData(model, data) {
        let metadata;

        try {
            metadata = JSON.parse(data.json_metadata);

            if (!metadata || Array.isArray(metadata)) {
                metadata = {};
            }
        } catch (error) {
            metadata = {};
        }

        model.metadata.app = metadata.app;
        model.metadata.format = metadata.format || metadata.editor;
        model.metadata.tags = Array.from(metadata.tags || []);
        model.metadata.images = Array.from(metadata.image || []);
        model.metadata.links = Array.from(metadata.links || []);
        model.metadata.users = Array.from(metadata.users || []);

        if (model.metadata.images && model.metadata.images[0] === '') {
            model.metadata.images = [];
        }
    }

    async _applyPendingPayout(model, isPost) {
        const chainProps = await this._chainPropsService.getCurrentValues(); // TODO REMOVED!
        const feedPrice = await this._feedPriceService.getCurrentValues(); // TODO REMOVED!
        const calculator = new ContentPendingPayout(model, isPost, {
            chainProps, // TODO REMOVED!
            gbgRate: feedPrice.gbgRate, // TODO REMOVED!
        });

        calculator.calc();
    }

    _selectModelClassAndType(data) {
        let isPost = true;
        let Model;

        if (data.parent_author) {
            isPost = false;
            Model = Comment;
        } else {
            Model = Post;
        }

        return [Model, isPost];
    }

    async _incrementPostComments(permlink) {
        await this._changePostCommentsCount(permlink, 1);
    }

    async _decrementPostComments(permlink) {
        await this._changePostCommentsCount(permlink, -1);
    }

    async _changePostCommentsCount(permlink, increment) {
        const post = await Post.findOne({ permlink });

        if (post) {
            await this._updateRevertTrace({
                command: 'swap',
                modelBody: post.toObject(),
                modelClassName: Post.modelName,
            });

            await Post.updateOne({ _id: post._id }, { $inc: { 'comments.count': increment } });
        }
    }
}

module.exports = Content;
