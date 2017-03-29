let express = require('express');
let router = express.Router();
let seckeyPool = require("../../utils/seckeyPool");
let publisher = require("../../mq/publish");
let constUtils = require('../../utils/constUtils');
let moment = require('moment');
let log4js = require('../../utils/logger');
let redis = require('../../utils/redis');
let jsName = __filename.substr(__dirname.length+1);
let logName = jsName.replace('\.js','\.log');

/* 获取物联平台十大系统信息
 * json:数据发送到ActiveMQ中，包括req.body数据主体；userInfo登录用户信息包括userId，password，communityId
 *
 *
 */
router.use('/getsysteminfo', function(req, res, next) {
    let log=log4js.config(jsName,logName);
    let json = req.body;
    let seckey = json.seckey;
    let communityId = '';
    let key = constUtils.TABLE_P_SYSTEMINFO;
    seckeyPool.get(seckey,function(loginuser) {
        loginuser=JSON.parse(loginuser);
        communityId = loginuser.communityId;
        console.log('当前用户的社区是'+communityId+',即将获取此社区十大物联系统信息！');
        redis.hget(key,communityId,function(err,systeminfo){
            log.info('用户信息：',loginuser,'系统信息：',systeminfo);
            res.send(systeminfo);
        });
    });

});

module.exports = router;
