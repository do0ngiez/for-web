const functions = require("firebase-functions");
const firebase = require("firebase-admin");
const express = require("express");
const session = require("express-session");
const engines = require("consolidate");
const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const key = "nDCZhi1XfcGsfNkqnSwSKVekovz3IUDE";
const iv = "9ONZu9SfCNbW5ffk";

// firebase
const firebaseConfig = {
  apiKey: "AIzaSyBHRsLegCBZkZGklkdnNWIwiWddADKn_J0",
  authDomain: "bluetooth-tracer.firebaseapp.com",
  projectId: "bluetooth-tracer",
  storageBucket: "bluetooth-tracer.appspot.com",
  messagingSenderId: "1015957112993",
  appId: "1:1015957112993:web:0ecae19bf52b45f7f908e0",
  measurementId: "G-61C7YZ8EVT",
};

const firebaseApp = firebase.initializeApp(firebaseConfig);

async function getUsers() {
  let data = [];
  const ref = firebaseApp.firestore().collection("users");
  await ref.get().then((snap) => snap.forEach((doc) => data.push(doc.data())));
  return data;
}

async function getAdmins() {
  let data = [];
  const ref = firebaseApp.firestore().collection("admins");
  await ref.get().then((snap) =>
    snap.forEach((doc) => {
      const entry = doc.data();
      entry.id = doc.id;
      data.push(entry);
    })
  );
  return data;
}

async function getAdminById(id) {
  let data = null;
  const ref = firebaseApp.firestore().collection("admins");
  await ref
    .doc(id)
    .get()
    .then((doc) => {
      data = doc.data();
      data.id = id;
    });
  return data;
}

async function getAdminByUsername(username) {
  let data = null;
  const ref = firebaseApp.firestore().collection("admins");
  const snapshot = await ref.where("username", "==", username).get();
  if (snapshot) {
    snapshot.forEach((doc) => (data = doc.data()));
  }
  return data;
}

async function updateAdmin(id, data) {
  const ref = firebaseApp.firestore().collection("admins");
  await ref.doc(id).update(data);
}

const app = express();
app.engine("hbs", engines.ejs);
app.set("views", "./views");
app.set("view engine", "ejs");

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "HZRJv39tRqf9tLsgGRjg",
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      // secure: true,
    },
  })
);

function checkSignIn(req, res, next) {
  if (req.session.user) {
    next(); //If session exists, proceed to page
  } else {
    const err = new Error("Not logged in!");
    next(err); //Error, trying to access unauthorized page!
  }
}

// pages
app.get("/", (request, response) => {
  response.render("index", {
    title: "BlueDu",
    pageName: "",
    currentUser: request.session.user,
    message: request.query.message,
  });
});

app.get("/about", (request, response) => {
  response.render("about", {
    title: "About",
    pageName: "about",
    currentUser: request.session.user,
  });
});

app.get("/archived", checkSignIn, (request, response) => {
  response.render("archived", {
    title: "Archived Data",
    pageName: "archived",
    currentUser: request.session.user,
  });
});

app.get("/dashboard", checkSignIn, (request, response) => {
  response.render("dashboard", {
    title: "Dashboard",
    pageName: "dashboard",
    currentUser: request.session.user,
  });
});

app.get("/usersettings", checkSignIn, async (request, response) => {
  const admins = await getAdmins();
  let selectedAdmin = null;
  if (request.query.id) {
    selectedAdmin = await getAdminById(request.query.id);
  }
  response.render("usersettings", {
    title: "Settings",
    pageName: "usersettings",
    currentUser: request.session.user,
    admins,
    selectedAdmin,
    message: request.query.message,
  });
});

app.post(
  "/updateAdminDetails",
  checkSignIn,
  async function (request, response) {
    await updateAdmin(request.body.id, {
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      contactNumber: request.body.contactNumber,
      email: request.body.email,
      address: request.body.address,
    });

    response.redirect(`/usersettings?message=Details successfully updated.`);
  }
);

app.post(
  "/updateAdminUsername",
  checkSignIn,
  async function (request, response) {
    if (request.body.newUsername !== request.body.confirmUsername) {
      response.redirect(`/usersettings?message=Usernames does not match!`);
    }
    await updateAdmin(request.body.id, {
      username: request.body.newUsername,
    });

    response.redirect(`/usersettings?message=Username successfully updated.`);
  }
);

app.post(
  "/updateAdminPassword",
  checkSignIn,
  async function (request, response) {
    if (request.body.newPassword !== request.body.confirmPassword) {
      response.redirect(`/usersettings?message=Passwords does not match!`);
    }
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(request.body.newPassword);
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    await updateAdmin(request.body.id, {
      passwordHash: encrypted.toString("hex").toUpperCase(),
    });

    response.redirect(`/usersettings?message=Password successfully updated.`);
  }
);

app.post("/login", async function (request, response) {
  if (!request.body.username || !request.body.password) {
    response.redirect(`/?message=Please enter both username and password.`);
  } else {
    const user = await getAdminByUsername(request.body.username);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(request.body.password);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    if (
      user &&
      user.passwordHash.toUpperCase() ===
        encrypted.toString("hex").toUpperCase()
    ) {
      request.session.user = user;
      response.redirect(`/?message=Hello ${user.firstName} ${user.lastName}.`);
    } else {
      response.redirect(`/?message=Invalid credentials!`);
    }
  }
});

app.get("/logout", function (request, response) {
  request.session.destroy();
  response.redirect("/");
});

// api
app.get("/api/users", checkSignIn, async (request, response) => {
  const users = await getUsers();
  response.json(users);
});

exports.app = functions.https.onRequest(app);
