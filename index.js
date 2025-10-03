const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const compression = require('compression');
const crypto = require('crypto');

const app = express();

// Middleware
app.use(compression({ level: 5, threshold: 0 }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Render dashboard.ejs
app.get('/dashboard', (req, res) => {
    res.render('dashboard');
});

// Handle login & register
app.post('/player/growid/login/validate', (req, res) => {
    const { growId, password } = req.body;

    // Log input ke console (opsional)
    console.log(`Incoming login/register request => GrowID: ${growId}, Password: ${password}`);

    // Simulasi validasi akun (bisa ganti dengan database)
    if (!growId || !password) {
        return res.status(400).json({
            status: 'error',
            message: 'Missing growId or password',
        });
    }

    // Generate token random base64
    const token = crypto.randomBytes(24).toString('base64');

    // Response JSON sesuai permintaan
    return res.json({
        status: 'success',
        message: 'Account Validated.',
        token: token,
        url: '',
        accountType: 'growtopia',
        accountAge: 2
    });
});

// Endpoint penutup modal (dipakai di JS front-end)
app.get('/player/validate/close', (req, res) => {
    res.send('Modal closed');
});

// Jalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
});
