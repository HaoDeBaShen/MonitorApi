/**
 * Created by SDB on 2017-08-29.
 */
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const MonitorAlarmSchema = new Schema({
    start_time:Date,
    end_time:Date,
    //高于上限(value-alarm_high)
    high : Number,
    //低于下限(alarm_low-value)
    low  : Number,
    //采集值
    origin : Number,
    is_deal : Boolean,
    monitor:{
        type : ObjectId,
        ref : 'Monitor'
    },
    index : String
},{ collection: 'monitorAlarms' });

const MonitorAlarm = mongoose.model('Alarm', MonitorAlarmSchema);

module.exports = MonitorAlarm;