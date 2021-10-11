const functions = require("firebase-functions");
const firebase = require("firebase-admin");
const express = require("express");
const session = require("express-session");
const { FirestoreStore } = require("@google-cloud/connect-firestore"); //connection to cloud firestore
const engines = require("consolidate");
const crypto = require("crypto");
const dayjs = require('dayjs');

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

///Follow comments to navigate
///API
///PAGES

//ADMIN AREA
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

//USERS AREA
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

//adding to firebase (student side forms, ct n monitoring)
async function createContactTracingForm(data) {
  const ref = firebase.firestore().collection("contact-tracing-form");
  const { id } = await ref.add(data);
  return id;
}

async function createCtLivesWith(ctId, collection) {
  const ref = firebase.firestore().collection("ct-livesWith");
  collection.forEach(async data => {
    await ref.add({
      ...data,
      ctId
    })
  });
}

async function createCtBeenAround(ctId, collection) {
  const ref = firebase.firestore().collection("ct-beenAround");
  collection.forEach(async data => {
    await ref.add({
      ...data,
      ctId
    })
  });
}

async function createCtActivity(ctId, collection) {
  const ref = firebase.firestore().collection("ct-activity");
  collection.forEach(async data => {
    await ref.add({
      ...data,
      ctId
    })
  });
}

async function createMonitoringForm(data) {
  const ref = firebase.firestore().collection("monitoring-form");
  const { id } = await ref.add(data);
  return id;
}

async function createMSelfMonitoring(mId, collection) {
  const ref = firebase.firestore().collection("m-selfMonitoring");
  collection.forEach(async data => {
    await ref.add({
      ...data,
      mId
    })
  });
}

async function updateMonitoringForm(id, data) {
  const ref = firebaseApp.firestore().collection("monitoring-form");
  await ref.doc(id).update(data);
}

async function updateMSelfMonitoring(id, data) {
  const ref = firebaseApp.firestore().collection("m-selfMonitoring");
  await ref.doc(id).update(data);
}

async function getAllMonitoringForm() {
  let data = [];
  const ref = firebaseApp.firestore().collection("monitoring-form");
  await ref.get().then((snap) =>
    snap.forEach((doc) => {
      const entry = doc.data();
      entry.id = doc.id;
      data.push(entry);
    })
  );
  return data;
}

async function getAllMonitoringFormForUser(userId) {
  let data = [];
  const ref = firebaseApp.firestore().collection("monitoring-form");
  await ref.where("userId", "==", userId).get().then((snap) =>
    snap.forEach((doc) => {
      const entry = doc.data();
      entry.id = doc.id;
      data.push(entry);
    })
  );
  return data;
}

async function getAllMSelfMonitoringForMonitoringForm(mId) {
  let data = [];
  const ref = firebaseApp.firestore().collection("m-selfMonitoring");
  await ref.where("mId", "==", mId).get().then((snap) =>
    snap.forEach((doc) => {
      const entry = doc.data();
      entry.id = doc.id;
      data.push(entry);
    })
  );
  return data;
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
app.get("/", (request, response) => { //gets the index after logging in (ADMIN SIDE)
  if (request.session.isAdmin)
  {
    response.render("index", {
      title: "BlueDu",
      pageName: "",
      currentUser: request.session.user,
      isAdmin: request.session.isAdmin,
      message: request.query.message,
    });
  }
  else if (request.session.user) //NORMAL USER
  {
    response.render("formIndex", {
      title: "BlueDu Forms",
      pageName: "",
      currentUser: request.session.user,
      isAdmin: request.session.isAdmin,
      message: request.query.message,
    });
  }
  else
  {
    response.render("login", { //LOGIN
      title: "Login",
      pageName: "login",
      currentUser: request.session.user,
      isAdmin: request.session.isAdmin,
      message: request.query.message,
    });
  }
});

//CT FORM GET, POST
app.get("/contactTracingForm", checkIsUser, (request, response) => {
  response.render("contactTracingForm", {
    title: "Contact Tracing Form",
    pageName: "contactTracingForm",
    currentUser: request.session.user,
    isAdmin: request.session.isAdmin,
    message: request.query.message,
  });
});

app.post("/contactTracingForm", checkIsUser, async (request, response) => {
  const livesWith = request.body.livesWith.filter(p => p.firstName != "REMOVED");
  const beenAround = request.body.beenAround.filter(p => p.firstName != "REMOVED");
  const activity = request.body.activity.filter(p => p.activity != "REMOVED");

  const ctId = await createContactTracingForm({
    userFirstName: request.session.user.firstName,
    userLastName: request.session.user.lastName,
    userAddress: request.session.user.address,
    userPhoneNumber: request.session.user.phoneNumber,
    submissionDate: new Date()
  });

  await createCtLivesWith(ctId, livesWith);
  await createCtBeenAround(ctId, beenAround);
  await createCtActivity(ctId, activity);

  response.redirect(`/?message=Contact Tracing Form successfully submitted.`);
});

//MONITORING FORM GET, POST
app.get("/monitoringForm", checkIsUser, async (request, response) => {
  // const currentMonitoringForm = {
  //   dateStarted: '2021-10-11',
  //   dateSymptomsStarted: '2021-10-11',
  //   selfMonitoring: [{
  //     date: '10/11',
  //     dailyTemperature: 28,
  //     cold: true,
  //     diarrhea: true
  //   }]
  // };
  // const currentMonitoringForm = null;
  const allMonitoringForm = await getAllMonitoringFormForUser(request.session.user.id);
  let currentMonitoringForm = allMonitoringForm.length ? allMonitoringForm[allMonitoringForm.length - 1] : null;
  console.log(currentMonitoringForm);
  if (currentMonitoringForm)
  {
    const selfMonitoring = await getAllMSelfMonitoringForMonitoringForm(currentMonitoringForm.id);
    selfMonitoring.sort((a, b) => dayjs(a.date, "MM/DD") > dayjs(b.date, "MM/DD") ? 1 : -1);
    currentMonitoringForm = {
      ...currentMonitoringForm,
      selfMonitoring
    };
  }

  response.render("monitoringForm", {
    title: "Monitoring Form",
    pageName: "monitoringForm",
    currentUser: request.session.user,
    isAdmin: request.session.isAdmin,
    message: request.query.message,
    currentMonitoringForm
  });
});

app.post("/monitoringForm", checkIsUser, async (request, response) => {
  if (request.body.mId)
  {
    await updateMonitoringForm(request.body.mId, {
      dateStarted: request.body.dateStarted,
      dateSymptomsStarted: request.body.dateSymptomsStarted
    });
    request.body.selfMonitoring.forEach(async selfMonitoring => {
      await updateMSelfMonitoring(selfMonitoring.id, {
        date: selfMonitoring.date,
        dailyTemperature: selfMonitoring.dailyTemperature,
        noSymptoms: selfMonitoring.noSymptoms ? true : false,
        cough: selfMonitoring.cough ? true : false,
        cold: selfMonitoring.cold ? true : false,
        diarrhea: selfMonitoring.diarrhea ? true : false,
        soreThroat: selfMonitoring.soreThroat ? true : false,
        headache: selfMonitoring.headache ? true : false,
        fatigue: selfMonitoring.fatigue ? true : false,
        difficultyOfBreathing: selfMonitoring.difficultyOfBreathing ? true : false,
        others: selfMonitoring.others ? true : false,
      });
    })
  }
  else
  {
    const mId = await createMonitoringForm({
      dateStarted: request.body.dateStarted,
      dateSymptomsStarted: request.body.dateSymptomsStarted,
      userId: request.session.user.id
    });
    await createMSelfMonitoring(mId, request.body.selfMonitoring.map(selfMonitoring => {
      return {
        date: selfMonitoring.date,
        dailyTemperature: selfMonitoring.dailyTemperature,
        noSymptoms: selfMonitoring.noSymptoms ? true : false,
        cough: selfMonitoring.cough ? true : false,
        cold: selfMonitoring.cold ? true : false,
        diarrhea: selfMonitoring.diarrhea ? true : false,
        soreThroat: selfMonitoring.soreThroat ? true : false,
        headache: selfMonitoring.headache ? true : false,
        fatigue: selfMonitoring.fatigue ? true : false,
        difficultyOfBreathing: selfMonitoring.difficultyOfBreathing ? true : false,
        others: selfMonitoring.others ? true : false,
      };
    }));
  }

  response.redirect(`/?message=Monitoring Form successfully submitted.`);
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
app.get("/profile", checkIsUser, (request, response) => {
  response.render("profile", {
    title: "Profile",
    pageName: "profile",
    currentUser: request.session.user,
    isAdmin: request.session.isAdmin,
    message: request.query.message,
  });
});

app.post("/profile", checkIsUser, async function (request, response) {
  await updateUser(request.session.user.id, {
    firstName: request.body.firstName,
    lastName: request.body.lastName,
    address: request.body.address,
    phoneNumber: request.body.phoneNumber,
  });

  request.session.user.firstName = request.body.firstName;
    request.session.user.lastName = request.body.lastName;
    request.session.user.address = request.body.address;
    request.session.user.phoneNumber = request.body.phoneNumber;

  response.redirect(`/profile?message=Profile successfully updated.`);
});

///USERS-ADMIN SIDE
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

//ADMIN LOGIN
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

//API LOGIN-USER SIDE
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

//API LOGIN-ADMIN SIDE
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
