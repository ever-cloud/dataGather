/**
 * Created by lenovo on 2017/3/15.
 */
var Stomp = require('stomp-client');
var config = require('../properties/config');
var host = config.get('activeMq.host');
var port = config.get('activeMq.port');
var user = config.get('activeMq.user');
var pwd  = config.get('activeMq.password')
var postgre = require("../utils/postgre");
var constUtils = require('../utils/constUtils');

//物联系统基本信息变更订阅
var client_systembasicinfo = new Stomp(host,port,user,pwd);
client_systembasicinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_SYSTEMINFO;
    client_systembasicinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//系统状态信息变更订阅
var client_systemstatusinfo = new Stomp(host,port,user,pwd);
client_systemstatusinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_SYSTEMSTATUSINFO;
    client_systemstatusinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//设备的状态信息变更订阅
var client_devicestatusinfo = new Stomp(host,port,user,pwd);
client_devicestatusinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_DEVICESTATUSINFO;
    client_devicestatusinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//设备的故障码或报警码信息订阅
var client_erroralarmcode = new Stomp(host,port,user,pwd);
client_erroralarmcode.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_ERRORALARMCODE;
    client_erroralarmcode.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//设备发生的故障记录订阅
var client_devicefault = new Stomp(host,port,user,pwd);
client_devicefault.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_DEVICEFAULT;
    client_devicefault.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//系统设备发生的异常报警记录订阅
var client_devicealarm = new Stomp(host,port,user,pwd);
client_devicealarm.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_DEVICEALARM;
    client_devicealarm.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//获取用户所在小区各物联系统相应信息订阅
// var client_getsysteminfo = new Stomp(host,port,user,pwd);
//
// client_getsysteminfo.connect(function(sessionId) {
//     var destination = constUtils.QUEUE_P_SYSTEMINFO;
//     client_getsysteminfo.subscribe(destination, function(body, headers) {
//         if (body){
// 			var extendJson={};     
//             var json = JSON.parse(body);
//             var deptId = json.userInfo.communityId;
// 			var tableName=json.userInfo.tableName;
// 			   extendJson['communityid'] = deptId;
//             extendJson['opter'] = json.userInfo.userId;
//             extendJson['optDate'] = json.optDate;
//             var data = json.data;
//             if(data.length>1000){
//                 console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
//             }
//
//             for(var jsondate of data){
//                     var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
// 					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
//                    
//                 });
//             }
//         }else{
//             console.log('No Transfer Body!Body is Null!');
//         }
//     });
// });
//视频监控设备的基本信息订阅
var client_videomonitor_deviceinfo = new Stomp(host,port,user,pwd);

client_videomonitor_deviceinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_VIDEOMONITOR_DEVICEINFO;
    client_videomonitor_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//入侵报警设备的基本信息订阅
var client_alarm_deviceinfo = new Stomp(host,port,user,pwd);
client_alarm_deviceinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_ALARM_DEVICEINFO;
    client_alarm_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            console.log('数据内容长度'+data.length);
            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//入侵报警防区的基本信息订阅
var client_alarm_sectorinfo = new Stomp(host,port,user,pwd);
client_alarm_sectorinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_ALARM_SECTORINFO;
    client_alarm_sectorinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//入侵报警报警信息订阅
var client_alarm_intrusion = new Stomp(host,port,user,pwd);

client_alarm_intrusion.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_ALARM_INTRUSION;
    client_alarm_intrusion.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//门禁设备的基本信息订阅
var client_gate_deviceinfo = new Stomp(host,port,user,pwd);
client_gate_deviceinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_GATE_DEVICEINFO;
    client_gate_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//门禁开门记录信息订阅
var client_gate_open = new Stomp(host,port,user,pwd);
client_gate_open.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_GATE_OPEN;
    client_gate_open.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//电梯控制设备的基本信息订阅
var client_elevator_deviceinfo = new Stomp(host,port,user,pwd);
client_elevator_deviceinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_ELEVATOR_DEVICEINFO;
    client_elevator_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//广播通讯设备基本信息订阅
var client_broadcast_deviceinfo = new Stomp(host,port,user,pwd);
client_broadcast_deviceinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_BROADCAST_DEVICEINFO;
    client_broadcast_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//广播通讯广播的记录信息订阅
var client_broadcast_record = new Stomp(host,port,user,pwd);

client_broadcast_record.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_BROADCAST_RECORD;
    client_broadcast_record.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//信息发布设备基本信息订阅
var client_infodiffusion_deviceinfo = new Stomp(host,port,user,pwd);
client_infodiffusion_deviceinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_INFODIFFUSION_DEVICEINFO;
    client_infodiffusion_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//信息发布发布的记录信息订阅
var client_infodiffusion_inforecord = new Stomp(host,port,user,pwd);

client_infodiffusion_inforecord.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_INFODIFFUSION_INFORECORD;
    client_infodiffusion_inforecord.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//人员定位设备基本信息订阅
var client_personlocation_deviceinfo = new Stomp(host,port,user,pwd);
client_personlocation_deviceinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_PERSONLOCATION_DEVICEINFO;
    client_personlocation_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//人员定位定位卡信息信息订阅
var client_personlocation_givecard = new Stomp(host,port,user,pwd);
client_personlocation_givecard.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_PERSONLOCATION_GIVECARD;
    client_personlocation_givecard.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//人员定位卡报警信息订阅
var client_personlocation_alarm = new Stomp(host,port,user,pwd);

client_personlocation_alarm.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_PERSONLOCATION_ALARM;
    client_personlocation_alarm.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//停车场设备基本信息订阅
var client_parking_deviceinfo = new Stomp(host,port,user,pwd);
client_parking_deviceinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_PARKING_DEVICEINFO;
    client_parking_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//停车场车位信息订阅
var client_parking_parkareainfo = new Stomp(host,port,user,pwd);
client_parking_parkareainfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_PARKING_PARKAREAINFO;
    client_parking_parkareainfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//停车场车辆车主信息订阅
var client_parking_caruserinfo = new Stomp(host,port,user,pwd);
client_parking_caruserinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_PARKING_CARUSERINFO;
    client_parking_caruserinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//停车场车辆进出信息订阅
var client_parking_carrecord = new Stomp(host,port,user,pwd);

client_parking_carrecord.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_PARKING_CARRECORD;
    client_parking_carrecord.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//可视对讲设备基本信息订阅
var client_videoinntercom_deviceinfo = new Stomp(host,port,user,pwd);
client_videoinntercom_deviceinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_VIDEOINNTERCOM_DEVICEINFO;
    client_videoinntercom_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//可视对讲设备呼叫信息订阅
var client_videoinntercom_call = new Stomp(host,port,user,pwd);
client_videoinntercom_call.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_VIDEOINNTERCOM_CALL;
    client_videoinntercom_call.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//可视对讲单元门开门信息订阅
var client_videoinntercom_opengate = new Stomp(host,port,user,pwd);
client_videoinntercom_opengate.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_VIDEOINNTERCOM_OPENGATE;
    client_videoinntercom_opengate.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//电子巡更设备基本信息订阅
var client_patrol_deviceinfo = new Stomp(host,port,user,pwd);
client_patrol_deviceinfo.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_PATROL_DEVICEINFO;
    client_patrol_deviceinfo.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};     
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
			extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }

            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
					postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                    
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});
//电子巡更巡更记录信息订阅
var client_patrol_nightrecord = new Stomp(host,port,user,pwd);
client_patrol_nightrecord.connect(function(sessionId) {
    var destination = constUtils.QUEUE_P_PATROL_NIGHTRECORD;
    client_patrol_nightrecord.subscribe(destination, function(body, headers) {
        if (body){
			var extendJson={};
            var json = JSON.parse(body);
            var deptId = json.userInfo.communityId;
			var tableName=json.userInfo.tableName;
            extendJson['communityid'] = deptId;
            extendJson['opter'] = json.userInfo.userId;
            extendJson['optDate'] = json.optDate;
            var data = json.data;
            if(data.length>1000){
                console.error('You Transfer Date More Than 1000 One Time ！Please Limit it!');
            }
            for(var jsondate of data){
                    var resultJson = postgre.getInsertDBSql(tableName,jsondate,extendJson);
                    // console.log('current resultJson is:'+JSON.stringify(resultJson));
                    // console.log('current sql is:'+resultJson.sql);
                    // console.log('current values is:'+resultJson.values);
        			postgre.excuteSql(resultJson.sql,resultJson.values,function(result) {
                });
            }
        }else{
            console.log('No Transfer Body!Body is Null!');
        }
    });
});