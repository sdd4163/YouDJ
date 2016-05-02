var _ = require('underscore');
var models = require('../models');
var Song = models.Song;

var adderPage = function(req, res) {
	res.render('adder', {csrfToken: req.csrfToken()});
};

var addSong = function(req, res) {
	var songData = {
		title: req.body.title,
		artist: req.body.artist,
		album: req.body.album,
		owner: req.session.account._id
	};
	
	var newSong = new Song.SongModel(songData);
	
	newSong.save(function(err) {
		if(err) {
			console.log(err);
			return res.status(400).json({error:'An error occurred'});
		}
		res.json({redirect: '/adder'});
	});
};

var songsPage = function(req, res) {
	Song.SongModel.findAll(function(err, docs) {
		if(err) {
			console.log(err);
			return res.status(400).json({error: 'An error occurred'});
		}
		res.render('allSongs', {csrfToken: req.csrfToken(), songs: docs});
	});
};

var appPage = function(req, res) {
	Song.SongModel.findByOwner(req.session.account._id, function(err, docs) {
		if(err) {
			console.log(err);
			return res.status(400).json({error: 'An error occurred'});
		}
		res.render('app', {csrfToken: req.csrfToken(), songs: docs});
	});
};

module.exports.adderPage = adderPage;
module.exports.add = addSong;
module.exports.songsPage = songsPage;
module.exports.appPage = appPage;