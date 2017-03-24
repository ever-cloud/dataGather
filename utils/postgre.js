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
 * @return callBack(err,result)
 */
postgredb.excuteSql = function(sql,params, callback){
    pool.connect(function(err, client, done) {
        if(err) {
            return console.error('数据库连接出错!请检查链接情况！', err);
        }
        var optType = sql.toString().toLowerCase().includes("insert")?'Insert':sql.toString().includes("update")?'Update':sql.toString().includes("delete")?'Delete':sql.toString().includes("select")?'Select':'';
        console.log(optType+ ' Sql Begin Execute!');
        console.log('Execute Sql:'+sql+';Params:'+params);
        client.query(sql,params, function(err, result) {
            done();// 释放连接（将其返回给连接池）
            if(err) {
                return console.error('数据库操作出错,操作类型：'+optType, err);
            }
            console.log(optType+' Execute Success;Current Time:'+new Date().toLocaleString());
            console.log(optType+' Recorde Num: ' + result.rowCount + ' Row!');
            callback(result);
            console.log(optType+' Is End!');
        });
    });
};

/**
 * 根据表名和内容得到拼接的insert语句及对应插入字段的数组
 * @param tablename 表名
 * @param jsondate json格式中date内的数据内容,如{id:"001",systemid:"1"}
 * @param jsonextend json格式中需要拼接到date内的外部数据内容，如{community:"001",opter:"zhangsan",optDate:"2017-4-1"}
 * @return result_json 返回包含拼接的Sql语句 及对应参数值数组
 */
postgredb.getInsertDBSql=function(tablename,jsondate,jsonextend){
    var result_json = {};
    var keystr_name = '';
    var keystr_value = '';
    var values = [];
    var valueIndex = 0;
    if((typeof jsondate)=='object' && Object.keys(jsondate).length>0){

        Object.keys(jsondate).forEach(function(key,index){
            valueIndex += 1;
            keystr_name += key.toLowerCase()+',';
            keystr_value += '$'+ valueIndex + ',';
            values.push(jsondate[key]);
        });
        if((typeof jsonextend)=='object' && Object.keys(jsonextend).length>0) {

            Object.keys(jsonextend).forEach(function (key, index) {
                valueIndex += 1;
                keystr_name += key.toLowerCase() + ',';
                keystr_value += '$' + valueIndex + ',';
                values.push(jsonextend[key]);
            });
        }
        keystr_name=keystr_name.substr(0,keystr_name.length-1);
        keystr_value=keystr_value.substr(0,keystr_value.length-1);
        result_json['sql']='insert into '+tablename+'('+keystr_name+') values('+keystr_value+')';
        result_json['values']=values;
    }
    //callback(resultJson);
    //console.log('insert sqlJson is:'+result_json);
    return result_json;
};

module.exports = postgredb;