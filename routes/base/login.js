"use strict";
let express = require('express');
let router = express.Router();
let constUtils = require('../../utils/constUtils');
let postgre = require("../../utils/postgre");
let seckeyPool = require("../../utils/seckeyPool");
let log4js = require('../../utils/logger');
/* 登录插入redis的json对象结构（从p_user表中取出)
 {"seckey":"",
 "data":[{
 "userId ":"zs"       //用户名;
 "password":"zs"      //密码
 "communityId":"xxx"  //社区id
 }]}
 */
router.use('/', function(req, res, next) {
    let log=log4js.config(__dirname+'/../../','login.js','login.log');
    let json = req.body;
    let userId = json.data[0].userId;
    let password = json.data[0].password;
    let type =  json.data[0].type; //区分是管理员还是接口上报人员
    let isInterfaceManager=false;
    let sql='';
    if(type != undefined && type=='manager'){
        sql='select ta.account as "userId",ta.password,taa.communityid as "communityId"  FROM t_admin ta left join t_admin_authority taa on ta.id=taa.adminid where ta.account = $1 ';
    }else{
        sql='select t.userid as "userId",t.pass as "password",t.id as "communityId"  FROM t_community t  where t.userid = $1 ';
        isInterfaceManager = true;
    }
    postgre.excuteSql(sql,[userId],function(result) {
        if(result.rowCount>0){
            if(password === result.rows[0].password){
                let communityId=result.rows[0].communityId;
                seckeyPool.add(userId,JSON.stringify(result.rows[0]),function (result) {
                    if(isInterfaceManager){
                        log.info('{"code":1000,"seckey":"'+result+'","communityId":"'+communityId+'"msg":"物联接口用户登录成功！","userId":'+userId+'}');
                        res.send('{"code":1000,"seckey":"'+result+'","communityId":"'+communityId+'","msg":"物联接口用户登录成功！"}');
                    }else{
                        log.info('{"code":1000,"seckey":"'+result+'","communityId":"'+communityId+'","msg":"管理员登录成功！","userId":'+userId+'}');
                        res.send('{"code":1000,"seckey":"'+result+'","communityId":"'+communityId+'","msg":"管理员登录成功！"}');
                    }

                });
            }else{
                log.info('{"code":'+constUtils.WORK_LOGIN_PASSERR+',"msg":"密码不正确！","userId":'+userId+'}');
                res.send('{"code":'+constUtils.WORK_LOGIN_PASSERR+',"msg":"密码不正确！"}');
            }
        }else{
            log.info('{"code":'+constUtils.WORK_LOGIN_NOUSER+',"msg":"用户名不存在！","userId":'+userId+'}');
            res.send('{"code":'+constUtils.WORK_LOGIN_NOUSER+',"msg":"用户名不存在！"}');
        }
    });
});

module.exports = router;
