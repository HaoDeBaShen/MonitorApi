/**
 * Created by DWUSER on 2016/4/1.
 */
const express = require('express');
const router = express.Router();
const moment = require('moment');
const Monitor = require("../models/monitor");
const Attachment = require("../models/attachment");
const Project = require("../models/project");
const emulator = require('../utils/emulator');
const check = require('../utils/check');

router.get('/',  (req, res) => {
    Monitor.find().lean()
        .populate({path:'rain',select:'name'})
        .populate({path:'down',select:'name'})
        .select('name code type basin subject enable automatic interval location placement rain down indexes alarm')
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

router.get('/:id',  (req, res) => {
    Monitor.findOne({_id: req.params.id}).lean()
        .populate({path:'rain'})
        .populate({path:'down'})
        .populate({path:'pictures'})
        .exec( (err,doc) => {
        if (err) {
            res.status(500);
            res.json(err);
        } else {
            res.status(200);
            res.json(doc);
        }
    });
});

router.get('/project/:id', (req, res, next) => {
    Monitor.find({'project': req.params.id}).lean()
        .populate({path:'project',select:'name'})
        .populate({path:'rain'})
        .populate({path:'down'})
        .exec( (err, docs) =>{
            if (err) {
                res.status(500);
                res.json(err);
            } else {
                res.status(200);
                res.json(docs);
            }
        });
});

router.post('/create',  (req, res) => {
    Monitor.findOne({
        code: req.body.monitor.code,
        type: req.body.monitor.type,
    }).exec( (err,doc) => {
        if (err) {
            res.status(500);
            res.json(err);
            return;
        }
        if (doc) {
            res.status(200);
            res.json({result:false});
            return;
        }
        Monitor.create(req.body.monitor, (err, doc) => {
            if (err) {
                res.status(500);
                res.json(err);
            }
            else{
                res.status(200);
                res.json({
                    result : true,
                    monitor : doc
                });
            }
        });
    });
});

router.get('/:id/remove',  (req, res) => {
    Monitor.findOneAndRemove({_id: req.params.id},  (err, result) => {
        if (err) {
            res.status(500);
            res.json(err);
        } else {
            res.status(200);
            res.json({result:true});
        }
    });
});

router.post('/:id/update',  (req, res) => {
    Monitor.findOneAndUpdate({_id: req.params.id}, req.body.monitor, {new: true},   (err, doc) => {
        if (err) {
            res.status(500);
            res.json(err);
        } else {
            res.status(200);
            res.json({
                result: true,
                doc : doc
            });
        }
    });
});

router.post('/update/alarm', (req,res) => {
    Monitor.findOneAndUpdate({_id : req.body.monitor._id}, { _id : req.body.monitor._id, alarm : req.body.monitor.alarm }, {new: true},   (err, result) => {
        if (err){
            res.status(500);
            res.json(err);
        }else {
            res.status(200);
            res.json({result:true});
        }
    });
});

router.post('/update/check', (req,res) => {
    Monitor.findOneAndUpdate({_id : req.body.monitor._id}, { _id : req.body.monitor._id, missing : req.body.monitor.missing, abnormal : req.body.monitor.abnormal }, {new: true},   (err, result) => {
        if (err){
            res.status(500);
            res.json(err);
        }else {
            let start = moment().subtract(1, 'days').startOf('day');
            let end = moment().subtract(1, 'days').endOf('day');
            check.autoCheckByMonitor(req.body.monitor,start,end);
            res.status(200);
            res.json({result:true});
        }
    });
});
//启动模拟器
router.post('/emulate/start', (req,res) => {
    Monitor.findOneAndUpdate({_id : req.body.monitor._id}, { _id : req.body.monitor._id, emulator : true, started : true }, {new: true},   (err, result) => {
        if (err){
            res.status(500);
            res.json(err);
        }else {
            emulator.start(req.body.monitor);
            res.status(200);
            res.json({result:true});
        }
    });
});
//停止模拟器
router.post('/emulate/stop', (req,res) => {
    Monitor.findOneAndUpdate({_id : req.body.monitor._id}, { _id : req.body.monitor._id, emulator : true, started : false }, {new: true},   (err, result) => {
        if (err){
            res.status(500);
            res.json(err);
        }else {
            emulator.stop(req.body.monitor);
            res.status(200);
            res.json({result:true});
        }
    });
});

module.exports = router;