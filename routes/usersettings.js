var express = require("express");
var router = express.Router();

router.get("/", function (req, res, next) {
  res.render("usersettings", {
    title: "User Settings",
    auth: true,
    pageName: "usersettings",
  });
});

module.exports = router;
