let express = require('express');
let router = express.Router();
let seckeyPool = require("../../utils/seckeyPool");
let pSystemInfo = require("../../mq/publish");
let constUtils = require('../../utils/constUtils');
let moment = require('moment');
let destination = constUtils.QUEUE_P_BROADCAST_DEVICEINFO;

/* GET users listing.
 * json:数据发送到ActiveMQ中，包括req.body数据主体；userInfo登录用户信息包括userId，password，communityid
 *
 *
 */
router.use('/deviceinfo', function(req, res, next) {
    let json = req.body;
    let seckey = json.seckey;
     seckeyPool.get(seckey,function(loginuser) {
			loginuser=JSON.parse(loginuser);
        loginuser['tableName'] = constUtils.TABLE_P_BROADCAST_DEVICEINFO;
        json['userInfo'] =loginuser;
        json['optDate'] = moment().format('YYYY-MM-DD');
        pSystemInfo.publish(destination,JSON.stringify(json));
    });
    res.send('{"code":'+constUtils.WORK_UPLOAD_SUCCESS+',"msg":"[广播通讯系统设备信息]数据上传ActiveMq成功！"} 上传时间:'+moment().format('YYYY-MM-DD hh:mm:ss'));

});

module.exports = router;
