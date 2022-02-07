const functions = require("firebase-functions");
const firebase = require("firebase-admin");
const express = require("express");
const session = require("express-session");
const { FirestoreStore } = require("@google-cloud/connect-firestore"); //connection to cloud firestore
const engines = require("consolidate");
const crypto = require("crypto");
const dayjs = require("dayjs");

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
async function getAllContactTracingFormForUser(userId) {
  let data = [];
  const ref = firebaseApp.firestore().collection("contact-tracing-form");
  await ref
    .where("userId", "==", userId)
    .get()
    .then((snap) =>
      snap.forEach((doc) => {
        const entry = doc.data();
        entry.id = doc.id;
        data.push(entry);
      })
    );
  return data;
}

async function getContactTracingFormById(id) {
  let data = null;
  const ref = firebaseApp.firestore().collection("contact-tracing-form");
  await ref
    .doc(id)
    .get()
    .then((doc) => {
      data = doc.data();
      data.id = id;
    });
  return data;
}

async function createContactTracingForm(data) {
  const ref = firebase.firestore().collection("contact-tracing-form");
  const { id } = await ref.add(data);
  return id;
}

async function getCtLivesWithForCt(ctId) {
  let data = [];
  const ref = firebaseApp.firestore().collection("ct-livesWith");
  await ref
    .where("ctId", "==", ctId)
    .get()
    .then((snap) =>
      snap.forEach((doc) => {
        const entry = doc.data();
        entry.id = doc.id;
        data.push(entry);
      })
    );
  return data;
}

async function createCtLivesWith(ctId, collection) {
  const ref = firebase.firestore().collection("ct-livesWith");
  collection.forEach(async (data) => {
    await ref.add({
      ...data,
      ctId,
    });
  });
}

async function getCtBeenAroundForCt(ctId) {
  let data = [];
  const ref = firebaseApp.firestore().collection("ct-beenAround");
  await ref
    .where("ctId", "==", ctId)
    .get()
    .then((snap) =>
      snap.forEach((doc) => {
        const entry = doc.data();
        entry.id = doc.id;
        data.push(entry);
      })
    );
  return data;
}

async function createCtBeenAround(ctId, collection) {
  const ref = firebase.firestore().collection("ct-beenAround");
  collection.forEach(async (data) => {
    await ref.add({
      ...data,
      ctId,
    });
  });
}

async function getCtActivityForCt(ctId) {
  let data = [];
  const ref = firebaseApp.firestore().collection("ct-activity");
  await ref
    .where("ctId", "==", ctId)
    .get()
    .then((snap) =>
      snap.forEach((doc) => {
        const entry = doc.data();
        entry.id = doc.id;
        data.push(entry);
      })
    );
  return data;
}

async function createCtActivity(ctId, collection) {
  const ref = firebase.firestore().collection("ct-activity");
  collection.forEach(async (data) => {
    await ref.add({
      ...data,
      ctId,
    });
  });
}

async function createMonitoringForm(data) {
  const ref = firebase.firestore().collection("monitoring-form");
  const { id } = await ref.add(data);
  return id;
}

async function createMSelfMonitoring(mId, collection) {
  const ref = firebase.firestore().collection("m-selfMonitoring");
  collection.forEach(async (data) => {
    await ref.add({
      ...data,
      mId,
    });
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
  await ref
    .where("userId", "==", userId)
    .get()
    .then((snap) =>
      snap.forEach((doc) => {
        const entry = doc.data();
        entry.id = doc.id;
        data.push(entry);
      })
    );
  return data;
}

async function getMonitoringFormById(id) {
  let data = null;
  const ref = firebaseApp.firestore().collection("monitoring-form");
  await ref
    .doc(id)
    .get()
    .then((doc) => {
      data = doc.data();
      data.id = id;
    });
  return data;
}

async function getAllMSelfMonitoringForMonitoringForm(mId) {
  let data = [];
  const ref = firebaseApp.firestore().collection("m-selfMonitoring");
  await ref
    .where("mId", "==", mId)
    .get()
    .then((snap) =>
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
    cookie: {
      maxAge: 1000 * 60 * 5,//expires 5 minutes (login sessions),
    },
    resave: true,
    rolling: true,
    saveUninitialized: false,
  })
);

//Login Checker if User OR Admin

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
app.get("/", (request, response) => {
  //gets the index after logging in (ADMIN SIDE)
  if (request.session.isAdmin) {
    response.render("index", {
      title: "BlueDu Dashboard",
      pageName: "",
      currentUser: request.session.user,
      isAdmin: request.session.isAdmin,
      message: request.query.message,
    });
  } else if (request.session.user) {
    //NORMAL USER
    response.render("formIndex", {
      title: "BlueDu Forms",
      pageName: "",
      currentUser: request.session.user,
      isAdmin: request.session.isAdmin,
      message: request.query.message,
    });
  } else {
    response.render("login", {
      //LOGIN
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
  const livesWith = request.body.livesWith.filter(
    (p) => p.firstName != "REMOVED"
  );
  const beenAround = request.body.beenAround.filter(
    (p) => p.firstName != "REMOVED"
  );
  const activity = request.body.activity.filter((p) => p.activity != "REMOVED");

  const ctId = await createContactTracingForm({
    userId: request.session.user.id,
    submissionDate: new Date(),
  });

  await createCtLivesWith(ctId, livesWith);
  await createCtBeenAround(ctId, beenAround);
  await createCtActivity(ctId, activity);

  response.redirect(`/?message=Contact Tracing Form successfully submitted.`);
});

//MONITORING FORM GET, POST
app.get("/monitoringForm", checkIsUser, async (request, response) => {
  let allMonitoringForm = await getAllMonitoringFormForUser(
    request.session.user.id
  );
  let filteredMontitoringForm = allMonitoringForm.filter(
    (form) => !form.isComplete
  );
  filteredMontitoringForm.sort((a, b) =>
    dayjs(a.dateStarted) > dayjs(b.dateStarted) ? 1 : -1
  );
  let currentMonitoringForm = filteredMontitoringForm.length
    ? filteredMontitoringForm[filteredMontitoringForm.length - 1]
    : null;
  if (currentMonitoringForm) {
    const selfMonitoring = await getAllMSelfMonitoringForMonitoringForm(
      currentMonitoringForm.id
    );
    selfMonitoring.sort((a, b) =>
      dayjs(a.date, "MM/DD") > dayjs(b.date, "MM/DD") ? 1 : -1
    );
    currentMonitoringForm = {
      ...currentMonitoringForm,
      selfMonitoring,
    };
  }

  response.render("monitoringForm", {
    title: "Monitoring Form",
    pageName: "monitoringForm",
    currentUser: request.session.user,
    isAdmin: request.session.isAdmin,
    message: request.query.message,
    currentMonitoringForm,
  });
});

app.post("/monitoringForm", checkIsUser, async (request, response) => {
  if (request.body.mId) {
    await updateMonitoringForm(request.body.mId, {
      dateStarted: request.body.dateStarted,
      dateSymptomsStarted: request.body.dateSymptomsStarted,
      isComplete:
        dayjs() >= dayjs(request.body.dateStarted).add(14, "day")
          ? true
          : false,
    });
    request.body.selfMonitoring.forEach(async (selfMonitoring) => {
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
        difficultyOfBreathing: selfMonitoring.difficultyOfBreathing
          ? true
          : false,
        others: selfMonitoring.others ? true : false,
      });
    });
  } else {
    const mId = await createMonitoringForm({
      dateStarted: request.body.dateStarted,
      dateSymptomsStarted: request.body.dateSymptomsStarted,
      userId: request.session.user.id,
    });
    await createMSelfMonitoring(
      mId,
      request.body.selfMonitoring.map((selfMonitoring) => {
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
          difficultyOfBreathing: selfMonitoring.difficultyOfBreathing
            ? true
            : false,
          others: selfMonitoring.others ? true : false,
        };
      })
    );
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
  response.render("dashboard", {
    title: "Dashboard",
    pageName: "dashboard",
    currentUser: request.session.user,
    isAdmin: request.session.isAdmin,
    users,
    message: request.query.message,
  });
});

app.get("/userDetails", checkIsAdmin, async (request, response) => {
  let selectedUser = null;
  let contactTracingForms = null;
  let monitoringForms = null;
  if (request.query.id) {
    selectedUser = await getUserById(request.query.id);
    contactTracingForms = await getAllContactTracingFormForUser(
      request.query.id
    );
    monitoringForms = await getAllMonitoringFormForUser(request.query.id);
  }
  response.render("userDetails", {
    title: "User Details",
    pageName: "userDetails",
    currentUser: request.session.user,
    isAdmin: request.session.isAdmin,
    selectedUser,
    contactTracingForms,
    monitoringForms,
  });
});

app.get(
  "/userContactTracingFormDetails",
  checkIsAdmin,
  async (request, response) => {
    let contactTracingForm;
    let user;
    let ctLivesWiths;
    let ctBeenArounds;
    let ctActivities;
    if (request.query.id) {
      contactTracingForm = await getContactTracingFormById(request.query.id);
      user = await getUserById(contactTracingForm.userId);
      ctLivesWiths = await getCtLivesWithForCt(contactTracingForm.id);
      ctBeenArounds = await getCtBeenAroundForCt(contactTracingForm.id);
      ctActivities = await getCtActivityForCt(contactTracingForm.id);
    }

    response.render("userContactTracingFormDetails", {
      title: "User Contact Tracing Form Details",
      pageName: "userContactTracingFormDetails",
      currentUser: request.session.user,
      isAdmin: request.session.isAdmin,
      contactTracingForm,
      user,
      ctLivesWiths,
      ctBeenArounds,
      ctActivities,
    });
  }
);

app.get(
  "/userMonitoringFormDetails",
  checkIsAdmin,
  async (request, response) => {
    let monitoringForm;
    let user;
    let selfMonitoring;
    if (request.query.id) {
      monitoringForm = await getMonitoringFormById(request.query.id);
      user = await getUserById(monitoringForm.userId);
      selfMonitoring = await getAllMSelfMonitoringForMonitoringForm(
        monitoringForm.id
      );
      selfMonitoring.sort((a, b) =>
        dayjs(a.date, "MM/DD") > dayjs(b.date, "MM/DD") ? 1 : -1
      );
    }

    response.render("userMonitoringFormDetails", {
      title: "User Self Monitoring Form Details",
      pageName: "userMonitoringFormDetails",
      currentUser: request.session.user,
      isAdmin: request.session.isAdmin,
      monitoringForm,
      user,
      selfMonitoring,
    });
  }
);

app.get("/adminsettings", checkIsAdmin, async (request, response) => {
  const admin = (await getAdmins())[0];
  //console.log(admin);
  response.render("adminsettings", {
    title: "Settings",
    pageName: "adminsettings",
    currentUser: request.session.user,
    isAdmin: request.session.isAdmin,
    admin,
    message: request.query.message,
  });
});

///ADMIN
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

    request.session.user.firstName = request.body.firstName;
    request.session.user.lastName = request.body.lastName;

    response.redirect(`/adminsettings?message=Details successfully updated.`);
  }
);

app.post(
  "/updateAdminUsername",
  checkIsAdmin,
  async function (request, response) {
    if (request.body.newUsername !== request.body.confirmUsername) {
      response.redirect(
        `/adminsettings?message=Usernames do not match! Please try again.`
      );
    } else {
      await updateAdmin(request.body.id, {
        username: request.body.newUsername,
      });

      response.redirect(
        `/adminsettings?message=Username successfully updated.`
      );
    }
  }
);

app.post(
  "/updateAdminPassword",
  checkIsAdmin,
  async function (request, response) {
    if (request.body.newPassword !== request.body.confirmPassword) {
      response.redirect(
        `/adminsettings?message=Passwords do not match! Please try again.`
      );
    } else {
      //encryption for pass update
      const cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
      let encrypted = cipher.update(request.body.newPassword);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      await updateAdmin(request.body.id, {
        passwordHash: encrypted.toString("hex").toUpperCase(), //encryption
      });

      response.redirect(
        `/adminsettings?message=Password successfully updated.`
      );
    }
  }
);

///USERS SIDE
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
app.get("/login-admin", (request, response) => {
  if (request.session.isAdmin) {
    response.redirect("/"); //if manually typed, redirects to index page :)
  }
  else {
    //gets to show the login-admin page
    response.render("login-admin", {
      title: "Admin Login",
      pageName: "login-admin",
      currentUser: request.session.user,
      isAdmin: request.session.isAdmin,
      message: request.query.message,
    });
  }
});

app.get("/logout", function (request, response) {
  const isAdmin = request.session.isAdmin;
  request.session.destroy(() => {
    if (isAdmin) {
      response.redirect("/login-admin");
    } else {
      response.redirect("/");
    }
  });
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
