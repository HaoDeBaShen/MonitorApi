const express = require('express');
const router = express.Router();
const moment = require('moment');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const MonitorAlarm = require("../models/monitorAlarm");
const Monitor = require("../models/monitor");
const MonitorIndex = require("../models/monitorIndex");

router.get('/monitor/:mid/:start/:end', (req, res) => {
    MonitorAlarm.find().lean()
        .and([{monitor : req.params.mid},{start_time: {$gte: req.params.start}},{start_time:{$lte: req.params.end}}])
        .sort({start_time : 'desc'})
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

router.get('/latest', (req, res) => {
    MonitorAlarm.aggregate([
        {$match : { start_time : { $gte : moment().subtract(180, 'days').startOf('day').toDate() }}},
        {$sort: {start_time: 1} },
        {$group:
            {
                _id: { monitor: "$monitor", index: "$index" },
                start_time: { $last: "$start_time" },
                end_time: { $last: "$end_time" },
                low: { $last: "$low" },
                high: { $last: "$high" },
                origin: { $last: "$origin" },
                is_deal: { $last: "$is_deal" },
                aid:{$last:"$_id"}
            }
        }
    ]).exec((err, result) => {
        if (err) {
            res.status(500);
            res.json(err);
        } else {
            res.status(200);
            res.json(result);
        }
    });
});

router.get('/monitor/:mid/latest', (req, res) => {
    MonitorAlarm.aggregate([
        {$match : {$and:[{ start_time : { $gte : moment().subtract(180, 'days').startOf('day').toDate() } },{monitor:new ObjectId(req.params.mid)}] }},
        {$sort: {start_time: 1} },
        {$group:
            {
                _id: "$index",
                start_time: { $last: "$start_time" },
                end_time: { $last: "$end_time" },
                low: { $last: "$low" },
                high: { $last: "$high" },
                origin: { $last: "$origin" },
                is_deal: { $last: "$is_deal" },
                aid:{$last:"$_id"}
            }
        }
    ]).exec((err, result) => {
        if (err) {
            res.status(500);
            res.json(err);
        } else {
            res.status(200);
            res.json(result);
        }
    });
});

router.post('/:id/update',  (req, res) => {
    MonitorAlarm.findOneAndUpdate({_id: req.params.id}, req.body.alarm, {new: true},   (err, result) => {
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