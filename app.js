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
var index = require('./routes/index');
app.use('/', index);
var login = require('./routes/base/login');
app.use('/login', login);

var systemInfo = require('./routes/business/systemInfo');
app.use('/systemInfo', systemInfo);



//yangHuuserJun  routes
var videoMonitor = require('./routes/business/videoMonitor');
app.use('/videoMonitor', videoMonitor);





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
