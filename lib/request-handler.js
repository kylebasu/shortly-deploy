var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');
var Users = require('../app/collections/users');
var Links = require('../app/collections/links');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function(){
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.find({}, function(links) {
    res.send(200, links);
  })
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  Link.find({ url: uri }, function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          return res.send(404);
        }

        var link = Link.create({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.then(function(newLink) {
          res.send(200, newLink);
        });
      });
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;
  User.find({}, function(err, users) {
  })

  User.findOne({'username': username}, function(err, user){
    if (err) {throw err;}
    if(!user){
      res.redirect('/login');
    }else{
      user.comparePassword(password, function(match) {
        if(match) {
          util.createSession(req, res, user)
        } else {
          res.redirect('/login')
        }
      })
    }
  });

};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({'username': username}, function(err, user) {
    if (err) {throw err;}
    if (!user) {
      var newUser = new User({username: username, password: password})
      newUser.save(function(err) {
        if (err) {console.log("errrr creating", err)}
        util.createSession(req, res, newUser);
      });
    } else {
      res.redirect('/signup');
    }
  });

};

exports.navToLink = function(req, res) {
  Link.findOne({ code: req.params[0] }, function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      link.set({ visits: link.get('visits') + 1 })
        .save()
        .then(function() {
          return res.redirect(link.get('url'));
        });
    }
  });
};