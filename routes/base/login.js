"use strict";
var express = require('express');
var router = express.Router();
var postgre = require("../../utils/postgre");
var seckeyPool = require("../../utils/seckeyPool");

/* 登录插入redis的json对象结构（从p_user表中取出)
 {"seckey":"",
 "data":[{
 "userId ":"zs"       //用户名;
 "password":"zs"      //密码
 "communityId":"xxx"  //社区id
 }]}
 */
router.use('/', function(req, res, next) {
    var json = req.body;
    var userId = json.data[0].userId;
    var password = json.data[0].password;
    postgre.excuteSql('SELECT userid as "userId",password,deptId as "communityId"  FROM p_user where userid = $1 ',[userId],function(result) {
        if(result.rowCount>0){
            if(password === result.rows[0].password){
                seckeyPool.add(userId,JSON.stringify(result.rows[0]),function (result) {
                    res.send('{"code":1001,"seckey":"'+result+'","msg":"登录成功！"}');
                });

            }else{
                res.send('{"code":'+constUtils.WORK_LOGIN_PASSERR+',"msg":"密码不正确！"}');
            }
        }else{
            res.send('{"code":'+constUtils.WORK_LOGIN_NOUSER+',"msg":"用户名不存在！"}');
        }
    });
});

module.exports = router;
