const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const rateLimiter = require("express-rate-limit");
const compression = require("compression");
const path = require("path");
const session = require("express-session");

// Middleware
app.use(
  compression({
    level: 5,
    threshold: 0,
    filter: (req, res) => {
      if (req.headers["x-no-compression"]) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

app.set("view engine", "ejs");
app.set("trust proxy", 1);

// Session middleware
app.use(
  session({
    secret: "your-secret-key", // Ganti dengan secret kuat
    resave: false,
    saveUninitialized: true,
  })
);

// Middleware CORS & logging
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  console.log(
    `[${new Date().toLocaleString()}] ${req.method} ${req.url} - ${res.statusCode}`
  );
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, headers: true }));

// ---------------- ROUTES ----------------

// ✅ Dashboard (tampilkan form login)
app.get("/player/login/dashboard", (req, res) => {
  res.render(__dirname + "/public/html/dashboard.ejs");
});

// ✅ Validasi login
app.post("/player/growid/login/validate", (req, res) => {
  const { _token, growId, password } = req.body;

  if (!growId || !password || !_token) {
    return res.status(400).send({
      status: "error",
      message: "Missing required fields: growId, password, or _token",
    });
  }

  // buat token
  const token = Buffer.from(
    `_token=${_token}&growId=${growId}&password=${password}`
  ).toString("base64");

  // simpan ke session
  req.session.user = {
    growId,
    token,
    createdAt: Date.now(),
  };

  const accountAge = 2; // umur akun fix 2 tahun

  res.send({
    status: "success",
    message: "Account Validated.",
    token,
    url: "",
    accountType: "growtopia",
    accountAge,
  });
});

// ✅ Register
app.post("/player/growid/register", (req, res) => {
  const { growId, password } = req.body;

  if (!growId || !password) {
    return res.status(400).send({
      status: "error",
      message: "Missing required fields: growId or password",
    });
  }

  const _token = Buffer.from(`${growId}:${password}`).toString("base64");

  req.session.user = {
    growId,
    token: _token,
    createdAt: Date.now(),
  };

  const accountAge = 2;

  res.send({
    status: "success",
    message: "Account Registered.",
    token: _token,
    url: "",
    accountType: "growtopia",
    accountAge,
  });
});

// ✅ Check token (cek session)
app.get("/player/growid/checkToken", (req, res) => {
  const userSession = req.session.user;

  if (!userSession || !userSession.token) {
    return res.status(401).send({
      status: "error",
      message: "User not logged in or session expired",
    });
  }

  const accountAge = 2;

  res.send({
    status: "success",
    message: "User is already logged in.",
    token: userSession.token,
    accountType: "growtopia",
    accountAge,
  });
});

// ✅ Favicon
app.get("/favicon.:ext", function (req, res) {
  res.sendFile(path.join(__dirname, "public", "favicon.ico"));
});

// ✅ Default
app.get("/", function (req, res) {
  res.send("Hello World!");
});

// ---------------- SERVER ----------------
app.listen(5000, function () {
  console.log("Listening on port 5000");
});
