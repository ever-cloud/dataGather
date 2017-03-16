/**
 * Created by lenovo on 2017/3/12.
 */
"use strict";

var pg = require('pg');
// 数据库配置

var pconf = require('../properties/config');
var user = pconf.get('postgre.user');
var database = pconf.get('postgre.database');
var password = pconf.get('postgre.password');
var host = pconf.get('postgre.host');
var port = pconf.get('postgre.port');
var config = {
    user:user,
    database:database,
    password:password,
    host:host,
    port:port,
    // 扩展属性
    max:20, // 连接池最大连接数
    idleTimeoutMillis:3000, // 连接最大空闲时间 3s
}
var pool = new pg.Pool(config);

var postgredb = {};
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