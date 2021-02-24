// 引入 events 模块
const events = require('events');
// 创建 eventEmitter 对象
const eventEmitter = new events.EventEmitter();
const moment = require('moment');
const MonitorAlarm = require("../models/monitorAlarm");

eventEmitter.on('alarm',  (monitor, value, date) => {
    monitor.alarm && monitor.alarm.forEach( (item,i) => {
        if (item.enabled && typeof value[i] === 'number'){
            MonitorAlarm.find({monitor: monitor, index: monitor.indexes[i]}).sort({start_time:'desc'}).limit(1).lean()
            .exec( (err, recs) => {
                if (err) { return; }
                //有警报
                if (recs && recs.length == 1) {
                    const alarm_record = recs[0];
                    //警报未结束
                    if (!alarm_record.end_time){
                        if(typeof item.high === 'number' && value[i] > item.high){
                            // continue alarm
                            alarm_record.origin = value[i];
                            alarm_record.high = Math.round((value[i] - item.high)*1000) / 1000;
                        } 
                        else if(typeof item.low === 'number' && value[i] < item.low) {
                            // continue alarm
                            alarm_record.origin = value[i];
                            alarm_record.low = Math.round((item.low - value[i])*1000) / 1000;
                        }
                        else{
                            // close alarm
                            alarm_record.end_time = moment(date);
                        }
                        MonitorAlarm.findOneAndUpdate({_id: alarm_record._id.toString()}, alarm_record).exec();
                    }
                    //警报已结束，但未处理同时时间间隔未超过有效期（默认1小时）
                    else if(!alarm_record.is_deal && moment(date).diff(moment(alarm_record.end_time), 'hours', true) < (item.hour || 1) ){
                        if(typeof item.high === 'number' && value[i] > item.high){
                            // continue alarm
                            alarm_record.end_time = undefined;
                            alarm_record.origin = value[i];
                            alarm_record.high = Math.round((value[i] - item.high)*1000) / 1000;
                            MonitorAlarm.findOneAndUpdate({_id: alarm_record._id.toString()}, alarm_record).exec();
                        }
                        if(typeof item.low === 'number' && value[i] < item.low){
                            // continue alarm
                            alarm_record.end_time = undefined;
                            alarm_record.origin = value[i];
                            alarm_record.low = Math.round((item.low - value[i])*1000) / 1000;
                            MonitorAlarm.findOneAndUpdate({_id: alarm_record._id.toString()}, alarm_record).exec();
                        }
                    }
                    //警报已结束，警报已处理或时间超有效期
                    else{
                        // auto deal alarm
                        alarm_record.is_deal = true;
                        MonitorAlarm.findOneAndUpdate({_id: alarm_record._id.toString()}, alarm_record).exec();
                        // restart alarm
                        if(typeof item.high === 'number' && value[i] > item.high){
                            MonitorAlarm.create({
                                start_time:moment(date),
                                monitor: monitor,
                                index : monitor.indexes[i],
                                high: Math.round((value[i] - item.high)*1000) / 1000,
                                origin : value[i],
                                is_deal: false
                            });
                        }
                        if(typeof item.low === 'number' && value[i] < item.low){
                            MonitorAlarm.create({
                                start_time:moment(date),
                                monitor: monitor,
                                index : monitor.indexes[i],
                                low: Math.round((item.low - value[i])*1000) / 1000,
                                origin : value[i],
                                is_deal: false
                            });
                        }
                    }
                }
                //无警报
                else {
                    // start alarm
                    if(typeof item.high === 'number' && value[i] > item.high){
                        MonitorAlarm.create({
                            start_time:moment(date),
                            monitor: monitor,
                            index : monitor.indexes[i],
                            high: Math.round((value[i] - item.high)*1000) / 1000,
                            origin : value[i],
                            is_deal: false
                        });
                    }
                    if(typeof item.low === 'number' && value[i] < item.low){
                        MonitorAlarm.create({
                            start_time:moment(date),
                            monitor: monitor,
                            index : monitor.indexes[i],
                            low: Math.round((item.low - value[i])*1000) / 1000,
                            origin : value[i],
                            is_deal: false
                        });
                    }
                }
            
            });
        }
    });
    
});

module.exports = {
    event : eventEmitter
}