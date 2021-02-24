/**
 * Created by DWUSER on 2016/4/1.
 */
const express = require('express');
const router = express.Router();

const MonitorLog = require("../models/monitorLog");
const MonitorRecord = require("../models/monitorRecord");
const MonitorIndex = require("../models/monitorIndex");
const Monitor = require("../models/monitor");

const moment = require('moment');
const lodash = require('lodash');
const request = require('request');

const cache = require('../utils/cache');
const check = require('../utils/check');
const collector = require('../utils/collector');
//const logger = require('../utils/log').logger;
const alarm = require('../utils/alarm').event;


//获取最近时间指定数量的数据记录
router.get('/monitor/:id/latest/:number', (req, res) => {
    MonitorRecord.find({monitor : req.params.id}).lean()
        .select('date origin modify -_id')
        .sort({date : 'desc'})
        .limit(parseInt(req.params.number))
        .exec( (err,docs) => {
            if (err) {
                res.status(500);
                res.json(err);
            } else {
                res.status(200);
                res.json(docs);
            }
        });
});

//数据采集 修改数据 需要id
router.get('/collect/:id/:start/:end', (req, res) => {
    MonitorRecord.find().lean()
        .and([{monitor : req.params.id},{date: {$gte: req.params.start}},{date:{$lte: req.params.end}}])
        .select('monitor date origin modify')
        .sort({date : 'asc'})
        .exec( (err,docs) => {
            if (err) {
                res.status(500);
                res.json(err);
            } else {
                res.status(200);
                res.json(docs);
            }
        });
});

//实时数据 按分钟
router.get('/monitor/:id/:start/:end', (req, res) => {
    MonitorRecord.find().lean()
        .and([{monitor : req.params.id},{date: {$gte: req.params.start}},{date:{$lte: req.params.end}}])
	.populate([{path:'monitor', select: "indexes"}])
        .select('monitor date origin modify -_id')
        .sort({date : 'asc'})
        .exec( (err,docs) => {
            if (err) {
                res.status(500);
                res.json(err);
            } else {
                res.status(200);
                res.json(docs);
            }
        });
});

//实时数据 按分钟
router.get('/code/:code/:start/:end?', (req, res) => {
	Monitor.findOne({code: req.params.code}).lean()
	.exec( (err,monitor) => {
		if (err) {
			res.status(500);
			res.json(err);
		} else {
			const start = moment(parseInt(req.params.start));
			const conditions = [{monitor: monitor._id},{date: {$gte: start}}];
			if(req.params.end){
				const end = moment(parseInt(req.params.end));
				conditions.push({date: {$lte: end}})
			}
			MonitorRecord.find({$and:conditions}).lean()
				.populate([{path:'monitor', select: "indexes"}])
				.select('monitor date origin modify -_id')
				.sort({date : 'desc'})
				.exec( (err,docs) => {
					if (err) {
						res.status(500);
						res.json(err);
					} else {
						res.status(200);
						res.json(docs);
					}
				});
		}
	});
});


//实时数据所有设备的最新数据记录
router.get('/monitor/now',  async (req, res) => {
    const now = await cache.all();
    res.status(200);
    res.json( now );
});

//实时数据所有设备的最新数据记录的上一条
/*router.get('/monitor/prev',  (req, res) => {
    res.status(200);
    res.json( cache.prev );
});*/

//人工采样后数据录入，自动采样数据补录
router.post('/create',  (req, res) => {
    MonitorRecord.create(req.body.record, (err, doc) => {
        if (err) {
            res.status(500);
            res.json(err);
        }
        else{
            res.status(200);
            res.json({
                result : true,
                record : doc
            });
        }
    });
});

router.get('/:id/remove',  (req, res) => {
    MonitorRecord.findOneAndRemove({_id: req.params.id}, (err, doc) => {
        if (err) {
            res.status(500);
            res.json(err);
        } else {
            res.status(200);
            res.json({result:true});
        }
    });
});

router.post('/:id/update', (req, res) => {
    MonitorRecord.findOneAndUpdate({_id: req.params.id}, req.body.record, {new: true}, (err, doc) => {
        if (err) {
            res.status(500);
            res.json(err);
        } else {
            res.status(200);
            res.json({result:true});
        }
    });
});

//数据清洗
router.get('/:id/:start/:end/remove',  (req, res) => {
    MonitorRecord.remove({monitor: req.params.id,date:{$gte:req.params.start,$lte:req.params.end}},  (err, result) => {
        if (err) {
            res.status(500);
            res.json(err);
        } else {
            res.status(200);
            res.json({result:true});
        }
    });
});

//数据修复
router.post('/repair', (req, res) => {
    const update_array = [];
    req.body.inserts && req.body.inserts.length>0 && req.body.inserts.forEach( item => {
        const insert_one = {
            insertOne: {
                document: item
            }
        };
        update_array.push(insert_one);
    });
    req.body.updates  && req.body.updates.length>0 && req.body.updates.forEach( item => {
        const update_one = {
            updateOne: {
                filter: { _id: item._id},
                update: item
            }
        };
        update_array.push(update_one);
    });
    MonitorRecord.bulkWrite(update_array).then( result => {
        res.status(200);
        res.json({result:true,count:result.modifiedCount + result.insertedCount});
    });
  
});

//数据抓取(历史数据抓取)
router.get('/:id/:start/:end/fetch',  async (req, res) => {
    const monitor = await Monitor.findOne({_id: req.params.id});
    const start = moment(parseInt(req.params.start));
    const end = moment(parseInt(req.params.end));
    collector.fetch(monitor, start, end).then( result => {
        /*if (result.records.length > 0) {
            alarm.emit('alarm', monitor, result.records[0].origin, result.records[0].date);
        }*/
        delete result.records;
        res.status(200);
        res.json(result);
    }).catch( error => {
        res.status(500);
        res.json(error);
    });
});

//批量获取
router.get('/:start?/batch/fetch',  async (req, res) => {
    Monitor.find().lean().exec((err, monitors) => {
        if (!err) {
            monitors.forEach((item,i) => {
                if (item.enable && item.api && item.api.provider) {
                    const start = req.params.start || moment("2019-05-01");
                    const end = moment();
                    collector.fetch(item, start, end).then( data => console.log( i.toString() + ":  " + item.code + "  " + data.update.toString())).catch();
                }
            });
        }
    });
});

/* 状态码含义:
 * 200: 传输成功
 * 301: 数据记录时间已存在
 * 401  传输数据字段存在空值
 * 402  传输数据对应设备不存在
 * 403  数据记录时间间隔不正确  //
 * 500  服务器内部错误
 * */
//stop service
router.post('/upload',  (req, res) => {
    res.status(200);
    res.json({
        code : 200,
        message : "传输成功",
        result : true
    });
    return;
    //logger.info("start");
    if(!req.body.code || !req.body.date || !req.body.data || req.body.data.length==0){
        //logger.info("传输数据字段存在空值");
        res.status(200);
        res.json({
            code : 401,
            message : "传输数据字段存在空值",
            result: true
        });
    }else{
        Monitor.findOne({code: req.body.code})
            .exec( (err,monitor) => {
                //logger.info("after find monitor");
                if (err) {
                    //logger.info("服务器内部错误:after find monitor");
                    res.status(200);
                    res.json({
                        code : 500,
                        message : "服务器内部错误",
                        result: false,
                        data:req.body
                    });
                }else {
                    if (!monitor || !monitor.indexes || monitor.indexes.length==0){
                        //logger.info("传输数据对应设备不存在: " + req.body.code);
                        res.status(200);
                        res.json({
                            code : 402,
                            message : "传输数据对应设备不存在",
                            result: true,
                            data:req.body
                        });
                    }else{
                        /* const cur_seconds = moment(req.body.date).get('second');
                        const cur_date = cur_seconds>30 ?  moment(req.body.date).add(1,'minute') : moment(req.body.date);
                        cur_date.set("second", 0).set("millisecond", 0);
                        const cur_minutes = cur_date.get('minute');
                        const cur_interval = (monitor && monitor.interval)? monitor.interval:5;
                        if(cur_minutes % cur_interval != 0){
                            logger.info("数据记录时间间隔不正确: " + moment(req.body.date).format("YYYY-MM-DD HH:mm:ss SSS"));
                            res.status(200);
                            res.json({
                                code : 403,
                                message : "数据记录时间间隔不正确",
                                result: true
                            });
                        } else {
                            
                        } */
                        MonitorRecord.findOne({monitor: monitor, date:req.body.date},  (err, doc) => {
                            //logger.info("after check date");
                            if (err) {
                                //logger.info("服务器内部错误:after check date");
                                res.status(200);
                                res.json({
                                    code : 500,
                                    message : "服务器内部错误",
                                    result: false,
                                    data:req.body
                                });
                            } else {
                                if(doc){
                                    log(monitor, "错误", "数据记录时间已存在: " + moment(req.body.date).format("YYYY-MM-DD HH:mm:ss SSS"));
                                    res.status(200);
                                    res.json({
                                        code : 301,
                                        message : "数据记录时间已存在",
                                        result:true,
                                        data:req.body
                                    });
                                }else{
                                    const record = {
                                        monitor: monitor,
                                        date : req.body.date,
                                        origin : [],
                                        modify : []
                                    };
                                    monitor.indexes.forEach(item => {
                                        const obj = req.body.data.find(d => d.name === item);
                                        if (obj && typeof(obj.value) === 'number' && obj.value != -9999){
                                            record.origin.push(obj.value);
                                        }else{
                                            record.origin.push(null);
                                        }
                                    });
                                    
                                    //alarm
                                    alarm.emit('alarm', monitor, record.origin, req.body.date);
                                  
                                    //logger.info("before insert");
                                    MonitorRecord.create(record, (err, doc) => {
                                        //logger.info("after insert");
                                        if (err) {
                                            //logger.info("服务器内部错误:after insert");
                                            res.status(200);
                                            res.json({
                                                code : 500,
                                                message : "服务器内部错误",
                                                result: false,
                                                data:req.body
                                            });
                                        }
                                        else{
                                            cache.update(record);
                                            //logger.info("after update latest");
                                            log(monitor,"消息", "数据接收成功: " + moment(req.body.date).format("YYYY-MM-DD HH:mm:ss SSS"));
                                            res.status(200);
                                            res.json({
                                                code : 200,
                                                message : "传输成功",
                                                result : true,
                                                data:req.body
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    } 
                }
            });

    }
});

function log(monitor, level, message){
    const log = {
        monitor: monitor,
        date : moment(),
        level : level,
        type : "数据",
        auto : "自动",
        source : "采集",
        description : message
    };
    MonitorLog.create(log, (err, doc) => { });
}

module.exports = router;