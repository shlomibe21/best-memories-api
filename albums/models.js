'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const albumSchema = mongoose.Schema({
    albumName: { type: String, required: true },
    dateCreated: { type: Date, required: true },
    comment: { type: String },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    files: [{
        fileName: { type: String, required: true },
        dateAdded: { type: Date },
        comment: { type: String},
        storageLocation: { type: String },
        positionTop: { type: String },
        positionLeft: { type: String },
        width: { type: String },
        height: { type: String },
        fileType: { type: String }
    }],
});

albumSchema.methods.serialize = function () {
    return {
        id: this._id,
        albumName: this.albumName,
        dateCreated: this.dateCreated,
        comment: this.comment,
        files: this.files
    };
};

const Albums = mongoose.model('albums', albumSchema);

module.exports = { Albums };
