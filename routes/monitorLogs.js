/**
 * Created by SDB on 2017-10-13.
 */
const express = require('express');
const router = express.Router();
const MonitorLog = require("../models/monitorLog");
const Monitor = require("../models/monitor");
const moment = require('moment');

router.get('/monitor/:mid/:start/:end', (req, res) => {
    MonitorLog.find().lean()
        .and([{monitor : req.params.mid},{date: {$gte: req.params.start}},{date:{$lte: req.params.end}}])
        .populate([{path:'monitor',select:'name'}])
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

router.post('/create', (req, res) => {
    MonitorLog.create(req.body.log, (err, doc) => {
        if (err) {
            res.status(500);
            res.json(err);
        }
        else{
            res.status(200);
            res.json({
                result : true,
                log  : doc
            });
        }
    });
});

router.post('/:id/update', (req, res) => {
    MonitorLog.findOneAndUpdate({_id: req.params.id}, req.body.log, {new: true},  (err, result) => {
        if (err) {
            res.status(500);
            res.json(err);
        } else {
            res.status(200);
            res.json({result:true});
        }
    });
});

router.get('/:id/remove', (req, res) => {
    MonitorLog.findOneAndRemove({_id: req.params.id},  (err, result) => {
        if (err) {
            res.status(500);
            res.json(err);
        } else {
            res.status(200);
            res.json({result:true});
        }
    });
});

//删除某个监测点的日志
router.get('/log/:mid/:start/:end/remove',  (req, res) => {
    MonitorLog.remove({monitor: req.params.mid, date:{$gte:req.params.start,$lte:req.params.end}},  (err, result) => {
        if (err) {
            res.status(500);
            res.json(err);
        } else {
            res.status(200);
            res.json({result:true});
        }
    });
});

module.exports = router;