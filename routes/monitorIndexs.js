/**
 * Created by DWUSER on 2016/4/1.
 */
const express = require('express');
const router = express.Router();
const MonitorIndex = require("../models/monitorIndex");
const moment = require('moment');

router.get('/',  (req, res) => {
    MonitorIndex.find().lean()
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
    MonitorIndex.findOne({_id: req.params.id}).lean()
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

router.post('/create',  (req, res) => {
    MonitorIndex.findOne({
        name: req.body.index.name
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
        MonitorIndex.create(req.body.index, (err, doc) => {
            if (err) {
                res.status(500);
                res.json(err);
            }
            else{
                res.status(200);
                res.json({
                    return : true,
                    index : doc
                });
            }
        });
    });
});

router.get('/:id/remove',  (req, res) => {
    MonitorIndex.findOneAndRemove({_id: req.params.id},  (err, result) => {
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
    MonitorIndex.findOneAndUpdate({_id: req.params.id}, req.body.index, {new: true},   (err, result) => {
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