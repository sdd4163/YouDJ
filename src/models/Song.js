var mongoose = require('mongoose');
var _ = require('underscore');

var SongModel;
var setString = function(inputString) {
	return _.escape(inputString).trim();
};

var SongSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
	
	artist: {
		type: String,
        required: true,
        trim: true
	},
	
	album: {
		type: String,
        trim: true,
		default: "None"
	},
    
    owner: {
        type: mongoose.Schema.ObjectId,
        required: true,
		ref: 'Account'
    },
    
    createdData: {
        type: Date,
        default: Date.now
    }

});

SongSchema.methods.toAPI = function() {
    return {
        title: this.title,
        artist: this.artist,
		album: this.album
    };
};

SongSchema.statics.findByOwner = function(ownerId, callback) {
    var search = {
        owner: mongoose.Types.ObjectId(ownerId)
    };

    return SongModel.find(search).select("title artist album").exec(callback);
};

SongSchema.statics.findAll = function(callback) {
	return SongModel.find().select("title artist album").exec(callback);
};

SongModel = mongoose.model('Song', SongSchema);

module.exports.SongModel = SongModel;
module.exports.SongSchema = SongSchema;