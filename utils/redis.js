/**
 * Created by lenovo on 2017/3/12.
 */
"use strict";
var redisdb = {};
var redis = require("redis");
var client =  redis.createClient('6379', '192.168.3.239');

client.on("error", function (err) {
    console.log("Error :" , err);
});

// client.on('connect', function(){
//     console.log('Redis连接成功.');
// });

/**
 * 添加string类型的数据
 * @param key 键
 * @params value 值
 * @params expire (过期时间,单位秒;可为空，为空表示不过期)
 * @param callBack(err,result)
 */
redisdb.set = function(key, value, expire){

    client.set(key, value, function(err, result){

        if (err) {
            console.log(err);
            return;
        }
        if (!isNaN(expire) && expire > 0) {
            client.expire(key, parseInt(expire));
        }
        if (result){
            console.log(result);
        }
    });
}

/**
 * 查询string类型的数据
 * @param key 键
 * @param callBack(err,result)
 */
redisdb.get = function(key){

    return  client.get(key, function(err,result){

        if (err) {
            console.log(err);
            return;
        }
        return result;
    });
}
/**
 * 添加string类型的数据
 * @param key 键
 * @params value 值
 * @params expire (过期时间,单位秒;可为空，为空表示不过期)
 * @param callBack(err,result)
 */
redisdb.hset = function(key,field, value, expire){

    client.hset(key, field, value, function(err, result){

        if (err) {
            console.log(err);
            return;
        }
        if (!isNaN(expire) && expire > 0) {
            client.expire(key, parseInt(expire));
        }
        if (result){
            console.log(result);
        }
    });
}

/**
 * 查询Map类型的数据
 * @param key 键
 * @param callBack(err,result)
 */
redisdb.hget = function(key,field){

    return client.hget(key,field, function(err,result){

        if (err) {
            console.log(err);
            return;
        }
        return result;
    });
}
/**
 * 查询Map类型的数据
 * @param key 键
 * @param callBack(err,result)
 */
redisdb.hget = function(key){

    return client.get(key, function(err,result){

        if (err) {
            console.log(err);
            return;
        }
        return result;
    });
}

module.exports = redisdb;