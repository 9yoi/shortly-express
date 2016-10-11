var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
app.use(session({secret: 'boo'}));

var checkUser = function(req, res, next) {
  if (req.session.active === undefined) {
    res.redirect('/login');
  } else {
    next();
  }
};

app.get('/', checkUser, function(req, res) {
  res.render('index');
});

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/create', checkUser, function(req, res) {
  res.render('index');
});

app.get('/links', checkUser, function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.status(200).send(links.models);
  });
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/links', function(req, res) {
  var uri = req.body.url; //the url that user types in

  if (!util.isValidUrl(uri)) {
    return res.sendStatus(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        Links.create({
          url: uri,
          title: title,
          baseUrl: req.headers.origin
        })
        .then(function(newLink) {
          res.status(200).send(newLink);
        });
      });
    }
  });
});

app.post('/signup', function(req, res) {
  new User({ username: req.body.username, password: req.body.password}).fetch().then(function(found) {
    if (found) {
      res.redirect('/login');
    } else {
      Users.create({
        username: req.body.username,
        password: req.body.password
      })
      .then(function(newUser) {
        res.status(200);
        req.session.active = true;
        res.redirect('/');
        //res.send(newUser); // this sends the object created to user
      });
    }
  });
});

// come back and encrypt later
app.post('/login', function(req, res) {
  new User({ username: req.body.username, password: req.body.password}).fetch().then(function(found) {
    if (found) {
      req.session.active = true;
      res.redirect('/');
    } else {
      res.status(301);
      res.redirect('/login');
    }
  });
});
/************************************************************/
// Write your authentication routes here
/************************************************************/


/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        linkId: link.get('id')
      });

      click.save().then(function() {
        link.set('visits', link.get('visits') + 1);
        link.save().then(function() {
          return res.redirect(link.get('url'));
        });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
