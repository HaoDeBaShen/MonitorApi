const { Observable, from, of, interval, timer } = require('rxjs');
const { map, filter, startWith } = require('rxjs/operators');
const moment = require('moment');
const MonitorStatistic = require("../models/monitorStatistic");
const MonitorRecord = require("../models/monitorRecord");
const MonitorIndex = require("../models/monitorIndex");
const MonitorLog = require("../models/monitorLog");
const Monitor = require("../models/monitor");

module.exports = {
    //auto statistic
    init : function(){
        const date = moment().endOf("day").add(1, "hour");
        timer(date.toDate(), 24 * 60 * 60 * 1000).subscribe( res => {
            Monitor.find().exec( (err, docs) => {
                docs.forEach(monitor => {
                    if (monitor.enable){
                        const start = moment().subtract(1,"day");
                        this.calc(monitor, 0, start, start);
                        this.calc(monitor, 1, start, start);
                    }
                })
            });
        });
    },
    //type   0:day,1:hour
    calc : function(monitor, type, start, end, callback){ 
        const start_date = moment(start).startOf("day");
        const end_date = moment(end).endOf("day");
        MonitorStatistic.remove({type:type, monitor:monitor._id, date:{$gte: start_date, $lt: end_date}}).exec( (err) => {
            if ( err ) { 
                callback && callback(err,null); 
                return; 
            }
            const o = {
                verbose : false,
                query : { monitor : monitor._id, date :{$gte: start_date, $lt: end_date}},
                scope : {
                    type : type
                }
            };
            o.map = function() {
                var key = '';
                if (type === 1){
                    key = this.date.getFullYear() + '-' + (this.date.getMonth() + 1) + '-' + this.date.getDate() + ' '  + this.date.getHours() + ':00:00';
                }else {
                    key = this.date.getFullYear() + '-' + (this.date.getMonth() + 1) + '-' + this.date.getDate();
                }
                var stat = [];
                if(this.origin && this.origin.length > 0){
                    for (var i = 0; i < this.origin.length; i++){
                        var value = this.origin[i];
                        var value2 = this.modify ? this.modify[i] :null;
                        stat.push({
                            count: typeof value === 'number' ? 1: 0,
                            sum: typeof value === 'number' ? value: undefined,
                            min: typeof value === 'number' ? value: undefined,
                            max: typeof value === 'number' ? value: undefined,
                            avg: typeof value === 'number' ? value: undefined,
                            count2: typeof value2 === 'number' ? 1: typeof value === 'number' ? 1: 0,
                            sum2: typeof value2 === 'number' ? value2: typeof value === 'number' ? value: undefined,
                            min2 : typeof value2 === 'number' ? value2: typeof value === 'number' ? value: undefined,
                            max2 : typeof value2 === 'number' ? value2: typeof value === 'number' ? value: undefined,
                            avg2: typeof value2 === 'number' ? value2: typeof value === 'number' ? value: undefined
                        });
                    }
                }
                emit(key,{statistic:stat});
                // 以hour统计 流量、液位、流速3个指标的流量计  为例 
                // {statistic: [{    //流量
                //      count : 1,
                //      sum : value,
                //      min : value,  
                //      max : value,
                //      avg : value,
                //},{液位},{流速}]}
            };

            o.reduce = function(key, values) {                         //map与reduce的数据结构必须一样，要不然会多次执行reduce
                var stat = [];
                if (values.length > 0){
                    stat = values[0].statistic;
                    for (var idx = 1; idx < values.length; idx++) {       //day : 288; hour : 12
                        for(var i = 0; i < values[idx].statistic.length; i++){      //monitor.indexes.length
                            var item = values[idx].statistic[i];
                            stat[i] = stat[i] || {
                                count: 0,
                                count2: 0
                            };
                            stat[i].count += item.count;
                            stat[i].count2 += item.count2;
                            if (typeof stat[i].sum === 'undefined'){
                                stat[i].sum = item.sum;
                            } else {
                                if (typeof item.sum === 'number') {
                                    stat[i].sum += item.sum;
                                }
                            }
                            if (typeof stat[i].sum2 === 'undefined'){
                                stat[i].sum2 = item.sum2;
                            } else {
                                if (typeof item.sum2 === 'number') {
                                    stat[i].sum2 += item.sum2;
                                }
                            }
                            if (typeof stat[i].sum === 'number'){
                                stat[i].avg = stat[i].sum / stat[i].count;
                            }
                            if (typeof stat[i].sum2 === 'number'){
                                stat[i].avg2 = stat[i].sum2 / stat[i].count2;
                            }
                            if (typeof stat[i].min === 'undefined'){
                                stat[i].min = item.min;
                            } else {
                                if (typeof item.min === 'number') {
                                    if (stat[i].min > item.min){
                                        stat[i].min = item.min;
                                    }
                                }
                            }
                            if (typeof stat[i].min2 === 'undefined'){
                                stat[i].min2 = item.min2;
                            } else {
                                if (typeof item.min2 === 'number') {
                                    if (stat[i].min2 > item.min2){
                                        stat[i].min2 = item.min2;
                                    }
                                }
                            }
                            if (typeof stat[i].max === 'undefined'){
                                stat[i].max = item.max;
                            } else {
                                if (typeof item.max === 'number') {
                                    if (stat[i].max < item.max){
                                        stat[i].max = item.max;
                                    }
                                }
                            }
                            if (typeof stat[i].max2 === 'undefined'){
                                stat[i].max2 = item.max2;
                            } else {
                                if (typeof item.max2 === 'number') {
                                    if (stat[i].max2 < item.max2){
                                        stat[i].max2 = item.max2;
                                    }
                                }
                            }
                        }
                    }
                }
                return { statistic : stat };
                // 以hour统计 流量、液位、流速3个指标的流量计  为例 
                // {statistic: [{    //流量
                //      count : 12,
                //      sum : sum(12),     
                //      min : min(12),  
                //      max : max(12),
                //      avg : avg(12),
                //},{液位},{流速}]}
            };

            MonitorRecord.mapReduce(o,   (err, reduce) => {
                if (err) {
                    callback && callback(err,null);
                } else{
                    const stats = [];
                    if(reduce && reduce.length > 0 ){
                        reduce.forEach( (result) =>{
                            const stat = {
                                monitor : monitor._id,
                                type : type,
                                date : result._id,
                                statistic : result.value.statistic
                            };
                            result.value.statistic.forEach( item => {
                                typeof item.sum === 'number' ? item.sum = Math.round(item.sum * 1000)/1000 : item.sum;
                                typeof item.avg === 'number' ? item.avg = Math.round(item.avg * 1000)/1000 : item.avg;
                                typeof item.sum2 === 'number' ? item.sum2 = Math.round(item.sum2 * 1000)/1000 : item.sum2;
                                typeof item.avg2 === 'number' ? item.avg2 = Math.round(item.avg2 * 1000)/1000 : item.avg2;
                            });
                            stats.push(stat);
                        });
                    }
                    if (stats.length > 0){
                        MonitorStatistic.create(stats, (err, doc) => {
                            if (err) {
                                callback && callback(err,null);
                            }else{
                                this.log(monitor, "消息", " 完成按" + (type? "时" : "天") + "统计(" + stats.length +")");
                                callback && callback(null,{result:true});
                            }
                        });
                    } else{
                        this.log(monitor, "消息", " 完成按" + (type? "时" : "天") + "统计(0)");
                        callback && callback(null,{result:true});
                    }
                }            
            });
        });
    },
    log : function(monitor, level, message){
        const log = {
            monitor: monitor,
            date : moment(),
            level : level,
            type : "数据",
            auto : "自动",
            source : "统计",
            description : message
        };
        MonitorLog.create(log, (err, doc) => { });
    }
}