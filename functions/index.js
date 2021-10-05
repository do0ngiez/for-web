const functions = require("firebase-functions");
const firebase = require("firebase-admin");
const express = require("express");
const session = require("express-session");
const { FirestoreStore } = require("@google-cloud/connect-firestore"); //connection to cloud firestore
const engines = require("consolidate");
const crypto = require("crypto");

const algorithm = "aes-256-cbc"; //cypherblock thing
const key = "nDCZhi1XfcGsfNkqnSwSKVekovz3IUDE"; //random 32
const iv = "9ONZu9SfCNbW5ffk"; //initialization vector -- still for encryption

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

// ADMIN
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

// USERS AREA
async function getUsers(statusFilter, fromDateFilter, toDateFilter) {
  let data = [];
  const ref = firebaseApp.firestore().collection("users");
  let query = ref;
  if (statusFilter) {
    query = ref.where("status", "==", statusFilter);
  }
  if (fromDateFilter && toDateFilter) {
    const toDate = new Date(toDateFilter);
    toDate.setDate(toDate.getDate() + 1);
    toDate.setMilliseconds(toDate.getMilliseconds() - 1);
    query = ref
      .where("timeOfContact", ">=", new Date(fromDateFilter))
      .where("timeOfContact", "<=", toDate);
  }
  await query.get().then((snap) =>
    snap.forEach((doc) => {
      const entry = doc.data();
      entry.id = doc.id;
      data.push(entry);
    })
  );
  return data;
}

async function getUserById(id) {
  let data = null;
  const ref = firebaseApp.firestore().collection("users");
  await ref
    .doc(id)
    .get()
    .then((doc) => {
      data = doc.data();
      data.id = id;
    });
  return data;
}

async function getUserByUsername(username) {
  let data = null;
  const ref = firebaseApp.firestore().collection("users");
  const snapshot = await ref.where("username", "==", username).get();
  if (snapshot) {
    snapshot.forEach((doc) => {
      data = doc.data();
      data.id = doc.id;
    });
  }
  return data;
}

async function updateUser(id, data) {
  const ref = firebaseApp.firestore().collection("users");
  await ref.doc(id).update(data);
}

/////////////////////

const app = express();
app.engine("hbs", engines.ejs);
app.set("views", "./views");
app.set("view engine", "ejs");

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    //connection to cloud firestore!
    store: new FirestoreStore({
      dataset: firebaseApp.firestore(),
      kind: "express-sessions",
    }),
    name: "__session",
    secret: "HZRJv39tRqf9tLsgGRjg", //random, encryption for sessions
    resave: false,
    saveUninitialized: true,
  })
);

function checkIsUser(req, res, next) {
  if (req.session.user && !req.session.isAdmin) {
    next(); //If session exists, proceed to page
  } else {
    const err = new Error("Not logged in!");
    next(err); //Error, trying to access unauthorized page!
  }
}

function checkIsAdmin(req, res, next) {
  if (req.session.isAdmin) {
    next(); //If session exists, proceed to page
  } else {
    const err = new Error("Not logged in!");
    next(err); //Error, trying to access unauthorized page!
  }
}

// PAGES AREA
app.get("/", (request, response) => { //gets the index after logging in
  if (request.session.user)
  {
    response.render("index", {
      title: "BlueDu",
      pageName: "",
      currentUser: request.session.user,
      isAdmin: request.session.isAdmin,
      message: request.query.message,
    });
  }
  else
  {
    response.render("login", {
      title: "Login",
      pageName: "login",
      currentUser: request.session.user,
      isAdmin: request.session.isAdmin,
      message: request.query.message,
    });
  }
});

// app.get("/login", (request, response) => {
//   response.render("login", {
//     title: "Login",
//     pageName: "login",
//     currentUser: request.session.user,
//     isAdmin: request.session.isAdmin,
//     message: request.query.message,
//   });
// });

app.get("/profile", checkIsUser, (request, response) => {
  response.render("profile", {
    title: "Profile",
    pageName: "profile",
    currentUser: request.session.user,
    isAdmin: request.session.isAdmin,
    message: request.query.message,
  });
});

app.get("/archived", checkIsAdmin, (request, response) => {
  response.render("archived", {
    title: "Archived Data",
    pageName: "archived",
    currentUser: request.session.user,
    isAdmin: request.session.isAdmin,
  });
});

app.get("/dashboard", checkIsAdmin, async (request, response) => {
  const users = await getUsers(
    request.query.statusFilter,
    request.query.fromDateFilter,
    request.query.toDateFilter
  );
  // console.log(users); ---user checker
  let selectedUser = null;
  if (request.query.id) {
    selectedUser = await getUserById(request.query.id);
  }
  response.render("dashboard", {
    title: "Dashboard",
    pageName: "dashboard",
    currentUser: request.session.user,
    isAdmin: request.session.isAdmin,
    users,
    selectedUser,
    message: request.query.message,
  });
});

app.get("/usersettings", checkIsAdmin, async (request, response) => {
  const admins = await getAdmins();
  let selectedAdmin = null;
  if (request.query.id) {
    selectedAdmin = await getAdminById(request.query.id);
  }
  response.render("usersettings", {
    title: "Settings",
    pageName: "usersettings",
    currentUser: request.session.user,
    isAdmin: request.session.isAdmin,
    admins,
    selectedAdmin,
    message: request.query.message,
  });
});

///ADMINS
app.post(
  "/updateAdminDetails",
  checkIsAdmin,
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
  checkIsAdmin,
  async function (request, response) {
    if (request.body.newUsername !== request.body.confirmUsername) {
      response.redirect(`/usersettings?message=Usernames does not match!`);
    } else {
      await updateAdmin(request.body.id, {
        username: request.body.newUsername,
      });

      response.redirect(`/usersettings?message=Username successfully updated.`);
    }
  }
);

app.post(
  "/updateAdminPassword",
  checkIsAdmin,
  async function (request, response) {
    if (request.body.newPassword !== request.body.confirmPassword) {
      response.redirect(`/usersettings?message=Passwords does not match!`);
    } else {
      //encryption for pass update
      const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
      let encrypted = cipher.update(request.body.newPassword);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      await updateAdmin(request.body.id, {
        passwordHash: encrypted.toString("hex").toUpperCase(),
      });

      response.redirect(`/usersettings?message=Password successfully updated.`);
    }
  }
);

///USERS
app.post("/profile", checkIsUser, async function (request, response) {
  await updateUser(request.session.user.id, {
    firstName: request.body.firstName,
    lastName: request.body.lastName,
  });

  request.session.user.firstName = request.body.firstName;
  request.session.user.lastName = request.body.lastName;

  response.redirect(`/profile?message=Profile successfully updated.`);
});

app.post(
  "/updateUserDetails",
  checkIsAdmin,
  async function (request, response) {
    await updateUser(request.body.id, {
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      durationOfContact: request.body.durationOfContact,
      status: request.body.status,
    });

    response.redirect(`/dashboard?message=Details successfully updated.`);
  }
);

app.get("/login-admin", (request, response) => { //gets to show the login-admin page
  response.render("login-admin", {
    title: "Admin Login",
    pageName: "login-admin",
    currentUser: request.session.user,
    isAdmin: request.session.isAdmin,
    message: request.query.message,
  });
});

app.get("/logout", function (request, response) {
  request.session.destroy(() => response.redirect("/"));
});

// api
app.post("/api/login", async function (request, response) {
  if (!request.body.username || !request.body.password) {
    response.json({
      success: false,
      message: "Please enter both username and password.",
    });
  } else {
    const user = await getUserByUsername(request.body.username);
    //password encryption
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(request.body.password);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    if (
      user &&
      user.passwordHash.toUpperCase() ===
        encrypted.toString("hex").toUpperCase()
      //hexadecimal
    ) {
      request.session.user = user;
      request.session.isAdmin = false;
      response.json({
        success: true,
      });
    } else {
      response.json({
        success: false,
        message: "Invalid credentials! Please contact someone.",
      });
    }
  }
});

app.post("/api/login-admin", async function (request, response) {
  if (!request.body.username || !request.body.password) {
    response.json({
      success: false,
      message: "Please enter both username and password.",
    });
  } else {
    const user = await getAdminByUsername(request.body.username);
    //password encryption
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(request.body.password);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    if (
      user &&
      user.passwordHash.toUpperCase() ===
        encrypted.toString("hex").toUpperCase()
      //hexadecimal
    ) {
      request.session.user = user;
      request.session.isAdmin = true;
      response.json({
        success: true,
      });
    } else {
      response.json({
        success: false,
        message: "Invalid credentials! Please contact someone.",
      });
    }
  }
});

exports.app = functions.https.onRequest(app);
