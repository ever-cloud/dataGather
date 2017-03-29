/**
 * Created by mumianhua on 2017/3/27.
 */
let log4js = require('log4js');
let fs = require('fs');
let path = require('path');
let moment = require('moment');
/*
* @param jsName 记录获取日志模块的js
* @param logName 记录日志的文件，默认放在根目录下当天日期文件夹内
* @use example let logger = require('./utils/logger');let log=loggers.config('app.js','app.log');log.debug('test logs,and test time:',new Date());
*
 */
let log4jLogger = {};
log4jLogger.config = function(jsName,logName){
        if(jsName==null || jsName=='' || jsName == undefined)
            jsName = 'default';
        let curdate = moment().format('YYYY-MM-DD');
        let accessLogPath = path.resolve('logs',curdate);
        fs.existsSync(accessLogPath) || fs.mkdirSync(accessLogPath);
        if(logName==null || logName=='' || logName == undefined)
            logName = curdate;
        logName = accessLogPath+ path.sep +logName;
        log4js.configure({
            appenders: [{
                type: 'file',
                filename: logName
            }]
        });
        let log4jlog = log4js.getLogger(jsName);
        log4jlog.info('日记录所在模块：'+jsName+',日志文件路径：'+logName);
        return log4jlog;
    };

module.exports = log4jLogger;