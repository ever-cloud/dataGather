/**
 * Created by lenovo on 2017/3/12.
 */
"use strict";

let pg = require('pg');
let moment = require('moment');
let log4js = require('./logger');
let jsName = __filename.substr(__dirname.length+1);
let logName = jsName.replace('\.js','\.log');
// 数据库配置

let pconf = require('../properties/config');
let user = pconf.get('postgre.user');
let database = pconf.get('postgre.database');
let password = pconf.get('postgre.password');
let host = pconf.get('postgre.host');
let port = pconf.get('postgre.port');
let config = {
    user:user,
    database:database,
    password:password,
    host:host,
    port:port,
    // 扩展属性
    max:20, // 连接池最大连接数
    idleTimeoutMillis:3000, // 连接最大空闲时间 3s
};
let pool = new pg.Pool(config);

let postgredb = {};
/**
 * 查询数据
 * @param sql
 * @param params
 * @param callback
 * @return callBack(err,result)
 */
postgredb.excuteSql = function(sql,params, callback){
    pool.connect(function(err, client, done) {
        if(err) {
            return console.error('数据库连接出错!请检查链接情况！', err);
        }
        if(sql !=undefined && sql != null){

            let optType = sql.toString().toLowerCase().includes("insert")?'Insert':sql.toString().includes("update")?'Update':sql.toString().includes("delete")?'Delete':sql.toString().includes("select")?'Select':'';
            console.log(optType+ ' Sql Begin Execute!');
            console.log('Execute Sql:'+sql+';Params:'+params);
            client.query(sql,params, function(err, result) {
                done();// 释放连接（将其返回给连接池）
                if(err) {
                    return console.error('数据库操作出错,操作类型：'+optType+'；语句：'+sql+';参数：'+params, err);
                }
                console.log(optType+' Execute Success;Current Time:'+new Date().toLocaleString());
                console.log(optType+' Recorde Num: ' + result.rowCount + ' Row!');
                callback(result);
                console.log(optType+' Is End!');
            });
        }
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
    let log=log4js.config(__dirname+'/../',jsName,logName);
    let result_json = {};
    let keystr_name = '';
    let keystr_value = '';
    let upsertsql='';
    let values = [];
    let valueIndex = 0;
    let constraint=tablename+'_pkey';
    if((typeof jsondate)=='object' && Object.keys(jsondate).length>0){
        let haveId=false;
        try{
            Object.keys(jsondate).forEach((key,index)=>{
                if(key.toLowerCase()=='id'){
                    haveId=true;
                    foreach.break=new Error("normal Stop");
                }
            });
        }catch(e){
            if(e.message==="foreach is not defined"){
            }else throw e;
        }

        if(haveId){
            Object.keys(jsondate).forEach(function(key,index){
                if((','+keystr_name).indexOf(','+key.toLowerCase()+',')<0){
                    valueIndex += 1;
                    keystr_name += key.toLowerCase()+',';
                    keystr_value += '$'+ valueIndex + ',';
                    if(key !='id'){
                        upsertsql+=key.toLowerCase()+'=EXCLUDED.'+key.toLowerCase()+ ',';
                    }
                    values.push(jsondate[key]);
                }
            });
            if((typeof jsonextend)=='object' && Object.keys(jsonextend).length>0) {

                Object.keys(jsonextend).forEach(function (key, index) {
                    if((','+keystr_name).indexOf(','+key.toLowerCase()+',')<0) {
                        valueIndex += 1;
                        keystr_name += key.toLowerCase() + ',';
                        keystr_value += '$' + valueIndex + ',';
                        if(key !='id'){
                            upsertsql+=key.toLowerCase()+'=EXCLUDED.'+key.toLowerCase()+ ',';
                        }
                        values.push(jsonextend[key]);
                    }
                });
            }
            keystr_name=keystr_name.substr(0,keystr_name.length-1);
            keystr_value=keystr_value.substr(0,keystr_value.length-1);
            upsertsql=upsertsql.substr(0,upsertsql.length-1);
            result_json['sql']='insert into '+tablename+'('+keystr_name+') values('+keystr_value+') ON CONFLICT(id) do update set '+upsertsql;
            result_json['values']=values;
        }else{
            console.log('本条数据id不存在，不能入库，插入（更新）表',tablename,'上传数据',JSON.stringify(jsondate),'时间：', moment().format('YYYY-MM-DD HH:mm:ss'));
            log.info('本条数据id不存在，不能入库，插入（更新）表',tablename,'上传数据',JSON.stringify(jsondate),'时间：', moment().format('YYYY-MM-DD HH:mm:ss'));
        }
    }
    //callback(resultJson);
    //console.log('insert sqlJson is:'+result_json);
    return result_json;
};

module.exports = postgredb;