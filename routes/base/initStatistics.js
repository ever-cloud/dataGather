"use strict";
let publisher = require("../../mq/publish");
let constUtils = require('../../utils/constUtils');
let postgre = require("../../utils/postgre");
let redis = require("../../utils/redis");
/**
 * //初始化统计物联系统，按社区，大区，集团，海尔存放，放到内存和redis中
 */

function initStatistics(){

    this.sum={"monitor":0,"elevator":0,"intercom":0,"location":0,"gate":0,"info":0,"intrusion":0,"park":0,"broadcast":0,"patrol":0};    //设备总数
    this.bug={"monitor":0,"elevator":0,"intercom":0,"location":0,"gate":0,"info":0,"intrusion":0,"park":0,"broadcast":0,"patrol":0};    //故障设备总数
    this.alarm={"elevator":0,"intrusion":0,"intercom":0,"location":0};    //实时警报
    this.monitor={"online":0,"camera":{"sum":0,"bug":0},"dvr":{"sum":0,"bug":0}};    //视频监控
    this.elevator={"online":0,"sum":0,"alarm":0,"bug":0};    //电梯监控
    this.intercom={online:0,sum:0,alarm:0,bug:0};    //可视对讲
    this.location={"online":0,"sum":0,"alarm":0,"card":0,"bug":0};    //人员定位
    this.gate={"online":0,"sum":0,"alarm":0};       //门禁
    this.info={"online":0,"sum":0,"bug":0};       //信息发布
    this.intrusion={"online":0,"sum":0,"alarm":0};    //入侵报警
    this.park={"online":0,"sum":0,"in":0,"out":0};       //车辆管理
    this.broadcast={"online":0,"onlinearea":0,"areasum":0,"onlinesum":0};    //广播通讯
    this.patrol={"online":0,"sum":0,"yet":0,"not":0};     //电子巡更
    this.devicesta={"online": 0,"offline": 0,"bug": 0,"nobug": 0};    //设备状态统计
    this.stat={};
    this.stat.sum=this.sum;
    this.stat.bug=this.bug;
    this.stat.alarm=this.alarm;
    this.stat.monitor=this.monitor;
    this.stat.elevator=this.elevator;
    this.stat.intercom=this.intercom;
    this.stat.location=this.location;
    this.stat.gate=this.gate;
    this.stat.info=this.info;
    this.stat.intrusion=this.intrusion;
    this.stat.park=this.park;
    this.stat.broadcast=this.broadcast;
    this.stat.patrol=this.patrol;
    this.stat.devicesta=this.devicesta;
    this.systemtypes=['','monitor','intercom','intrusion','info','gate','park','elevator','broadcast','patrol','location'];
    //统计信息存放在redis的hset中格式key:stat:(c/r/g/h:)deptid,field:统计code例如sum,bug或各系统简称monitor，value:统计内容比如：{"monitor":123,"elevator":123,"intercom":123,"location":123,"gate":123,"info":123,"intrusion":123,"park":123,"broadcast":123,"patrol":123}
    this.createStatistics=()=>{
        console.log('现在初始化部门id字典信息！根据字典初始化系统在线统计');
        //整理部门id字典存放reids，以便后面统计调用（目前统计status为3即完成）
        let deptidSql= 'select  c.id "communityid",r.id as "regionid",g.id as "groupid",\'1\' as "haierid" from t_community c,t_region r,t_group g where c.status=\'3\' and c.regionid=r.id and r.groupid=g.id  order by g.id,r.id,c.id';
        let thatstat=this.stat;
        let systemtypes=this.systemtypes;
        let middleObj={};
        postgre.excuteSql(deptidSql,[],function (result){
            if(result.rowCount>0){
                result.rows.forEach(function(data){
                    redis.hset('deptdict:'+data.communityid,'regionid',data.regionid);
                    redis.hset('deptdict:'+data.communityid,'groupid',data.groupid);
                    redis.hset('deptdict:'+data.communityid,'haierid',data.haierid);
                    //初始赋值0
                    middleObj['stat:c:'+data.communityid]=JSON.parse(JSON.stringify(thatstat));
                    if(middleObj['stat:r:'+data.regionid]==undefined)middleObj['stat:r:'+data.regionid]=JSON.parse(JSON.stringify(thatstat));
                    if(middleObj['stat:g:'+data.groupid]==undefined)middleObj['stat:g:'+data.groupid]=JSON.parse(JSON.stringify(thatstat));
                    if(middleObj['stat:h:'+data.haierid]==undefined)middleObj['stat:h:'+data.haierid]=JSON.parse(JSON.stringify(thatstat));
                    Object.keys(thatstat).forEach(function(key,index){
                        redis.hset('stat:c:'+data.communityid,key,JSON.stringify(middleObj['stat:c:'+data.communityid][key]));
                        redis.hexists('stat:r:'+data.regionid,key,(err,result)=>{
                            if(result===0)
                                redis.hset('stat:r:'+data.regionid,key,JSON.stringify(middleObj['stat:r:'+data.regionid][key]));
                        });
                        redis.hexists('stat:g:'+data.groupid,key,(err,result)=>{
                            if(result===0)
                                redis.hset('stat:g:'+data.groupid,key,JSON.stringify(middleObj['stat:g:'+data.groupid][key]));
                        });
                        redis.hexists('stat:h:'+data.haierid,key,(err,result)=>{
                            if(result===0)
                                redis.hset('stat:h:'+data.haierid,key,JSON.stringify(middleObj['stat:h:'+data.haierid][key]));
                        });
                    });
                });
                result.rows.forEach(function(data){
                    //系统统计在线
                    redis.hget(constUtils.TABLE_P_SYSTEMINFO,data.communityid,(systemInfoList_data)=>{
                        if(systemInfoList_data !=null){
                            console.log('现在处理的系统是：'+systemInfoList_data);
                            let systemInfoList=JSON.parse(systemInfoList_data);
                            systemInfoList.forEach((systeminfo,index)=>{
                                let communitySum = 0;
                                if(systeminfo.status=='null' || systeminfo.status=='1'){
                                    communitySum=1;
                                    middleObj['stat:c:'+data.communityid][systemtypes[systeminfo.sid]].online=communitySum;
                                    redis.hset('stat:c:'+data.communityid,systemtypes[systeminfo.sid],JSON.stringify(middleObj['stat:c:'+data.communityid][systemtypes[systeminfo.sid]]));
                                    redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                            middleObj['stat:r:' + deptid][systemtypes[systeminfo.sid]].online += communitySum;
                                            redis.hset('stat:r:' + deptid, systemtypes[systeminfo.sid], JSON.stringify(middleObj['stat:r:' + deptid][systemtypes[systeminfo.sid]]));
                                        });
                                    redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                        middleObj['stat:g:' + deptid][systemtypes[systeminfo.sid]].online += communitySum;
                                        redis.hset('stat:g:' + deptid, systemtypes[systeminfo.sid], JSON.stringify(middleObj['stat:g:' + deptid][systemtypes[systeminfo.sid]]));
                                    });
                                    redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                        middleObj['stat:h:' + deptid][systemtypes[systeminfo.sid]].online += communitySum;
                                        redis.hset('stat:h:' + deptid, systemtypes[systeminfo.sid], JSON.stringify(middleObj['stat:h:' + deptid][systemtypes[systeminfo.sid]]));
                                    });
                                }
                            });
                        }
                    });
                });
            }
            console.log('现在初始化视频监控系统的统计信息！');
            //视频监控
            //设备数和故障数
            let monitorSql='select t.communityid,sum(case when t.devicetype=\'camera\'  then 1 else 0 end) as "camerasum",sum(case when t.devicetype=\'camera\'  and t.status=\'2\' then 1 else 0 end) as "camerabug",sum(case when t.devicetype=\'dvr\'  then 1 else 0 end) as "dvrsum",sum(case when t.devicetype=\'dvr\' and t.status=\'2\' then 1 else 0 end) as "dvrbug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" from p_videomonitor_deviceinfo t where t.status<>\'3\' group by t.communityid order by t.communityid';
            postgre.excuteSql(monitorSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let camerasum=+data.camerasum;
                        let camerabug=+data.camerabug;
                        let dvrsum=+data.dvrsum;
                        let dvrbug=+data.dvrbug;
                        let offline=+data.offline;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].monitor.camera.sum=camerasum;
                            middleObj['stat:c:'+data.communityid].monitor.camera.bug=camerabug;
                            middleObj['stat:c:'+data.communityid].monitor.dvr.sum=dvrsum;
                            middleObj['stat:c:'+data.communityid].monitor.dvr.bug=dvrbug;
                            //合计及bug
                            middleObj['stat:c:'+data.communityid].sum.monitor=camerasum+dvrsum;
                            middleObj['stat:c:'+data.communityid].bug.monitor=camerabug+dvrbug;
                            redis.hset('stat:c:'+data.communityid,'monitor',JSON.stringify(middleObj['stat:c:'+data.communityid].monitor));
                            redis.hset('stat:c:'+data.communityid,'sum',JSON.stringify(middleObj['stat:c:'+data.communityid].sum));
                            redis.hset('stat:c:'+data.communityid,'bug',JSON.stringify(middleObj['stat:c:'+data.communityid].bug));
                            //设备状态
                            middleObj['stat:c:'+data.communityid].devicesta.online+=camerasum+dvrsum-offline;
                            middleObj['stat:c:'+data.communityid].devicesta.offline+=offline;
                            middleObj['stat:c:'+data.communityid].devicesta.bug+=camerabug+dvrbug;
                            middleObj['stat:c:'+data.communityid].devicesta.nobug+=camerasum+dvrsum-(camerabug+dvrbug);
                            redis.hset('stat:c:'+data.communityid,'devicesta',JSON.stringify(middleObj['stat:c:'+data.communityid].devicesta));

                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].monitor.camera.sum += camerasum;
                                middleObj['stat:r:' + deptid].monitor.camera.bug += camerabug;
                                middleObj['stat:r:' + deptid].monitor.dvr.sum += dvrsum;
                                middleObj['stat:r:' + deptid].monitor.dvr.bug += dvrbug;
                                //合计及bug
                                middleObj['stat:r:'+deptid].sum.monitor+=camerasum+dvrsum;
                                middleObj['stat:r:'+deptid].bug.monitor+=camerabug+dvrbug;
                                redis.hset('stat:r:' + deptid, 'monitor', JSON.stringify(middleObj['stat:r:' + deptid].monitor));
                                redis.hset('stat:r:' + deptid, 'sum', JSON.stringify(middleObj['stat:r:' + deptid].sum));
                                redis.hset('stat:r:' + deptid, 'bug', JSON.stringify(middleObj['stat:r:' + deptid].bug));
                                //设备状态
                                middleObj['stat:r:' + deptid].devicesta.online+=camerasum+dvrsum-offline;
                                middleObj['stat:r:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:r:' + deptid].devicesta.bug+=camerabug+dvrbug;
                                middleObj['stat:r:' + deptid].devicesta.nobug+=camerasum+dvrsum-(camerabug+dvrbug);
                                redis.hset('stat:r:' + deptid,'devicesta',JSON.stringify(middleObj['stat:r:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].monitor.camera.sum += camerasum;
                                middleObj['stat:g:' + deptid].monitor.camera.bug += camerabug;
                                middleObj['stat:g:' + deptid].monitor.dvr.sum += dvrsum;
                                middleObj['stat:g:' + deptid].monitor.dvr.bug += dvrbug;
                                //合计及bug
                                middleObj['stat:g:'+deptid].sum.monitor+=camerasum+dvrsum;
                                middleObj['stat:g:'+deptid].bug.monitor+=camerabug+dvrbug;
                                redis.hset('stat:g:' + deptid, 'monitor', JSON.stringify(middleObj['stat:g:' + deptid].monitor));
                                redis.hset('stat:g:' + deptid, 'sum', JSON.stringify(middleObj['stat:g:' + deptid].sum));
                                redis.hset('stat:g:' + deptid, 'bug', JSON.stringify(middleObj['stat:g:' + deptid].bug));
                                //设备状态
                                middleObj['stat:g:' + deptid].devicesta.online+=camerasum+dvrsum-offline;
                                middleObj['stat:g:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:g:' + deptid].devicesta.bug+=camerabug+dvrbug;
                                middleObj['stat:g:' + deptid].devicesta.nobug+=camerasum+dvrsum-(camerabug+dvrbug);
                                redis.hset('stat:g:' + deptid,'devicesta',JSON.stringify(middleObj['stat:g:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].monitor.camera.sum += camerasum;
                                middleObj['stat:h:' + deptid].monitor.camera.bug += camerabug;
                                middleObj['stat:h:' + deptid].monitor.dvr.sum += dvrsum;
                                middleObj['stat:h:' + deptid].monitor.dvr.bug += dvrbug;
                                //合计及bug
                                middleObj['stat:h:'+deptid].sum.monitor+=camerasum+dvrsum;
                                middleObj['stat:h:'+deptid].bug.monitor+=camerabug+dvrbug;
                                redis.hset('stat:h:' + deptid, 'monitor', JSON.stringify(middleObj['stat:h:' + deptid].monitor));
                                redis.hset('stat:h:' + deptid, 'sum', JSON.stringify(middleObj['stat:h:' + deptid].sum));
                                redis.hset('stat:h:' + deptid, 'bug', JSON.stringify(middleObj['stat:h:' + deptid].bug));
                                //设备状态
                                middleObj['stat:h:' + deptid].devicesta.online+=camerasum+dvrsum-offline;
                                middleObj['stat:h:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:h:' + deptid].devicesta.bug+=camerabug+dvrbug;
                                middleObj['stat:h:' + deptid].devicesta.nobug+=camerasum+dvrsum-(camerabug+dvrbug);
                                redis.hset('stat:h:' + deptid,'devicesta',JSON.stringify(middleObj['stat:h:' + deptid].devicesta));
                            });
                        }


                    });
                }
            });
            console.log('现在初始化电梯监控系统的统计信息！');
            //电梯监控
            //设备数和警报数和故障数
            let elevatorbugSql='select t.communityid,count(id) as "sum",sum(case when t.status=\'2\' then 1 else 0 end) as "bug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" from p_elevator_deviceinfo t where t.status<>\'3\' group by t.communityid order by t.communityid';
            let elevatoralarmSql='select o.communityid,count(o.communityid) as "alarm" from(select distinct communityid,deviceid from p_devicealarm t where t.sid=\'7\' and t."datetime" BETWEEN CURRENT_DATE and CURRENT_DATE+1) o group by o.communityid order by o.communityid';
            let elevatorrealalarmSql='select  communityid,count(*) as "elevatoralarm" from p_devicealarm t where t.sid=\'7\' and t."datetime" BETWEEN CURRENT_DATE and CURRENT_DATE+1 group by t.communityid order by t.communityid';
            postgre.excuteSql(elevatorbugSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let sum=+data.sum;
                        let bug=+data.bug;
                        let offline=+data.offline;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].elevator.sum=sum;
                            middleObj['stat:c:'+data.communityid].elevator.bug=bug;
                            //合计及bug
                            middleObj['stat:c:'+data.communityid].sum.elevator+=sum;
                            middleObj['stat:c:'+data.communityid].bug.elevator+=bug;
                            redis.hset('stat:c:'+data.communityid,'elevator',JSON.stringify(middleObj['stat:c:'+data.communityid].elevator));
                            redis.hset('stat:c:'+data.communityid,'sum',JSON.stringify(middleObj['stat:c:'+data.communityid].sum));
                            redis.hset('stat:c:'+data.communityid,'bug',JSON.stringify(middleObj['stat:c:'+data.communityid].bug));
                            //设备状态
                            middleObj['stat:c:'+data.communityid].devicesta.online+=sum-offline;
                            middleObj['stat:c:'+data.communityid].devicesta.offline+=offline;
                            middleObj['stat:c:'+data.communityid].devicesta.bug+=bug;
                            middleObj['stat:c:'+data.communityid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:c:'+data.communityid,'devicesta',JSON.stringify(middleObj['stat:c:'+data.communityid].devicesta));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].elevator.sum += sum;
                                middleObj['stat:r:' + deptid].elevator.bug += bug;
                                redis.hset('stat:r:' + deptid, 'elevator', JSON.stringify(middleObj['stat:r:' + deptid].elevator));
                                //合计及bug
                                middleObj['stat:r:'+deptid].sum.elevator+=sum;
                                middleObj['stat:r:'+deptid].bug.elevator+=bug;
                                redis.hset('stat:r:' + deptid, 'sum', JSON.stringify(middleObj['stat:r:' + deptid].sum));
                                redis.hset('stat:r:' + deptid, 'bug', JSON.stringify(middleObj['stat:r:' + deptid].bug));
                                //设备状态
                                middleObj['stat:r:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:r:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:r:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:r:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:r:' + deptid,'devicesta',JSON.stringify(middleObj['stat:r:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].elevator.sum += sum;
                                middleObj['stat:g:' + deptid].elevator.bug += bug;
                                redis.hset('stat:g:' + deptid, 'elevator', JSON.stringify(middleObj['stat:g:' + deptid].elevator));
                                //合计及bug
                                middleObj['stat:g:'+deptid].sum.elevator+=sum;
                                middleObj['stat:g:'+deptid].bug.elevator+=bug;
                                redis.hset('stat:g:' + deptid, 'sum', JSON.stringify(middleObj['stat:g:' + deptid].sum));
                                redis.hset('stat:g:' + deptid, 'bug', JSON.stringify(middleObj['stat:g:' + deptid].bug));
                                //设备状态
                                middleObj['stat:g:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:g:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:g:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:g:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:g:' + deptid,'devicesta',JSON.stringify(middleObj['stat:g:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].elevator.sum += sum;
                                middleObj['stat:h:' + deptid].elevator.bug += bug;
                                redis.hset('stat:h:' + deptid, 'elevator', JSON.stringify(middleObj['stat:h:' + deptid].elevator));
                                //合计及bug
                                middleObj['stat:h:'+deptid].sum.elevator+=sum;
                                middleObj['stat:h:'+deptid].bug.elevator+=bug;
                                redis.hset('stat:h:' + deptid, 'sum', JSON.stringify(middleObj['stat:h:' + deptid].sum));
                                redis.hset('stat:h:' + deptid, 'bug', JSON.stringify(middleObj['stat:h:' + deptid].bug));
                                //设备状态
                                middleObj['stat:h:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:h:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:h:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:h:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:h:' + deptid,'devicesta',JSON.stringify(middleObj['stat:h:' + deptid].devicesta));
                            });
                        }

                    });
                }
            });
            postgre.excuteSql(elevatoralarmSql,[],function (result){// 电梯警报
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let alarm=+data.alarm;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].elevator.alarm=alarm;
                            redis.hset('stat:c:'+data.communityid,'elevator',JSON.stringify(middleObj['stat:c:'+data.communityid].elevator));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].elevator.alarm += alarm;
                                redis.hset('stat:r:' + deptid, 'elevator', JSON.stringify(middleObj['stat:r:' + deptid].elevator));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].elevator.alarm += alarm;
                                redis.hset('stat:g:' + deptid, 'elevator', JSON.stringify(middleObj['stat:g:' + deptid].elevator));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].elevator.alarm += alarm;
                                redis.hset('stat:h:' + deptid, 'elevator', JSON.stringify(middleObj['stat:h:' + deptid].elevator));
                            });
                        }

                    });
                }
            });

            postgre.excuteSql(elevatorrealalarmSql,[],function (result){//实时报警
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let elevatoralarm=+data.elevatoralarm;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].alarm.elevator=elevatoralarm;
                            redis.hset('stat:c:'+data.communityid,'alarm',JSON.stringify(middleObj['stat:c:'+data.communityid].alarm));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].alarm.elevator += elevatoralarm;
                                redis.hset('stat:r:' + deptid, 'alarm', JSON.stringify(middleObj['stat:r:' + deptid].alarm));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].alarm.elevator += elevatoralarm;
                                redis.hset('stat:g:' + deptid, 'alarm', JSON.stringify(middleObj['stat:g:' + deptid].alarm));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].alarm.elevator += elevatoralarm;
                                redis.hset('stat:h:' + deptid, 'alarm', JSON.stringify(middleObj['stat:h:' + deptid].alarm));
                            });
                        }
                    });
                }
            });

            console.log('现在初始化可视对讲系统的统计信息！');
            //可视对讲
            //设备数和警报数和故障数
            let intercombugSql='select t.communityid,count(id) as "sum",sum(case when t.status=\'2\' then 1 else 0 end) as "bug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" from p_videointercom_deviceinfo t where t.status<>\'3\' group by t.communityid order by t.communityid';
            let intercomalarmSql='select o.communityid,count(o.communityid) as "alarm" from(select distinct communityid,deviceid from p_devicealarm t where t.sid=\'2\' and t."datetime" BETWEEN CURRENT_DATE and CURRENT_DATE+1) o group by o.communityid order by o.communityid';
            let intercomrealalarmSql='select o.communityid,count(o.communityid) as "intercomalarm" from p_devicealarm o where o.sid=\'2\' and o."datetime" BETWEEN CURRENT_DATE and CURRENT_DATE+1 group by o.communityid order by o.communityid';
            postgre.excuteSql(intercombugSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let sum=+data.sum;
                        let bug=+data.bug;
                        let offline=+data.offline;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].intercom.sum=sum;
                            middleObj['stat:c:'+data.communityid].intercom.bug=bug;
                            //合计及bug
                            middleObj['stat:c:'+data.communityid].sum.intercom+=sum;
                            middleObj['stat:c:'+data.communityid].bug.intercom+=bug;
                            redis.hset('stat:c:'+data.communityid,'intercom',JSON.stringify(middleObj['stat:c:'+data.communityid].intercom));
                            redis.hset('stat:c:'+data.communityid,'sum',JSON.stringify(middleObj['stat:c:'+data.communityid].sum));
                            redis.hset('stat:c:'+data.communityid,'bug',JSON.stringify(middleObj['stat:c:'+data.communityid].bug));
                            //设备状态
                            middleObj['stat:c:'+data.communityid].devicesta.online+=sum-offline;
                            middleObj['stat:c:'+data.communityid].devicesta.offline+=offline;
                            middleObj['stat:c:'+data.communityid].devicesta.bug+=bug;
                            middleObj['stat:c:'+data.communityid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:c:'+data.communityid,'devicesta',JSON.stringify(middleObj['stat:c:'+data.communityid].devicesta));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].intercom.sum += sum;
                                middleObj['stat:r:' + deptid].intercom.bug += bug;
                                redis.hset('stat:r:' + deptid, 'intercom', JSON.stringify(middleObj['stat:r:' + deptid].intercom));
                                //合计及bug
                                middleObj['stat:r:'+deptid].sum.intercom+=sum;
                                middleObj['stat:r:'+deptid].bug.intercom+=bug;
                                redis.hset('stat:r:' + deptid, 'sum', JSON.stringify(middleObj['stat:r:' + deptid].sum));
                                redis.hset('stat:r:' + deptid, 'bug', JSON.stringify(middleObj['stat:r:' + deptid].bug));
                                //设备状态
                                middleObj['stat:r:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:r:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:r:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:r:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:r:' + deptid,'devicesta',JSON.stringify(middleObj['stat:r:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].intercom.sum += sum;
                                middleObj['stat:g:' + deptid].intercom.bug += bug;
                                redis.hset('stat:g:' + deptid, 'intercom', JSON.stringify(middleObj['stat:g:' + deptid].intercom));
                                //合计及bug
                                middleObj['stat:g:'+deptid].sum.intercom+=sum;
                                middleObj['stat:g:'+deptid].bug.intercom+=bug;
                                redis.hset('stat:g:' + deptid, 'sum', JSON.stringify(middleObj['stat:g:' + deptid].sum));
                                redis.hset('stat:g:' + deptid, 'bug', JSON.stringify(middleObj['stat:g:' + deptid].bug));
                                //设备状态
                                middleObj['stat:g:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:g:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:g:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:g:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:g:' + deptid,'devicesta',JSON.stringify(middleObj['stat:g:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].intercom.sum += sum;
                                middleObj['stat:h:' + deptid].intercom.bug += bug;
                                redis.hset('stat:h:' + deptid, 'intercom', JSON.stringify(middleObj['stat:h:' + deptid].intercom));
                                //合计及bug
                                middleObj['stat:h:'+deptid].sum.intercom+=sum;
                                middleObj['stat:h:'+deptid].bug.intercom+=bug;
                                redis.hset('stat:h:' + deptid, 'sum', JSON.stringify(middleObj['stat:h:' + deptid].sum));
                                redis.hset('stat:h:' + deptid, 'bug', JSON.stringify(middleObj['stat:h:' + deptid].bug));
                                //设备状态
                                middleObj['stat:h:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:h:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:h:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:h:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:h:' + deptid,'devicesta',JSON.stringify(middleObj['stat:h:' + deptid].devicesta));
                            });
                        }

                    });
                }
            });
            postgre.excuteSql(intercomalarmSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let alarm=+data.alarm;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].intercom.alarm=alarm;
                            redis.hset('stat:c:'+data.communityid,'intercom',JSON.stringify(middleObj['stat:c:'+data.communityid].intercom));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].intercom.alarm += alarm;
                                redis.hset('stat:r:' + deptid, 'intercom', JSON.stringify(middleObj['stat:r:' + deptid].intercom));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].intercom.alarm += alarm;
                                redis.hset('stat:g:' + deptid, 'intercom', JSON.stringify(middleObj['stat:g:' + deptid].intercom));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].intercom.alarm += alarm;
                                redis.hset('stat:h:' + deptid, 'intercom', JSON.stringify(middleObj['stat:h:' + deptid].intercom));
                            });
                        }

                    });
                }
            });
            postgre.excuteSql(intercomrealalarmSql,[],function (result){//实时报警
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let intercomalarm=+data.intercomalarm;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].alarm.intercom=intercomalarm;
                            redis.hset('stat:c:'+data.communityid,'alarm',JSON.stringify(middleObj['stat:c:'+data.communityid].alarm));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].alarm.intercom += intercomalarm;
                                redis.hset('stat:r:' + deptid, 'alarm', JSON.stringify(middleObj['stat:r:' + deptid].alarm));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].alarm.intercom += intercomalarm;
                                redis.hset('stat:g:' + deptid, 'alarm', JSON.stringify(middleObj['stat:g:' + deptid].alarm));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].alarm.intercom += intercomalarm;
                                redis.hset('stat:h:' + deptid, 'alarm', JSON.stringify(middleObj['stat:h:' + deptid].alarm));
                            });
                        }
                    });
                }
            });

            console.log('现在初始化人员定位系统的统计信息！');
            //人员定位
            //设备数和警报数和故障数和发卡数
            let locationbugSql='select t.communityid,count(id) as "sum",sum(case when t.status=\'2\' then 1 else 0 end) as "bug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" from p_personlocation_deviceinfo t where t.status<>\'3\' group by t.communityid order by t.communityid';
            let locationalarmSql='select p.communityid,count(p.communityid) as "alarm" from p_personlocation_alarm p where p.alarmtype=\'1\'   group by p.communityid order by p.communityid';
            let locationrealalarmSql='select p.communityid,count(p.communityid) as "locationalarm" from p_personlocation_alarm p where p.datetime BETWEEN CURRENT_DATE and CURRENT_DATE+1  group by p.communityid order by p.communityid';
            let locationcardSql='select p.communityid,count(p.communityid) as "card" from p_personlocation_givecard p  group by p.communityid order by p.communityid';

            postgre.excuteSql(locationbugSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let sum=+data.sum;
                        let bug=+data.bug;
                        let offline=+data.offline;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].location.sum=sum;
                            middleObj['stat:c:'+data.communityid].location.bug=bug;
                            //合计及bug
                            middleObj['stat:c:'+data.communityid].sum.location+=sum;
                            middleObj['stat:c:'+data.communityid].bug.location+=bug;
                            redis.hset('stat:c:'+data.communityid,'location',JSON.stringify(middleObj['stat:c:'+data.communityid].location));
                            redis.hset('stat:c:'+data.communityid,'sum',JSON.stringify(middleObj['stat:c:'+data.communityid].sum));
                            redis.hset('stat:c:'+data.communityid,'bug',JSON.stringify(middleObj['stat:c:'+data.communityid].bug));
                            //设备状态
                            middleObj['stat:c:'+data.communityid].devicesta.online+=sum-offline;
                            middleObj['stat:c:'+data.communityid].devicesta.offline+=offline;
                            middleObj['stat:c:'+data.communityid].devicesta.bug+=bug;
                            middleObj['stat:c:'+data.communityid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:c:'+data.communityid,'devicesta',JSON.stringify(middleObj['stat:c:'+data.communityid].devicesta));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].location.sum += sum;
                                middleObj['stat:r:' + deptid].location.bug += bug;
                                redis.hset('stat:r:' + deptid, 'location', JSON.stringify(middleObj['stat:r:' + deptid].location));
                                //合计及bug
                                middleObj['stat:r:'+deptid].sum.location+=sum;
                                middleObj['stat:r:'+deptid].bug.location+=bug;
                                redis.hset('stat:r:' + deptid, 'sum', JSON.stringify(middleObj['stat:r:' + deptid].sum));
                                redis.hset('stat:r:' + deptid, 'bug', JSON.stringify(middleObj['stat:r:' + deptid].bug));
                                //设备状态
                                middleObj['stat:r:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:r:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:r:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:r:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:r:' + deptid,'devicesta',JSON.stringify(middleObj['stat:r:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].location.sum += sum;
                                middleObj['stat:g:' + deptid].location.bug += bug;
                                redis.hset('stat:g:' + deptid, 'location', JSON.stringify(middleObj['stat:g:' + deptid].location));
                                //合计及bug
                                middleObj['stat:g:'+deptid].sum.location+=sum;
                                middleObj['stat:g:'+deptid].bug.location+=bug;
                                redis.hset('stat:g:' + deptid, 'sum', JSON.stringify(middleObj['stat:g:' + deptid].sum));
                                redis.hset('stat:g:' + deptid, 'bug', JSON.stringify(middleObj['stat:g:' + deptid].bug));
                                //设备状态
                                middleObj['stat:g:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:g:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:g:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:g:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:g:' + deptid,'devicesta',JSON.stringify(middleObj['stat:g:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].location.sum += sum;
                                middleObj['stat:h:' + deptid].location.bug += bug;
                                redis.hset('stat:h:' + deptid, 'location', JSON.stringify(middleObj['stat:h:' + deptid].location));
                                //合计及bug
                                middleObj['stat:h:'+deptid].sum.location+=sum;
                                middleObj['stat:h:'+deptid].bug.location+=bug;
                                redis.hset('stat:h:' + deptid, 'sum', JSON.stringify(middleObj['stat:h:' + deptid].sum));
                                redis.hset('stat:h:' + deptid, 'bug', JSON.stringify(middleObj['stat:h:' + deptid].bug));
                                //设备状态
                                middleObj['stat:h:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:h:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:h:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:h:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:h:' + deptid,'devicesta',JSON.stringify(middleObj['stat:h:' + deptid].devicesta));
                            });
                        }

                    });
                }
            });

            postgre.excuteSql(locationalarmSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let alarm=+data.alarm;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].location.alarm=alarm;
                            redis.hset('stat:c:'+data.communityid,'location',JSON.stringify(middleObj['stat:c:'+data.communityid].location));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].location.alarm += alarm;
                                redis.hset('stat:r:' + deptid, 'location', JSON.stringify(middleObj['stat:r:' + deptid].location));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].location.alarm += alarm;
                                redis.hset('stat:g:' + deptid, 'location', JSON.stringify(middleObj['stat:g:' + deptid].location));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].location.alarm += alarm;
                                redis.hset('stat:h:' + deptid, 'location', JSON.stringify(middleObj['stat:h:' + deptid].location));
                            });
                        }
                    });
                }
            });

            postgre.excuteSql(locationrealalarmSql,[],function (result){//实时报警
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let locationalarm=+data.locationalarm;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].alarm.location=locationalarm;
                            redis.hset('stat:c:'+data.communityid,'alarm',JSON.stringify(middleObj['stat:c:'+data.communityid].alarm));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].alarm.location += locationalarm;
                                redis.hset('stat:r:' + deptid, 'alarm', JSON.stringify(middleObj['stat:r:' + deptid].alarm));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].alarm.location += locationalarm;
                                redis.hset('stat:g:' + deptid, 'alarm', JSON.stringify(middleObj['stat:g:' + deptid].alarm));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].alarm.location += locationalarm;
                                redis.hset('stat:h:' + deptid, 'alarm', JSON.stringify(middleObj['stat:h:' + deptid].alarm));
                            });
                        }
                    });
                }
            });

            postgre.excuteSql(locationcardSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let card=+data.card;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].location.card=card;
                            redis.hset('stat:c:'+data.communityid,'location',JSON.stringify(middleObj['stat:c:'+data.communityid].location));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].location.card += card;
                                redis.hset('stat:r:' + deptid, 'location', JSON.stringify(middleObj['stat:r:' + deptid].location));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].location.card += card;
                                redis.hset('stat:g:' + deptid, 'location', JSON.stringify(middleObj['stat:g:' + deptid].location));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].location.card += card;
                                redis.hset('stat:h:' + deptid, 'location', JSON.stringify(middleObj['stat:h:' + deptid].location));
                            });
                        }

                    });
                }
            });

            console.log('现在初始化gate系统的统计信息！');
            //gate
            //设备数和警报数和故障数
            let gatebugSql='select t.communityid,count(id) as "sum",SUM(case when t.status=\'2\' then 1 else 0 end) as "bug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" from p_gate_deviceinfo t where t.status<>\'3\' group by t.communityid order by t.communityid';
            let gatealarmSql='select t.communityid,count(t.communityid) as "alarm" from p_devicealarm t where t.sid=\'5\'  group by t.communityid order by t.communityid';
            postgre.excuteSql(gatebugSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let sum=+data.sum;
                        let bug=+data.bug;
                        let offline=+data.offline;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].gate.sum=sum;
                            middleObj['stat:c:'+data.communityid].gate.bug=bug;
                            //合计及bug
                            middleObj['stat:c:'+data.communityid].sum.gate+=sum;
                            middleObj['stat:c:'+data.communityid].bug.gate+=bug;
                            redis.hset('stat:c:'+data.communityid,'gate',JSON.stringify(middleObj['stat:c:'+data.communityid].gate));
                            redis.hset('stat:c:'+data.communityid,'sum',JSON.stringify(middleObj['stat:c:'+data.communityid].sum));
                            redis.hset('stat:c:'+data.communityid,'bug',JSON.stringify(middleObj['stat:c:'+data.communityid].bug));
                            //设备状态
                            middleObj['stat:c:'+data.communityid].devicesta.online+=sum-offline;
                            middleObj['stat:c:'+data.communityid].devicesta.offline+=offline;
                            middleObj['stat:c:'+data.communityid].devicesta.bug+=bug;
                            middleObj['stat:c:'+data.communityid].devicesta.nobug+=sum-bug;
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].gate.sum += sum;
                                middleObj['stat:r:' + deptid].gate.bug += bug;
                                redis.hset('stat:r:' + deptid, 'gate', JSON.stringify(middleObj['stat:r:' + deptid].gate));
                                //合计及bug
                                middleObj['stat:r:'+deptid].sum.gate+=sum;
                                middleObj['stat:r:'+deptid].bug.gate+=bug;
                                redis.hset('stat:r:' + deptid, 'sum', JSON.stringify(middleObj['stat:r:' + deptid].sum));
                                redis.hset('stat:r:' + deptid, 'bug', JSON.stringify(middleObj['stat:r:' + deptid].bug));
                                //设备状态
                                middleObj['stat:r:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:r:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:r:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:r:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:r:' + deptid,'devicesta',JSON.stringify(middleObj['stat:r:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].gate.sum += sum;
                                middleObj['stat:g:' + deptid].gate.bug += bug;
                                redis.hset('stat:g:' + deptid, 'gate', JSON.stringify(middleObj['stat:g:' + deptid].gate));
                                //合计及bug
                                middleObj['stat:g:'+deptid].sum.gate+=sum;
                                middleObj['stat:g:'+deptid].bug.gate+=bug;
                                redis.hset('stat:g:' + deptid, 'sum', JSON.stringify(middleObj['stat:g:' + deptid].sum));
                                redis.hset('stat:g:' + deptid, 'bug', JSON.stringify(middleObj['stat:g:' + deptid].bug));
                                //设备状态
                                middleObj['stat:g:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:g:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:g:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:g:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:g:' + deptid,'devicesta',JSON.stringify(middleObj['stat:g:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].gate.sum += sum;
                                middleObj['stat:h:' + deptid].gate.bug += bug;
                                redis.hset('stat:h:' + deptid, 'gate', JSON.stringify(middleObj['stat:h:' + deptid].gate));
                                //合计及bug
                                middleObj['stat:h:'+deptid].sum.gate+=sum;
                                middleObj['stat:h:'+deptid].bug.gate+=bug;
                                redis.hset('stat:h:' + deptid, 'sum', JSON.stringify(middleObj['stat:h:' + deptid].sum));
                                redis.hset('stat:h:' + deptid, 'bug', JSON.stringify(middleObj['stat:h:' + deptid].bug));
                                //设备状态
                                middleObj['stat:h:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:h:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:h:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:h:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:h:' + deptid,'devicesta',JSON.stringify(middleObj['stat:h:' + deptid].devicesta));
                            });
                        }

                    });
                }
            });
            postgre.excuteSql(gatealarmSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let alarm=+data.alarm;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].gate.alarm=alarm;
                            redis.hset('stat:c:'+data.communityid,'gate',JSON.stringify(middleObj['stat:c:'+data.communityid].gate));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].gate.alarm += alarm;
                                redis.hset('stat:r:' + deptid, 'gate', JSON.stringify(middleObj['stat:r:' + deptid].gate));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].gate.alarm += alarm;
                                redis.hset('stat:g:' + deptid, 'gate', JSON.stringify(middleObj['stat:g:' + deptid].gate));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].gate.alarm += alarm;
                                redis.hset('stat:h:' + deptid, 'gate', JSON.stringify(middleObj['stat:h:' + deptid].gate));
                            });
                        }

                    });
                }
            });


            console.log('现在初始化信息发布系统的统计信息！');
            //信息发布
            //设备数和故障数
            let infobugSql='select t.communityid,count(id) as "sum",sum(case when t.status=\'2\' then 1 else 0 end) as "bug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" from p_infodiffusion_deviceinfo t where t.status<>\'3\' group by t.communityid order by t.communityid';
            postgre.excuteSql(infobugSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let sum=+data.sum;
                        let bug=+data.bug;
                        let offline=+data.offline;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].info.sum=sum;
                            middleObj['stat:c:'+data.communityid].info.bug=bug;
                            //合计及bug
                            middleObj['stat:c:'+data.communityid].sum.info+=sum;
                            middleObj['stat:c:'+data.communityid].bug.info+=bug;
                            redis.hset('stat:c:'+data.communityid,'info',JSON.stringify(middleObj['stat:c:'+data.communityid].info));
                            redis.hset('stat:c:'+data.communityid,'sum',JSON.stringify(middleObj['stat:c:'+data.communityid].sum));
                            redis.hset('stat:c:'+data.communityid,'bug',JSON.stringify(middleObj['stat:c:'+data.communityid].bug));
                            //设备状态
                            middleObj['stat:c:'+data.communityid].devicesta.online+=sum-offline;
                            middleObj['stat:c:'+data.communityid].devicesta.offline+=offline;
                            middleObj['stat:c:'+data.communityid].devicesta.bug+=bug;
                            middleObj['stat:c:'+data.communityid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:c:'+data.communityid,'devicesta',JSON.stringify(middleObj['stat:c:'+data.communityid].devicesta));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].info.sum += sum;
                                middleObj['stat:r:' + deptid].info.bug += bug;
                                redis.hset('stat:r:' + deptid, 'info', JSON.stringify(middleObj['stat:r:' + deptid].info));
                                //合计及bug
                                middleObj['stat:r:'+deptid].sum.info+=sum;
                                middleObj['stat:r:'+deptid].bug.info+=bug;
                                redis.hset('stat:r:' + deptid, 'sum', JSON.stringify(middleObj['stat:r:' + deptid].sum));
                                redis.hset('stat:r:' + deptid, 'bug', JSON.stringify(middleObj['stat:r:' + deptid].bug));
                                //设备状态
                                middleObj['stat:r:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:r:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:r:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:r:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:r:' + deptid,'devicesta',JSON.stringify(middleObj['stat:r:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].info.sum += sum;
                                middleObj['stat:g:' + deptid].info.bug += bug;
                                redis.hset('stat:g:' + deptid, 'info', JSON.stringify(middleObj['stat:g:' + deptid].info));
                                //合计及bug
                                middleObj['stat:g:'+deptid].sum.info+=sum;
                                middleObj['stat:g:'+deptid].bug.info+=bug;
                                redis.hset('stat:g:' + deptid, 'sum', JSON.stringify(middleObj['stat:g:' + deptid].sum));
                                redis.hset('stat:g:' + deptid, 'bug', JSON.stringify(middleObj['stat:g:' + deptid].bug));
                                //设备状态
                                middleObj['stat:g:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:g:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:g:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:g:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:g:' + deptid,'devicesta',JSON.stringify(middleObj['stat:g:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].info.sum += sum;
                                middleObj['stat:h:' + deptid].info.bug += bug;
                                redis.hset('stat:h:' + deptid, 'info', JSON.stringify(middleObj['stat:h:' + deptid].info));
                                //合计及bug
                                middleObj['stat:h:'+deptid].sum.info+=sum;
                                middleObj['stat:h:'+deptid].bug.info+=bug;
                                redis.hset('stat:h:' + deptid, 'sum', JSON.stringify(middleObj['stat:h:' + deptid].sum));
                                redis.hset('stat:h:' + deptid, 'bug', JSON.stringify(middleObj['stat:h:' + deptid].bug));
                                //设备状态
                                middleObj['stat:h:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:h:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:h:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:h:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:h:' + deptid,'devicesta',JSON.stringify(middleObj['stat:h:' + deptid].devicesta));
                            });
                        }

                    });
                }
            });

            console.log('现在初始化入侵警报系统的统计信息！');
            //入侵警报
            //防区数和警报数
            let intrusionsectionSql='select t.communityid,count(sectorid) as "sum" from p_alarm_sectorinfo t group by t.communityid order by t.communityid';
            let intrusionalarmSql='select o.communityid,count(o.communityid) as "alarm" from p_alarm_intrusion  o group by o.communityid order by o.communityid';
            let intrusionrealalarmSql='select o.communityid,count(o.communityid) as "intrusionalarm" from p_alarm_intrusion  o where o.datetime BETWEEN CURRENT_DATE and CURRENT_DATE+1 group by o.communityid order by o.communityid';
            let intrusionbugSql='select t.communityid,count(id) as "sum",sum(case when t.status=\'2\' then 1 else 0 end) as "bug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" from p_alarm_deviceinfo t where t.status<>\'3\' group by t.communityid order by t.communityid';
            postgre.excuteSql(intrusionbugSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let sum=+data.sum;
                        let bug=+data.bug;
                        let offline=+data.offline;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            //合计及bug
                            middleObj['stat:c:'+data.communityid].sum.intrusion+=sum;
                            middleObj['stat:c:'+data.communityid].bug.intrusion+=bug;
                            redis.hset('stat:c:'+data.communityid,'sum',JSON.stringify(middleObj['stat:c:'+data.communityid].sum));
                            redis.hset('stat:c:'+data.communityid,'bug',JSON.stringify(middleObj['stat:c:'+data.communityid].bug));
                            //设备状态
                            middleObj['stat:c:'+data.communityid].devicesta.online+=sum-offline;
                            middleObj['stat:c:'+data.communityid].devicesta.offline+=offline;
                            middleObj['stat:c:'+data.communityid].devicesta.bug+=bug;
                            middleObj['stat:c:'+data.communityid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:c:'+data.communityid,'devicesta',JSON.stringify(middleObj['stat:c:'+data.communityid].devicesta));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                //合计及bug
                                middleObj['stat:r:'+deptid].sum.intrusion+=sum;
                                middleObj['stat:r:'+deptid].bug.intrusion+=bug;
                                redis.hset('stat:r:' + deptid, 'sum', JSON.stringify(middleObj['stat:r:' + deptid].sum));
                                redis.hset('stat:r:' + deptid, 'bug', JSON.stringify(middleObj['stat:r:' + deptid].bug));
                                //设备状态
                                middleObj['stat:r:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:r:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:r:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:r:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:r:' + deptid,'devicesta',JSON.stringify(middleObj['stat:r:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                //合计及bug
                                middleObj['stat:g:'+deptid].sum.intrusion+=sum;
                                middleObj['stat:g:'+deptid].bug.intrusion+=bug;
                                redis.hset('stat:g:' + deptid, 'sum', JSON.stringify(middleObj['stat:g:' + deptid].sum));
                                redis.hset('stat:g:' + deptid, 'bug', JSON.stringify(middleObj['stat:g:' + deptid].bug));
                                //设备状态
                                middleObj['stat:g:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:g:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:g:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:g:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:g:' + deptid,'devicesta',JSON.stringify(middleObj['stat:g:' + deptid].devicesta));

                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                //合计及bug
                                middleObj['stat:h:'+deptid].sum.intrusion+=sum;
                                middleObj['stat:h:'+deptid].bug.intrusion+=bug;
                                redis.hset('stat:h:' + deptid, 'sum', JSON.stringify(middleObj['stat:h:' + deptid].sum));
                                redis.hset('stat:h:' + deptid, 'bug', JSON.stringify(middleObj['stat:h:' + deptid].bug));
                                //设备状态
                                middleObj['stat:h:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:h:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:h:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:h:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:h:' + deptid,'devicesta',JSON.stringify(middleObj['stat:h:' + deptid].devicesta));
                            });
                        }

                    });
                }
            });
            postgre.excuteSql(intrusionsectionSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let sum=+data.sum;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].intrusion.sum=sum;
                            redis.hset('stat:c:'+data.communityid,'intrusion',JSON.stringify(middleObj['stat:c:'+data.communityid].intrusion));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].intrusion.sum += sum;
                                redis.hset('stat:r:' + deptid, 'intrusion', JSON.stringify(middleObj['stat:r:' + deptid].intrusion));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].intrusion.sum += sum;
                                redis.hset('stat:g:' + deptid, 'intrusion', JSON.stringify(middleObj['stat:g:' + deptid].intrusion));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].intrusion.sum += sum;
                                redis.hset('stat:h:' + deptid, 'intrusion', JSON.stringify(middleObj['stat:h:' + deptid].intrusion));
                            });
                        }
                    });
                }
            });
            postgre.excuteSql(intrusionalarmSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let alarm=+data.alarm;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].intrusion.alarm=alarm;
                            redis.hset('stat:c:'+data.communityid,'intrusion',JSON.stringify(middleObj['stat:c:'+data.communityid].intrusion));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].intrusion.alarm += alarm;
                                redis.hset('stat:r:' + deptid, 'intrusion', JSON.stringify(middleObj['stat:r:' + deptid].intrusion));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].intrusion.alarm += alarm;
                                redis.hset('stat:g:' + deptid, 'intrusion', JSON.stringify(middleObj['stat:g:' + deptid].intrusion));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].intrusion.alarm += alarm;
                                redis.hset('stat:h:' + deptid, 'intrusion', JSON.stringify(middleObj['stat:h:' + deptid].intrusion));
                            });
                        }
                    });
                }
            });

            postgre.excuteSql(intrusionrealalarmSql,[],function (result){//实时报警
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let intrusionalarm=+data.intrusionalarm;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].alarm.intrusion=intrusionalarm;
                            redis.hset('stat:c:'+data.communityid,'alarm',JSON.stringify(middleObj['stat:c:'+data.communityid].alarm));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].alarm.intrusion += intrusionalarm;
                                redis.hset('stat:r:' + deptid, 'alarm', JSON.stringify(middleObj['stat:r:' + deptid].alarm));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].alarm.intrusion += intrusionalarm;
                                redis.hset('stat:g:' + deptid, 'alarm', JSON.stringify(middleObj['stat:g:' + deptid].alarm));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].alarm.intrusion += intrusionalarm;
                                redis.hset('stat:h:' + deptid, 'alarm', JSON.stringify(middleObj['stat:h:' + deptid].alarm));
                            });
                        }
                    });
                }
            });


            console.log('现在初始化车辆管理系统的统计信息！');
            //车辆管理
            //车位数和入库数和出库数
            let parkportSql='select t.communityid,sum(total) as "sum" from p_parking_parkareainfo t group by t.communityid order by t.communityid';
            let parkinSql='select o.communityid,sum(case when o.status=\'enter\'  then 1 else 0 end) as "in",sum(case when o.status=\'leave\'  then 1 else 0 end) as "out" from p_parking_carrecord  o group by o.communityid order by o.communityid';
            let parkbugSql='select t.communityid,count(id) as "sum",sum(case when t.status=\'2\' then 1 else 0 end) as "bug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" from p_parking_deviceinfo t where t.status<>\'3\' group by t.communityid order by t.communityid';
            postgre.excuteSql(parkbugSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let sum=+data.sum;
                        let bug=+data.bug;
                        let offline=+data.offline;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            //合计及bug
                            middleObj['stat:c:'+data.communityid].sum.park+=sum;
                            middleObj['stat:c:'+data.communityid].bug.park+=bug;
                            redis.hset('stat:c:'+data.communityid,'park',JSON.stringify(middleObj['stat:c:'+data.communityid].park));
                            redis.hset('stat:c:'+data.communityid,'sum',JSON.stringify(middleObj['stat:c:'+data.communityid].sum));
                            redis.hset('stat:c:'+data.communityid,'bug',JSON.stringify(middleObj['stat:c:'+data.communityid].bug));
                            //设备状态
                            middleObj['stat:c:'+data.communityid].devicesta.online+=sum-offline;
                            middleObj['stat:c:'+data.communityid].devicesta.offline+=offline;
                            middleObj['stat:c:'+data.communityid].devicesta.bug+=bug;
                            middleObj['stat:c:'+data.communityid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:c:'+data.communityid,'devicesta',JSON.stringify(middleObj['stat:c:'+data.communityid].devicesta));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                //合计及bug
                                middleObj['stat:r:'+deptid].sum.park+=sum;
                                middleObj['stat:r:'+deptid].bug.park+=bug;
                                redis.hset('stat:r:' + deptid, 'sum', JSON.stringify(middleObj['stat:r:' + deptid].sum));
                                redis.hset('stat:r:' + deptid, 'bug', JSON.stringify(middleObj['stat:r:' + deptid].bug));
                                //设备状态
                                middleObj['stat:r:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:r:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:r:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:r:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:r:' + deptid,'devicesta',JSON.stringify(middleObj['stat:r:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                //合计及bug
                                middleObj['stat:g:'+deptid].sum.park+=sum;
                                middleObj['stat:g:'+deptid].bug.park+=bug;
                                redis.hset('stat:g:' + deptid, 'sum', JSON.stringify(middleObj['stat:g:' + deptid].sum));
                                redis.hset('stat:g:' + deptid, 'bug', JSON.stringify(middleObj['stat:g:' + deptid].bug));
                                //设备状态
                                middleObj['stat:g:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:g:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:g:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:g:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:g:' + deptid,'devicesta',JSON.stringify(middleObj['stat:g:' + deptid].devicesta));

                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                //合计及bug
                                middleObj['stat:h:'+deptid].sum.park+=sum;
                                middleObj['stat:h:'+deptid].bug.park+=bug;
                                redis.hset('stat:h:' + deptid, 'sum', JSON.stringify(middleObj['stat:h:' + deptid].sum));
                                redis.hset('stat:h:' + deptid, 'bug', JSON.stringify(middleObj['stat:h:' + deptid].bug));
                                //设备状态
                                middleObj['stat:h:' + deptid].devicesta.online+=sum-offline;
                                middleObj['stat:h:' + deptid].devicesta.offline+=offline;
                                middleObj['stat:h:' + deptid].devicesta.bug+=bug;
                                middleObj['stat:h:' + deptid].devicesta.nobug+=sum-bug;
                                redis.hset('stat:h:' + deptid,'devicesta',JSON.stringify(middleObj['stat:h:' + deptid].devicesta));
                            });
                        }

                    });
                }
            });
            postgre.excuteSql(parkportSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let sum=+data.sum;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].park.sum=sum;
                            redis.hset('stat:c:'+data.communityid,'park',JSON.stringify(middleObj['stat:c:'+data.communityid].park));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].park.sum += sum;
                                redis.hset('stat:r:' + deptid, 'park', JSON.stringify(middleObj['stat:r:' + deptid].park));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].park.sum += sum;
                                redis.hset('stat:g:' + deptid, 'park', JSON.stringify(middleObj['stat:g:' + deptid].park));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].park.sum += sum;
                                redis.hset('stat:h:' + deptid, 'park', JSON.stringify(middleObj['stat:h:' + deptid].park));
                            });
                        }
                    });
                }
            });
            postgre.excuteSql(parkinSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let carin=+data.in;
                        let carout=+data.out;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].park.in=carin;
                            middleObj['stat:c:'+data.communityid].park.out=carout;
                            redis.hset('stat:c:'+data.communityid,'park',JSON.stringify(middleObj['stat:c:'+data.communityid].park));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].park.in += carin;
                                middleObj['stat:r:' + deptid].park.out += carout;
                                redis.hset('stat:r:' + deptid, 'park', JSON.stringify(middleObj['stat:r:' + deptid].park));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].park.in += carin;
                                middleObj['stat:g:' + deptid].park.out += carout;
                                redis.hset('stat:g:' + deptid, 'park', JSON.stringify(middleObj['stat:g:' + deptid].park));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].park.in += carin;
                                middleObj['stat:h:' + deptid].park.out += carout;
                                redis.hset('stat:h:' + deptid, 'park', JSON.stringify(middleObj['stat:h:' + deptid].park));
                            });
                        }
                    });
                }
            });

            console.log('现在初始化广播通讯系统的统计信息！');
            //广播通讯
            //在线分区和广播分区和广播状态
            let broadcastbroadSql='select t.communityid,count(id) as "onlinesum" from p_broadcast_record t where t."datetime" BETWEEN CURRENT_DATE and CURRENT_DATE+1 group by t.communityid order by t.communityid';
            let broadcastsectionSql='select o.communityid,sum(case when o.status=\'1\'  then 1 else 0 end) as "onlinearea",count(id) as "areasum" from p_broadcast_area as o group by o.communityid order by o.communityid';
            let broadcastbugSql='select t.communityid,count(id) as "sum",sum(case when t.status=\'2\' then 1 else 0 end) as "bug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" from p_broadcast_deviceinfo t where t.status<>\'3\' group by t.communityid order by t.communityid';
            postgre.excuteSql(broadcastbugSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let sum=+data.sum;
                        let bug=+data.bug;
                        let offline=+data.offline;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            //合计及bug
                            middleObj['stat:c:'+data.communityid].sum.broadcast+=sum;
                            middleObj['stat:c:'+data.communityid].bug.broadcast+=bug;
                            redis.hset('stat:c:'+data.communityid,'broadcast',JSON.stringify(middleObj['stat:c:'+data.communityid].broadcast));
                            redis.hset('stat:c:'+data.communityid,'sum',JSON.stringify(middleObj['stat:c:'+data.communityid].sum));
                            redis.hset('stat:c:'+data.communityid,'bug',JSON.stringify(middleObj['stat:c:'+data.communityid].bug));
                            //设备状态
                            middleObj['stat:c:'+data.communityid].devicesta.online+=sum-offline;
                            middleObj['stat:c:'+data.communityid].devicesta.offline+=offline;
                            middleObj['stat:c:'+data.communityid].devicesta.bug+=bug;
                            middleObj['stat:c:'+data.communityid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:c:'+data.communityid,'devicesta',JSON.stringify(middleObj['stat:c:'+data.communityid].devicesta));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                            redis.hset('stat:r:' + deptid, 'broadcast', JSON.stringify(middleObj['stat:r:' + deptid].broadcast));
                            //合计及bug
                            middleObj['stat:r:'+deptid].sum.broadcast+=sum;
                            middleObj['stat:r:'+deptid].bug.broadcast+=bug;
                            redis.hset('stat:r:' + deptid, 'sum', JSON.stringify(middleObj['stat:r:' + deptid].sum));
                            redis.hset('stat:r:' + deptid, 'bug', JSON.stringify(middleObj['stat:r:' + deptid].bug));
                            //设备状态
                            middleObj['stat:r:' + deptid].devicesta.online+=sum-offline;
                            middleObj['stat:r:' + deptid].devicesta.offline+=offline;
                            middleObj['stat:r:' + deptid].devicesta.bug+=bug;
                            middleObj['stat:r:' + deptid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:r:' + deptid,'devicesta',JSON.stringify(middleObj['stat:r:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                            redis.hset('stat:g:' + deptid, 'broadcast', JSON.stringify(middleObj['stat:g:' + deptid].broadcast));
                            //合计及bug
                            middleObj['stat:g:'+deptid].sum.broadcast+=sum;
                            middleObj['stat:g:'+deptid].bug.broadcast+=bug;
                            redis.hset('stat:g:' + deptid, 'sum', JSON.stringify(middleObj['stat:g:' + deptid].sum));
                            redis.hset('stat:g:' + deptid, 'bug', JSON.stringify(middleObj['stat:g:' + deptid].bug));
                            //设备状态
                            middleObj['stat:g:' + deptid].devicesta.online+=sum-offline;
                            middleObj['stat:g:' + deptid].devicesta.offline+=offline;
                            middleObj['stat:g:' + deptid].devicesta.bug+=bug;
                            middleObj['stat:g:' + deptid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:g:' + deptid,'devicesta',JSON.stringify(middleObj['stat:g:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                            redis.hset('stat:h:' + deptid, 'broadcast', JSON.stringify(middleObj['stat:h:' + deptid].broadcast));
                            //合计及bug
                            middleObj['stat:h:'+deptid].sum.broadcast+=sum;
                            middleObj['stat:h:'+deptid].bug.broadcast+=bug;
                            redis.hset('stat:h:' + deptid, 'sum', JSON.stringify(middleObj['stat:h:' + deptid].sum));
                            redis.hset('stat:h:' + deptid, 'bug', JSON.stringify(middleObj['stat:h:' + deptid].bug));
                            //设备状态
                            middleObj['stat:h:' + deptid].devicesta.online+=sum-offline;
                            middleObj['stat:h:' + deptid].devicesta.offline+=offline;
                            middleObj['stat:h:' + deptid].devicesta.bug+=bug;
                            middleObj['stat:h:' + deptid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:h:' + deptid,'devicesta',JSON.stringify(middleObj['stat:h:' + deptid].devicesta));
                            });
                        }

                    });
                }
            });
            postgre.excuteSql(broadcastbroadSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let onlinearea=+data.onlinearea;
                        let areasum=+data.areasum;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].broadcast.onlinearea=onlinearea;
                            middleObj['stat:c:'+data.communityid].broadcast.areasum=areasum;
                            redis.hset('stat:c:'+data.communityid,'broadcast',JSON.stringify(middleObj['stat:c:'+data.communityid].broadcast));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].broadcast.onlinearea += onlinearea;
                                middleObj['stat:r:' + deptid].broadcast.areasum += areasum;
                                redis.hset('stat:r:' + deptid, 'broadcast', JSON.stringify(middleObj['stat:r:' + deptid].broadcast));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].broadcast.onlinearea += onlinearea;
                                middleObj['stat:g:' + deptid].broadcast.areasum += areasum;
                                redis.hset('stat:g:' + deptid, 'broadcast', JSON.stringify(middleObj['stat:g:' + deptid].broadcast));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].broadcast.onlinearea += onlinearea;
                                middleObj['stat:h:' + deptid].broadcast.areasum += areasum;
                                redis.hset('stat:h:' + deptid, 'broadcast', JSON.stringify(middleObj['stat:h:' + deptid].broadcast));
                            });
                        }
                    });
                }
            });

            postgre.excuteSql(broadcastsectionSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let onlinesum=+data.onlinesum;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].broadcast.onlinesum=onlinesum;
                            redis.hset('stat:c:'+data.communityid,'broadcast',JSON.stringify(middleObj['stat:c:'+data.communityid].broadcast));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].broadcast.onlinesum += onlinesum;
                                redis.hset('stat:r:' + deptid, 'broadcast', JSON.stringify(middleObj['stat:r:' + deptid].broadcast));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].broadcast.onlinesum += onlinesum;
                                redis.hset('stat:g:' + deptid, 'broadcast', JSON.stringify(middleObj['stat:g:' + deptid].broadcast));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].broadcast.onlinesum += onlinesum;
                                redis.hset('stat:h:' + deptid, 'broadcast', JSON.stringify(middleObj['stat:h:' + deptid].broadcast));
                            });
                        }
                    });
                }
            });

            console.log('现在初始化电子巡更系统的统计信息！');
            //电子巡更
            //终端总数和已巡更次数和未巡更次数
            let patrolsumSql='select t.communityid,count(id) as "sum",sum(case when t.status=\'2\' then 1 else 0 end) as "bug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" from p_patrol_deviceinfo t where t.status<>\'3\' group by t.communityid order by t.communityid';
            let patrolrecordSql='select o.communityid,sum(case when o.result=\'0\'  then 1 else 0 end) as "not",sum(case when (o.result=\'1\' or o.result=\'2\'   ) then 1 else 0 end) as "yet" from p_patrol_nightrecord as o group by o.communityid order by o.communityid';
            postgre.excuteSql(patrolsumSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let sum=+data.sum;
                        let bug=+data.bug;
                        let offline=+data.offline;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].patrol.sum=sum;
                            //合计及bug
                            middleObj['stat:c:'+data.communityid].sum.patrol+=sum;
                            middleObj['stat:c:'+data.communityid].bug.patrol+=bug;
                            redis.hset('stat:c:'+data.communityid,'patrol',JSON.stringify(middleObj['stat:c:'+data.communityid].patrol));
                            redis.hset('stat:c:'+data.communityid,'sum',JSON.stringify(middleObj['stat:c:'+data.communityid].sum));
                            redis.hset('stat:c:'+data.communityid,'bug',JSON.stringify(middleObj['stat:c:'+data.communityid].bug));
                            //设备状态
                            middleObj['stat:c:'+data.communityid].devicesta.online+=sum-offline;
                            middleObj['stat:c:'+data.communityid].devicesta.offline+=offline;
                            middleObj['stat:c:'+data.communityid].devicesta.bug+=bug;
                            middleObj['stat:c:'+data.communityid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:c:'+data.communityid,'devicesta',JSON.stringify(middleObj['stat:c:'+data.communityid].devicesta));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                            middleObj['stat:r:' + deptid].patrol.sum += sum;
                            redis.hset('stat:r:' + deptid, 'patrol', JSON.stringify(middleObj['stat:r:' + deptid].patrol));
                            //合计及bug
                            middleObj['stat:r:'+deptid].sum.patrol+=sum;
                            middleObj['stat:r:'+deptid].bug.patrol+=bug;
                            redis.hset('stat:r:' + deptid, 'sum', JSON.stringify(middleObj['stat:r:' + deptid].sum));
                            redis.hset('stat:r:' + deptid, 'bug', JSON.stringify(middleObj['stat:r:' + deptid].bug));
                            //设备状态
                            middleObj['stat:r:' + deptid].devicesta.online+=sum-offline;
                            middleObj['stat:r:' + deptid].devicesta.offline+=offline;
                            middleObj['stat:r:' + deptid].devicesta.bug+=bug;
                            middleObj['stat:r:' + deptid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:r:' + deptid,'devicesta',JSON.stringify(middleObj['stat:r:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                            middleObj['stat:g:' + deptid].patrol.sum += sum;
                            redis.hset('stat:g:' + deptid, 'patrol', JSON.stringify(middleObj['stat:g:' + deptid].patrol));
                            //合计及bug
                            middleObj['stat:g:'+deptid].sum.patrol+=sum;
                            middleObj['stat:g:'+deptid].bug.patrol+=bug;
                            redis.hset('stat:g:' + deptid, 'sum', JSON.stringify(middleObj['stat:g:' + deptid].sum));
                            redis.hset('stat:g:' + deptid, 'bug', JSON.stringify(middleObj['stat:g:' + deptid].bug));
                            //设备状态
                            middleObj['stat:g:' + deptid].devicesta.online+=sum-offline;
                            middleObj['stat:g:' + deptid].devicesta.offline+=offline;
                            middleObj['stat:g:' + deptid].devicesta.bug+=bug;
                            middleObj['stat:g:' + deptid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:g:' + deptid,'devicesta',JSON.stringify(middleObj['stat:g:' + deptid].devicesta));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                            middleObj['stat:h:' + deptid].patrol.sum += sum;
                            redis.hset('stat:h:' + deptid, 'patrol', JSON.stringify(middleObj['stat:h:' + deptid].patrol));
                            //合计及bug
                            middleObj['stat:h:'+deptid].sum.patrol+=sum;
                            middleObj['stat:h:'+deptid].bug.patrol+=bug;
                            redis.hset('stat:h:' + deptid, 'sum', JSON.stringify(middleObj['stat:h:' + deptid].sum));
                            redis.hset('stat:h:' + deptid, 'bug', JSON.stringify(middleObj['stat:h:' + deptid].bug));
                            //设备状态
                            middleObj['stat:h:' + deptid].devicesta.online+=sum-offline;
                            middleObj['stat:h:' + deptid].devicesta.offline+=offline;
                            middleObj['stat:h:' + deptid].devicesta.bug+=bug;
                            middleObj['stat:h:' + deptid].devicesta.nobug+=sum-bug;
                            redis.hset('stat:h:' + deptid,'devicesta',JSON.stringify(middleObj['stat:h:' + deptid].devicesta));
                            });
                        }
                    });
                }
            });
            postgre.excuteSql(patrolrecordSql,[],function (result){
                if(result.rowCount>0){
                    result.rows.forEach(function(data){
                        let yet=+data.yet;
                        let not=+data.not;
                        if(middleObj['stat:c:'+data.communityid]!=undefined){

                            middleObj['stat:c:'+data.communityid].patrol.yet=yet;
                            middleObj['stat:c:'+data.communityid].patrol.not=not;
                            redis.hset('stat:c:'+data.communityid,'patrol',JSON.stringify(middleObj['stat:c:'+data.communityid].patrol));
                            redis.hget('deptdict:'+data.communityid,'regionid',(deptid)=>{
                                middleObj['stat:r:' + deptid].patrol.yet += yet;
                                middleObj['stat:r:' + deptid].patrol.not += not;
                                redis.hset('stat:r:' + deptid, 'patrol', JSON.stringify(middleObj['stat:r:' + deptid].patrol));
                            });
                            redis.hget('deptdict:'+data.communityid,'groupid',(deptid)=>{
                                middleObj['stat:g:' + deptid].patrol.yet += yet;
                                middleObj['stat:g:' + deptid].patrol.not += not;
                                redis.hset('stat:g:' + deptid, 'patrol', JSON.stringify(middleObj['stat:g:' + deptid].patrol));
                            });
                            redis.hget('deptdict:'+data.communityid,'haierid',(deptid)=>{
                                middleObj['stat:h:' + deptid].patrol.yet += yet;
                                middleObj['stat:h:' + deptid].patrol.not += not;
                                redis.hset('stat:h:' + deptid, 'patrol', JSON.stringify(middleObj['stat:h:' + deptid].patrol));
                            });
                        }
                    });
                }
            });

        });
        console.log('初始化统计设备信息完成！');
    };

    //初始化发布主题，按照社区，大区，集团，haier分别发布
    this.publishTopic=()=>{
        let publishRole=['stat:c:*','stat:r:*','stat:g:*','stat:h:*'];
        let publishPath=[constUtils.TOPIC_STATISTICS_COMMUNITY,constUtils.TOPIC_STATISTICS_REGION,constUtils.TOPIC_STATISTICS_GROUP,constUtils.TOPIC_STATISTICS_SUPER];
        let desc_contents=[];
        let j=0;
        publishRole.forEach(function(keyrole,index){
            let communityStatInfo=[];

            redis.keys(keyrole,function(keys){
                keys.forEach(function(key,keyindex){
                    redis.hgetall(key,(data)=>{
                        let statinfo={};
                        let datainfo={};
                        statinfo.id=key.substring(7);
                        Object.keys(data).forEach((key)=>{
                            if(key != 'devicesta'){
                                datainfo[key]=JSON.parse(data[key]);
                            }
                        });
                        statinfo.data=datainfo;
                        communityStatInfo.push(statinfo);
                        if(communityStatInfo.length==keys.length && keyindex==keys.length-1){
                            let descContent={};
                            descContent['destination']=publishPath[index];
                            descContent['content']=JSON.stringify(communityStatInfo);
                            desc_contents.push(descContent);
                            j++;
                            if(j==publishRole.length){
                                publisher.mutlipublish(desc_contents);
                            }
                        }
                    });

                });

            });

        });

    };
}

module.exports = initStatistics;
