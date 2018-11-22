const core = require('gls-core-service');
const Logger = core.utils.Logger;
const Abstract = require('./Abstract');
const Comment = require('../../models/Comment');
const Post = require('../../models/Post');

const POST_BODY_CUT_LENGTH = 600;

class Content extends Abstract {
    async handleMakeOrModify(data) {
        const [Model, isPost] = this._selectModelClassAndType(data);
        const model = await this._getOrCreateModelWithTrace(Model, { permlink: data.permlink });

        this._applyBasicData(model, data, isPost);
        this._applyMetaData(model, data);

        await model.save();

        if (!isPost) {
            await this._incrementPostComments(model.parentPermlink);
        }
    }

    async handleDelete(data) {
        const [Model, isPost] = this._selectModelClassAndType(data);
        const model = await this._getOrCreateModelWithTrace(Model, { permlink: data.permlink });

        if (!model) {
            Logger.log(`Model not found, skip - ${data.permlink}`);
            return;
        }

        if (!isPost) {
            await this._decrementPostComments(model.parentPermlink);
        }

        await model.remove();
    }

    _applyBasicData(model, data, isPost) {
        model.parentPermlink = data.parent_permlink;
        model.author = data.author;
        model.permlink = data.permlink;
        model.metadata.rawJson = data.json_metadata;
        model.body = {
            full: data.body,
            cut: data.body.slice(0, POST_BODY_CUT_LENGTH),
        };

        if (isPost) {
            model.title = data.title;
        } else {
            model.parentAuthor = data.parent_author;
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
            // do nothing, invalid metadata or another client
            return;
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
