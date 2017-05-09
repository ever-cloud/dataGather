let express = require('express');
let router = express.Router();
let seckeyPool = require("../../utils/seckeyPool");
let publisher = require("../../mq/publish");
let constUtils = require('../../utils/constUtils');
let moment = require('moment');
let log4js = require('../../utils/logger');
let destination = constUtils.QUEUE_P_ALARM_DEVICEINFO;
let jsName = __filename.substr(__dirname.length+1);
let logName = jsName.replace('\.js','\.log');
/* GET users listing.
 * json:数据发送到ActiveMQ中，包括req.body数据主体；userInfo登录用户信息包括userId，password，communityId
 *
 *
 */
router.use('/deviceinfo', function(req, res, next) {
    let log=log4js.config(__dirname+'/../../',jsName,logName);
    let json = req.body;
    let seckey = json.seckey;
    if(seckey!='' && seckey!=undefined && seckey!=null) {
        seckeyPool.get(seckey, function (loginuser) {
            if(loginuser != null){

                loginuser = JSON.parse(loginuser);
                loginuser['tableName'] = constUtils.TABLE_P_ALARM_DEVICEINFO;
                json['userInfo'] = loginuser;
                json['optDate'] = moment().format('YYYY-MM-DD');
                publisher.publish(destination, JSON.stringify(json));
                log.info(loginuser, json);
                res.send('{"code":' + constUtils.WORK_UPLOAD_SUCCESS + ',"msg":"[入侵报警系统设备信息]数据上传ActiveMq成功！"} 上传时间:' + moment().format('YYYY-MM-DD hh:mm:ss'));
            }else{
                res.send('{"code":' + constUtils.WORK_QUERY_FAIL + ',"msg":"[入侵报警系统设备信息]无效seckey，操作不成功！"} 时间:' + moment().format('YYYY-MM-DD hh:mm:ss'));
            }
        });
    }

});

module.exports = router;
