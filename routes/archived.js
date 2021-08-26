var express = require("express");
var router = express.Router();

router.get("/", function (req, res, next) {
  res.render("archived", {
    title: "Archived Data",
    auth: true,
    pageName: "archived",
  });
});

module.exports = router;
