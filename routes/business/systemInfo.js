var express = require('express');
var router = express.Router();
var seckeyPool = require("../../utils/seckeyPool");
var pSystemInfo = require("../../mq/publish");
var destination = '/queue/p.systemInfo';

/* GET users listing. */
router.use('/statusinfo', function(req, res, next) {
    var json = req.body;
    var seckey = json.seckey;
   var obj = seckeyPool.get(seckey,function(obj) {
       obj['tableName'] = 'systemInfo';
       json['userInfo'] = JSON.parse(obj);
       pSystemInfo.publish(destination,JSON.stringify(json));
    });
    res.send('{"code":1002,"msg":"系统在线信息数据上传成功！"}');
});

module.exports = router;
