/**
 * Created by sz on 2016/6/27.
 */
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;
//监测点
const MonitorSchema = new Schema({
    //名称
    name :String,
    //编码
    code :String,
    //描述
    description : String,
    //地址
    address : String,
    //类型（流量、雨量、水质）
    type : String,
    //所在分区
    basin : String,
    //是否可用
    enable : Boolean,
    //是否模拟
    emulator : Boolean,
    //模拟器是否启动
    started : Boolean,
    //是否自动采样
    automatic :Boolean,
    //采样间隔
    interval:Number,
    //安装时间
    time:Date,
    //井深
    depth:Number,
    //管径
    diameter:Number,
    //传感器距井底距离
    offset:Number,
    //标注的位置（lt,lb,rt,rb）
    placement:String,
    //监测对象类型（lid、project、river...）
    subject : String,
    project : {
        type : ObjectId,
        ref  : 'Project'
    },
    //布点原则
    principles : [
        String
    ],
    //图片
    pictures : [{
        type : ObjectId,
        ref  : 'Attachment'
    }],
    //下游监测点
    down : {
        type : ObjectId,
        ref  : 'Monitor'
    },
    //坐标位置
    location :{
        x:Number,
        y:Number
    },
    //如果是流量计对应绑定的雨量计
    rain :{
        type : ObjectId,
        ref  : 'Monitor'
    },
    //监测指标
    indexes :[String],
    //指标报警
    alarm: [{
        enabled: Boolean,
        high : Number,
        low : Number,
        //距上次报警 几小时后 重新报警
        hour : Number
    }],
    //缺失值智能检查规则
    missing:{
        enable:Boolean
    },
    //异常值智能检查规则
    abnormal:{
        threshold:{
            enable:Boolean
        },
        truncated:{
            enable:Boolean
        },
        rate:{
            enable:Boolean,
            k:Number
        },
        variance:{
            enable:Boolean
        }
    },
    api: {
        //提供设备商
        provider: String,
        url: String,
        indexes: [String]
    }
},{ collection: 'monitors' });

const Monitor = mongoose.model('Monitor', MonitorSchema);

module.exports = Monitor;
