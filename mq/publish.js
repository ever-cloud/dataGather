/**
 * Created by lenovo on 2017/3/15.
 */
var Stomp = require('stomp-client');
var config = require('../properties/config');
var client = new Stomp(config.get('activeMq.host'), config.get('activeMq.port'),config.get('activeMq.user'), config.get('activeMq.password'));
var p = {};
var _connectedCallback=function(){
    console.log('连接成功,连接中。。。');
}
var _errorCallback=function(err){
    console.log('连接出错，错误：'+err);
}
client.connect((_connectedCallback,_errorCallback)=>{
    console.log('启动连接了！ActiveM 启动！');
});
/**
 * [{destination:"xxx",content:"xxxx"},{destination:"xxx",content:"xxxx"},...]
 * @param destination
 * @param content
 */
p.mutlipublish = function (destContents) {
        for (let destContent of destContents){
            let destination =  destContent.destination;
            let content =  destContent.content;
            client.publish(destination,content);
            console.log('发布后'+destination+':'+content);
        }
};
/**
 *
 * @param destination  目标：queue或topic名
 * @param content      要传的数据
 */
p.publish = function (destination,content) {
        client.publish(destination,content);
};
module.exports = p;