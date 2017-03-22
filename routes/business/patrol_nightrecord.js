var express = require('express');
var router = express.Router();
var seckeyPool = require("../../utils/seckeyPool");
var pSystemInfo = require("../../mq/publish");
var constUtils = require('../../utils/constUtils');
var moment = require('moment');
var destination = constUtils.QUEUE_P_PATROL_NIGHTRECORD;

/* GET users listing.
 * json:数据发送到ActiveMQ中，包括req.body数据主体；userInfo登录用户信息包括userId，password，communityid
 *
 *
 */
router.use('/nightrecord', function (req, res, next) {
    var json = req.body;
    var seckey = json.seckey;
     seckeyPool.get(seckey, function (loginuser) {
        			loginuser=JSON.parse(loginuser);
        loginuser['tableName'] = constUtils.TABLE_P_PATROL_NIGHTRECORD;
        json['userInfo'] = loginuser;
        json['optDate'] = moment().format('YYYY-MM-DD');
        pSystemInfo.publish(destination, JSON.stringify(json));
    });
    res.send('{"code":' + constUtils.WORK_UPLOAD_SUCCESS + ',"msg":"[电子巡更系统巡更信息]数据上传ActiveMq成功！"} 上传时间:'+moment().format('YYYY-MM-DD hh:mm:ss'));

});

module.exports = router;
