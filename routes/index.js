var express = require("express");
var router = express.Router();

const firebase = require("firebase");

// Required for side-effects
require("firebase/firestore");

var firebaseConfig = {
  apiKey: "AIzaSyAWvltia_UHrxp0r4MonhTZCi0wVQXvca4",
  authDomain: "sample-app-c2d07.firebaseapp.com",
  projectId: "sample-app-c2d07",
  storageBucket: "sample-app-c2d07.appspot.com",
  messagingSenderId: "671328237834",
  appId: "1:671328237834:web:025988251a7f48444822f3",
  measurementId: "G-HTXHTS47VP",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

var db = firebase.firestore();
let data = [];
db.collection("users")
  .get()
  .then((querySnapshot) => {
    querySnapshot.forEach((doc) => {
      console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
      data.push(doc.data());
    });
  });

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", {
    title: "BlueDu",
    data: data,
    auth: false,
    pageName: "index",
  });
});

module.exports = router;
