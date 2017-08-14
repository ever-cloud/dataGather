"use strict";
let constUtils = require('../../utils/constUtils');
let postgre = require("../../utils/postgre");
let redis = require("../../utils/redis");

//  系统信息变更后入缓存
let _sysinfo=function(communityids){
    if(communityids != null && communityids != undefined){
        let systeminfoSql='select s.* from '+constUtils.TABLE_P_SYSTEMINFO+' as s where communityid=$1 order by communityid,cast(sid as integer)';
        if(communityids instanceof Array && communityids.length > 0){
            communityids.forEach((communityid)=>{
                postgre.excuteSql(systeminfoSql,[communityid],function (result){
                    if(result.rowCount>0){
                        let systeminfoJson = [];
                        result.rows.forEach(function(data,index){
                            systeminfoJson.push(data);
                            if(index==result.rows.length-1)
                                redis.hset(constUtils.TABLE_P_SYSTEMINFO,communityid,JSON.stringify(systeminfoJson));
                            _stat(communityid,'online');
                        });
                    }
                });
            });
        }else if(typeof communityids=='string'){
            // postgre.excuteSql(systeminfoSql,[communityids],function (result){
            //     if(result.rowCount>0){
            //         let systeminfoJson = [];
            //         result.rows.forEach(function(data,index){
            //             systeminfoJson.push(data);
            //             if(index==result.rows.length-1)
            //                 redis.hset(constUtils.TABLE_P_SYSTEMINFO,communityids,JSON.stringify(systeminfoJson));
            //         });
            //     }
            // });
            let communityary=[];
            communityary.push(communityids);
            _sysinfo(communityary);
        }
    }
}

//communityid社区id  types需要统计类型  typearrays 统计系统类型(根据情况传数组参数）
//  online 系统在线状态统计
let _stat=function(communityid,types,typearrays,cb){
    switch(types){
        case 'online'://统计系统在线
            let systemtypes=['','monitor','intercom','intrusion','info','gate','park','elevator','broadcast','patrol','location'];
            let systeminfoSql='select s.sid,s.status from '+constUtils.TABLE_P_SYSTEMINFO+' as s where s.communityid=$1 order by cast(s.sid as integer)';
            console.log('处理统计系统在线'+communityid+'初始的系统类型'+systemtypes);
            postgre.excuteSql(systeminfoSql,[communityid],function (result){
                console.log('处理统计系统在线'+communityid+'初始的系统类型'+systemtypes);
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
                                            cb;
                                            redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                                redis.hget('stat:r:'+deptid,field,(regionstats)=>{
                                                        let oldstatinfo=JSON.parse(regionstats);
                                                        oldstatinfo['online']=+oldstatinfo['online']+calinfo[field];
                                                        redis.hset('stat:r:'+deptid,field,JSON.stringify(oldstatinfo));

                                                });
                                            });

                                            redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                                redis.hget('stat:g:'+deptid,(groupstats)=>{
                                                        let oldstatinfo=JSON.parse(groupstats);
                                                        oldstatinfo['online']=+oldstatinfo['online']+calinfo[field];
                                                        redis.hset('stat:g:'+deptid,field,JSON.stringify(oldstatinfo));
                                                });

                                            });
                                            redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                                redis.hget('stat:h:'+deptid,(haierstats)=>{
                                                        let oldstatinfo=JSON.parse(haierstats);
                                                        oldstatinfo['online']=+oldstatinfo['online']+calinfo[field];
                                                        redis.hset('stat:h:'+deptid,field,JSON.stringify(oldstatinfo));
                                                });
                                            });
                                        }
                                    });
                                });
                            });

                        }
                    });
                }
            });
            break;
        case 'devicestatus'://统计设备数及故障数及在线数
            let systemtypes_2=['monitor','intercom','intrusion','info','gate','park','elevator','broadcast','patrol','location'];
            let sysdevicetables=['p_videomonitor_deviceinfo','p_videointercom_deviceinfo','p_alarm_deviceinfo','p_infodiffusion_deviceinfo','p_gate_deviceinfo','p_parking_deviceinfo','p_elevator_deviceinfo','p_broadcast_deviceinfo','p_patrol_deviceinfo','p_personlocation_deviceinfo'];
            if(typearrays != undefined && typearrays instanceof Array && typearrays.length > 0){
                let tempst=[];
                sysdevicetables.forEach(function(item,index){
                    for(var i=0;i<typearrays.length;i++){
                        if(item ==typearrays[i]){
                            tempst.push(systemtypes_2[index]);
                            break;
                        }
                    }
                });
                systemtypes_2=tempst;
                sysdevicetables=typearrays;
            }
            let deviceinfosql='';
            sysdevicetables.forEach((deviceinfotable,dindex)=>{
                if(deviceinfotable=='p_videomonitor_deviceinfo'){
                    deviceinfosql='select t.communityid,sum(case when t.devicetype=\'camera\'  then 1 else 0 end) as "camerasum",sum(case when t.devicetype=\'camera\'  and t.status=\'2\' then 1 else 0 end) as "camerabug",sum(case when t.devicetype=\'dvr\'  then 1 else 0 end) as "dvrsum",sum(case when t.devicetype=\'dvr\' and t.status=\'2\' then 1 else 0 end) as "dvrbug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" FROM '+deviceinfotable+' t where t.communityid=$1 and t.status<>\'3\' group by t.communityid';
                }else{
                    deviceinfosql='select t.communityid,count(id) as "sum",sum(case when t.status=\'2\' then 1 else 0 end) as "bug",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline" FROM '+deviceinfotable+' t where t.status<>\'3\' and t.communityid=$1 group by t.communityid ';
                }
                postgre.excuteSql(deviceinfosql,[communityid],function (result){
                    if(result.rowCount>0){
                        redis.exists('stat:c:'+communityid,(isexists)=>{
                            if(isexists===1){
                                let calinfo={};//存放临时差异值
                                let oldstatinfo = {};  //缓存中各系统统计信息
                                let oldstatsum = {};    //缓存中合计统计信息
                                let oldstatbug = {};     //缓存中故障统计信息
                                redis.hget('stat:c:'+communityid,systemtypes_2[dindex],(communitystats)=> {
                                    let field = systemtypes_2[dindex];
                                    calinfo[field] = {};
                                    calinfo['sum'] = {};
                                    calinfo['bug'] = {};
                                    oldstatinfo[field] = JSON.parse(communitystats);
                                    result.rows.forEach(function (data) {
                                        if (field == 'monitor') {
                                            let camerasum = +data.camerasum;
                                            let camerabug = +data.camerabug;
                                            let dvrsum = +data.dvrsum;
                                            let dvrbug = +data.dvrbug;
                                            calinfo[field]['camerasum'] = +camerasum - oldstatinfo[field].camera.sum;
                                            calinfo[field]['camerabug'] = +camerabug - oldstatinfo[field].camera.bug;
                                            calinfo[field]['dvrsum'] = +dvrsum - oldstatinfo[field].dvr.sum;
                                            calinfo[field]['dvrbug'] = +dvrbug - oldstatinfo[field].dvr.bug;
                                            oldstatinfo[field]['camera']['sum'] = camerasum;
                                            oldstatinfo[field]['camera']['bug'] = camerabug;
                                            oldstatinfo[field]['dvr']['sum'] = dvrsum;
                                            oldstatinfo[field]['dvr']['bug'] = dvrbug;
                                            calinfo['sum'][field] = calinfo[field]['camerasum'] + calinfo[field]['dvrsum'];
                                            calinfo['bug'][field] = calinfo[field]['camerabug'] + calinfo[field]['dvrbug'];
                                            redis.hget('stat:c:'+communityid,'sum',(sumstats)=> {
                                                oldstatsum = JSON.parse(sumstats);
                                                oldstatsum[field] = +camerasum + dvrsum;
                                                redis.hset('stat:c:' + communityid, 'sum', JSON.stringify(oldstatsum));
                                            });
                                            redis.hget('stat:c:'+communityid,'bug',(bugstats)=> {
                                                oldstatbug = JSON.parse(bugstats);
                                                oldstatbug[field] = +camerabug + dvrbug;
                                                redis.hset('stat:c:' + communityid, 'bug', JSON.stringify(oldstatbug));

                                            });
                                            //统计上级
                                            redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                                redis.hget('stat:r:'+deptid,field,(regionstats)=>{
                                                    let oldstatinfo={};
                                                    let oldstatsum={};
                                                    let oldstatbug={};
                                                    let oldstatdevicesta={};
                                                    oldstatinfo[field] = JSON.parse(regionstats);
                                                        oldstatinfo[field]['camera']['sum']=+oldstatinfo[field]['camera']['sum']+calinfo[field]['camerasum'];
                                                        oldstatinfo[field]['camera']['bug']=+oldstatinfo[field]['camera']['bug']+calinfo[field]['camerabug'];
                                                        oldstatinfo[field]['dvr']['sum']=+oldstatinfo[field]['dvr']['sum']+calinfo[field]['dvrsum'];
                                                        oldstatinfo[field]['dvr']['bug']=+oldstatinfo[field]['dvr']['bug']+calinfo[field]['dvrbug'];
                                                    redis.hset('stat:r:'+deptid,field,JSON.stringify(oldstatinfo[field]));

                                                });
                                                redis.hget('stat:r:'+deptid,'sum',(sumstats)=> {
                                                    oldstatsum = JSON.parse(sumstats);
                                                    oldstatsum[field]=oldstatsum[field]+calinfo['sum'][field];
                                                    redis.hset('stat:r:'+deptid,'sum',JSON.stringify(oldstatsum));
                                                });
                                                redis.hget('stat:r:'+deptid,'bug',(bugstats)=> {
                                                    oldstatbug = JSON.parse(bugstats);
                                                    oldstatbug[field]=oldstatbug[field]+calinfo['bug'][field];
                                                    redis.hset('stat:r:'+deptid,'bug',JSON.stringify(oldstatbug));
                                                });
                                            });
                                            redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                                redis.hget('stat:g:'+deptid,field,(groupstats)=>{
                                                    let oldstatinfo={};
                                                    let oldstatsum={};
                                                    let oldstatbug={};
                                                    let oldstatdevicesta={};
                                                    oldstatinfo[field] = JSON.parse(groupstats);
                                                    oldstatinfo[field]['camera']['sum']=+oldstatinfo[field]['camera']['sum']+calinfo[field]['camerasum'];
                                                    oldstatinfo[field]['camera']['bug']=+oldstatinfo[field]['camera']['bug']+calinfo[field]['camerabug'];
                                                    oldstatinfo[field]['dvr']['sum']=+oldstatinfo[field]['dvr']['sum']+calinfo[field]['dvrsum'];
                                                    oldstatinfo[field]['dvr']['bug']=+oldstatinfo[field]['dvr']['bug']+calinfo[field]['dvrbug'];
                                                    redis.hset('stat:g:'+deptid,field,JSON.stringify(oldstatinfo[field]));

                                                });
                                                redis.hget('stat:g:'+deptid,'sum',(sumstats)=> {
                                                    oldstatsum = JSON.parse(sumstats);
                                                    oldstatsum[field]=oldstatsum[field]+calinfo['sum'][field];
                                                    redis.hset('stat:g:'+deptid,'sum',JSON.stringify(oldstatsum));
                                                });
                                                redis.hget('stat:g:'+deptid,'bug',(bugstats)=> {
                                                    oldstatbug = JSON.parse(bugstats);
                                                    oldstatbug[field]=oldstatbug[field]+calinfo['bug'][field];
                                                    redis.hset('stat:g:'+deptid,'bug',JSON.stringify(oldstatbug));
                                                });
                                            });
                                            redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                                redis.hget('stat:h:'+deptid,field,(haierstats)=>{
                                                    let oldstatinfo={};
                                                    let oldstatsum={};
                                                    let oldstatbug={};
                                                    let oldstatdevicesta={};
                                                    oldstatinfo[field] = JSON.parse(haierstats);
                                                    oldstatinfo[field]['camera']['sum']=+oldstatinfo[field]['camera']['sum']+calinfo[field]['camerasum'];
                                                    oldstatinfo[field]['camera']['bug']=+oldstatinfo[field]['camera']['bug']+calinfo[field]['camerabug'];
                                                    oldstatinfo[field]['dvr']['sum']=+oldstatinfo[field]['dvr']['sum']+calinfo[field]['dvrsum'];
                                                    oldstatinfo[field]['dvr']['bug']=+oldstatinfo[field]['dvr']['bug']+calinfo[field]['dvrbug'];
                                                    redis.hset('stat:h:'+deptid,field,JSON.stringify(oldstatinfo[field]));

                                                });
                                                redis.hget('stat:h:'+deptid,'sum',(sumstats)=> {
                                                    oldstatsum = JSON.parse(sumstats);
                                                    oldstatsum[field]=oldstatsum[field]+calinfo['sum'][field];
                                                    redis.hset('stat:h:'+deptid,'sum',JSON.stringify(oldstatsum));
                                                });
                                                redis.hget('stat:h:'+deptid,'bug',(bugstats)=> {
                                                    oldstatbug = JSON.parse(bugstats);
                                                    oldstatbug[field]=oldstatbug[field]+calinfo['bug'][field];
                                                    redis.hset('stat:h:'+deptid,'bug',JSON.stringify(oldstatbug));
                                                });
                                            });
                                        }else{
                                            let sum = data.sum;
                                            let bug = data.bug;
                                            if (oldstatinfo[field].sum != undefined)
                                                calinfo[field]['sum'] = sum - oldstatinfo[field].sum;
                                            if (oldstatinfo[field].bug != undefined)
                                                calinfo[field]['bug'] = bug - oldstatinfo[field].bug;
                                            if (oldstatinfo[field].sum != undefined && field != 'intrusion' && field != 'park') {
                                                oldstatinfo[field]['sum'] = sum;
                                            }
                                            if (oldstatinfo[field].bug != undefined) {
                                                oldstatinfo[field]['bug'] = bug;
                                            }
                                            redis.hget('stat:c:'+communityid,'sum',(sumstats)=> {
                                                oldstatsum = JSON.parse(sumstats);
                                                if (oldstatsum[field] != undefined) {
                                                    calinfo['sum'][field] = sum - oldstatsum[field];
                                                    oldstatsum[field] = sum;
                                                }
                                                redis.hset('stat:c:' + communityid, 'sum', JSON.stringify(oldstatsum));
                                                //统计上级机构
                                                redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                                    redis.hget('stat:r:'+deptid,'sum',(regionstats)=>{
                                                        let oldstatsum={};
                                                            oldstatsum = JSON.parse(regionstats);
                                                        if(oldstatsum[field] != undefined)oldstatsum[field]=oldstatsum[field]+calinfo['sum'][field];
                                                        redis.hset('stat:r:'+deptid,'sum',JSON.stringify(oldstatsum));
                                                    });
                                                });
                                                redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                                    redis.hget('stat:g:'+deptid,'sum',(groupstats)=>{
                                                        let oldstatsum={};
                                                        oldstatsum = JSON.parse(groupstats);
                                                        if(oldstatsum[field] != undefined)oldstatsum[field]=oldstatsum[field]+calinfo['sum'][field];
                                                        redis.hset('stat:g:'+deptid,'sum',JSON.stringify(oldstatsum));
                                                    });
                                                });
                                                redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                                    redis.hget('stat:h:'+deptid,'sum',(haierstats)=>{
                                                        let oldstatsum={};
                                                        oldstatsum = JSON.parse(haierstats);
                                                        if(oldstatsum[field] != undefined)oldstatsum[field]=oldstatsum[field]+calinfo['sum'][field];
                                                        redis.hset('stat:h:'+deptid,'sum',JSON.stringify(oldstatsum));
                                                    });
                                                });


                                            });
                                            redis.hget('stat:c:'+communityid,'bug',(bugstats)=> {
                                                oldstatbug = JSON.parse(bugstats);
                                                if (oldstatbug[field] != undefined) {
                                                    calinfo['bug'][field] = bug - oldstatbug[field];
                                                    oldstatbug[field] = bug;
                                                }
                                                redis.hset('stat:c:' + communityid, 'bug', JSON.stringify(oldstatbug));

                                                //统计上级机构
                                                redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                                    redis.hget('stat:r:'+deptid,'bug',(regionstats)=>{
                                                        let oldstatbug={};
                                                        oldstatbug = JSON.parse(regionstats);
                                                        if(oldstatbug[field] != undefined)oldstatbug[field]=oldstatbug[field]+calinfo['bug'][field];
                                                        redis.hset('stat:r:'+deptid,'bug',JSON.stringify(oldstatbug));
                                                    });
                                                });
                                                redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                                    redis.hget('stat:g:'+deptid,'bug',(groupstats)=>{
                                                        let oldstatbug={};
                                                        oldstatbug = JSON.parse(groupstats);
                                                        if(oldstatbug[field] != undefined)oldstatbug[field]=oldstatbug[field]+calinfo['bug'][field];
                                                        redis.hset('stat:g:'+deptid,'bug',JSON.stringify(oldstatbug));
                                                    });
                                                });
                                                redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                                    redis.hget('stat:h:'+deptid,'bug',(haierstats)=>{
                                                        let oldstatbug={};
                                                        oldstatbug = JSON.parse(haierstats);
                                                        if(oldstatbug[field] != undefined)oldstatbug[field]=oldstatbug[field]+calinfo['bug'][field];
                                                        redis.hset('stat:h:'+deptid,'bug',JSON.stringify(oldstatbug));
                                                    });
                                                });

                                            });
                                        //统计上级机构
                                            redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                                redis.hget('stat:r:'+deptid,field,(regionstats)=>{
                                                    let oldstatinfo={};
                                                    let oldstatdevicesta={};
                                                    if (field == 'devicesta') {
                                                        oldstatdevicesta = JSON.parse(regionstats);
                                                    } else {
                                                        oldstatinfo[field] = JSON.parse(regionstats);
                                                    }
                                                    if(oldstatinfo[field].sum !=undefined && field !='intrusion' && field !='park'){
                                                        oldstatinfo[field]['sum']=+oldstatinfo[field]['sum']+calinfo[field]['sum'];
                                                    }
                                                    if(oldstatinfo[field].bug !=undefined) {
                                                        oldstatinfo[field]['bug']=+oldstatinfo[field]['bug']+calinfo[field]['bug'];
                                                    }
                                                    redis.hset('stat:r:'+deptid,field,JSON.stringify(oldstatinfo[field]));
                                                });
                                            });
                                            redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                                redis.hget('stat:g:'+deptid,field,(groupstats)=>{
                                                    let oldstatinfo={};
                                                    let oldstatdevicesta={};
                                                    if (field == 'devicesta') {
                                                        oldstatdevicesta = JSON.parse(groupstats);
                                                    } else {
                                                        oldstatinfo[field] = JSON.parse(groupstats);
                                                    }
                                                    if(oldstatinfo[field].sum !=undefined && field !='intrusion' && field !='park'){
                                                        oldstatinfo[field]['sum']=+oldstatinfo[field]['sum']+calinfo[field]['sum'];
                                                    }
                                                    if(oldstatinfo[field].bug !=undefined) {
                                                        oldstatinfo[field]['bug']=+oldstatinfo[field]['bug']+calinfo[field]['bug'];
                                                    }
                                                    redis.hset('stat:g:'+deptid,field,JSON.stringify(oldstatinfo[field]));
                                                });
                                            });
                                            redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                                redis.hget('stat:h:'+deptid,field,(haierstats)=>{
                                                    let oldstatinfo={};
                                                    let oldstatdevicesta={};
                                                    if (field == 'devicesta') {
                                                        oldstatdevicesta = JSON.parse(haierstats);
                                                    } else {
                                                        oldstatinfo[field] = JSON.parse(haierstats);
                                                    }
                                                    if(oldstatinfo[field].sum !=undefined && field !='intrusion' && field !='park'){
                                                        oldstatinfo[field]['sum']=+oldstatinfo[field]['sum']+calinfo[field]['sum'];
                                                    }
                                                    if(oldstatinfo[field].bug !=undefined) {
                                                        oldstatinfo[field]['bug']=+oldstatinfo[field]['bug']+calinfo[field]['bug'];
                                                    }
                                                    redis.hset('stat:h:'+deptid,field,JSON.stringify(oldstatinfo[field]));
                                                });
                                            });

                                        }
                                        redis.hset('stat:c:' + communityid, field, JSON.stringify(oldstatinfo[field]));
                                    });
                                    cb;
                                });
                            }
                        });
                    }
                });
            });
            //社区各系统总设备在线，故障数统计
            let statsysdevicetables=['p_videomonitor_deviceinfo','p_videointercom_deviceinfo','p_alarm_deviceinfo','p_infodiffusion_deviceinfo','p_gate_deviceinfo','p_parking_deviceinfo','p_elevator_deviceinfo','p_broadcast_deviceinfo','p_patrol_deviceinfo','p_personlocation_deviceinfo'];
            let devicestatsql='select stat.communityid,sum(stat.online) as "online",sum(stat.offline) as "offline",sum(stat.bug) as "bug",sum(stat.nobug) as "nobug" from(';
            statsysdevicetables.forEach((tablename,index)=>{
                devicestatsql+='SELECT t.communityid,sum(1)-sum(case when t.status=\'0\'  then 1 else 0 end) as "online",sum(case when t.status=\'0\'  then 1 else 0 end) as "offline",sum(case when  t.status=\'2\' then 1 else 0 end) as "bug",sum(1)-sum(case when  t.status=\'2\' then 1 else 0 end) as "nobug" FROM '+tablename+' t where t.communityid=$1 and t.status<>\'3\' group by t.communityid ';
                if(index != statsysdevicetables.length-1){

                    devicestatsql+=' union all ';
                }else{
                    devicestatsql+=') stat group by stat.communityid';
                }
            });
            postgre.excuteSql(devicestatsql,[communityid],function (result){
                if(result.rowCount>0){
                    redis.exists('stat:c:'+communityid,(isexists)=>{
                        if(isexists===1){
                            let calinfo={};
                            redis.hget('stat:c:'+communityid,'devicesta',(communitystats)=>{
                                let oldstatdevicesta = JSON.parse(communitystats);
                                    result.rows.forEach(function(data){
                                        let online=+data.online;
                                        let offline=+data.offline;
                                        let bug=+data.bug;
                                        let nobug=+data.nobug;
                                        calinfo['online']=online-oldstatdevicesta.online;
                                        calinfo['offline']=offline-oldstatdevicesta.offline;
                                        calinfo['bug']=bug-oldstatdevicesta.bug;
                                        calinfo['nobug']=nobug-oldstatdevicesta.nobug;
                                        oldstatdevicesta['online']=online;
                                        oldstatdevicesta['offline']=offline;
                                        oldstatdevicesta['bug']=bug;
                                        oldstatdevicesta['nobug']=nobug;
                                        redis.hset('stat:c:'+communityid,'devicesta',JSON.stringify(oldstatdevicesta));

                                        //统计上级机构
                                        redis.hget('deptdict:'+communityid,'regionid',(deptid)=>{
                                            redis.hget('stat:r:'+deptid,'devicesta',(regionstats)=>{
                                                let oldstatdevicesta = JSON.parse(regionstats);
                                                oldstatdevicesta['online']=oldstatdevicesta['online']+calinfo['online'];
                                                oldstatdevicesta['offline']=oldstatdevicesta['offline']+calinfo['offline'];
                                                oldstatdevicesta['bug']=oldstatdevicesta['bug']+calinfo['bug'];
                                                oldstatdevicesta['nobug']=oldstatdevicesta['nobug']+calinfo['nobug'];
                                                redis.hset('stat:r:'+deptid,'devicesta',JSON.stringify(oldstatdevicesta));
                                            });
                                        });

                                        redis.hget('deptdict:'+communityid,'groupid',(deptid)=>{
                                            redis.hget('stat:g:'+deptid,'devicesta',(groupstats)=>{
                                                let oldstatdevicesta = JSON.parse(groupstats);
                                                oldstatdevicesta['online']=oldstatdevicesta['online']+calinfo['online'];
                                                oldstatdevicesta['offline']=oldstatdevicesta['offline']+calinfo['offline'];
                                                oldstatdevicesta['bug']=oldstatdevicesta['bug']+calinfo['bug'];
                                                oldstatdevicesta['nobug']=oldstatdevicesta['nobug']+calinfo['nobug'];
                                                redis.hset('stat:g:'+deptid,'devicesta',JSON.stringify(oldstatdevicesta));
                                            });
                                        });
                                        redis.hget('deptdict:'+communityid,'haierid',(deptid)=>{
                                            redis.hget('stat:h:'+deptid,'devicesta',(haierstats)=>{
                                                let oldstatdevicesta = JSON.parse(haierstats);
                                                oldstatdevicesta['online']=oldstatdevicesta['online']+calinfo['online'];
                                                oldstatdevicesta['offline']=oldstatdevicesta['offline']+calinfo['offline'];
                                                oldstatdevicesta['bug']=oldstatdevicesta['bug']+calinfo['bug'];
                                                oldstatdevicesta['nobug']=oldstatdevicesta['nobug']+calinfo['nobug'];
                                                redis.hset('stat:h:'+deptid,'devicesta',JSON.stringify(oldstatdevicesta));
                                            });
                                        });
                                    });
                            });


                        }
                        cb;
                    });
                }
            });
            break;
        case 'alarm'://统计报警数包括设备报警和实时报警
            if(typearrays instanceof Array && typearrays.length > 0){
                let oldstatinfo;

                typearrays.forEach((stattype,dindex)=>{
                    let realalarmsql='';
                    let alarmservicesql='';
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
                    if(realalarmsql != ''){

                        postgre.excuteSql(realalarmsql,[communityid],function (result){
                            // console.log('当前实时报警'+realalarmsql+':types:'+typearrays+':stattype:'+stattype);
                            if(result.rowCount>0){
                                redis.exists('stat:c:'+communityid,(isexists)=>{
                                    if(isexists===1){
                                        let calinfo={};

                                        redis.hget('stat:c:'+communityid,'alarm',(communitystats)=>{
                                            if(oldstatinfo==undefined)
                                             oldstatinfo=JSON.parse(communitystats);
                                            result.rows.forEach(function(data){
                                                let alarm=data.alarm;
                                                if(oldstatinfo[stattype] !=undefined){
                                                    calinfo[stattype]=alarm-oldstatinfo[stattype];
                                                    oldstatinfo[stattype]=alarm;
                                                }
                                                redis.hset('stat:c:'+communityid,'alarm',JSON.stringify(oldstatinfo));
                                                //下面都移到方法体内，统计上级机构

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
                                            });
                                        });

                                    }
                                    cb;
                                });
                            }
                        });
                    }
                    if(alarmservicesql != ''){
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

                                            //统计上级机构

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
                                            });
                                        });

                                    }
                                    cb;
                                });
                            }
                        });
                    }
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

                                        //统计上级机构
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
                                    });
                                });

                            }
                            cb;
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

                                    //统计上级机构
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
                                });
                            });

                        }
                        cb;
                    });
                }
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
                                        //统计上级机构
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
                                    });
                                });

                            }
                            cb;
                        });
                    }
                });
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
                                //统计上级机构
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
                            });
                        });

                    }
                    cb;
                });
            }
        });
        break;
        case 'othersum':
            if(typearrays instanceof Array && typearrays.length > 0){
                let othersumsql='';
                typearrays.forEach((stattype,dindex)=>{
                    if(stattype=='park'){
                        othersumsql='select  t.communityid,total as "sum" from p_parking_parkareainfo t ,(select communityid,max(optdate) optdate  from p_parking_parkareainfo  group by communityid)m where t.communityid=m.communityid and t.optdate=m.optdate and t.communityid=$1 ';
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
                                            //统计上级机构
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
                                        });
                                    });

                                }
                                cb;
                            });
                        }
                    });
                });
            }else{
                console.log('第三个参数为数组并且参数个数大于0');
            }
            break;
        case 'card'://报警卡的统计
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
                                        //统计上级机构
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
                                    });
                                });

                            }
                            cb;
                        });
                    }
                });
            break;
    }
}
let handle={
    stat:_stat,
    sysinfo:_sysinfo
}

module.exports = handle;
