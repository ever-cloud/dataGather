var express = require('express');
var router = express.Router();
var seckeyPool = require("../../utils/seckeyPool");

/* GET users listing. */
router.use('/deviceInfo', function(req, res, next) {
    var json = req.body;
    var seckey = json.seckey;
    console.log(seckeyPool.exists(seckey));
    console.log(seckeyPool.get(seckey,function (result) {
        console.log(result);
    }));
  //todo
  res.send('respond with a resource videoMonitor deviceInfo');
});

module.exports = router;
