var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var seckeyPool = require("./utils/seckeyPool");
var subscribe = require("./mq/subscribe");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//拦域所有URL并验证
app.use(function (req, res, next) {
    /*
     验证seckey有效性，合法的seckey 存在redis中，此验证只需要从redis中查询是否存在即可。
     */
    function  verify(seckey) {
        if(seckey === undefined || seckey === null || seckey === ""){
            return false;
        }else{
            //查询redis是否存在
            return seckeyPool.exists();
        }
    }
    //仅拦截restful请求
    var contentType = req.get('Content-Type');
    if(contentType === 'application/json;charset=UTF-8'){
        var path = req.url;
        if (path!='/login') {
            var obj = req.body;
            if (!verify(obj.seckey)) {
                res.send('{"code":4003,"msg":"无效的seckey，请重新登录！"}');
            }
        }
    }
    next();
});
//anGuangYing
//路由定义根路径
var index = require('./routes/index');
app.use('/', index);
//业务处理开始，login登录登陆系统后生成安全码（seckey），有效时间默认一天
var login = require('./routes/base/login');
app.use('/login', login);

//物联系统基本信息变更
var systembasicinfo = require('./routes/business/systembasicinfo');
app.use('/common', systembasicinfo);
//系统状态信息变更
var systemstatusinfo = require('./routes/business/systemstatusinfo');
app.use('/common', systemstatusinfo);
//设备的状态信息变更
var devicestatusinfo = require('./routes/business/devicestatusinfo');
app.use('/common', devicestatusinfo);
//设备的故障码或报警码信息
var erroralarmcode = require('./routes/business/erroralarmcode');
app.use('/common', erroralarmcode);
//设备发生的故障记录
var devicefault = require('./routes/business/devicefault');
app.use('/common', devicefault);
//系统设备发生的异常报警记录
var devicealarm = require('./routes/business/devicealarm');
app.use('/common', devicealarm);
//获取用户所在小区各物联系统相应信息
var getsysteminfo = require('./routes/business/getsysteminfo');
app.use('/common', getsysteminfo);

//视频监控设备的基本信息
var videomonitor_deviceinfo = require('./routes/business/videomonitor_deviceinfo');
app.use('/videomonitor', videomonitor_deviceinfo);

//入侵报警设备的基本信息
var alarm_deviceinfo = require('./routes/business/alarm_deviceinfo');
app.use('/alarm', alarm_deviceinfo);
//入侵报警防区的基本信息
var alarm_sectorinfo = require('./routes/business/alarm_sectorinfo');
app.use('/alarm', alarm_sectorinfo);
//入侵报警报警信息
var alarm_intrusion = require('./routes/business/alarm_intrusion');
app.use('/alarm', alarm_intrusion);

//门禁设备的基本信息
var gate_deviceinfo = require('./routes/business/gate_deviceinfo');
app.use('/gate', gate_deviceinfo);
//门禁开门记录信息
var gate_open = require('./routes/business/gate_open');
app.use('/gate', gate_open);

//电梯控制设备的基本信息
var elevator_deviceinfo = require('./routes/business/elevator_deviceinfo');
app.use('/elevator', elevator_deviceinfo);


//广播通讯设备基本信息
var broadcast_deviceinfo = require('./routes/business/broadcast_deviceinfo');
app.use('/broadcast', broadcast_deviceinfo);
//广播通讯广播的记录信息
var broadcast_record = require('./routes/business/broadcast_record');
app.use('/broadcast', broadcast_record);

//信息发布设备基本信息
var infodiffusion_deviceinfo = require('./routes/business/infodiffusion_deviceinfo');
app.use('/infodiffusion', infodiffusion_deviceinfo);
//信息发布发布的记录信息
var infodiffusion_inforecord = require('./routes/business/infodiffusion_inforecord');
app.use('/infodiffusion', infodiffusion_inforecord);

//人员定位设备基本信息
var personlocation_deviceinfo = require('./routes/business/personlocation_deviceinfo');
app.use('/personlocation', personlocation_deviceinfo);
//人员定位定位卡信息信息
var personlocation_givecard = require('./routes/business/personlocation_givecard');
app.use('/personlocation', personlocation_givecard);
//人员定位卡报警信息
var personlocation_alarm = require('./routes/business/personlocation_alarm');
app.use('/personlocation', personlocation_alarm);

//停车场设备基本信息
var parking_deviceinfo = require('./routes/business/parking_deviceinfo');
app.use('/parking', parking_deviceinfo);
//停车场车位信息
var parking_parkareainfo = require('./routes/business/parking_parkareainfo');
app.use('/parking', parking_parkareainfo);
//停车场车辆车主信息
var parking_caruserinfo = require('./routes/business/parking_caruserinfo');
app.use('/parking', parking_caruserinfo);
//停车场车辆进出信息
var parking_carrecord = require('./routes/business/parking_carrecord');
app.use('/parking', parking_carrecord);

//可视对讲设备基本信息
var videoinntercom_deviceinfo = require('./routes/business/videoinntercom_deviceinfo');
app.use('/videoinntercom', videoinntercom_deviceinfo);
//可视对讲设备呼叫信息
var videoinntercom_call = require('./routes/business/videoinntercom_call');
app.use('/videoinntercom', videoinntercom_call);
//可视对讲单元门开门信息
var videoinntercom_opengate = require('./routes/business/videoinntercom_opengate');
app.use('/videoinntercom', videoinntercom_opengate);

//电子巡更设备基本信息
var patrol_deviceinfo = require('./routes/business/patrol_deviceinfo');
app.use('/patrol', patrol_deviceinfo);
//电子巡更巡更记录信息
var patrol_nightrecord = require('./routes/business/patrol_nightrecord');
app.use('/patrol', patrol_nightrecord);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler 500
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
