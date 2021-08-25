var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
    res.render('usersettings', { title: 'User Settings'});
});

module.exports = router;
  