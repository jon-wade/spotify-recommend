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
            //console.log(item);
            artist.related = item.artists;
            var counter = 0;
            var numRelatedArtists = item.artists.length;

            console.log('numRelatedArtists = ', numRelatedArtists);

            artist.related.forEach(function(relatedArtist){
               //console.log(relatedArtist.name, " ", relatedArtist.id);
               endpoint = 'artists/' + relatedArtist.id + '/top-tracks?country=GB';

               var trackReq = getFromApi(endpoint, null);

               trackReq.on('end', function(item){
                   //do something here
                   //console.log('doing something:', counter);
                   //console.log('Item tracks = ', item.tracks);
                   relatedArtist.tracks = item.tracks;
                   //console.log('track response', item);
                   checkComplete();
                   counter++;
               });

                trackReq.on('error', function(code){
                    res.sendStatus(code);
                });


                var checkComplete = function(){
                    if(counter == numRelatedArtists-1) {
                        //console.log('Sending Artists to UI');
                        //console.log(artist);
                        res.json(artist);
                    }
                };
            });
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

