var async = require('async');
var cors = require('cors');
var express = require('express');
var request = require('superagent');

// How many minutes should we cache the results for a given request
var CACHE_TIME = process.env.CACHE_TIME || 4;
var PORT = process.env.PORT || 5000;

var app = express();

app.use(express.logger());

var whitelist = [
  'http://tfrce-social-buttons.herokuapp.com',
  'http://dev.stopwatching.us',
  'http://rally.stopwatching.us',
  'http://2.stopwatching.us',
  'http://localhost:4000',
  'https://dev.stopwatching.us',
  'https://rally.stopwatching.us',
  'https://2.stopwatching.us',
  'https://localhost:4000',
  'https://thedaywefightback.org',
  'http://thedaywefightback.org'
];

var corsOptions = {
  origin: function (origin, cb) {
    cb(null, whitelist.indexOf(origin) !== -1);
  }
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.use(function (req, res, next) {
  // Setup caching headers (works well with cloudfront)
  res.setHeader('Expires', new Date(Date.now() + CACHE_TIME * 60 * 1000)
    .toUTCString());

  next();
});

var networkCallbacks = {
  twitter: function (url, callback) {
    // Twitter is nice and easy
    var apiUrl = 'http://urls.api.twitter.com/1/urls/count.json?url=' + url;
    request.get(apiUrl)
      .set('Accept', 'application/json')
      .end(function (data) {
        callback(null, data.body.count);
      });
  },
  facebook: function (url, callback) {
    // This query string gets the total number of likes, shares and comments to
    // create the final count
    var apiUrl = 'https://graph.facebook.com/fql?q=SELECT%20url,' +
      '%20normalized_url,%20share_count,%20like_count,%20comment_count,' +
      '%20total_count,commentsbox_count,%20comments_fbid,' +
      '%20click_count%20FROM%20link_stat%20WHERE%20url="' + url + '"';

    request.get(apiUrl)
      .set('Accept', 'application/json')
      .end(function (data) {
        var count = 0;

        if (data.body.data.length > 0) {
          count = data.body.data[0].total_count;
        }

        callback(null, count);
      });
  },
  googleplus: function (url, callback) {
    // This is a hacky method found on the internet because google doesn't have
    // an API for google plus counts
    var apiUrl = 'https://plusone.google.com/_/+1/fastbutton?url=' + url;

    request.get(apiUrl)
      .end(function (data) {
        var reg = /__SSR \= \{c\: (.*?)\.0/g;
        var result = reg.exec(data.text);
        var count = 0;

        if (result) {
          count = result[1] * 1;
        }

        callback(null, count);
      });
  }
};

app.get('/', function (req, res) {
  var networks, url;

  // Check to see if any networks were specified in the query
  if (typeof req.query.networks === 'undefined') {
    return res.send({
      error: 'You have to specify which networks you want stats for ' +
        '(networks=facebook,twitter,googleplus)'
    });
  }

  networks = req.query.networks;

  // Check to see if a url was specified in the query else attempt to use the
  // referer url
  if (typeof req.query.url !== 'undefined') {
    url = req.query.url;
  } else {
    url = req.header('Referer');

    if (typeof url === 'undefined') {
      return res.send({
        error: 'You asked for the referring urls stats but there is no ' +
          'referring url, specify one manually (&url=http://1984day.com)'
      });
    }
  }

  // Create an object of callbacks for each of the requested networks It is
  // then passed to the async library to executed in parallel All results will
  // be sent to the browser on completion.
  var networksToRequest = {};

  networks.split(',').forEach(function (network) {
    if (typeof networkCallbacks[network] !== 'undefined') {
      networksToRequest[network] = function (callback) {
        networkCallbacks[network](url, callback);
      };
    }
  });

  async.parallel(networksToRequest, function (err, results) {
    res.jsonp(results);
  });
});

app.listen(PORT, function () {
  console.log('Listening on ' + PORT);
});
