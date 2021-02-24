/**
 * Created by sz on 2016/6/27.
 */
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const MonitorIndexSchema = new Schema({
    name :String,
    code :String,
    description : String,
    //单位类型
    //1.流量;2.流速;3.液位
    unit_type: Number,
    //存储单位
    //流量：1.立方米每秒;2.升每秒
    unit : Number,
    //显示单位
    //流量：1.立方米每秒;2.升每秒
    display_unit: Number,
    series_type:String,
    //渲染颜色
    series_color:String

},{ collection: 'monitorIndexs' });

const MonitorIndex = mongoose.model('MonitorIndex', MonitorIndexSchema);

module.exports = MonitorIndex;
