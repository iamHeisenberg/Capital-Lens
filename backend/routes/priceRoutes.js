const express = require('express');
const router = express.Router();
const { getPrice } = require('../controllers/priceController');
const validateTicker = require('../middleware/validateTicker');

// Price route - fetch historical price data for NSE Indian stocks only
router.get('/price/:ticker', validateTicker, getPrice);

module.exports = router;
