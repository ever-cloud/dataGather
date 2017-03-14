"use strict";
var express = require('express');
var router = express.Router();
var postgre = require("../../utils/postgre");
var seckeyPool = require("../../utils/seckeyPool");

/* 登录的json对象结构
 {"seckey":"",
 "data":[{
 "userId ":"zs"  //用户名;
 "password”:"zs"         //密码
 }]}
 */
router.use('/', function(req, res, next) {
    var json = req.body;
    var userId = json.data[0].userId;
    var password = json.data[0].password;
    postgre.excuteSql("SELECT password FROM p_user where name = $1 ",[userId],function(result) {
        if(result.rowCount>0){
            if(password === result.rows[0].password){
                seckeyPool.add(userId,function (result) {
                    res.send('{"code":1001,"seckey":"'+result+'","msg":"登录成功！"}');
                });

            }else{
                res.send('{"code":4002,"msg":"密码不正确！"}');
            }
        }else{
            res.send('{"code":4001,"msg":"用户名不存在！"}');
        }
    });
});

module.exports = router;
