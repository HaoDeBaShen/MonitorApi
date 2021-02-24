
const mongoose = require('mongoose');
const Schema   = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const AttachmentSchema = new Schema({
    //自动文件名（唯一）
    auto_name:String,
    //原始文件名
    origin_name:String,
    //文件类型
    file_type:String,
    //文件大小
    file_size:String,
    //路径不带文件名
    relative_path:String,
    //上传用户
    author: {
        type : ObjectId,
        ref  : 'User'
    },
    //上传日期
    date:Date
},{ collection: 'attachments' });
const Attachment = mongoose.model('Attachment', AttachmentSchema);

module.exports = Attachment;