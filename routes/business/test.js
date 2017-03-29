/**
 * Created by mumianhua on 2017/3/23.
 */

// let redisclient = require('../../utils/redis');
//
//
//     //redisclient.hset('systeminfo','c001','{systemid:\'001\',name:\'电子巡更\'}');
//      //redisclient.hset('systeminfo','c001','{systemid:"002",name:"电梯管理",model:"1"}');
//      //redisclient.hset('systeminfo','c002','{systemid:"003",name:"停车场",model:"2"}');
//     //redisclient.hset('systeminfo','c001','[{systemid:"003",name:"停车场",model:"2"},{systemid:"004",name:"可视监控",model:"3"}]');
//
//     let fetchResult = redisclient.hexists('systeminfo','c002',function(err,result){
//          //console.log(' hexists callback result is:'+result);
//
//     // redisclient.hgetall('systeminfo',function(err,result){
//     //      console.log(result);
//     //      let m=JSON.stringify(result);
//     //      console.log(m);
//     //      let m1=JSON.parse(m);
//     //      Object.keys(m1).forEach(function (item,index) {
//     //             console.log(item);
//     //      });
//         // console.log(JSON.stringify(result.toString()));
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

let path = require('path');
let jsName =__filename.substr(__dirname.length+1);
console.log('当前文件'+ jsName.replace('\.js','\.log'));

console.log((__dirname).length);
console.log(path.resolve('../..','cur','good'));
// console.log(path.join('../..',__dirname,'cur','good'));
function aa(){
    this.name='zhangsan';
    //console.log(typeof this);
    console.log(this);
}

