/**
 * Created by lenovo on 2017/3/12.
 */
"use strict";
var postgredb = {};
var pg = require('pg');
// 数据库配置
var config = {
    user:"postgres",
    database:"datagather",
    password:"postgres",
    host:"192.168.3.239",
    port:5432,

    // 扩展属性
    max:20, // 连接池最大连接数
    idleTimeoutMillis:3000, // 连接最大空闲时间 3s
}
var pool = new pg.Pool(config);

/**
 * 查询数据
 * @param sql
 * @param params
 * @param callBack(err,result)
 */
postgredb.excuteSql = function(sql,params, callback){
    pool.connect(function(err, client, done) {
        if(err) {
            return console.error('数据库连接出错', err);
        }
        client.query(sql,params, function(err, result) {
            done();// 释放连接（将其返回给连接池）
            if(err) {
                return console.error('数据库操作出错', err);
            }
            callback(result);
        });
    });
};

module.exports = postgredb;