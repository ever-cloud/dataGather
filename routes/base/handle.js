"use strict";
let constUtils = require('../../utils/constUtils');
let postgre = require("../../utils/postgre");
let redis = require("../../utils/redis");

let systemtypes=['','monitor','intercom','intrusion','info','gate','park','elevator','broadcast','patrol','location'];
//communityid社区id  types需要统计类型  typearrays 统计系统类型
//  online 系统在线状态统计
let _stat=function(communityid,types,typearrays,cb){
    switch(types){
        case 'online'://统计系统在线
            let systeminfoSql='select s.sid,s.status from '+constUtils.TABLE_P_SYSTEMINFO+' as s where s.communityid=? order by cast(s.sid as integer)';
            postgre.excuteSql(systeminfoSql,[communityid],function (result){
                if(result.rowCount>0){
                    redis.exists('stat:c:'+communityid,(isexists)=>{
                        if(isexists===1){
                            let calinfo={};
                            redis.hgetall('stat:c:'+communityid,(communitystats)=>{
                                Object.keys(communitystats).forEach(function (field,index) {
                                    let oldstatinfo=JSON.parse(communitystats[field]);
                                    result.rows.forEach(function(data){
                                        if(systemtypes[data.sid]==field){
                                        let newonlie=0;
                                        if(data.status !='0') newonlie=1;
                                            calinfo[field]=newonlie-oldstatinfo.online;
                                            oldstatinfo['online']=newonlie;
                                            redis.hset('stat:c:'+communityid,field,JSON.stringify(oldstatinfo));
                                        }
                                    });
                                });
                            });

                            redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                redis.hgetall('stat:r:'+deptid,(regionstats)=>{
                                    Object.keys(regionstats).forEach(function (field,index) {
                                        result.rows.forEach(function(data){
                                            if(systemtypes[data.sid]==field){
                                                let oldstatinfo=JSON.parse(regionstats[field]);
                                                oldstatinfo['online']=+oldstatinfo['online']+calinfo[field];
                                                redis.hset('stat:r:'+deptid,field,JSON.stringify(oldstatinfo));
                                            }
                                        });
                                    });
                                });

                            });
                            redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                redis.hgetall('stat:g:'+deptid,(groupstats)=>{
                                    Object.keys(groupstats).forEach(function (field,index) {
                                        result.rows.forEach(function(data){
                                            if(systemtypes[data.sid]==field){
                                                let oldstatinfo=JSON.parse(groupstats[field]);
                                                oldstatinfo['online']=+oldstatinfo['online']+calinfo[field];
                                                redis.hset('stat:g:'+deptid,field,JSON.stringify(oldstatinfo));
                                            }
                                        });
                                    });

                                });

                            });
                            redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                redis.hgetall('stat:h:'+deptid,(haierstats)=>{
                                    Object.keys(haierstats).forEach(function (field,index) {
                                        result.rows.forEach(function(data){
                                            if(systemtypes[data.sid]==field){
                                                let oldstatinfo=JSON.parse(haierstats[field]);
                                                oldstatinfo['online']=+oldstatinfo['online']+calinfo[field];
                                                redis.hset('stat:h:'+deptid,field,JSON.stringify(oldstatinfo));
                                            }
                                        });
                                    });
                                });
                            });
                        }
                    });
                }
            });
            break;
        case 'devicestatus'://统计设备数及故障数及在线数
            let systemtypes=['monitor','intercom','intrusion','info','gate','park','elevator','broadcast','patrol','location'];
            let sysdevicetables=['p_videomonitor_deviceinfo','p_videointercom_deviceinfo','p_alarm_deviceinfo','p_infodiffusion_deviceinfo','p_gate_deviceinfo','p_parking_deviceinfo','p_elevator_deviceinfo','p_broadcast_deviceinfo','p_patrol_deviceinfo','p_personlocation_deviceinfo'];
            if(typearrays instanceof Array && typearrays.length > 0){
                let tempst=[];
                sysdevicetables.forEach(function(item,index){
                    for(var i=0;i<typearrays.length;i++){
                        if(item ==typearrays[i]){
                            tempst.push(systemtypes[index]);
                            break;
                        }
                    }
                });
                systemtypes=tempst;
                sysdevicetables=typearrays;
            }
            let deviceinfosql='';
            sysdevicetables.forEach((deviceinfotable,dindex)=>{
                if(deviceinfotable=='p_videomonitor_deviceinfo'){
                    deviceinfosql='SELECT t.communityid,sum(case when t.devicetype=\'camera\'  then 1 else 0 end) as "camerasum",sum(case when t.devicetype=\'camera\'  and t.status=\'2\' then 1 else 0 end) as "camerabug",sum(case when t.devicetype=\'dvr\'  then 1 else 0 end) as "dvrsum",sum(case when t.devicetype=\'dvr\' and t.status=\'2\' then 1 else 0 end) as "dvrbug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" FROM '+deviceinfotable+' t where t.communityid=$1 and t.status<>\'3\' group by t.communityid';
                }else{
                    deviceinfosql='SELECT t.communityid,count(id) as "sum",sum(case when t.status=\'2\' then 1 else 0 end) as "bug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" FROM '+deviceinfotable+' t where t.status<>\'3\' where t.communityid=$1 group by t.communityid ';
                }
                postgre.excuteSql(deviceinfosql,[communityid],function (result){
                    if(result.rowCount>0){
                        redis.exists('stat:c:'+communityid,(isexists)=>{
                            if(isexists===1){
                                let calinfo={};
                                redis.hgetall('stat:c:'+communityid,(communitystats)=>{
                                    let oldstatinfo={};
                                    let oldstatsum={};
                                    let oldstatbug={};
                                    let oldstatdevicesta={};
                                    Object.keys(communitystats).forEach(function (field) {
                                        if(field=='sum'){
                                            oldstatsum=JSON.parse(communitystats[field]);
                                        }else if(field=='bug'){
                                            oldstatbug=JSON.parse(communitystats[field]);
                                        }else if(field=='devicesta'){
                                            oldstatdevicesta=JSON.parse(communitystats[field]);
                                        }else{
                                            oldstatinfo=JSON.parse(communitystats[field]);
                                        }
                                    });
                                    Object.keys(communitystats).forEach(function (field) {
                                        result.rows.forEach(function(data){
                                            if(systemtypes[dindex]==field){
                                                if(field=='monitor'){
                                                    let camerasum=data.camerasum;
                                                    let camerabug=data.camerabug;
                                                    let dvrsum=data.dvrsum;
                                                    let dvrbug=data.dvrbug;
                                                    let offline=data.offline;
                                                    calinfo[field]['camerasum']=camerasum-oldstatinfo.camerasum;
                                                    calinfo[field]['camerabug']=camerabug-oldstatinfo.camerabug;
                                                    calinfo[field]['dvrsum']=dvrsum-oldstatinfo.dvrsum;
                                                    calinfo[field]['dvrbug']=dvrbug-oldstatinfo.dvrbug;
                                                    calinfo['online']=camerasum+dvrsum-offline-oldstatdevicesta.online;
                                                    calinfo['offline']=offline-oldstatdevicesta.offline;
                                                    calinfo['bug']=camerabug+dvrbug-oldstatdevicesta.bug;
                                                    calinfo['nobug']=camerasum+dvrsum-(camerabug+dvrbug)-oldstatdevicesta.nobug;
                                                    oldstatinfo['camera']['sum']=camerasum;
                                                    oldstatinfo['camera']['bug']=camerabug;
                                                    oldstatinfo['dvr']['sum']=dvrsum;
                                                    oldstatinfo['dvr']['bug']=dvrbug;
                                                    if(oldstatsum[field] != undefined)
                                                        oldstatsum[field]=oldstatsum[field]+calinfo[field]['camerasum']+calinfo[field]['dvrsum'];
                                                    if(oldstatbug[field] != undefined)
                                                        oldstatbug[field]=oldstatbug[field]+calinfo[field]['camerabug']+calinfo[field]['dvrbug'];
                                                    if(oldstatdevicesta['online'] != undefined)
                                                        oldstatdevicesta['online']+=calinfo['online'];
                                                    if(oldstatdevicesta['offline'] != undefined)
                                                        oldstatdevicesta['offline']+=calinfo['offline'];
                                                    if(oldstatdevicesta['bug'] != undefined)
                                                        oldstatdevicesta['bug']+=calinfo['bug'];
                                                    if(oldstatdevicesta['nobug'] != undefined)
                                                        oldstatdevicesta['nobug']+=calinfo['nobug'];
                                                }else{
                                                    let sum=data.sum;
                                                    let bug=data.bug;
                                                    let offline=data.offline;
                                                    calinfo[field]['sum']=sum-oldstatinfo.sum;
                                                    calinfo[field]['bug'] = bug - oldstatinfo.bug;
                                                    calinfo['online']=sum-offline-oldstatdevicesta.online;
                                                    calinfo['offline']=offline-oldstatdevicesta.offline;
                                                    calinfo['bug']=bug-oldstatdevicesta.bug;
                                                    calinfo['nobug']=sum-bug-oldstatdevicesta.nobug;
                                                    if(oldstatinfo.sum !=undefined && field !='intrusion' && field !='park'){
                                                            oldstatinfo['sum']=sum;
                                                    }
                                                    if(oldstatinfo.bug !=undefined) {
                                                        oldstatinfo['bug'] = bug;
                                                    }
                                                    if(oldstatsum[field] != undefined)
                                                        oldstatsum[field]=oldstatsum[field]+calinfo[field]['sum'];
                                                    if(oldstatbug[field] != undefined)
                                                        oldstatbug[field]=oldstatbug[field]+calinfo[field]['bug'];
                                                    if(oldstatdevicesta['online'] != undefined)
                                                        oldstatdevicesta['online']+=calinfo['online'];
                                                    if(oldstatdevicesta['offline'] != undefined)
                                                        oldstatdevicesta['offline']+=calinfo['offline'];
                                                    if(oldstatdevicesta['bug'] != undefined)
                                                        oldstatdevicesta['bug']+=calinfo['bug'];
                                                    if(oldstatdevicesta['nobug'] != undefined)
                                                        oldstatdevicesta['nobug']+=calinfo['nobug'];

                                                }
                                                redis.hset('stat:c:'+communityid,field,JSON.stringify(oldstatinfo));
                                            }
                                        });
                                        if(field=='sum'){
                                            redis.hset('stat:c:'+communityid,field,JSON.stringify(oldstatsum));
                                        }else if(field=='bug'){
                                            redis.hset('stat:c:'+communityid,field,JSON.stringify(oldstatbug));
                                        }else if(field=='devicesta'){
                                            redis.hset('stat:c:'+communityid,field,JSON.stringify(oldstatdevicesta));
                                        }
                                    });
                                });

                                redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                    redis.hgetall('stat:r:'+deptid,(regionstats)=>{
                                        Object.keys(regionstats).forEach(function (field) {
                                            let oldstatinfo={};
                                            let oldstatsum={};
                                            let oldstatbug={};
                                            let oldstatdevicesta={};
                                            if(field=='sum'){
                                                oldstatsum=JSON.parse(regionstats[field]);
                                            }else if(field=='bug'){
                                                oldstatbug=JSON.parse(regionstats[field]);
                                            }else if(field=='devicesta'){
                                                oldstatdevicesta=JSON.parse(regionstats[field]);
                                            }else{
                                                oldstatinfo=JSON.parse(regionstats[field]);
                                            }
                                        });
                                        Object.keys(regionstats).forEach(function (field){
                                            if(systemtypes[dindex]==field){
                                                if(field=='monitor'){
                                                    oldstatinfo['camera']['sum']==+oldstatinfo['camera']['sum']+calinfo[field]['camerasum'];
                                                    oldstatinfo['camera']['bug']==+oldstatinfo['camera']['bug']+calinfo[field]['camerabug'];
                                                    oldstatinfo['dvr']['sum']=+oldstatinfo['dvr']['sum']+calinfo[field]['dvrsum'];
                                                    oldstatinfo['dvr']['bug']=+oldstatinfo['dvr']['bug']+calinfo[field]['dvrbug'];
                                                    if(oldstatsum[field] != undefined)
                                                        oldstatsum[field]=oldstatsum[field]+calinfo[field]['camerasum']+calinfo[field]['dvrsum'];
                                                    if(oldstatbug[field] != undefined)
                                                        oldstatbug[field]=oldstatbug[field]+calinfo[field]['camerabug']+calinfo[field]['dvrbug'];
                                                    
                                                }else{
                                                    if(oldstatinfo.sum !=undefined && field !='intrusion' && field !='park'){
                                                        oldstatinfo['sum']=+oldstatinfo['sum']+calinfo[field]['sum'];
                                                    }
                                                    if(oldstatinfo.bug !=undefined) {
                                                        oldstatinfo['bug']=+oldstatinfo['bug']+calinfo[field]['bug'];
                                                    }
                                                    if(oldstatsum[field] != undefined)
                                                        oldstatsum[field]=oldstatsum[field]+calinfo[field]['sum'];
                                                    if(oldstatbug[field] != undefined)
                                                        oldstatbug[field]=oldstatbug[field]+calinfo[field]['bug'];
                                                }
                                                if(oldstatdevicesta['online'] != undefined)
                                                    oldstatdevicesta['online']+=calinfo['online'];
                                                if(oldstatdevicesta['offline'] != undefined)
                                                    oldstatdevicesta['offline']+=calinfo['offline'];
                                                if(oldstatdevicesta['bug'] != undefined)
                                                    oldstatdevicesta['bug']+=calinfo['bug'];
                                                if(oldstatdevicesta['nobug'] != undefined)
                                                    oldstatdevicesta['nobug']+=calinfo['nobug'];
                                                redis.hset('stat:r:'+deptid,field,JSON.stringify(oldstatinfo));
                                            }
                                            if(field=='sum'){
                                                redis.hset('stat:r:'+deptid,field,JSON.stringify(oldstatsum));
                                            }else if(field=='bug'){
                                                redis.hset('stat:r:'+deptid,field,JSON.stringify(oldstatbug));
                                            }else if(field=='devicesta'){
                                                redis.hset('stat:r:'+deptid,field,JSON.stringify(oldstatdevicesta));
                                            }
                                        });
                                    });

                                });
                                redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                    redis.hgetall('stat:g:'+deptid,(groupstats)=>{
                                        Object.keys(groupstats).forEach(function (field) {
                                            let oldstatinfo={};
                                            let oldstatsum={};
                                            let oldstatbug={};
                                            let oldstatdevicesta={};
                                            if(field=='sum'){
                                                oldstatsum=JSON.parse(groupstats[field]);
                                            }else if(field=='bug'){
                                                oldstatbug=JSON.parse(groupstats[field]);
                                            }else if(field=='devicesta'){
                                                oldstatdevicesta=JSON.parse(groupstats[field]);
                                            }else{
                                                oldstatinfo=JSON.parse(groupstats[field]);
                                            }
                                        });
                                        Object.keys(groupstats).forEach(function (field){
                                            if(systemtypes[dindex]==field){
                                                if(field=='monitor'){
                                                    oldstatinfo['camera']['sum']==+oldstatinfo['camera']['sum']+calinfo[field]['camerasum'];
                                                    oldstatinfo['camera']['bug']==+oldstatinfo['camera']['bug']+calinfo[field]['camerabug'];
                                                    oldstatinfo['dvr']['sum']=+oldstatinfo['dvr']['sum']+calinfo[field]['dvrsum'];
                                                    oldstatinfo['dvr']['bug']=+oldstatinfo['dvr']['bug']+calinfo[field]['dvrbug'];
                                                    if(oldstatsum[field] != undefined)
                                                        oldstatsum[field]=oldstatsum[field]+calinfo[field]['camerasum']+calinfo[field]['dvrsum'];
                                                    if(oldstatbug[field] != undefined)
                                                        oldstatbug[field]=oldstatbug[field]+calinfo[field]['camerabug']+calinfo[field]['dvrbug'];
                                                }else{
                                                    if(oldstatinfo.sum !=undefined && field !='intrusion' && field !='park'){
                                                        oldstatinfo['sum']=+oldstatinfo['sum']+calinfo[field]['sum'];
                                                    }
                                                    if(oldstatinfo.bug !=undefined) {
                                                        oldstatinfo['bug']=+oldstatinfo['bug']+calinfo[field]['bug'];
                                                    }
                                                    if(oldstatsum[field] != undefined)
                                                        oldstatsum[field]=oldstatsum[field]+calinfo[field]['sum'];
                                                    if(oldstatbug[field] != undefined)
                                                        oldstatbug[field]=oldstatbug[field]+calinfo[field]['bug'];
                                                }
                                                if(oldstatdevicesta['online'] != undefined)
                                                    oldstatdevicesta['online']+=calinfo['online'];
                                                if(oldstatdevicesta['offline'] != undefined)
                                                    oldstatdevicesta['offline']+=calinfo['offline'];
                                                if(oldstatdevicesta['bug'] != undefined)
                                                    oldstatdevicesta['bug']+=calinfo['bug'];
                                                if(oldstatdevicesta['nobug'] != undefined)
                                                    oldstatdevicesta['nobug']+=calinfo['nobug'];
                                                redis.hset('stat:g:'+deptid,field,JSON.stringify(oldstatinfo));
                                            }
                                            if(field=='sum'){
                                                redis.hset('stat:g:'+deptid,field,JSON.stringify(oldstatsum));
                                            }else if(field=='bug'){
                                                redis.hset('stat:g:'+deptid,field,JSON.stringify(oldstatbug));
                                            }else if(field=='devicesta'){
                                                redis.hset('stat:g:'+deptid,field,JSON.stringify(oldstatdevicesta));
                                            }
                                        });
                                    });
                                });
                                redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                    redis.hgetall('stat:h:'+deptid,(haierstats)=>{
                                        Object.keys(haierstats).forEach(function (field) {
                                            let oldstatinfo={};
                                            let oldstatsum={};
                                            let oldstatbug={};
                                            let oldstatdevicesta={};
                                            if(field=='sum'){
                                                oldstatsum=JSON.parse(haierstats[field]);
                                            }else if(field=='bug'){
                                                oldstatbug=JSON.parse(haierstats[field]);
                                            }else if(field=='devicesta'){
                                                oldstatdevicesta=JSON.parse(haierstats[field]);
                                            }else{
                                                oldstatinfo=JSON.parse(haierstats[field]);
                                            }
                                        });
                                        Object.keys(haierstats).forEach(function (field){
                                            if(systemtypes[dindex]==field){
                                                if(field=='monitor'){
                                                    oldstatinfo['camera']['sum']==+oldstatinfo['camera']['sum']+calinfo[field]['camerasum'];
                                                    oldstatinfo['camera']['bug']==+oldstatinfo['camera']['bug']+calinfo[field]['camerabug'];
                                                    oldstatinfo['dvr']['sum']=+oldstatinfo['dvr']['sum']+calinfo[field]['dvrsum'];
                                                    oldstatinfo['dvr']['bug']=+oldstatinfo['dvr']['bug']+calinfo[field]['dvrbug'];
                                                    if(oldstatsum[field] != undefined)
                                                        oldstatsum[field]=oldstatsum[field]+calinfo[field]['camerasum']+calinfo[field]['dvrsum'];
                                                    if(oldstatbug[field] != undefined)
                                                        oldstatbug[field]=oldstatbug[field]+calinfo[field]['camerabug']+calinfo[field]['dvrbug'];
                                                }else{
                                                    if(oldstatinfo.sum !=undefined && field !='intrusion' && field !='park'){
                                                        oldstatinfo['sum']=+oldstatinfo['sum']+calinfo[field]['sum'];
                                                    }
                                                    if(oldstatinfo.bug !=undefined) {
                                                        oldstatinfo['bug']=+oldstatinfo['bug']+calinfo[field]['bug'];
                                                    }
                                                    if(oldstatsum[field] != undefined)
                                                        oldstatsum[field]=oldstatsum[field]+calinfo[field]['sum'];
                                                    if(oldstatbug[field] != undefined)
                                                        oldstatbug[field]=oldstatbug[field]+calinfo[field]['bug'];
                                                }
                                                if(oldstatdevicesta['online'] != undefined)
                                                    oldstatdevicesta['online']+=calinfo['online'];
                                                if(oldstatdevicesta['offline'] != undefined)
                                                    oldstatdevicesta['offline']+=calinfo['offline'];
                                                if(oldstatdevicesta['bug'] != undefined)
                                                    oldstatdevicesta['bug']+=calinfo['bug'];
                                                if(oldstatdevicesta['nobug'] != undefined)
                                                    oldstatdevicesta['nobug']+=calinfo['nobug'];
                                                redis.hset('stat:h:'+deptid,field,JSON.stringify(oldstatinfo));
                                            }
                                            if(field=='sum'){
                                                redis.hset('stat:h:'+deptid,field,JSON.stringify(oldstatsum));
                                            }else if(field=='bug'){
                                                redis.hset('stat:h:'+deptid,field,JSON.stringify(oldstatbug));
                                            }else if(field=='devicesta'){
                                                redis.hset('stat:h:'+deptid,field,JSON.stringify(oldstatdevicesta));
                                            }
                                        });
                                    });
                                });
                            }
                        });
                    }
                });
            });
            break;
        case 'alarm'://统计报警数包括设备报警和实时报警
            if(typearrays instanceof Array && typearrays.length > 0){
                let realalarmsql='';
                let alarmservicesql='';
                typearrays.forEach((stattype,dindex)=>{
                    if(stattype=='elevator'){
                        realalarmsql='select t.communityid,count(t.communityid) as "alarm" FROM p_devicealarm t where t.communityid=$1 and t.sid=\'7\' and t."datetime" BETWEEN CURRENT_DATE and CURRENT_DATE+1 group by t.communityid ';
                        alarmservicesql='select o.communityid,count(o.communityid) as "alarm" from(SELECT distinct communityid,deviceid FROM p_devicealarm t where t.communityid=$1 and t.sid=\'7\' and t."datetime" BETWEEN CURRENT_DATE and CURRENT_DATE+1) o group by o.communityid';
                    }else if(stattype=='intrusion'){
                        realalarmsql='select o.communityid,count(o.communityid) as "alarm" from p_alarm_intrusion  o where o.communityid=$1 and o.datetime BETWEEN CURRENT_DATE and CURRENT_DATE+1 group by o.communityid';
                        alarmservicesql='select o.communityid,count(o.communityid) as "alarm" from p_alarm_intrusion  o where o.communityid=$1  group by o.communityid';
                    }else if(stattype=='intercom'){
                        realalarmsql='select o.communityid,count(o.communityid) as "alarm" from p_devicealarm o where o.communityid=$1 and o.sid=\'2\' and o."datetime" BETWEEN CURRENT_DATE and CURRENT_DATE+1 group by o.communityid';
                        alarmservicesql='select o.communityid,count(o.communityid) as "alarm" from(SELECT distinct communityid,deviceid FROM p_devicealarm t where t.communityid=$1 and t.sid=\'2\' and t."datetime" BETWEEN CURRENT_DATE and CURRENT_DATE+1) o group by o.communityid';
                    }else if(stattype=='location'){
                        realalarmsql='select p.communityid,count(p.communityid) as "alarm" from p_personlocation_alarm p where p.communityid=$1 and p.datetime BETWEEN CURRENT_DATE and CURRENT_DATE+1  group by p.communityid';
                        alarmservicesql='select p.communityid,count(p.communityid) as "alarm" from p_personlocation_alarm p where p.communityid=$1 and p.alarmtype=\'1\'   group by p.communityid';
                    }else if(stattype=='gate'){
                        alarmservicesql='select t.communityid,count(t.communityid) as "alarm" from p_devicealarm t where t.communityid=$1 and t.sid=\'5\'  group by t.communityid';
                    }
                    postgre.excuteSql(realalarmsql,[communityid],function (result){
                        if(result.rowCount>0){
                            redis.exists('stat:c:'+communityid,(isexists)=>{
                                if(isexists===1){
                                    let calinfo={};
                                    redis.hget('stat:c:'+communityid,'alarm',(communitystats)=>{
                                        let oldstatinfo=JSON.parse(communitystats);
                                        result.rows.forEach(function(data){
                                            let alarm=data.alarm;
                                            if(oldstatinfo[stattype] !=undefined){
                                                calinfo[stattype]=alarm-oldstatinfo[stattype];
                                                oldstatinfo[stattype]=alarm;
                                            }
                                        redis.hset('stat:c:'+communityid,'alarm',JSON.stringify(oldstatinfo));
                                        });
                                    });
                                    redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                        redis.hget('stat:r:'+deptid,'alarm',(regionstats)=>{
                                                let oldstatinfo=JSON.parse(regionstats);
                                                if(oldstatinfo[stattype] != undefined)
                                                    oldstatinfo[stattype]=+oldstatinfo[stattype]+calinfo[stattype];
                                                redis.hset('stat:r:'+deptid,'alarm',JSON.stringify(oldstatinfo));
                                        });
                                    });
                                    redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                        redis.hget('stat:g:'+deptid,'alarm',(groupstats)=>{
                                            let oldstatinfo=JSON.parse(groupstats);
                                            if(oldstatinfo[stattype] != undefined)
                                                oldstatinfo[stattype]=+oldstatinfo[stattype]+calinfo[stattype];
                                            redis.hset('stat:g:'+deptid,'alarm',JSON.stringify(oldstatinfo));

                                        });
                                    });
                                    redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                        redis.hget('stat:h:'+deptid,'alarm',(haierstats)=>{
                                            let oldstatinfo=JSON.parse(haierstats);
                                            if(oldstatinfo[stattype] != undefined)
                                                oldstatinfo[stattype]=+oldstatinfo[stattype]+calinfo[stattype];
                                            redis.hset('stat:h:'+deptid,'alarm',JSON.stringify(oldstatinfo));
                                        });
                                    });
                                }
                            });
                        }
                    });
                    postgre.excuteSql(alarmservicesql,[communityid],function (result){
                        if(result.rowCount>0){
                            redis.exists('stat:c:'+communityid,(isexists)=>{
                                if(isexists===1){
                                    let calinfo={};
                                    redis.hget('stat:c:'+communityid,stattype,(communitystats)=>{
                                        let oldstatinfo=JSON.parse(communitystats);
                                        result.rows.forEach(function(data){
                                            let alarm=data.alarm;
                                            if(oldstatinfo['alarm'] !=undefined){
                                                calinfo[stattype]=alarm-oldstatinfo['alarm'];
                                                oldstatinfo['alarm']=alarm;
                                            }
                                        redis.hset('stat:c:'+communityid,stattype,JSON.stringify(oldstatinfo));
                                        });
                                    });
                                    redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                        redis.hget('stat:r:'+deptid,stattype,(regionstats)=>{
                                                let oldstatinfo=JSON.parse(regionstats);
                                                if(oldstatinfo['alarm'] != undefined)
                                                    oldstatinfo['alarm']=+oldstatinfo['alarm']+calinfo[stattype];
                                                redis.hset('stat:r:'+deptid,stattype,JSON.stringify(oldstatinfo));
                                        });
                                    });
                                    redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                        redis.hget('stat:g:'+deptid,stattype,(groupstats)=>{
                                            let oldstatinfo=JSON.parse(groupstats);
                                            if(oldstatinfo['alarm'] != undefined)
                                                oldstatinfo['alarm']=+oldstatinfo['alarm']+calinfo[stattype];
                                            redis.hset('stat:g:'+deptid,stattype,JSON.stringify(oldstatinfo));

                                        });
                                    });
                                    redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                        redis.hget('stat:h:'+deptid,stattype,(haierstats)=>{
                                            let oldstatinfo=JSON.parse(haierstats);
                                            if(oldstatinfo['alarm'] != undefined)
                                                oldstatinfo['alarm']=+oldstatinfo['alarm']+calinfo[stattype];
                                            redis.hset('stat:h:'+deptid,stattype,JSON.stringify(oldstatinfo));
                                        });
                                    });
                                }
                            });
                        }
                    });

                });
            }else{
                console.log('第三个参数为数组并且参数个数大于0');
            }
            break;
        case 'parkio'://统计停车场进出
            let parkiosql='select o.communityid,sum(case when o.status=\'enter\'  then 1 else 0 end) as "in",sum(case when o.status=\'leave\'  then 1 else 0 end) as "out" from p_parking_carrecord  o where o.communityid=$1 group by o.communityid';
                postgre.excuteSql(parkiosql,[communityid],function (result){
                    if(result.rowCount>0){
                        redis.exists('stat:c:'+communityid,(isexists)=>{
                            if(isexists===1){
                                let calinfo={};
                                redis.hget('stat:c:'+communityid,'park',(communitystats)=>{
                                    let oldstatinfo=JSON.parse(communitystats);
                                    result.rows.forEach(function(data){
                                        let parkin=data.in;
                                        let parkout=data.out;
                                        if(oldstatinfo['in'] !=undefined){
                                            calinfo['in']=parkin-oldstatinfo['in'];
                                            oldstatinfo['in']=parkin;
                                        }
                                        if(oldstatinfo['out'] !=undefined){
                                            calinfo['out']=parkout-oldstatinfo['out'];
                                            oldstatinfo['out']=parkout;
                                        }
                                    redis.hset('stat:c:'+communityid,'park',JSON.stringify(oldstatinfo));
                                    });
                                });
                                redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                    redis.hget('stat:r:'+deptid,'park',(regionstats)=>{
                                            let oldstatinfo=JSON.parse(regionstats);
                                            if(oldstatinfo['in'] != undefined)
                                                oldstatinfo['in']=+oldstatinfo['in']+calinfo['in'];
                                            if(oldstatinfo['out'] != undefined)
                                                oldstatinfo['out']=+oldstatinfo['out']+calinfo['out'];
                                            redis.hset('stat:r:'+deptid,'park',JSON.stringify(oldstatinfo));
                                    });
                                });
                                redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                    redis.hget('stat:g:'+deptid,'park',(groupstats)=>{
                                        let oldstatinfo=JSON.parse(groupstats);
                                        if(oldstatinfo['in'] != undefined)
                                            oldstatinfo['in']=+oldstatinfo['in']+calinfo['in'];
                                        if(oldstatinfo['out'] != undefined)
                                            oldstatinfo['out']=+oldstatinfo['out']+calinfo['out'];
                                        redis.hset('stat:g:'+deptid,'park',JSON.stringify(oldstatinfo));

                                    });
                                });
                                redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                    redis.hget('stat:h:'+deptid,'park',(haierstats)=>{
                                        let oldstatinfo=JSON.parse(haierstats);
                                        if(oldstatinfo['in'] != undefined)
                                            oldstatinfo['in']=+oldstatinfo['in']+calinfo['in'];
                                        if(oldstatinfo['out'] != undefined)
                                            oldstatinfo['out']=+oldstatinfo['out']+calinfo['out'];
                                        redis.hset('stat:h:'+deptid,'park',JSON.stringify(oldstatinfo));
                                    });
                                });
                            }
                        });
                    }
                });
            break;
        case 'broadcastinfo':
            let broadcastbroadSql='select t.communityid,count(id) as "onlinesum" FROM p_broadcast_record t where t.communityid=$1 and t."datetime" BETWEEN CURRENT_DATE and CURRENT_DATE+1 group by t.communityid';
            let broadcastsectionSql='select o.communityid,sum(case when o.status=\'1\'  then 1 else 0 end) as "onlinearea",count(id) as "areasum" from p_broadcast_area as o where o.communityid=$1 group by o.communityid';
            postgre.excuteSql(broadcastbroadSql,[communityid],function (result){
                if(result.rowCount>0){
                    redis.exists('stat:c:'+communityid,(isexists)=>{
                        if(isexists===1){
                            let calinfo={};
                            redis.hget('stat:c:'+communityid,'broadcast',(communitystats)=>{
                                let oldstatinfo=JSON.parse(communitystats);
                                result.rows.forEach(function(data){
                                    let onlinesum=data.onlinesum;
                                    if(oldstatinfo['onlinesum'] !=undefined){
                                        calinfo['onlinesum']=onlinesum-oldstatinfo['onlinesum'];
                                        oldstatinfo['onlinesum']=onlinesum;
                                    }
                                    redis.hset('stat:c:'+communityid,'broadcast',JSON.stringify(oldstatinfo));
                                });
                            });
                            redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                redis.hget('stat:r:'+deptid,'broadcast',(regionstats)=>{
                                    let oldstatinfo=JSON.parse(regionstats);
                                    if(oldstatinfo['onlinesum'] != undefined)
                                        oldstatinfo['onlinesum']=+oldstatinfo['onlinesum']+calinfo['onlinesum'];
                                    redis.hset('stat:r:'+deptid,'broadcast',JSON.stringify(oldstatinfo));
                                });
                            });
                            redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                redis.hget('stat:g:'+deptid,'broadcast',(groupstats)=>{
                                    let oldstatinfo=JSON.parse(groupstats);
                                    if(oldstatinfo['onlinesum'] != undefined)
                                        oldstatinfo['onlinesum']=+oldstatinfo['onlinesum']+calinfo['onlinesum'];
                                    redis.hset('stat:g:'+deptid,'broadcast',JSON.stringify(oldstatinfo));
                                });
                            });
                            redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                redis.hget('stat:h:'+deptid,'broadcast',(haierstats)=>{
                                    let oldstatinfo=JSON.parse(haierstats);
                                    if(oldstatinfo['onlinesum'] != undefined)
                                        oldstatinfo['onlinesum']=+oldstatinfo['onlinesum']+calinfo['onlinesum'];
                                    redis.hset('stat:h:'+deptid,'broadcast',JSON.stringify(oldstatinfo));
                                });
                            });
                        }
                    });
                }
            });
            postgre.excuteSql(broadcastsectionSql,[communityid],function (result){
                if(result.rowCount>0){
                    redis.exists('stat:c:'+communityid,(isexists)=>{
                        if(isexists===1){
                            let calinfo={};
                            redis.hget('stat:c:'+communityid,'broadcast',(communitystats)=>{
                                let oldstatinfo=JSON.parse(communitystats);
                                result.rows.forEach(function(data){
                                    let onlinearea=data.onlinearea;
                                    let areasum=data.areasum;
                                    if(oldstatinfo['onlinearea'] !=undefined){
                                        calinfo['onlinearea']=onlinearea-oldstatinfo['onlinearea'];
                                        oldstatinfo['onlinearea']=onlinearea;
                                    }
                                    if(oldstatinfo['areasum'] !=undefined){
                                        calinfo['areasum']=areasum-oldstatinfo['areasum'];
                                        oldstatinfo['areasum']=areasum;
                                    }
                                    redis.hset('stat:c:'+communityid,'broadcast',JSON.stringify(oldstatinfo));
                                });
                            });
                            redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                redis.hget('stat:r:'+deptid,'broadcast',(regionstats)=>{
                                    let oldstatinfo=JSON.parse(regionstats);
                                    if(oldstatinfo['onlinearea'] != undefined)
                                        oldstatinfo['onlinearea']=+oldstatinfo['onlinearea']+calinfo['onlinearea'];
                                    if(oldstatinfo['areasum'] != undefined)
                                        oldstatinfo['areasum']=+oldstatinfo['areasum']+calinfo['areasum'];
                                    redis.hset('stat:r:'+deptid,'broadcast',JSON.stringify(oldstatinfo));
                                });
                            });
                            redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                redis.hget('stat:g:'+deptid,'broadcast',(groupstats)=>{
                                    let oldstatinfo=JSON.parse(groupstats);
                                    if(oldstatinfo['onlinearea'] != undefined)
                                        oldstatinfo['onlinearea']=+oldstatinfo['onlinearea']+calinfo['onlinearea'];
                                    if(oldstatinfo['areasum'] != undefined)
                                        oldstatinfo['areasum']=+oldstatinfo['areasum']+calinfo['areasum'];
                                    redis.hset('stat:g:'+deptid,'broadcast',JSON.stringify(oldstatinfo));

                                });
                            });
                            redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                redis.hget('stat:h:'+deptid,'broadcast',(haierstats)=>{
                                    let oldstatinfo=JSON.parse(haierstats);
                                    if(oldstatinfo['onlinearea'] != undefined)
                                        oldstatinfo['onlinearea']=+oldstatinfo['onlinearea']+calinfo['onlinearea'];
                                    if(oldstatinfo['areasum'] != undefined)
                                        oldstatinfo['areasum']=+oldstatinfo['areasum']+calinfo['areasum'];
                                    redis.hset('stat:h:'+deptid,'broadcast',JSON.stringify(oldstatinfo));
                                });
                            });
                        }
                    });
                }
            });

            break;
            case 'patrolinfo':
        let patrolinfosql='select o.communityid,sum(case when o.result=\'0\'  then 1 else 0 end) as "not",sum(case when (o.result=\'1\' or o.result=\'2\') then 1 else 0 end) as "yet" from p_patrol_nightrecord as o where o.communityid=$1 group by o.communityid';
        postgre.excuteSql(patrolinfosql,[communityid],function (result){
            if(result.rowCount>0){
                redis.exists('stat:c:'+communityid,(isexists)=>{
                    if(isexists===1){
                        let calinfo={};
                        redis.hget('stat:c:'+communityid,'patrol',(communitystats)=>{
                            let oldstatinfo=JSON.parse(communitystats);
                            result.rows.forEach(function(data){
                                let not=data.not;
                                let yet=data.yet;
                                if(oldstatinfo['not'] !=undefined){
                                    calinfo['not']=not-oldstatinfo['not'];
                                    oldstatinfo['not']=not;
                                }
                                if(oldstatinfo['yet'] !=undefined){
                                    calinfo['yet']=yet-oldstatinfo['yet'];
                                    oldstatinfo['yet']=yet;
                                }
                                redis.hset('stat:c:'+communityid,'patrol',JSON.stringify(oldstatinfo));
                            });
                        });
                        redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                            redis.hget('stat:r:'+deptid,'patrol',(regionstats)=>{
                                let oldstatinfo=JSON.parse(regionstats);
                                if(oldstatinfo['not'] != undefined)
                                    oldstatinfo['not']=+oldstatinfo['not']+calinfo['not'];
                                if(oldstatinfo['yet'] != undefined)
                                    oldstatinfo['yet']=+oldstatinfo['yet']+calinfo['yet'];
                                redis.hset('stat:r:'+deptid,'patrol',JSON.stringify(oldstatinfo));
                            });
                        });
                        redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                            redis.hget('stat:g:'+deptid,'patrol',(groupstats)=>{
                                let oldstatinfo=JSON.parse(groupstats);
                                if(oldstatinfo['not'] != undefined)
                                    oldstatinfo['not']=+oldstatinfo['not']+calinfo['not'];
                                if(oldstatinfo['yet'] != undefined)
                                    oldstatinfo['yet']=+oldstatinfo['yet']+calinfo['yet'];
                                redis.hset('stat:g:'+deptid,'patrol',JSON.stringify(oldstatinfo));

                            });
                        });
                        redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                            redis.hget('stat:h:'+deptid,'patrol',(haierstats)=>{
                                let oldstatinfo=JSON.parse(haierstats);
                                if(oldstatinfo['not'] != undefined)
                                    oldstatinfo['not']=+oldstatinfo['not']+calinfo['not'];
                                if(oldstatinfo['yet'] != undefined)
                                    oldstatinfo['yet']=+oldstatinfo['yet']+calinfo['yet'];
                                redis.hset('stat:h:'+deptid,'patrol',JSON.stringify(oldstatinfo));
                            });
                        });
                    }
                });
            }
        });
        break;
        case 'othersum':
            if(typearrays instanceof Array && typearrays.length > 0){
                let othersumsql='';
                typearrays.forEach((stattype,dindex)=>{
                    if(stattype=='park'){
                        othersumsql='select t.communityid,sum(total) as "sum" from p_parking_parkareainfo t where t.communityid=$1 group by t.communityid';
                    }else if(stattype=='intrusion'){
                        othersumsql='select t.communityid,count(sectorid) as "sum" from p_alarm_sectorinfo t  where t.communityid=$1 group by t.communityid';
                    }
                    postgre.excuteSql(othersumsql,[communityid],function (result){
                        if(result.rowCount>0){
                            redis.exists('stat:c:'+communityid,(isexists)=>{
                                if(isexists===1){
                                    let calinfo={};
                                    redis.hget('stat:c:'+communityid,stattype,(communitystats)=>{
                                        let oldstatinfo=JSON.parse(communitystats);
                                        result.rows.forEach(function(data){
                                            let sum=data.sum;
                                            if(oldstatinfo['sum'] !=undefined){
                                                calinfo[stattype]=sum-oldstatinfo['sum'];
                                                oldstatinfo['sum']=sum;
                                            }
                                            redis.hset('stat:c:'+communityid,stattype,JSON.stringify(oldstatinfo));
                                        });
                                    });
                                    redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                        redis.hget('stat:r:'+deptid,stattype,(regionstats)=>{
                                            let oldstatinfo=JSON.parse(regionstats);
                                            if(oldstatinfo['sum'] != undefined)
                                                oldstatinfo['sum']+=+calinfo[stattype];
                                            redis.hset('stat:r:'+deptid,stattype,JSON.stringify(oldstatinfo));
                                        });
                                    });
                                    redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                        redis.hget('stat:g:'+deptid,stattype,(groupstats)=>{
                                            let oldstatinfo=JSON.parse(groupstats);
                                            if(oldstatinfo['sum'] != undefined)
                                                oldstatinfo['sum']+=+calinfo[stattype];
                                            redis.hset('stat:g:'+deptid,stattype,JSON.stringify(oldstatinfo));

                                        });
                                    });
                                    redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                        redis.hget('stat:h:'+deptid,stattype,(haierstats)=>{
                                            let oldstatinfo=JSON.parse(haierstats);
                                            if(oldstatinfo['sum'] != undefined)
                                                oldstatinfo['sum']+=+calinfo[stattype];
                                            redis.hset('stat:h:'+deptid,stattype,JSON.stringify(oldstatinfo));
                                        });
                                    });
                                }
                            });
                        }
                    });
                });
            }else{
                console.log('第三个参数为数组并且参数个数大于0');
            }
            break;
        case 'card':
                let cardsql='select p.communityid,count(p.communityid) as "card" from p_personlocation_givecard p where p.communityid=$1  group by p.communityid';
                postgre.excuteSql(cardsql,[communityid],function (result){
                    if(result.rowCount>0){
                        redis.exists('stat:c:'+communityid,(isexists)=>{
                            if(isexists===1){
                                let calinfo={};
                                redis.hget('stat:c:'+communityid,'location',(communitystats)=>{
                                    let oldstatinfo=JSON.parse(communitystats);
                                    result.rows.forEach(function(data){
                                        let card=data.card;
                                        if(oldstatinfo['card'] !=undefined){
                                            calinfo['card']=card-oldstatinfo['card'];
                                            oldstatinfo['card']=card;
                                        }
                                        redis.hset('stat:c:'+communityid,'location',JSON.stringify(oldstatinfo));
                                    });
                                });
                                redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                    redis.hget('stat:r:'+deptid,'location',(regionstats)=>{
                                        let oldstatinfo=JSON.parse(regionstats);
                                        if(oldstatinfo['card'] != undefined)
                                            oldstatinfo['card']+=+calinfo['card'];
                                        redis.hset('stat:r:'+deptid,'location',JSON.stringify(oldstatinfo));
                                    });
                                });
                                redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                    redis.hget('stat:g:'+deptid,'location',(groupstats)=>{
                                        let oldstatinfo=JSON.parse(groupstats);
                                        if(oldstatinfo['card'] != undefined)
                                            oldstatinfo['card']+=+calinfo['card'];
                                        redis.hset('stat:g:'+deptid,'location',JSON.stringify(oldstatinfo));

                                    });
                                });
                                redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                    redis.hget('stat:h:'+deptid,'location',(haierstats)=>{
                                        let oldstatinfo=JSON.parse(haierstats);
                                        if(oldstatinfo['card'] != undefined)
                                            oldstatinfo['card']+=+calinfo['card'];
                                        redis.hset('stat:h:'+deptid,'location',JSON.stringify(oldstatinfo));
                                    });
                                });
                            }
                        });
                    }
                });
            break;
    }
}
let handle={
    stat:_stat
}

module.exports = handle;
