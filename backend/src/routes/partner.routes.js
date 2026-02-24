const express = require('express');
const router = express.Router();
const partnerController = require('../controllers/partner.controller');
const upload = require('../config/upload');

// Partner Registration
router.post('/register',
    upload.fields([
        { name: 'images', maxCount: 5 },
        { name: 'qrCode', maxCount: 1 },
        { name: 'icon', maxCount: 1 }
    ]),
    partnerController.registerPartner
);

module.exports = router;
