let express = require('express');
let router = express.Router();
let seckeyPool = require("../../utils/seckeyPool");
let publisher = require("../../mq/publish");
let constUtils = require('../../utils/constUtils');
let postgredb = require('../../utils/postgre');
let moment = require('moment');
let log4js = require('../../utils/logger');
let destination = constUtils.QUEUE_P_SYSTEMSTATUSINFO;
let jsName = __filename.substr(__dirname.length+1);
let logName = jsName.replace('\.js','\.log');
/* GET users listing.
 * json:数据发送到ActiveMQ中，包括req.body数据主体；userInfo登录用户信息包括userId，password，communityid
 *
 *
 */
router.use('/systemstatusinfo', function(req, res, next) {
    let log=log4js.config(__dirname+'/../../',jsName,logName);
    let json = req.body;
    let seckey = json.seckey;
    seckeyPool.get(seckey, function (loginuser) {
        let communityid=JSON.parse(loginuser).communityId;
        let tablename=constUtils.TABLE_P_SYSTEMSTATUSINFO;
        let jsondatas=json.data;
        jsondatas=postgredb.concatid(jsondatas,tablename,communityid);
        if(seckey!='' && seckey!=undefined && seckey!=null) {
            postgredb.getTbleColInfo(constUtils.TABLE_P_SYSTEMSTATUSINFO,json,uploadData);
        }
    });

    function uploadData(checkResult) {
        if(checkResult.status){
            seckeyPool.get(seckey, function (loginuser) {
                if (loginuser != null) {
                    loginuser = JSON.parse(loginuser);
                    loginuser['tableName'] = constUtils.TABLE_P_SYSTEMSTATUSINFO;
                    json['userInfo'] = loginuser;
                    json['optDate'] = moment().format('YYYY-MM-DD');
                    publisher.publish(destination, JSON.stringify(json));
                    log.info(loginuser, json);
                    console.log('systemstatusinfo upload is ' + JSON.stringify(json));
                    res.send('{"code":' + constUtils.WORK_UPLOAD_SUCCESS + ',"msg":"[物联系统状态信息]数据上传ActiveMq成功！"} 上传时间:' + moment().format('YYYY-MM-DD HH:mm:ss'));
                }else{
                    res.send('{"code":' + constUtils.WORK_QUERY_FAIL + ',"msg":"[物联系统状态信息]无效seckey，操作不成功！"}  上传时间:' + moment().format('YYYY-MM-DD HH:mm:ss'));
                }
            });
        }else{
            res.send('{"code":' + constUtils.WORK_DATA_ERR + ',"msg":[物联系统状态信息]数据不正确，上传失败！失败原因：'+JSON.stringify(checkResult.msg).replace(/\\/g,"")+'}  上传时间:' + moment().format('YYYY-MM-DD HH:mm:ss'));
        }
    }
});

module.exports = router;
