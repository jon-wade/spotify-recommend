var unirest = require('unirest');
var express = require('express');
var events = require('events');

var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
        .qs(args)
        .end(function(response) {
            if (response.ok) {
                emitter.emit('end', response.body);
            }
            else {
                emitter.emit('error', response.code);
            }
        });
    return emitter;
};

var app = express();
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    searchReq.on('end', function(item) {
        //console.log(item.artists);
        var artist = item.artists.items[0];

        var endpoint = 'artists/' + artist.id + '/related-artists';
        //console.log(endpoint);

        var relatedReq = getFromApi(endpoint, null);

        relatedReq.on('end', function(item) {
            console.log(item);
            artist.related = item.artists;
            res.json(artist);
        });

        relatedReq.on('error', function(code){
            res.sendStatus(code);
        });

    });

    searchReq.on('error', function(code) {
        res.sendStatus(code);
    });
});

app.listen(8080);

//https://api.spotify.com/v1/artists/{id}/related-artists