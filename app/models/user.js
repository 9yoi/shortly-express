var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',

  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      var hash = bcrypt.hashSync(model.attributes.password); 
      model.set('password', hash);
    });
  }

});

module.exports = User;