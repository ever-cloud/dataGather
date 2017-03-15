
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
seckeyPool.get = function (userId,callback) {
    var key = createSeckey(userId);
    var value =redis.get(key);
    callback(value);
};

seckeyPool.exists = function (seckey) {
    var value = redis.get(seckey);
    if(value==undefined || value==null||value==''){
       return false;
    };
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