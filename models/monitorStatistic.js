/**
 * Created by sz on 2016/6/27.
 */
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const MonitorStatisticSchema = new Schema({
    monitor : {
        type : ObjectId,
        ref : 'Monitor'
    },
    //hourly 1  daily 0
    type : Number,
    date : Date,
    statistic : [{
        count : Number,
        count2 : Number,
        min :Number,
        min2 :Number,
        max : Number,
        max2 : Number,
        sum : Number,
        sum2 : Number,
        avg : Number,
        avg2 : Number
    }]

},{ collection: 'monitorStatistics' });

const MonitorStatistic = mongoose.model('MonitorStatistic', MonitorStatisticSchema);

module.exports = MonitorStatistic;