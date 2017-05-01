let express = require('express');
let router = express.Router();
let seckeyPool = require("../../utils/seckeyPool");
let publisher = require("../../mq/publish");
let constUtils = require('../../utils/constUtils');
let moment = require('moment');
let log4js = require('../../utils/logger');
let destination = constUtils.QUEUE_P_VIDEOINTERCOM_CALL;
let jsName = __filename.substr(__dirname.length+1);
let logName = jsName.replace('\.js','\.log');
/* GET users listing.
 * json:数据发送到ActiveMQ中，包括req.body数据主体；userInfo登录用户信息包括userId，password，communityid
 *
 *
 */
router.use('/call', function(req, res, next) {
    let log=log4js.config(__dirname+'/../../',jsName,logName);
    let json = req.body;
    let seckey = json.seckey;
     seckeyPool.get(seckey,function(loginuser) {
			loginuser=JSON.parse(loginuser);
        loginuser['tableName'] = constUtils.TABLE_P_VIDEOINTERCOM_CALL;
        json['userInfo'] =loginuser;
        json['optDate'] = moment().format('YYYY-MM-DD');
        publisher.publish(destination,JSON.stringify(json));
        log.info(loginuser,json);
    });
    res.send('{"code":'+constUtils.WORK_UPLOAD_SUCCESS+',"msg":"[可视开门系统对讲记录信息]数据上传ActiveMq成功！"} 上传时间:'+moment().format('YYYY-MM-DD hh:mm:ss'));

});

module.exports = router;
