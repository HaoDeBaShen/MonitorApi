const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const RainfallStatisticSchema = new Schema({
    //监测点
    monitor : {
        type : ObjectId,
        ref : 'Monitor'
    },
    //名称
    name:String,
    //降雨开始时间
    start : Date,
    //降雨结束时间
    end : Date,
    //降雨量峰值
    rainfall_max :Number,
    //降雨峰值时间
    rainfall_max_time :Date,
    //累计降雨量
    rainfall_sum :Number,
    //降雨时长
    rainfall_time :Number,
    //旱季入流开始时间
    dry_inflow_start:Date,
    //旱季入流结束时间
    dry_inflow_end:Date,
    //产流开始时间
    overflow_start:Date,
    //产流结束时间
    overflow_end:Date,
    //峰值延后时长
    overflow_delay :Number,
    //产流总量
    overflow_sum :Number,
    //产流峰值
    overflow_max :Number,
    //产流峰值时间
    overflow_max_time :Date

},{ collection: 'rainfallStatistics' });

const RainfallStatistic = mongoose.model('RainfallStatistic', RainfallStatisticSchema);

module.exports = RainfallStatistic;