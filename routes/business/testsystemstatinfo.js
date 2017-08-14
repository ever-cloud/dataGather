"use strict";
let express = require('express');
let router = express.Router();
let Stomp = require('stomp-client');
let host = '192.168.3.239';
let port = '61613';
let user = 'admin';
let pwd  = 'admin';
let constUtils = require('../../utils/constUtils');
let destination1 = constUtils.TOPIC_STATISTICS_COMMUNITY;
let destination2 = constUtils.TOPIC_STATISTICS_REGION;
let destination3 = constUtils.TOPIC_STATISTICS_GROUP;
let destination4 = constUtils.TOPIC_STATISTICS_SUPER;
let destinations=[destination1,destination2,destination3,destination4];
let jsName = __filename.substr(__dirname.length+1);
let logName = jsName.replace('\.js','\.log');

let client = new Stomp(host,port,user,pwd);
var connectCallback = function(sessionId) {
    console.log('connectCallback:sessionId is:'+sessionId);
    for(var i=0;i<4;i++){
        var subscription = client.subscribe(destinations[i], onMessage);
        // console.log('_eventsCount:'+subscription._eventsCount);
        // console.log('user:'+subscription.user);
        // console.log('pass:'+subscription.pass);
        // console.log('address:'+subscription.address);
        // console.log('port:'+subscription.port);
        // console.log('version:'+subscription.version);
        // console.log('_retryNumber:'+subscription._retryNumber);
    }

};
var onMessage = function(message){
    console.log('消息获取：'+message);
    if (message.data) {
        console.log(typeof message);

    } else {
        console.log("got empty message");
    }
};
var errorCallback = function(error){
    console.log(error.headers.message);
};

client.connect(connectCallback,errorCallback);

