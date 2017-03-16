/**
 * Created by lenovo on 2017/3/15.
 */
var Stomp = require('stomp-client');
var config = require('../properties/config');
var host = config.get('activeMq.host');
var port = config.get('activeMq.port');
var user = config.get('activeMq.user');
var pwd  = config.get('activeMq.password')
var postgre = require("../utils/postgre");

//系统信息表的订阅
var client_systemInfo = new Stomp(host,port,user,pwd);
client_systemInfo.connect(function(sessionId) {
    var destination = '/queue/p.systemInfo';
    client_systemInfo.subscribe(destination, function(body, headers) {
        if (body){
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
            var data = json.data;
            for(var si of data){
                console.log(si.status,deptId,si.systemId);
                postgre.excuteSql("update p_systeminfo set status = $1 where deptid = $2 and systemid = $3 ",[si.status,deptId,si.systemId],function(result) {
                    console.log(result);
                });
            }
        }
    });
});