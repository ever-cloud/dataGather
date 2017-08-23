let express = require('express');
let router = express.Router();
let seckeyPool = require("../../utils/seckeyPool");
let publisher = require("../../mq/publish");
let constUtils = require('../../utils/constUtils');
let moment = require('moment');
let log4js = require('../../utils/logger');
let destination = constUtils.QUEUE_P_ALARM_INTRUSION;
let jsName = __filename.substr(__dirname.length+1);
let logName = jsName.replace('\.js','\.log');
let postgredb = require('../../utils/postgre');
/* GET users listing.
 * json:数据发送到ActiveMQ中，包括req.body数据主体；userInfo登录用户信息包括userId，password，communityid
 *
 *
 */
router.use('/intrusion', function(req, res) {
    let log=log4js.config(__dirname+'/../../',jsName,logName);
    let json = req.body;
    let seckey = json.seckey;
    if(seckey!='' && seckey!=undefined && seckey!=null) {
        postgredb.getTbleColInfo(constUtils.TABLE_P_ALARM_INTRUSION,json,uploadData);

    }
    console.log("111111111111111111111111111111111111111");
    let uploadData=function (checkResult) {
        if(checkResult.status){
            seckeyPool.get(seckey, function (loginuser) {
                if (loginuser != null) {
                    loginuser = JSON.parse(loginuser);
                    loginuser['tableName'] = constUtils.TABLE_P_ALARM_INTRUSION;
                    json['userInfo'] = loginuser;
                    json['optDate'] = moment().format('YYYY-MM-DD');
                    publisher.publish(destination, JSON.stringify(json));
                    log.info(loginuser, json);
                    res.send('{"code":' + constUtils.WORK_UPLOAD_SUCCESS + ',"msg":"[入侵报警系统报警信息]数据上传ActiveMq成功！"} 上传时间:' + moment().format('YYYY-MM-DD hh:mm:ss'));
                }else{
                    res.send('{"code":' + constUtils.WORK_QUERY_FAIL + ',"msg":"[入侵报警系统报警信息]无效seckey，操作不成功！"} 时间:' + moment().format('YYYY-MM-DD hh:mm:ss'));
                }
            });
        }else{
            res.send('{"code":' + constUtils.WORK_DATA_ERR + ',"msg":"[入侵报警系统报警信息]数据不正确，上传失败！具体为：'+checkResult+'"} 时间:' + moment().format('YYYY-MM-DD hh:mm:ss'));
        }
    }

});

module.exports = router;
