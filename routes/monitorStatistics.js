/**
 * Created by DWUSER on 2016/4/1.
 */
const express = require('express');
const router = express.Router();
const MonitorStatistic = require("../models/monitorStatistic");
const Monitor = require("../models/monitor");
const statistic = require("../utils/statistic");

//1按小时，0按天
router.get('/monitor/:id/:type/:start/:end',  (req, res) => {
    MonitorStatistic.find().lean()
        .and([{monitor : req.params.id},{type : req.params.type},{date: {$gte: req.params.start}},{date:{$lte: req.params.end}}])
        .select('date statistic -_id')
        .sort({date : 'asc'})
        .exec( (err,docs) =>{
            if (err) {
                res.status(500);
                res.json(err);
            } else {
                res.status(200);
                res.json(docs);
            }
        });
});

//所有监测点全部统计
router.get('/calc/:start/:end',  (req, res) => {
    Monitor.find().lean()
        .exec( (err,docs) => {
            if (err) {
                res.status(500);
                res.json(err);
            } else {
                docs.forEach(item => {
                    statistic.calc(item, 0, parseInt(req.params.start), parseInt(req.params.end), (err, result) => {});
                    statistic.calc(item, 1, parseInt(req.params.start), parseInt(req.params.end), (err, result) => {});
                });
                res.status(200);
                res.json({result:true});
            }
        });
});

router.get('/calc/:id/:type/:start/:end',  (req, res) => {
    const monitor = {
        //_id : "5799c424b766e59b9d1e75e1"
        _id : req.params.id
    };
    statistic.calc(monitor, parseInt(req.params.type), parseInt(req.params.start), parseInt(req.params.end), (err, result)=> {
        if (err){
            res.status(500);
            res.json(err);
        }else{
            res.status(200);
            res.json({result:true});
        }
    });
});

//删除某段时间的统计结果
router.get('/:id/:start/:end/remove',  (req, res) => {
    MonitorStatistic.remove({monitor: req.params.id,date:{$gte:req.params.start,$lte:req.params.end}}, (err, result) => {
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