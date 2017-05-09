/**
 * Created by lenovo on 2017/3/15.
 */
let Stomp = require('stomp-client');
let config = require('../properties/config');
let host = config.get('activeMq.host');
let port = config.get('activeMq.port');
let user = config.get('activeMq.user');
let pwd  = config.get('activeMq.password')
let postgre = require("../utils/postgre");
let constUtils = require('../utils/constUtils');
let redis = require("../utils/redis");
let handle = require("../routes/base/handle");
let initStatistics = require("../routes/base/initStatistics");

//物联系统基本信息变更订阅
let client_systembasicinfo = new Stomp(host,port,user,pwd);
client_systembasicinfo.connect(function() {
    let destination = constUtils.QUEUE_P_SYSTEMINFO;
    client_systembasicinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['aid'] = json.userInfo.userId;
            extendJson['atime'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex=0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                        dataindex++;
                        if(dataindex===data.length){
                            handle.sysinfo(deptId);
                        }

                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//系统状态信息变更订阅
let client_systemstatusinfo = new Stomp(host,port,user,pwd);
let initstatistics = new initStatistics();
client_systemstatusinfo.connect(function() {
    let destination = constUtils.QUEUE_P_SYSTEMSTATUSINFO;
    client_systemstatusinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let new_systeminfo=[];
            redis.hget(constUtils.TABLE_P_SYSTEMINFO,deptId,(systeminfo)=>{
                if(systeminfo !=undefined && systeminfo != null){
                    new_systeminfo=JSON.parse(systeminfo);
                }
            });
            let i=0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {});
					let updateSysteminfoSql='update '+constUtils.TABLE_P_SYSTEMINFO+' set status=$1 where communityid=$2 and systemid=$3';
					let updateParams=[];
                    updateParams.push(jsondate.status);
                    updateParams.push(deptId);
                    updateParams.push(jsondate.systemId);
					postgre.excuteSql(updateSysteminfoSql,updateParams,function(result) {
                    for(let i=0;i<new_systeminfo.length;i++){
                        if(new_systeminfo[i].communityid==deptId && new_systeminfo[i].systemid==jsondate.systemId){
                            new_systeminfo[i]['status']=jsondate.status;

                        }
                    }
                    redis.hset(constUtils.TABLE_P_SYSTEMINFO,deptId,JSON.stringify(new_systeminfo));
                    i++;
                    if(i===data.length){
                        handle.stat(deptId,'online');
                        initstatistics.publishTopic();
                        }
                    });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//设备的状态信息变更订阅
let client_devicestatusinfo = new Stomp(host,port,user,pwd);
client_devicestatusinfo.connect(function() {
    let destination = constUtils.QUEUE_P_DEVICESTATUSINFO;
    client_devicestatusinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let typearrays=[];
            let sysdevicetables=['','p_videomonitor_deviceinfo','p_videointercom_deviceinfo','p_alarm_deviceinfo','p_infodiffusion_deviceinfo','p_gate_deviceinfo','p_parking_deviceinfo','p_elevator_deviceinfo','p_broadcast_deviceinfo','p_patrol_deviceinfo','p_personlocation_deviceinfo'];
            let dataindex=0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(isInserted) {
					    if(isInserted){
                            let updatedeviceinfoSql='update '+sysdevicetables[jsondate.sid]+' set status=$1 where communityid=$2 and systemid=$3 and deviceid=$4';
                            let updateParams=[];
                            updateParams.push(jsondate.status);
                            updateParams.push(deptId);
                            updateParams.push(jsondate.systemId);
                            updateParams.push(jsondate.deviceId);
                            if(typearrays.indexOf(sysdevicetables[jsondate.sid]) == -1){
                                typearrays.push(sysdevicetables[jsondate.sid]);
                            }
                            postgre.excuteSql(updatedeviceinfoSql,updateParams,function(result) {
                                dataindex++;
                                if(dataindex===data.length){
                                    handle.stat(deptId,'devicestatus',typearrays);
                                    initstatistics.publishTopic();
                                }
                            });
                        }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//设备的故障码或报警码信息订阅
let client_erroralarmcode = new Stomp(host,port,user,pwd);
client_erroralarmcode.connect(function() {
    let destination = constUtils.QUEUE_P_ERRORALARMCODE;
    client_erroralarmcode.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//设备发生的故障记录订阅
let client_devicefault = new Stomp(host,port,user,pwd);
client_devicefault.connect(function() {
    let destination = constUtils.QUEUE_P_DEVICEFAULT;
    client_devicefault.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let sysdevicetables=['','p_videomonitor_deviceinfo','p_videointercom_deviceinfo','p_alarm_deviceinfo','p_infodiffusion_deviceinfo','p_gate_deviceinfo','p_parking_deviceinfo','p_elevator_deviceinfo','p_broadcast_deviceinfo','p_patrol_deviceinfo','p_personlocation_deviceinfo'];
            let dataindex=0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(isInserted) {
                        if(isInserted){
                            let updatedeviceinfoSql='update '+sysdevicetables[jsondate.sid]+' set status=\'2\' where communityid=$1 and systemid=$2 and deviceid=$3';
                            let updateParams=[];
                            updateParams.push(deptId);
                            updateParams.push(jsondate.systemId);
                            updateParams.push(jsondate.deviceId);
                            postgre.excuteSql(updatedeviceinfoSql,updateParams,function(result) {
                                dataindex++;
                                if(dataindex===data.length){
                                    handle.stat(deptId,'devicestatus');
                                    initstatistics.publishTopic();
                                }
                            });
                        }

                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//系统设备发生的异常报警记录订阅
let client_devicealarm = new Stomp(host,port,user,pwd);
client_devicealarm.connect(function() {
    let destination = constUtils.QUEUE_P_DEVICEALARM;
    client_devicealarm.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex==data.length){
                        handle.stat(deptId,'alarm',['elevator','intercom','gate']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//视频监控设备的基本信息订阅
let client_videomonitor_deviceinfo = new Stomp(host,port,user,pwd);

client_videomonitor_deviceinfo.connect(function() {
    let destination = constUtils.QUEUE_P_VIDEOMONITOR_DEVICEINFO;
    client_videomonitor_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex=0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'devicestatus',['p_videomonitor_deviceinfo']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//入侵报警设备的基本信息订阅
let client_alarm_deviceinfo = new Stomp(host,port,user,pwd);
client_alarm_deviceinfo.connect(function() {
    let destination = constUtils.QUEUE_P_ALARM_DEVICEINFO;
    client_alarm_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'devicestatus',['p_alarm_deviceinfo']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//入侵报警防区的基本信息订阅
let client_alarm_sectorinfo = new Stomp(host,port,user,pwd);
client_alarm_sectorinfo.connect(function() {
    let destination = constUtils.QUEUE_P_ALARM_SECTORINFO;
    client_alarm_sectorinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'othersum',['intrusion']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//入侵报警报警信息订阅
let client_alarm_intrusion = new Stomp(host,port,user,pwd);

client_alarm_intrusion.connect(function() {
    let destination = constUtils.QUEUE_P_ALARM_INTRUSION;
    client_alarm_intrusion.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex==data.length){
                        handle.stat(deptId,'alarm',['intrusion']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//门禁设备的基本信息订阅
let client_gate_deviceinfo = new Stomp(host,port,user,pwd);
client_gate_deviceinfo.connect(function() {
    let destination = constUtils.QUEUE_P_GATE_DEVICEINFO;
    client_gate_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'devicestatus',['p_gate_deviceinfo']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//门禁开门记录信息订阅
let client_gate_open = new Stomp(host,port,user,pwd);
client_gate_open.connect(function() {
    let destination = constUtils.QUEUE_P_GATE_OPEN;
    client_gate_open.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//电梯控制设备的基本信息订阅
let client_elevator_deviceinfo = new Stomp(host,port,user,pwd);
client_elevator_deviceinfo.connect(function() {
    let destination = constUtils.QUEUE_P_ELEVATOR_DEVICEINFO;
    client_elevator_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'devicestatus',['p_elevator_deviceinfo']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//广播通讯设备基本信息订阅
let client_broadcast_deviceinfo = new Stomp(host,port,user,pwd);
client_broadcast_deviceinfo.connect(function() {
    let destination = constUtils.QUEUE_P_BROADCAST_DEVICEINFO;
    client_broadcast_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'devicestatus',['p_broadcast_deviceinfo']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//广播通讯广播的记录信息订阅
let client_broadcast_record = new Stomp(host,port,user,pwd);

client_broadcast_record.connect(function() {
    let destination = constUtils.QUEUE_P_BROADCAST_RECORD;
    client_broadcast_record.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//广播通讯广播的分区
let client_broadcast_area = new Stomp(host,port,user,pwd);
client_broadcast_area.connect(function() {
    let destination = constUtils.QUEUE_P_BROADCAST_AREA;
    client_broadcast_area.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {

                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//信息发布设备基本信息订阅
let client_infodiffusion_deviceinfo = new Stomp(host,port,user,pwd);
client_infodiffusion_deviceinfo.connect(function() {
    let destination = constUtils.QUEUE_P_INFODIFFUSION_DEVICEINFO;
    client_infodiffusion_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'devicestatus',['p_infodiffusion_deviceinfo']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//信息发布发布的记录信息订阅
let client_infodiffusion_inforecord = new Stomp(host,port,user,pwd);

client_infodiffusion_inforecord.connect(function() {
    let destination = constUtils.QUEUE_P_INFODIFFUSION_INFORECORD;
    client_infodiffusion_inforecord.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//人员定位设备基本信息订阅
let client_personlocation_deviceinfo = new Stomp(host,port,user,pwd);
client_personlocation_deviceinfo.connect(function() {
    let destination = constUtils.QUEUE_P_PERSONLOCATION_DEVICEINFO;
    client_personlocation_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'devicestatus',['p_personlocation_deviceinfo']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//人员定位定位卡信息信息订阅
let client_personlocation_givecard = new Stomp(host,port,user,pwd);
client_personlocation_givecard.connect(function() {
    let destination = constUtils.QUEUE_P_PERSONLOCATION_GIVECARD;
    client_personlocation_givecard.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                        dataindex++;
                        if(dataindex===data.length){
                            handle.stat(deptId,'card');
                            initstatistics.publishTopic();
                        }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//人员定位卡报警信息订阅
let client_personlocation_alarm = new Stomp(host,port,user,pwd);

client_personlocation_alarm.connect(function() {
    let destination = constUtils.QUEUE_P_PERSONLOCATION_ALARM;
    client_personlocation_alarm.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex==data.length){
                        handle.stat(deptId,'alarm',['location']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//停车场设备基本信息订阅
let client_parking_deviceinfo = new Stomp(host,port,user,pwd);
client_parking_deviceinfo.connect(function() {
    let destination = constUtils.QUEUE_P_PARKING_DEVICEINFO;
    client_parking_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'devicestatus',['p_parking_deviceinfo']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//停车场车位信息订阅
let client_parking_parkareainfo = new Stomp(host,port,user,pwd);
client_parking_parkareainfo.connect(function() {
    let destination = constUtils.QUEUE_P_PARKING_PARKAREAINFO;
    client_parking_parkareainfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'othersum',['park']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//停车场车辆车主信息订阅
let client_parking_caruserinfo = new Stomp(host,port,user,pwd);
client_parking_caruserinfo.connect(function() {
    let destination = constUtils.QUEUE_P_PARKING_CARUSERINFO;
    client_parking_caruserinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//停车场车辆进出信息订阅
let client_parking_carrecord = new Stomp(host,port,user,pwd);

client_parking_carrecord.connect(function() {
    let destination = constUtils.QUEUE_P_PARKING_CARRECORD;
    client_parking_carrecord.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'parkio');
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
        console.log(headers);
    });
});
//可视对讲设备基本信息订阅
let client_videointercom_deviceinfo = new Stomp(host,port,user,pwd);
client_videointercom_deviceinfo.connect(function() {
    let destination = constUtils.QUEUE_P_VIDEOINTERCOM_DEVICEINFO;
    client_videointercom_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'devicestatus',['p_videointercom_deviceinfo']);
                        initstatistics.publishTopic();
                    }
                    });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//可视对讲设备呼叫信息订阅
let client_videointercom_call = new Stomp(host,port,user,pwd);
client_videointercom_call.connect(function() {
    let destination = constUtils.QUEUE_P_VIDEOINTERCOM_CALL;
    client_videointercom_call.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//可视对讲单元门开门信息订阅
let client_videointercom_opengate = new Stomp(host,port,user,pwd);
client_videointercom_opengate.connect(function() {
    let destination = constUtils.QUEUE_P_VIDEOINTERCOM_OPENGATE;
    client_videointercom_opengate.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//电子巡更设备基本信息订阅
let client_patrol_deviceinfo = new Stomp(host,port,user,pwd);
client_patrol_deviceinfo.connect(function() {
    let destination = constUtils.QUEUE_P_PATROL_DEVICEINFO;
    client_patrol_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};     
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex = 0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'devicestatus',['p_patrol_deviceinfo']);
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//电子巡更巡更记录信息订阅
let client_patrol_nightrecord = new Stomp(host,port,user,pwd);
client_patrol_nightrecord.connect(function() {
    let destination = constUtils.QUEUE_P_PATROL_NIGHTRECORD;
    client_patrol_nightrecord.subscribe(destination, function(body, headers) {
        if (body){
			let extendJson={};
            let json = JSON.parse(body);
            let deptId = json.userInfo.communityId;
			let tableName=json.userInfo.tableName;
            extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            let data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            let dataindex=0;
            for(let jsondate of data){
                    let insertJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
        			postgre.excuteSql(insertJson.sql,insertJson.values,function(result) {
                    dataindex++;
                    if(dataindex===data.length){
                        handle.stat(deptId,'patrolinfo');
                        initstatistics.publishTopic();
                    }
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});