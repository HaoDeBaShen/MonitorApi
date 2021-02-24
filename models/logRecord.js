/**
 * Created by sz on 2016/6/27.
 */
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const logRecordSchema = new Schema({
    date: Date,
    content: String,
}, { collection: 'LogRecords' });

const LogRecord = mongoose.model('LogRecord', logRecordSchema);

module.exports = LogRecord;