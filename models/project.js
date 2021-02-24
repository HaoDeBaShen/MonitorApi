/**
 * Created by Thinkpad on 2015/12/25.
 */
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const ProjectSchema = new Schema({
    //项目名称
    name : String,
    //项目编码
    code : String,
    //项目状态  新建 已完成规划 正在设计 已完成设计 正在施工 已完成施工  移交管养
    status : String,
    //项目位置
    location:String,
    //项目类型 源头、过程、末端、水体
    type : String,
    //地块类型
    landuse  : String,
    targets : [{
        index:String,
        content :String,
        total_volume : Number,
        value : Number
    }]
},{ collection: 'projects' });

const Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;