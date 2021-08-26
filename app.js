var createError = require("http-errors");
var express = require("express");
var expressLayouts = require("express-ejs-layouts");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var livereload = require("livereload");
var connectLiveReload = require("connect-livereload");

// for connecting ejs
var indexRouter = require("./routes/index");
var dashboardRouter = require("./routes/dashboard");
var aboutRouter = require("./routes/about");
var archivedRouter = require("./routes/archived");
var usersettingsRouter = require("./routes/usersettings");

const liveReloadServer = livereload.createServer();
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

const app = express();

app.use(connectLiveReload());

// view engine setup
app.use(expressLayouts);
app.set("layout", "../layouts/common");
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// for using ejs
app.use("/", indexRouter); //index
app.use("/dashboard", dashboardRouter);
app.use("/about", aboutRouter);
app.use("/archived", archivedRouter);
app.use("/usersettings", usersettingsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
