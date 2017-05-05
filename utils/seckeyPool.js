
/**
 * Created by lenovo on 2017/3/13.
 */
"use strict";

var redis = require("./redis");
var seckeyPool ={};
var crypto = require('crypto');
seckeyPool.add = function (userId,obj ,callback) {
    var key = createSeckey(userId);
    redis.set(key, obj,24*60*60);
    callback(key);
};
seckeyPool.get = function (seckey,callback) {
    redis.get(seckey,function (err,result) {
        if (err){
            console.log(err);
        }
        callback(result);
    },'seckeyPool.js,seckeyPool.get');
};

seckeyPool.exists = function (seckey) {
    redis.get(seckey,function (result) {
        if(result==undefined || result==null|| result==''){
            return false;
        };
    });
    return true;
};

function  createSeckey(userId) {
   var str = "jds35y6dee#%*&@dj7ff"+ userId + Date.now();
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
}

module.exports = seckeyPool;