const {Observable, from, of, interval, timer} = require('rxjs');
const {map, filter, startWith} = require('rxjs/operators');
const moment = require('moment');
const Monitor = require("../models/monitor");
const MonitorLog = require("../models/monitorLog");
const MonitorRecord = require("../models/monitorRecord");
const cache = require('./cache');
const alarm = require('./alarm').event;

module.exports = {
    subscription: any = {},
    init: function () {
        this.subscription = this.subscription || {};
        Monitor.find().exec((err, docs) => {
            if (!err) {
                docs.forEach(item => {
                    if (item.emulator && item.started) {
                        this.start(item);
                    }
                });
            }
        });
    },
    start: function (monitor) {
        this.subscription = this.subscription || {};
        if (this.subscription[monitor.name]) {
            return;
        }
        const now = moment();
        const minute = Math.floor(now.get('minute') / monitor.interval) * monitor.interval + monitor.interval;
        now.set('second', 0).set('millisecond', 0).set('minute', 0).add(minute, 'minute');
        this.subscription[monitor.name] = timer(now.toDate(), monitor.interval * 60 * 1000).pipe(map(item => {
            const date = moment();
            date.set('second', 0).set('millisecond', 0);
            const data = [];
            monitor.indexes.forEach(item => {
                data.push(Math.random());
            });
            return {
                date: date,
                data: data
            }
        })).subscribe(item => {
            const record = {
                monitor: monitor,
                date: item.date,
                origin: item.data
            };
            MonitorRecord.create(record, (err, doc) => {
                if (err) {
                }
                else {
                    //alarm
                    alarm.emit('alarm', monitor, record.origin, record.date);
                    //cache
                    cache.update(record);

                    this.log(monitor, "消息", "数据接收成功: " + moment(item.date).format("YYYY-MM-DD HH:mm:ss SSS"));
                }
            });
        });
    },

    stop: function (monitor) {
        this.subscription = this.subscription || {};
        if (!this.subscription[monitor.name]) {
            return;
        }
        this.subscription[monitor.name].unsubscribe();
        delete this.subscription[monitor.name];
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