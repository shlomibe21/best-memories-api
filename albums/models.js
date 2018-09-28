'use strict';

const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const albumSchema = mongoose.Schema({
    albumName: { type: String, required: true },
    dateCreated: { type: Date, required: true },
    text: { type: String },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    files: [{
        fileName: { type: String, required: true },
        dateAdded: { type: Date, required: true },
        text: { type: String},
        storageLocation: { type: String, required: true },
        positionTop: { type: String },
        positionLeft: { type: String },
        width: { type: String },
        height: { type: String },
    }],
});

albumSchema.methods.serialize = function () {
    return {
        id: this._id,
        albumName: this.albumName,
        dateCreated: this.dateCreated,
        text: this.text,
        files: this.files
    };
};

const Albums = mongoose.model('albums', albumSchema);

module.exports = { Albums };
