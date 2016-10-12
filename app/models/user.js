var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      var salt = bcrypt.genSaltSync(2);
      var hash = bcrypt.hashSync(model.attributes.password, salt); 
      model.set('password', hash);
    });
  }

});

module.exports = User;