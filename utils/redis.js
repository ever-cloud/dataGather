/**
 * Created by lenovo on 2017/3/12.
 */
"use strict";
let redisdb = {};
let redis = require("redis");
var async = require('async');
let rds_opt={auth_pass:'redis01@test'};
// let client =  redis.createClient('6379', '127.0.0.1');
let client =  redis.createClient('6379', '192.168.3.239');
// let client =  redis.createClient('6379', '101.37.169.160',rds_opt);
//  let client =  redis.createClient('6379', '192.168.1.106');
// client.auth('redis01@test',function () {
//     console.log('密码认证通过')
// });
client.on("error", function (err) {
    console.log("Error :" , err);
});

// client.on('connect', function(){
//     //client.set('author','An guang yin',redis.print);
//     client.get('author',redis.print);
//     console.log('Redis连接成功.');
// });

/**
 * 添加string类型的数据
 * @param key 键
 * @param value 值
 * @param expire (过期时间,单位秒;可为空，为空表示不过期)
 * @return callback(err,result)
 */
redisdb.set = function(key,value,expire){

    client.set(key, value, function(err, result){

        if (err) {
            console.log(err);
            return false;
        }
        if (!isNaN(expire) && expire > 0) {
            client.expire(key, parseInt(expire));
            console.log('redis set expire execute success!set  item is:'+key + ':'+result+';expire time is:'+expire +' seconds!');
        }
            console.log('redis set execute success!set item is:'+key + ':'+result);
    });
};

/**
 * 查询string类型的数据
 * @param key 键
 * @param callback(err,result)
 */
redisdb.get = function(key,callback,note){
      client.get(key, function(err,result){
        if (err) {
            console.log(err);
            callback(err,null);
            return;
        }
        if(note !=undefined){
            console.log('redis get execute success!get item is:' + key + '=>' + result+'!提示：'+note);
        }else{
            console.log('redis get execute success!get item is:' + key + '=>' + result);
        }
        callback(null,result);
    });
};
/**
 * 查询所有key
 * @param key* 键,可通配*，？
 * @param callback(err,result)
 */
redisdb.keys = function(regkey,callback){
      client.keys(regkey, function(err,keys){
        if (err) {
            console.log(err);
            callback(err,null);
            return;
        }
        console.log('redis keys execute success!get keys is:' + regkey + '=>' + keys);
        callback(keys);
    });
};

/**
 * 删除键值
 * @param key 键
 * @return callback(err,result)
 */
redisdb.del = function(key){
    client.del(key,function (err,result) {
        if (err) {
            console.log(err);
            return false;
        }
        console.log('redis del execute success!delete item key is:'+key+' and delete count is:'+result);
    })
};

/**
 * 添加string类型的数据
 * @param key 键
 * @param field 子键
 * @param value 值
 * @param expire (过期时间,单位秒;可为空，为空表示不过期)
 * @return callback(result)
 */
redisdb.hset = function(key,field,value,expire){

    client.hset(key, field, value, function(err, result){

        if (err) {
            console.log(err);
            return;
        }
        if (!isNaN(expire) && expire > 0) {
            client.expire(key, parseInt(expire));

        }
        let itemMsg = key+':'+field+':'+value;
        console.log(result==1?'redis hset execute insert success! item is:'+itemMsg:result==0?'redis hset execute update success! item is:'+itemMsg:'redis hset execute false! item is:'+itemMsg);
    });
};

/**
 * 获取Hash类型的某键某子键的数据
 * @param key 键
 * @param field 子键
 * @param callback(err,result)
 */
redisdb.hget = function(key,field,callback){
     client.hget(key, field,function(err,result){
        if (err) {
            console.log(err);
            callback(err,null);
            return false;
        }
         console.log('redis hget execute success!hget item is:' + key+':'+field + '=>' + result);
         callback(result);

    });
};
/**
 * 获取Hash类型某键的所有数据
 * @param key 键
 * @param callback(err,result)
 */
redisdb.hgetall = function(key,callback){
     client.hgetall(key,function(err,result){
        if (err) {
            console.log('hgetall operation is error,err result:'+err);
            callback(err,null);
            return false;
        }
         console.log('redis hgetall execute success!hgetall item is:' + key+ '=>' + result);
         callback(result);
    });
};

/**
 * 获取Hash类型某键的包含的键值对数量
 * @param key 键
 * @param callback(err,result)
 */
redisdb.hlen = function(key,callback){
     client.hlen(key,function(err,result){
        if (err) {
            console.log(err);
            callback(err,null);
            return false;
        }
         console.log('redis hlen execute success!item hlen is:' + key+ '=>' + result);
         callback(null,result);
    });
};

/**
 * 获取Hash类型某键的包含的所有键
 * @param key 键
 * @param callback(err,result)
 */
redisdb.hkeys = function(key,callback){
     client.hkeys(key,function(err,result){
        if (err) {
            console.log(err);
            callback(err,null);
            return false;
        }
         console.log('redis hkeys execute success!item hkeys is:' + key+ '=>' + result);
         callback(result);
    });
};
/**
 * 获取Hash类型某键的包含的所有值
 * @param key 键
 * @param callback(err,result)
 */
redisdb.hvals = function(key,callback){
     client.hvals(key,function(err,result){
        if (err) {
            console.log(err);
            callback(err,null);
            return false;
        }
         console.log('redis hvals execute success!item hvals is:' + key+ '=>' + result);
         callback(result);
    });
};

/**
 * 删除Hash类型的某键某子键的数据
 * @param key 键
 * @param field 子键
 */
redisdb.hdel = function(key,field){
    client.hdel(key,field,function (err,result){
        if (err) {
            console.log(err);
            return false;
        }
        console.log('redis del execute success!delete item\'s count is:'+result);

    });
};
/**
 * 判断有无此键值,有返回1 无返回0
 * @param key 键
 * @param callback(err,result)
 */
redisdb.exists = function(key,callback){
    client.exists(key,function (err,result) {
        if (err) {
            console.log(err);
            callback(err,null);
            return false;
        }
        console.log(result==1?'redis exists execute '+key+' is true!':result==0?'redis exists execute '+key+' is false!':'redis exists execute false!');
        callback(null,result);
    })
};
/**
 * 判断给定键是否在散列中,有返回1 无返回0
 * @param key 键
 * @param field 子键
 * @param callback(err,result)
 */
redisdb.hexists = function(key,field,callback){
    client.hexists(key,field,function (err,result) {
        if (err) {
            console.log(err);
            callback(err,null);
            return false;
        }
        console.log(result==1?'redis hexists execute '+key+':'+field +' is true!':result==0?'redis hexists execute '+key+':'+field +' is false!':'redis hexists execute false!');
        callback(null,result);
    });

};

/**
 * 判断给定键是否在,有返回1 无返回0
 * @param key 键
 * @param callback(err,result)
 */
redisdb.exists = function(key,callback){
    client.exists(key,function (err,result) {
        if (err) {
            console.log(err);
            callback(err,null);
            return false;
        }
        console.log(result==1?'redis exists execute '+key+' is true!':result==0?'redis exists execute '+key +' is false!':'redis exists execute false!');
        callback(result);
    });

};

module.exports = redisdb;