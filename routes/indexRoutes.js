const express = require('express');
const router = express.Router();

// Import Controllers
const loginController = require("../controllers/auth/loginController.js");
// const laporanController = require('../controllers/koperasi/laporanController');
// const pinjamanController = require('../controllers/koperasi/pinjamanController');
const simpananController = require('../controllers/koperasi/simpananController.js');
// const kreditController = require('../controllers/koperasi/kreditController');
// const masterController = require('../controllers/master/masterController');

// Route untuk Login
router.get("/", (req, res) => {
  res.redirect("/login");
});
router.get("/login", loginController.getLogin);
router.post("/login", loginController.login);

// Route untuk Change Password
router.get('/changePassword', (req, res) => {
  console.log("Change Password Page Accessed");
  res.render('auth/changePassword');
});
router.post('/changePassword', loginController.changePassword);

// Route untuk Logout
router.post("/logout", loginController.logout);


// Route untuk Dashboard
router.get("/dashboardSuperadmin", (req, res) => {
  res.render("dashboardSuperadmin");
});
router.get("/dashboardPimpinan", (req, res) => {
  res.render("dashboardPimpinan");
});
router.get("/dashboardKeuangan", (req, res) => {
  if (req.session.role === 'Admin Keuangan') {
    res.render("dashboardKeuangan");
  } else {
    res.redirect('/login');
  }
});



// Route untuk Laporan
// router.get('/laporan', laporanController.getLaporan);
// router.post('/laporan', laporanController.createLaporan);

// Route untuk Pinjaman
// router.get('/pinjaman', pinjamanController.getPinjaman);
// router.post('/pinjaman', pinjamanController.createPinjaman);

// Route untuk Simpanan
router.get('/simpanan', (req, res) => {
  if (req.session.role === 'Admin Keuangan') {
      res.render('koperasi/simpananKeuangan/lihatsimpanan');
  } else {
      res.redirect('/login');
  }
});

// API Routes untuk Simpanan
router.get('/api/simpanan', simpananController.getSimpananData);
router.get('/koperasi/simpanan/lihatsimpanan', simpananController.lihatSimpanan);

// API Routes untuk Simpanan
router.get('/api/simpanan', simpananController.getSimpananData);
router.get('/api/simpanan/filter', simpananController.filterSimpanan);
router.get('/api/simpanan/years', simpananController.getAvailableYears);
router.get('/api/anggota', simpananController.getAnggotaList);
router.post('/api/simpanan', simpananController.createSimpanan);
router.delete('/api/simpanan/:id', simpananController.deleteSimpanan);


// Route untuk Kredit
// router.get('/kredit', kreditController.getKredit);
// router.post('/kredit', kreditController.createKredit);

// Route untuk Master
// router.get('/master/anggota', masterController.getAnggota);
// router.get('/master/user', masterController.getUser);

// Export Router
module.exports = router;