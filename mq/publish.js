/**
 * Created by lenovo on 2017/3/15.
 */
var Stomp = require('stomp-client');
var config = require('../properties/config');
var client = new Stomp(config.get('activeMq.host'), config.get('activeMq.port'),config.get('activeMq.userId'), config.get('activeMq.pwd'));
var p = {};
    client.connect(function(sessionId) {
        console.log('connect OK,sessionId='+sessionId);
    });

p.publish = function (destination,content) {
    client.on('connect',function (connected) {
        if (connected){
            client.publish(destination,content);
        }else {
            client.connect(function(sessionId) {
                console.log('connect OK,sessionId='+sessionId);
                client.publish(destination,content);
            });
        }
    });

};

module.exports = p;