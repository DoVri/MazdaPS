const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const rateLimiter = require('express-rate-limit');
const compression = require('compression');
const path = require('path');
const session = require('express-session');

// Middleware
app.use(
  compression({
    level: 5,
    threshold: 0,
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
  }),
);
app.set('view engine', 'ejs');
app.set('trust proxy', 1);

// Setting up session middleware
app.use(session({
  secret: 'your-secret-key', // Ganti dengan secret yang lebih aman
  resave: false,
  saveUninitialized: true,
}));

// Middleware CORS dan logging
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept',
  );
  console.log(
    `[${new Date().toLocaleString()}] ${req.method} ${req.url} - ${
      res.statusCode
    }`,
  );
  next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, headers: true }));

// Route untuk Dashboard (tampilkan form login)
app.all('/player/login/dashboard', function (req, res) {
  const tData = {};
  try {
    const uData = JSON.stringify(req.body).split('"')[1].split('\\n');
    const uName = uData[0].split('|');
    const uPass = uData[1].split('|');
    for (let i = 0; i < uData.length - 1; i++) {
      const d = uData[i].split('|');
      tData[d[0]] = d[1];
    }
    if (uName[1] && uPass[1]) {
      res.redirect('/player/growid/login/validate');
    }
  } catch (why) {
    console.log(`Warning: ${why}`);
  }

  res.render(__dirname + '/public/html/dashboard.ejs', { data: tData });
});

// Route untuk validasi login dan register
app.all('/player/growid/login/validate', (req, res) => {
  const _token = req.body._token;
  const growId = req.body.growId;
  const password = req.body.password;

  if (!growId || !password || !_token) {
    return res.status(400).send({
      status: 'error',
      message: 'Missing required fields: growId, password, or _token',
    });
  }

  // Logika untuk memvalidasi login
  const token = Buffer.from(
    `_token=${_token}&growId=${growId}&password=${password}`,
  ).toString('base64');

  // Menyimpan informasi login ke session (atau bisa ke database)
  req.session.user = {
    growId: growId,
    token: token,
    createdAt: Date.now(),  // Menyimpan waktu registrasi akun (misalnya dengan timestamp)
  };

  // Langsung set accountAge menjadi 2 tahun
  const accountAge = 2;  // Menetapkan umur akun menjadi 2 tahun

  res.send({
    status: 'success',
    message: 'Account Validated.',
    token: token,
    url: '',
    accountType: 'growtopia',
    accountAge: accountAge,  // Menetapkan umur akun 2 tahun
  });
});

// Route untuk register (misalnya untuk membuat akun baru)
app.all('/player/growid/register', (req, res) => {
  const growId = req.body.growId;
  const password = req.body.password;

  if (!growId || !password) {
    return res.status(400).send({
      status: 'error',
      message: 'Missing required fields: growId or password',
    });
  }

  // Simpan akun baru di database (anggap saja berhasil)
  const _token = Buffer.from(`${growId}:${password}`).toString('base64');

  // Setelah register, langsung simpan token dan waktu registrasi ke session
  req.session.user = {
    growId: growId,
    token: _token,
    createdAt: Date.now(),  // Menyimpan waktu registrasi akun
  };

  // Langsung set accountAge menjadi 2 tahun
  const accountAge = 2;  // Menetapkan umur akun menjadi 2 tahun

  // Kirim pesan yang sama untuk register seperti pada login, termasuk accountAge
  res.send({
    status: 'success',
    message: 'Account Validated.',
    token: _token,
    url: '',
    accountType: 'growtopia',
    accountAge: accountAge,  // Menetapkan umur akun 2 tahun
  });
});

// Route untuk memeriksa token (validasi session)
app.all('/player/growid/checkToken', (req, res) => {
  const userSession = req.session.user;

  if (!userSession || !userSession.token) {
    return res.status(401).send({
      status: 'error',
      message: 'User not logged in or session expired',
    });
  }

  // Langsung set accountAge menjadi 2 tahun
  const accountAge = 2;  // Menetapkan umur akun menjadi 2 tahun

  res.send({
    status: 'success',
    message: 'User is already logged in.',
    token: userSession.token,
    accountType: 'growtopia',
    accountAge: accountAge,  // Menetapkan umur akun 2 tahun
  });
});

// Favicon route
app.get('/favicon.:ext', function (req, res) {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Default route
app.get('/', function (req, res) {
  res.send('Hello World!');
});

// Server listening on port 5000
app.listen(5000, function () {
  console.log('Listening on port 5000');
});
