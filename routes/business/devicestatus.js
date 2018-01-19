let express = require('express');
let router = express.Router();
let constUtils = require('../../utils/constUtils');
let redis = require('../../utils/redis');
let log4js = require('../../utils/logger');
let jsName = __filename.substr(__dirname.length+1);
let logName = jsName.replace('\.js','\.log');
/* GET ten system's statistic from redis.
 *输入json{role:"",ids:["",""]}
 * json:数据返回输出{[]}
 *
 *
 */
router.use('/devicestatus', function(req, res, next) {
    let log=log4js.config(__dirname+'/../../',jsName,logName);
    let json = req.body;    
    let role = json.role;
    let ids = json.ids;
    let prestat='';
    switch(role)
    {
        case 'community':
            prestat='stat:c:';
            break;
        case 'region':
            prestat='stat:r:';
            break;
        case 'group':
            prestat='stat:g:';
            break;
        case 'super':
            prestat='stat:h:';
            break;
    }
    if(ids.length>0){
        let result=[];
        ids.forEach(function(item,index) {
            let datainfo={};
            redis.hget(prestat+item,'devicesta',(data)=>{
               if(data !=null && data !=undefined){
                   datainfo=JSON.parse(data);
                   //判断合计是否相等
                   redis.hget(prestat+item,'sum',(sdata)=>{
                       if(sdata !=null && sdata !=undefined){
                           sdatainfo=JSON.parse(sdata);
                           sumonline=+parseInt(sdatainfo["monitor"])+parseInt(sdatainfo["elevator"])+parseInt(sdatainfo["intercom"])+parseInt(sdatainfo["location"])+parseInt(sdatainfo["gate"])+parseInt(sdatainfo["info"])+parseInt(sdatainfo["intrusion"])+parseInt(sdatainfo["park"])+parseInt(sdatainfo["broadcast"])+parseInt(sdatainfo["patrol"]);
                           if(sumonline!=parseInt(datainfo.online)){
                               datainfo.online=sumonline;
                               datainfo.nobug=datainfo.online-datainfo.bug;
                           }
                           result.push(datainfo);
                           if(index==ids.length-1){
                               res.send('{"code":'+constUtils.WORK_QUERY_SUCCESS+',"msg":'+JSON.stringify(result)+'}');
                           }
                       }
                   });
               }else{
                   res.send('{"code":'+constUtils.WORK_QUERY_FAIL+',"msg":"未能查到当前机构id：'+item+'的数据!"}');
               }
            });
        });
    }
});

module.exports = router;
