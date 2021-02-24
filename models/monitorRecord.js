/**
 * Created by sz on 2016/6/27.
 */
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const MonitorRecordSchema = new Schema({
    monitor : {
        type : ObjectId,
        ref : 'Monitor'
    },
    date : Date,
    origin : [Number],
    modify : [Number]
},{ collection: 'monitorRecords' });

const MonitorRecord = mongoose.model('MonitorRecord', MonitorRecordSchema);

module.exports = MonitorRecord;