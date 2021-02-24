const {Observable, from, of, interval, timer} = require('rxjs');
const {map, filter, startWith} = require('rxjs/operators');
const moment = require('moment');
const request = require('request');
const Monitor = require("../models/monitor");
const MonitorLog = require("../models/monitorLog");
const MonitorRecord = require("../models/monitorRecord");
const cache = require('./cache');
const alarm = require('./alarm').event;

module.exports = {
    subscription: any,
    init: function () {
        this.subscription = timer(moment().toDate(), 3 * 60 * 1000).subscribe(res => {
            Monitor.find().lean().exec((err, monitors) => {
                if (!err) {
                    monitors.forEach(async monitor => {
                        if (monitor.enable && monitor.api && monitor.api.provider) {
                            const latest = await cache.get(monitor._id.toString());
                            const start = latest ? latest.lastDate : moment().startOf("day");
                            const end = moment().endOf("day");
                            this.collect(monitor, start, end);
                        }
                    });
                }
            });
        });
    },

    collect: function (monitor, start, end) {
        this.fetch(monitor, start, end).then( data => {
            if(data.records.length > 0) {
                data.records.sort((a, b) => (moment(b.date).valueOf() - moment(a.date).valueOf()));
                //alarm
                alarm.emit('alarm', monitor, data.records[0].origin, data.records[0].date);
                //cache
                cache.update(data.records[0]);
                //log
                this.log(monitor, "消息", "数据接收成功: " + moment(data.records[0].date).format("YYYY-MM-DD HH:mm:ss"));
            }
        }).catch();
    },

    fetch: function(monitor, start, end){
        if (monitor.api.provider === "WHXF") {
            return this.fetchWHXF(monitor, start, end);
        }else if (monitor.api.provider === "NCME"){
            return this.fetchNCME(monitor, start, end);
        }else {
            return new Promise(function(resolve, reject){
                reject(new Error("provider is unknown!"));
            });
        }
    },

    fetchWHXF : async function(monitor, start, end){
        return new Promise(function(resolve, reject){
            request({
                url: monitor.api.url,
                qs: {
                    st: monitor.code,
                    startTime: moment(start).format("YYYY-MM-DD HH:mm:ss"),
                    endTime: moment(end).format("YYYY-MM-DD HH:mm:ss")
                },
                method: "GET",
                json: true
            },  (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    const records = [];
                    Array.isArray(body) && body.forEach(item => {
                        const record = {
                            monitor: {_id: monitor._id},
                            date : item.tt,
                            origin : [],
                            modify : []
                        };
                        if (Array.isArray(monitor.api.indexes)){
                            monitor.api.indexes.forEach(index => {
                                if (typeof(item[index]) !== 'number' || item[index] < 0){
                                    record.origin.push(null);
                                }else{
                                    if (index === 'sbl1' || index === 'sbl2') {
                                        //立方米/每小时 转 立方米/秒
                                        record.origin.push(item[index] / 3600);
                                    } else {
                                        record.origin.push(item[index])
                                    }
                                }
                            });
                            records.push(record);
                        }

                    });
                    if (records.length > 0) {
                        MonitorRecord.bulkWrite(records.map(record => {
                            return {
                                updateOne: {
                                    filter: {monitor: record.monitor, date:record.date},
                                    update: record,
                                    upsert: true
                                }
                            }
                        })).then( result => {
                            //alarm.emit('alarm', monitor, records[0].origin, records[0].date);
                            resolve({result:true, insert: result.insertedCount, update: result.modifiedCount, records: records});
                        });
                    } else {
                        resolve({result:true, insert: 0, update: 0, records: []});
                    }
                } else {
                    reject(new Error(error));
                }
            });
        });
    },

    fetchNCME : async function(monitor, start, end){
        return new Promise(function(resolve, reject){
            request({
                url: monitor.api.url + monitor.code + "/" + moment(start).valueOf() + "/" +  moment(end).valueOf(),
                method: "GET",
                json: true
            },  (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    const records = [];
                    Array.isArray(body) && body.forEach(item => {
                        const record = {
                            monitor: {_id: monitor._id},
                            date : item.date,
                            origin : [],
                            modify : []
                        };
                        if (Array.isArray(monitor.api.indexes)){
                            monitor.api.indexes.forEach(index => {
                                if (typeof(item[index]) !== 'number' || item[index] < 0){
                                    record.origin.push(null);
                                }else{
                                    if (index === 'Q') {
                                        //立方米/每小时 转 立方米/秒
                                        record.origin.push(item[index] / 3600);
                                    } else {
                                        record.origin.push(item[index])
                                    }
                                }
                            });
                            records.push(record);
                        }

                    });
                    if (records.length > 0) {
                        MonitorRecord.bulkWrite(records.map(record => {
                            return {
                                updateOne: {
                                    filter: {monitor: record.monitor, date:record.date},
                                    update: record,
                                    upsert: true
                                }
                            }
                        })).then( result => {
                            //alarm.emit('alarm', monitor, records[0].origin, records[0].date);
                            resolve({result:true, insert: result.insertedCount, update: result.modifiedCount, records: records});
                        });
                    } else {
                        resolve({result:true, insert: 0, update: 0, records: []});
                    }
                } else {
                    reject(new Error(error));
                }
            });
        });
    },

    stop: function () {
        this.subscription && this.subscription.unsubscribe();
    },

    log: function (monitor, level, message) {
        const log = {
            monitor: monitor,
            date: moment(),
            level: level,
            type: "数据",
            auto: "自动",
            source: "采集",
            description: message
        };
        MonitorLog.create(log, (err, doc) => {




        });
    }

}