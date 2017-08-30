/**
 * Created by mumianhua on 2017/3/23.
 */
var path=require('path');
let constUtils = require('../../utils/constUtils');
let myjson=[{'system':'1',deviceid:'333','unit':''},{'system':'3',deviceid:'555','unit':'2'}]
function gid(json) {
    json.id=json.system+json.deviceid+json.unit;
    return json;
}
for (let jsondata of myjson){

    jsondata=gid(jsondata);
}
console.log(JSON.stringify(myjson));
let tablename='p_videomonitor_deviceinfo';
constUtils.pk[tablename].forEach(function (key,index) {
    console.log(key);
})
// var http = require('http');
// var express = require('express');
// var app = express();
// http.createServer(app).listen(3000);
// // app.listen(3000);
// app.param(['user','id'], function (req, res, next, user,id) {
//     console.log('CALLED ONLY ONCE,'+user+','+id);ext) {
//     console.log('although this matches,');
//     next();
// });
//
// app.get('/user/:id/:user', function (req, res) {
//     console.log('and this matches too'+req);
//     res.end();
// });
// console.log(constUtils[constUtils.TABLE_P_ALARM_DEVICEINFO]);
// let m;
// console.log(m==undefined);
// console.log(typeof m);
//  //
// let buf = ['1','1','1',''];
//
// console.log(buf.toString());
// console.log(typeof  buf);
// console.log(buf instanceof String);
//
// console.log(buf.length);
// buf='111';
// console.log(buf.length);
// buf='11111111111';
// console.log(buf.toString());
// let mypath=path.join(__dirname,'subpath');
// console.log(mypath);
// let ary=[1,2,3,4];
// console.log(ary instanceof Object);
// console.log(ary instanceof Array);
// let ary1=['m1',
// 'm2','m3','m4'];
// let _stat=function(communityid,types,typearrays,cb){
//     console.log(ary.indexOf(5));
// }
// _stat();
// let m=[{field:{dvr:3}},{field2:{dvr:3}}];
// for(var i=0;i<m.length;i++){
//
//     console.log(m[i]);
// }
// let haveId=false;
// try{
//     Object.keys(jsondate).forEach((key,index)=>{
//         if(key.toLowerCase()=='id'){
//             haveId=true;
//             foreach.break=new Error("normal Stop");
//         }
//     });
// }catch(e){
//            if(e.message==="foreach is not defined"){
//                }else throw e;
// }
//
// if(haveId){
//
// }else{
//
// }
//
// console.log(ary+':'+ary1);
// let m2=['m2','m4'];
// let m3=[];
// ary1.forEach(function(ary1item,index){
//     for(var i=0;i<m2.length;i++){
//         if(ary1item ==m2[i]){
//             m3.push(ary[index]);
//             break;
//         }
//     }
// });
// ary1=m2;
// ary=m3;
// console.log(ary1+':'+ary);
// let p=url.parse('http://www.baidu.com?name=zhangsan');
// console.log(p);
//  let redis = require('../../utils/redis');
//  let m={};
// redis.hget('stat:c:111','alarm',(result)=>{
//        let json=JSON.parse(result);
//        m.elevator=json.elevator+4;
//     });
// redis.hget('stat:r:11','alarm',(result)=>{
//     console.log(m);
// });
//  // let async = require('async');
// let count={online:0};
// console.log((__dirname+'/systemstatistics'));
// redis.hgetall('stat:r:11',function(result){
//          console.log(typeof result);
//          count.online=3;
//          console.log('内部的值'+JSON.stringify(count));
//          // console.log(m);
//          // let m1=JSON.parse(m);
//          Object.keys(result).forEach(function (item,index) {
//                 console.log('key:'+item+';value:'+typeof result[item]);
//          });
//
// });
// redis.hgetall('stat:r:12',function(result){
//     console.log('b内部的值2'+JSON.stringify(count));
//     count.online=4;
//     console.log('e内部的值2'+JSON.stringify(count));
//     // console.log(m);
//     // let m1=JSON.parse(m);
//     // Object.keys(m1).forEach(function (item,index) {
//     //        console.log(item);
//     // });
// })
// redis.hget('deptdict:111','regionid',(deptid)=>{
//     redis.hgetall('stat:r:'+deptid,(regionstats)=>{
//         console.log('c内部的值3'+JSON.stringify(count));
//         count.online=6;
//         console.log('d内部的值3'+JSON.stringify(count));
//     });
//
// });
// console.log('值'+count.online);
// let a={};
// a['portal']={};
// a['portal']['sum']=3;
// console.log(a);
// let m=[];
// m.push(7,3,4,8,5,9);
// console.log(m);
// m.sort(function(a,b){
//     //console.log(a+':'+b);
//     return a<b;
// });
//
// console.log(m);
// m.reverse();
// console.log(m);
// m.shift()
// console.log(m);
//
// m.pop();
// console.log(m);

//aSon.name='三';
// console.log(aSon.name);
// aSon.eat('一二','米饭');
// aSon.drink('一一','水');

//
//
//     //redisclient.hset('systeminfo','c001','{systemid:\'001\',name:\'电子巡更\'}');
//      //redisclient.hset('systeminfo','c001','{systemid:"002",name:"电梯管理",model:"1"}');
//      //redisclient.hset('systeminfo','c002','{systemid:"003",name:"停车场",model:"2"}');
//     //redisclient.hset('systeminfo','c001','[{systemid:"003",name:"停车场",model:"2"},{systemid:"004",name:"可视监控",model:"3"}]');
//
    //let fetchResult = redisclient.hexists('systeminfo','key\*',function(err,result){
         //console.log(' hexists callback result is:'+result);

    // redisclient.hgetall('p_syst'+'*',function(err,result){
    //      //console.log(result);
    //      let m=JSON.stringify(result);
    //      console.log(m);
        //  let m1=JSON.parse(m);
        //  Object.keys(m1).forEach(function (item,index) {
        //         console.log(item);
        //  });
        // console.log(JSON.stringify(result.toString()));
        // });
//     //console.log('result is '+ fetchResult);
// let fetchResult2 = redisclient.hkeys('systeminfo',function(err,result){
//     console.log('hkeys callback result is:'+result);
//
//     // redisclient.hgetall('systeminfo',function(err,result){
//     //      console.log(result);
//     //      let m=JSON.stringify(result);
//     //      console.log(m);
//     //      let m1=JSON.parse(m);
//     //      Object.keys(m1).forEach(function (item,index) {
//     //             console.log(item);
//     //      });
//     // console.log(JSON.stringify(result.toString()));
// });
// let myarr =[];
// myarr.push({name:'zhangsan',sex:'w'});
// myarr.push({name:'zhangsan1',sex:'m'});
// myarr.push({name:'zhangsan2',sex:'w'});
// myarr.push({name:'zhangsan3',sex:'m'});
// console.log(JSON.stringify(myarr));
//let log = reuqire('morgan');
// let path = require('path');
// let moment = require('moment');
// let eday = moment().format('YYYY-MM-DD');
// let myPath = path.join(__dirname,'myfolder/'+eday);
// console.log('curpath'+myPath);
// console.log('curexecPath'+process.execPath)
// console.log('curDirname'+__dirname)
// console.log('curexecCmd'+this.name)
//
// let path = require('path');
// let jsName =__filename.substr(__dirname.length+1);
// console.log('当前文件'+ jsName.replace('\.js','\.log'));
//
// console.log((__dirname).length);
// console.log(path.resolve('../..','cur','good'));
// // console.log(path.join('../..',__dirname,'cur','good'));
// function aa(){
//     this.name='zhangsan';
//     //console.log(typeof this);
//     console.log(this);
// }

// function foo(){
//     function bar(){
//
//         i=3;
//         console.log(i);
//     }
//     for(let i=0;i<10;i++){
//         bar();
//     }
// }
// foo();
//     function initstat(){
//     this.sum={"monitor":0,"elevator":0,"intercom":0,"location":0,"gate":0,"info":0,"intrusion":0,"park":0,"broadcast":0,"patrol":0};    //设备总数
//     this.bug={"monitor":0,"elevator":0,"intercom":0,"location":0,"gate":0,"info":0,"intrusion":0,"park":0,"broadcast":0,"patrol":0};    //故障设备总数
//     this.alarm={"elevator":0,"intrusion":0,"intercom":0,"location":0};    //实时警报
//     this.monitor={"online":0,"camera":{"sum":0,"bug":0},"dvr":{"sum":0,"bug":0}};    //视频监控
//     this.elevator={"online":0,"sum":0,"alarm":0,"bug":0};    //电梯监控
//     this.intercom={online:0,sum:0,alarm:0,bug:0};    //可视对讲
//     this.location={"online":0,"sum":0,"alarm":0,"bug":0};    //人员定位
//     this.gate={"online":0,"sum":0,"alarm":0,"card":0,"bug":0};       //门禁
//     this.info={"online":0,"sum":0,"bug":0};       //信息发布
//     this.intrusion={"online":0,"sum":0,"alarm":0};    //入侵报警
//     this.park={"online":0,"sum":0,"in":0,"out":0};       //车辆管理
//     this.broadcast={"online":0,"onlinearea":0,"areasum":0,"onlinesum":0};    //广播通讯
//     this.patrol={"online":0,"sum":0,"yet":2,"not":23};
//     this.stat={};
//     this.stat.sum=this.sum;
//     this.stat.bug=this.bug;
//
//     this.ininstatfun=()=>{
//      let that=this.stat;
//      Object.keys(that).forEach((key,index)=>{
//           console.log(key);
//         });
//         };
//
// }
// let m=[];
//     let m1={name:1,sex:'m'};
//     let m2={name:2,sex:'wm'};
//     m.push(m1);
//     m.push(m2);
//     console.log(m.length);
// let inits= new initstat();
//     let m={};
//     m['stat']=JSON.parse(JSON.stringify(inits.stat));
//     console.log(m['stat']);
//
//     console.log(m['stat']['sum']);
//     m['stat'].sum=;
// console.log(m['stat']);
// inits.monitor.online=1;
// console.log(inits.stat['su'+'m']==undefined);
// redis.hset('test','monitor',JSON.stringify(inits.monitor));
// async.each([0,1,2,3,4,5],(data,callback)=>{
//    let m= redis.hget('test','monitor',(result)=>{
//         inits.monitor=JSON.parse(result);
//        console.log('one result:'+data+':'+JSON.stringify(inits.monitor));
//         inits.monitor.online+=1;
//        console.log('loop inner json:'+JSON.stringify(inits.monitor));
//     });
//
//     console.log('loop outer json:'+JSON.stringify(inits.monitor));
//
// });
// console.log('outer:'+JSON.stringify(inits.monitor));

// });
// let m=['1'];
// console.log(m instanceof Array && m.length>0);
//
// let m={"dvr":{"sum":"3"}};
// m.dvr1=6;
// console.log(m);
// m.dvr.sum=m.dvr.sum+1;
// console.log(JSON.stringify(m));
//去掉html标签
//
// function removeHtmlTab(tab) {
//     return tab.replace(/<[^<>]+?>/g,'');//删除所有HTML标签
// }
// //普通字符转换成转意符
//
// function html2Escape(sHtml) {
//     return sHtml.replace(/[<>&"]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c];});
// }
// //转意符换成普通字符
//
// function escape2Html(str) {
//     var arrEntities={'lt':'<','gt':'>','nbsp':' ','amp':'&','quot':'"'};
//     return str.replace(/&(lt|gt|nbsp|amp|quot);/ig,function(all,t){return arrEntities[t];});
// }
// // &nbsp;转成空格
//
// function nbsp2Space(str) {
//     var arrEntities = {'nbsp' : ' '};
//     return str.replace(/&(nbsp);/ig, function(all, t){return arrEntities[t]})
// }
// //回车转为br标签
//
// function return2Br(str) {
//     return str.replace(/\r?\n/g,"<br />");
// }
// //去除开头结尾换行,并将连续3次以上换行转换成2次换行
//
// function trimBr(str) {
//     str=str.replace(/((\s|&nbsp;)*\r?\n){3,}/g,"\r\n\r\n");//限制最多2次换行
//     str=str.replace(/^((\s|&nbsp;)*\r?\n)+/g,'');//清除开头换行
//     str=str.replace(/((\s|&nbsp;)*\r?\n)+$/g,'');//清除结尾换行
//     return str;
// }
// // 将多个连续空格合并成一个空格
//
// function mergeSpace(str) {
//     str=str.replace(/(\s|&nbsp;)+/g,' ');
//     return str;
// }
// let m='{&quot;selectAreaUrl&quot;:&quot;/door/selectArea&quot;,&quot;getPwdUrl&quot;:&quot;/door/getPwd&quot;}';
// console.log(JSON.parse(m));
