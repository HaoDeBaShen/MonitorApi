const {Observable, from, of, interval, timer} = require('rxjs');
const {map, filter, startWith} = require('rxjs/operators');
const moment = require('moment');
const lodash = require('lodash');
const math = require('mathjs');
const MonitorStatistic = require("../models/monitorStatistic");
const MonitorRecord = require("../models/monitorRecord");
const MonitorIndex = require("../models/monitorIndex");
const MonitorLog = require("../models/monitorLog");
const Monitor = require("../models/monitor");

module.exports = {
    //auto statistic
    init: function () {
        //const date = moment().endOf("day").add(2, "hour");
        const date = moment("2018-07-23 10:15:00");
        timer(date.toDate(), 24 * 60 * 60 * 1000).subscribe(res => {
            Monitor.find().exec((err, docs) => {
                docs.forEach(monitor => {
                    if (monitor.enable) {
                        let start = moment().subtract(1, 'days').startOf('day');
                        let end = moment().subtract(1, 'days').endOf('day');
                        this.autoCheckByMonitor(monitor,start,end);
                    }
                })
            });
        });
    },

    autoCheckByMonitor:function(monitor,start,end){
        if (monitor.missing_rule && monitor.missing_rule.missing.is_work) {
            this.statisticMissing(monitor, start, end)
        }
        if (monitor.abnormal_rule && monitor.abnormal_rule.threshold_method.is_work) {
            MonitorRecord.find()
                .and([{monitor: monitor._id}, {date: {$gte: start}}, {date: {$lte: end}}])
                .exec((err, docs) => {
                    if (err) {
                    } else {
                        if (docs && docs.length >= 0) {
                            this.statisticAbnormalByThresholdMethod(monitor,docs,start,end);
                        }
                    }
                });
        }
        if (monitor.abnormal_rule && monitor.abnormal_rule.truncated_point_method.is_work) {
            MonitorRecord.find()
                .and([{monitor: monitor._id}, {date: {$gte: start}}, {date: {$lte: end}}])
                .exec((err, docs) => {
                    if (err) {
                    } else {
                        if (docs && docs.length >= 0) {
                            this.statisticAbnormalByTruncatedPointMethod(monitor,docs,start,end);
                        }
                    }
                });
        }
        if (monitor.abnormal_rule && monitor.abnormal_rule.rate_change_method.is_work) {
            MonitorRecord.find()
                .and([{monitor: monitor._id}, {date: {$gte: start}}, {date: {$lte: end}}])
                .exec((err, docs) => {
                    if (err) {
                    } else {
                        if (docs && docs.length >= 0) {
                            this.statisticAbnormalByRateChangeMethod(monitor,docs,monitor.abnormal_rule.rate_change_method.k,start,end);
                        }
                    }
                });
        }
        if (monitor.abnormal_rule && monitor.abnormal_rule.variance_check_method.is_work) {
            MonitorRecord.find()
                .and([{monitor: monitor._id}, {date: {$gte: start}}, {date: {$lte: end}}])
                .exec((err, docs) => {
                    if (err) {
                    } else {
                        if (docs && docs.length >= 0) {
                            this.statisticAbnormalByVarianceCheckMethod(monitor,docs,start,end);
                        }
                    }
                });
        }
    },

    statisticMissing: function (monitor, start, end) {
        MonitorRecord.find()
            .and([{monitor: monitor._id}, {date: {$gte: start}}, {date: {$lte: end}}])
            .exec((err, docs) => {
                if (err) {
                } else {
                    let interval = monitor.interval || 5;
                    let data = this.orderData(docs,interval,start,end,"MM-DD HH:mm");
                    monitor.indexes.forEach((item,i) =>{
                        let missing_value = lodash.filter(data,d => {
                            return typeof this.findIndexValue(d,i) != "number";
                        });
                        if(missing_value && missing_value.length>0){
                            let message = moment(start).format("YYYY-MM-DD") + item.description + "缺失数据：" +  missing_value.length + "条";
                            this.log(monitor, "错误", "missing_method", start, end, missing_value.length, message);
                        }
                    });
                }
            })
    },

    statisticAbnormalByThresholdMethod: function (monitor,array,start,end) {
        if (monitor.indexes && monitor.indexes.length > 0) {
            monitor.indexes.forEach((item, i) => {
                if (monitor.alarm && monitor.alarm.length && monitor.alarm[i].enabled) {
                    let abnormal_array = lodash.filter(array,(d) => {
                        let index_value = this.findIndexValue(d,i);
                        return (typeof  monitor.alarm[i].high === "number" && index_value > monitor.alarm[i].high ) ||(typeof  monitor.alarm[i].low === "number" && index_value < monitor.alarm[i].low );
                    });
                    if(abnormal_array  && abnormal_array.length >0){
                        let message =moment(start).format("YYYY-MM-DD") + "阈值法检查" + item.description + "异常数据：" + abnormal_array.length + "条";
                        this.log(monitor, "警报", "threshold_method", start, end, abnormal_array.length, message);
                    }
                }
            })
        }
    },

    statisticAbnormalByTruncatedPointMethod: function (monitor,array,start,end) {
        if (monitor.indexes && monitor.indexes.length > 0) {
            monitor.indexes.forEach((item, i) => {
                let abnormal_array = this.truncatedPointMethod(array,i);
                if(abnormal_array && abnormal_array.abnormal && abnormal_array.abnormal.length >0){
                    let message = mmoment(start).format("YYYY-MM-DD") + "截断点法检查" +item.description + "异常数据：" + abnormal_array.abnormal.length + "条";
                    this.log(monitor, "警报", "truncated_point_method", start, end, abnormal_array.abnormal.length, message);
                }
            });
        }
    },

    statisticAbnormalByRateChangeMethod: function (monitor,array,k,start,end) {
        if (monitor.indexes && monitor.indexes.length > 0) {
            monitor.indexes.forEach((item, i) => {
                let interval = monitor.interval || 5;
                let data = this.orderData(array,interval,start,end,"MM-DD HH:mm");
                let abnormal_array = this.rateChangeMethod(data,i,k);
                if(abnormal_array && abnormal_array.length >0){
                    let message = moment(start).format("YYYY-MM-DD") + "变化率法检查" + item.description + "异常数据：" + abnormal_array.length + "条";
                    this.log(monitor, "警报", "rate_change_method", start, end, abnormal_array.length, message);
                }
            })
        }
    },

    statisticAbnormalByVarianceCheckMethod: function (monitor,array,start,end) {
        if (monitor.indexes && monitor.indexes.length > 0) {
            monitor.indexes.forEach((item, i) => {
                let variance = this.varianceCheckMethod(array,i);
                if(!variance || variance < 0.000001){
                    let message = moment(start).format("YYYY-MM-DD") + "方差法检查" + item.description + "异常数据：" + array.length + "条";
                    this.log(monitor, "警报", "variance_check_method", start, end, array.length, message);
                }
            });
        }
    },

    findIndexValue:function(data,index_number){
        if(data.modify && data.modify.length >0 && typeof data.modify[index_number] ==="number"){
            return  data.modify[index_number];
        }else if (data.origin && data.origin.length >0 && typeof data.origin[index_number] ==="number"){
            return  data.origin[index_number];
        }else{
            return null
        }
    },

    truncatedPointMethod :function(array,index_number){
        let result  ={};
        let index_array = lodash.flatMap(array, item => {
            return this.findIndexValue(item,index_number);
        });
        index_array = lodash.sortBy(index_array);
        index_array = lodash.compact(index_array);
        let quantile = math.quantileSeq(index_array, [1/4, 3/4]);
        let q1 = quantile[0];
        let q3 = quantile[1];
        if( typeof q1 === "number" && typeof q3 === "number"){
            let r = q3 -q1;
            let t1 = q1 - 1.5 * r;
            let t3 = q3 + 1.5 * r;
            result.abnormal = lodash.filter(index_array,(item) => {
                if(typeof item === "number"){
                    return item - t1 < 0 || item - t3 > 0;
                }else{
                    return false;
                }
            });
            result.t1 = parseFloat(t1.toFixed(4));
            result.t3 = parseFloat(t3.toFixed(4));
        }
        return result;
    },

    rateChangeMethod:function(array,index_number,k){
        let result =[];
        let index_array = lodash.flatMap(array, item => {
            return this.findIndexValue(item,index_number);
        });
        if(index_array && index_array.length >0){
            let max_value = lodash.max(index_array);
            let min_value = lodash.min(index_array);
            let rate_change_value = k * (max_value - min_value);
            index_array.forEach((item,i) => {
                if(i >0 && typeof index_array[i] ==="number" && typeof index_array[i-1] ==="number"){
                    if(index_array[i] - index_array[i-1] > rate_change_value || index_array[i] - index_array[i-1] < - rate_change_value){
                        let temp_array =[];
                        temp_array.push({value:index_array[i],index:i});
                        temp_array.push({value:index_array[i-1],index:i-1});
                        result.push(temp_array);
                    }
                }
            })
        }
        return result;
    },

    varianceCheckMethod:function(array,index_number){
        let result;
        let index_array = lodash.flatMap(array, (item) => {
            return this.findIndexValue(item,index_number);
        });
        if(index_array && index_array.length >0){
            result = math.std(index_array, 'uncorrected');
        }
        return result;
    },

    orderData:function(array, interval, start_time, end_time, time_format) {
        let result = [];
        let time_interval = parseInt(interval);
        let all_count = 0;
        let all_miniters = 0;
        let empty_correction = [];
        if (moment(end_time) > moment().startOf("day")) {
            all_miniters = moment().diff(moment(start_time), 'minutes');
            all_count = Math.floor(all_miniters / time_interval);
        } else {
            all_miniters = (moment(end_time).diff(moment(start_time), 'days') + 1) * 1440;
            all_count = Math.floor(all_miniters / time_interval);
        }
        for (let i = 0; i < all_count; i++) {
            empty_correction.push({
                dt: moment(start_time).add(i * time_interval, 'minutes').format(time_format),
                origin: null,
                modify: null,
                date: moment(start_time).add(i * time_interval, 'minutes').format("YYYY-MM-DD HH:mm:ss")
            });
        }
        if (array && array.length > 0) {
            array.forEach(d => {
                result.push({
                    rid: d._id,
                    dt: moment(d.date).format(time_format),
                    origin: d.origin,
                    modify: d.modify,
                    date: moment(d.date).format("YYYY-MM-DD HH:mm:ss")
                });
            });
        }
        result = lodash.intersectionBy(result, empty_correction, 'dt');
        result = lodash.unionBy(result, empty_correction, 'dt');
        result = lodash.sortBy(result, 'date');
        return result;
    },

    log: function (monitor, level, check_method, start_time, end_time, count, message) {
        const log = {
            monitor: monitor,
            date: moment(),
            level: level,
            type: "数据",
            auto: "自动",
            source: "修复",
            check_method: check_method,
            start_time: start_time,
            end_time: end_time,
            count: count,
            description: message
        };
        MonitorLog.create(log, (err, doc) => {
        });
    }

};