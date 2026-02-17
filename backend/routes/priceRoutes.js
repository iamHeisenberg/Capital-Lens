const express = require('express');
const router = express.Router();
const { getPrice } = require('../controllers/priceController');

// Price route - fetch historical price data for NSE Indian stocks only
router.get('/price/:ticker', getPrice);

module.exports = router;
