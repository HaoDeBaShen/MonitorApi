/**
 * Created by SDB on 2017-10-13.
 */
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const MonitorLogSchema = new Schema({
    monitor : {
        type : ObjectId,
        ref : 'Monitor'
    },
    date : Date,
    start_time:Date,
    end_time:Date,
    //消息、警告、错误
    level: String,
    count: Number,
    is_deal: Boolean,
    repair_log:{
        type : ObjectId,
        ref : 'MonitorLog'
    },
    //线性法，均值法
    repair_method:String,
    //缺失值检查，变化率法
    check_method:String,
    //设备，数据
    type : String,
    //自动，人工
    auto : String,
    //数据 ：检查，修复，采集；设备：安装，维护
    source : String,
   
    creator:{
        type : ObjectId,
        ref : 'User'
    },
    description : String

},{ collection: 'monitorLogs' });

 const MonitorLog = mongoose.model('MonitorLog', MonitorLogSchema);

module.exports = MonitorLog;