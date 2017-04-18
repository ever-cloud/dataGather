/**
 * Created by lenovo on 2017/3/15.
 * Edit by yanghuijun 2017/3/17
 * 自定义系统使用各类常量
 */
let constData={};

//业务错误码及错误提示
/**
 * @name {登录成功}
 */
constData.WORK_LOGIN_SUCCESS = "1000" ;
/**
 * @name {查询成功}
 */
constData.WORK_QUERY_SUCCESS = "1001" ;
/**
 * @name {入库成功}
 */
constData.WORK_INSERT_SUCCESS = "1002" ;
/**
 * @name {上传ActMq成功}
 */
constData.WORK_UPLOAD_SUCCESS = "1003" ;

/**
 * @name {登录失败}
 */
constData.WORK_LOGIN_FAIL = "4000" ;
/**
 * @name {查询失败}
 */
constData.WORK_QUERY_FAIL = "4001" ;
/**
 * @name {入库失败}
 */
constData.WORK_INSERT_FAIL = "4002" ;
/**
 * @name {上传ActMq失败}
 */
constData.WORK_UPLOAD_FAIL = "4003" ;
/**
 * @name {用户名不存在}
 */
constData.WORK_LOGIN_NOUSER = "4004" ;
/**
 * @name {密码不正确}
 */
constData.WORK_LOGIN_PASSERR = "4005" ;
/**
 * @name {系统错误}
 */
constData.WORK_SYSTEM_ERROR = "7000" ;


//接口数据在ActiveMq中的队列名，命名为/queue/tablename（采用点对点）
let queue="/queue/";
//接口数据在ActiveMq中的主题，命名为/topic/interfacename(采用publish/subscribe)
let topic="/topic/";

/**
 * @name {视频监控设备的基本信息}
 */
constData.TABLE_P_VIDEOMONITOR_DEVICEINFO = "p_videomonitor_deviceinfo";
constData.QUEUE_P_VIDEOMONITOR_DEVICEINFO = queue+constData.TABLE_P_VIDEOMONITOR_DEVICEINFO;
/**
 * @name {可视开门系统设备的基本信息}
 */
constData.TABLE_P_VIDEOINTERCOM_DEVICEINFO = "p_videointercom_deviceinfo";
constData.QUEUE_P_VIDEOINTERCOM_DEVICEINFO = queue+constData.TABLE_P_VIDEOINTERCOM_DEVICEINFO;
/**
 * @name {可视开门系统开门记录信息}
 */
constData.TABLE_P_VIDEOINTERCOM_OPENGATE = "p_videointercom_opengate";
constData.QUEUE_P_VIDEOINTERCOM_OPENGATE = queue+constData.TABLE_P_VIDEOINTERCOM_OPENGATE;
/**
 * @name {可视开门系统对讲记录信息}
 */
constData.TABLE_P_VIDEOINTERCOM_CALL = "p_videointercom_call";
constData.QUEUE_P_VIDEOINTERCOM_CALL = queue+constData.TABLE_P_VIDEOINTERCOM_CALL;
/**
 * @name {社区物联系统状态信息}
 */
constData.TABLE_P_SYSTEMSTATUSINFO = "p_systemstatusinfo";
constData.QUEUE_P_SYSTEMSTATUSINFO = queue+constData.TABLE_P_SYSTEMSTATUSINFO;
/**
 * @name {社区物联系统信息}
 * 换第三方表
 */
constData.TABLE_P_SYSTEMINFO = "t_community_system";
constData.QUEUE_P_SYSTEMINFO = queue+constData.TABLE_P_SYSTEMINFO;
/**
 * @name {人员定位定位卡信息}
 */
constData.TABLE_P_PERSONLOCATION_GIVECARD = "p_personlocation_givecard";
constData.QUEUE_P_PERSONLOCATION_GIVECARD = queue+constData.TABLE_P_PERSONLOCATION_GIVECARD;
/**
 * @name {人员定位系统定位卡报警信息}
 */
constData.TABLE_P_PERSONLOCATION_ALARM = "p_personlocation_alarm";
constData.QUEUE_P_PERSONLOCATION_ALARM = queue+constData.TABLE_P_PERSONLOCATION_ALARM;
/**
 * @name {人员定位系统设备信息}
 */
constData.TABLE_P_PERSONLOCATION_DEVICEINFO = "p_personlocation_deviceinfo";
constData.QUEUE_P_PERSONLOCATION_DEVICEINFO = queue+constData.TABLE_P_PERSONLOCATION_DEVICEINFO;
/**
 * @name {电子巡更系统巡更信息}
 */
constData.TABLE_P_PATROL_NIGHTRECORD = "p_patrol_nightrecord";
constData.QUEUE_P_PATROL_NIGHTRECORD = queue+constData.TABLE_P_PATROL_NIGHTRECORD;
/**
 * @name {电子巡更系统设备信息}
 */
constData.TABLE_P_PATROL_DEVICEINFO = "p_patrol_deviceinfo";
constData.QUEUE_P_PATROL_DEVICEINFO = queue+constData.TABLE_P_PATROL_DEVICEINFO;
/**
 * @name {停车场系统车位信息}
 */
constData.TABLE_P_PARKING_PARKAREAINFO = "p_parking_parkareainfo";
constData.QUEUE_P_PARKING_PARKAREAINFO = queue+constData.TABLE_P_PARKING_PARKAREAINFO;
/**
 * @name {停车场系统设备信息}
 */
constData.TABLE_P_PARKING_DEVICEINFO = "p_parking_deviceinfo";
constData.QUEUE_P_PARKING_DEVICEINFO = queue+constData.TABLE_P_PARKING_DEVICEINFO;
/**
 * @name {停车场系统车主信息}
 */
constData.TABLE_P_PARKING_CARUSERINFO = "p_parking_caruserinfo";
constData.QUEUE_P_PARKING_CARUSERINFO = queue+constData.TABLE_P_PARKING_CARUSERINFO;
/**
 * @name {停车场系统车辆进出信息}
 */
constData.TABLE_P_PARKING_CARRECORD = "p_parking_carrecord";
constData.QUEUE_P_PARKING_CARRECORD = queue+constData.TABLE_P_PARKING_CARRECORD;
/**
 * @name {信息发布系统设备信息}
 */
constData.TABLE_P_INFODIFFUSION_DEVICEINFO = "p_infodiffusion_deviceinfo";
constData.QUEUE_P_INFODIFFUSION_DEVICEINFO = queue+constData.TABLE_P_INFODIFFUSION_DEVICEINFO;
/**
 * @name {信息发布发布的记录信息}
 */
constData.TABLE_P_INFODIFFUSION_INFORECORD = "p_infodiffusion_inforecord";
constData.QUEUE_P_INFODIFFUSION_INFORECORD = queue+constData.TABLE_P_INFODIFFUSION_INFORECORD;
/**
 * @name {门禁系统开门信息}
 */
constData.TABLE_P_GATE_OPEN = "p_gate_open";
constData.QUEUE_P_GATE_OPEN = queue+constData.TABLE_P_GATE_OPEN;
/**
 * @name {门禁系统设备信息}
 */
constData.TABLE_P_GATE_DEVICEINFO = "p_gate_deviceinfo";
constData.QUEUE_P_GATE_DEVICEINFO = queue+constData.TABLE_P_GATE_DEVICEINFO;
/**
 * @name {设备故障码/报警码信息}
 */
constData.TABLE_P_ERRORALARMCODE = "p_erroralarmcode";
constData.QUEUE_P_ERRORALARMCODE = queue+constData.TABLE_P_ERRORALARMCODE;
/**
 * @name {电梯控制系统设备信息}
 */
constData.TABLE_P_ELEVATOR_DEVICEINFO = "p_elevator_deviceinfo";
constData.QUEUE_P_ELEVATOR_DEVICEINFO = queue+constData.TABLE_P_ELEVATOR_DEVICEINFO;
/**
 * @name {设备使用状态信息}
 */
constData.TABLE_P_DEVICESTATUSINFO = "p_devicestatusinfo";
constData.QUEUE_P_DEVICESTATUSINFO = queue+constData.TABLE_P_DEVICESTATUSINFO;
/**
 * @name {设备故障信息}
 */
constData.TABLE_P_DEVICEFAULT = "p_devicefault";
constData.QUEUE_P_DEVICEFAULT = queue+constData.TABLE_P_DEVICEFAULT;
/**
 * @name {设备异常报警信息}
 */
constData.TABLE_P_DEVICEALARM = "p_devicealarm";
constData.QUEUE_P_DEVICEALARM = queue+constData.TABLE_P_DEVICEALARM;
/**
 * @name {广播通讯系统广播信息}
 */
constData.TABLE_P_BROADCAST_RECORD = "p_broadcast_record";
constData.QUEUE_P_BROADCAST_RECORD = queue+constData.TABLE_P_BROADCAST_RECORD;
/**
 * @name {广播通讯系统设备信息}
 */
constData.TABLE_P_BROADCAST_DEVICEINFO = "p_broadcast_deviceinfo";
constData.QUEUE_P_BROADCAST_DEVICEINFO = queue+constData.TABLE_P_BROADCAST_DEVICEINFO;
/**
 * @name {广播通讯系统分区信息}
 */
constData.TABLE_P_BROADCAST_AREA = "p_broadcast_area";
constData.QUEUE_P_BROADCAST_AREA = queue+constData.TABLE_P_BROADCAST_AREA;
/**
 * @name {入侵报警系统防区信息}
 */
constData.TABLE_P_ALARM_SECTORINFO = "p_alarm_sectorinfo";
constData.QUEUE_P_ALARM_SECTORINFO = queue+constData.TABLE_P_ALARM_SECTORINFO;
/**
 * @name {入侵报警系统报警信息}
 */
constData.TABLE_P_ALARM_INTRUSION = "p_alarm_intrusion";
constData.QUEUE_P_ALARM_INTRUSION = queue+constData.TABLE_P_ALARM_INTRUSION;
/**
 * @name {入侵报警系统设备信息}
 */
constData.TABLE_P_ALARM_DEVICEINFO = "p_alarm_deviceinfo";
constData.QUEUE_P_ALARM_DEVICEINFO = queue+constData.TABLE_P_ALARM_DEVICEINFO;
/**
 * @name {物联系统统计主题}
 */
//社区
constData.TOPIC_STATISTICS_COMMUNITY = topic+"portal.sysstatistics.community";
//大区
constData.TOPIC_STATISTICS_REGION = topic+"portal.sysstatistics.region";
//集团
constData.TOPIC_STATISTICS_GROUP = topic+"portal.sysstatistics.group";
//海尔
constData.TOPIC_STATISTICS_SUPER = topic+"portal.sysstatistics.super";


module.exports = constData;