var express = require('express');
var router = express.Router();
var publishController = require("../controllers/PublishController.js");
var mutipart= require('connect-multiparty');
var mutipartMiddeware = mutipart();

router.get('/index', publishController.index);


router.get('/excel', publishController.excel);

router.post('/publish',publishController.publish)

router.post('/addr_detail',publishController.addr_detail)

router.post('/getlongandlan',publishController.getlongandlan)

router.post('/getPrice',publishController.getPrice)

router.post('/excelin',mutipartMiddeware,publishController.excelin)
module.exports = router;
