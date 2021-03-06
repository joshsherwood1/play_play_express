var express = require('express');
var router = express.Router();

const Playlists = require('../../../models/playlists.js');
const playlists = new Playlists();

const Favorites = require('../../../models/favorites.js');
const favorites = new Favorites();

const PlaylistsFavorites = require('../../../models/playlists_favorites.js')
const playlistsFavorites = new PlaylistsFavorites();

const PlaylistsPresenter = require('../../../presenters/playlists_presenter.js')
const playlistsPresenter = new PlaylistsPresenter();

const environment = process.env.NODE_ENV || 'development';
const configuration = require('../../../knexfile')[environment];
const database = require('knex')(configuration);

router.get('/', async function (request, response) {
  try {
    let allPlaylists = await playlists.allPlaylists()
    let data = await playlistsPresenter.createResponse(allPlaylists)
    return response.status(200).json(data);
  }
  catch(error) {
    return response.status(500).json({"error": "Request could not be handled"});
  }
});

router.get('/:id/favorites', async function (request, response) {
  try {
    let playlist = await playlists.findPlaylist(request.params.id)
    if (playlist[0]){
      let playlistObject = await playlistsPresenter.createPlaylistObject(playlist[0])
      return response.status(201).json(playlistObject);
    } else {
      return response.status(400).json({"error": "Record could not be found"});
    }
  }
  catch(error) {
    return response.status(500).json({"error": "Request could not be handled"});
  }
});

router.post('/', async function (request, response) {
  try {
    if (!('title' in request.body)) {
      return response.status(400).json({"error": "You must include a title parameter in the request"});
    }
    if (request.body.title === '') {
      return response.status(400).json({"error": "Title cannot be blank"});
    }
    try {
      let data = await playlists.createPlaylist(request.body.title)
      return response.status(201).json(data)
    }
    catch(error) {
      return response.status(400).json({"error": "Please enter a unique title"});
    }
  }
  catch(error) {
    return response.status(500).json({"error": "Request could not be handled"});
  }
});

router.post('/:playlist_id/favorites/:favorite_id', async function (request, response) {
  try {
    let favoriteId = await request.params.favorite_id
    let playlistId = await request.params.playlist_id
    let previouslyfavorited = await playlistsFavorites.allPlaylistsFavorites(favoriteId, playlistId)
    if(previouslyfavorited.length != []) {
      return response.status(400).json({"error": "The song has already been added to the playlist"});
    }
    let newFavorited = await playlistsPresenter.getPlaylistFavoriteTitle(favoriteId, playlistId)
    if (newFavorited){
      await playlists.addFavoriteToPlaylist(favoriteId, playlistId)
      return response.status(201).json({"Success": `${newFavorited.favorite} has been added to ${newFavorited.playlist}!`})
    } else {
      return response.status(400).json({"error": "Please enter a valid playlist and/or favorite id"});
    }
  }
  catch(error) {
    return response.status(500).json({"error": "Request could not be handled"});
  }
});

router.put('/:id', async function (request, response) {
  let playlistId = await request.params.id
  let title = await request.body.title
  let playlist = await playlists.findPlaylist(playlistId)
  try {
    if (playlist.length == 0) {
      return response.status(400).json({"error": "Please enter a valid id"});
    }
    if (!('title' in request.body)) {
      return response.status(400).json({"error": "You must include a title parameter in the request"});
    }
    if (request.body.title === '') {
      return response.status(400).json({"error": "Title cannot be blank"});
    }
    let data = await playlists.updatePlaylist(playlistId, title)
    return response.status(200).json(data)
  }
  catch(error) {
    return response.status(500).json({"error": "Request could not be handled"});
  }
});

router.delete('/:id', async function (request, response) {
  try {
    let playlistId = await request.params.id
    let data = await playlists.findPlaylist(playlistId)
    if (data[0]){
      await playlists.deletePlaylist(data[0].id)
      return response.status(204).json(data);
    } else {
      return response.status(404).json({"error": "Record not found"});
    }
  }
  catch(error) {
    return response.status(500).json({"error": "Request could not be handled"});
  }
});

router.delete('/:playlist_id/favorites/:favorite_id', async function (request, response) {
  try {
    let playlistId = await request.params.playlist_id
    let favoriteId = await request.params.favorite_id
    let data = await playlists.removeFavoriteFromPlaylist(playlistId, favoriteId);
    if (data){
      return response.status(204).json(data);
    } else{
      return response.status(404).json({"error": "Record not found"})
    }
  }
  catch(error) {
    return response.status(500).json({"error": "Request could not be handled"});
  }
});

module.exports = router;
