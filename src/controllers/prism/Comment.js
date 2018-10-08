const AbstractComment = require('./AbstractComment');
const Model = require('../../models/Comment');

class Comment extends AbstractComment {
    async handle(data) {
        await super.handle(data, Model);
    }

    _isInvalid(data) {
        return !data.parent_author;
    }

    _applyBasicData(model, data) {
        super._applyBasicData(model, data);

        model.parentAuthor = data.parent_author;
    }
}

module.exports = Comment;
