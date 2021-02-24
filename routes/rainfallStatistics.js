const express = require('express');
const router = express.Router();
const RainfallStatistic = require("../models/rainfallStatistic");

router.get('/',  (req, res) => {
    RainfallStatistic.find().lean()
        .populate({path:'monitor'})
        .exec((err,docs) => {
            if (err) {
                res.status(500);
                res.json(err);
            } else {
                res.status(200);
                res.json(docs);
            }
        });
});

router.get('/:id', (req, res)=> {
    RainfallStatistic.find({monitor: req.params.id}).lean()
        .populate({path:'monitor'})
        .exec((err,docs) => {
            if (err) {
                res.status(500);
                res.json(err);
            } else {
                res.status(200);
                res.json(docs);
            }
        });
});

router.get('/monitor/:id/:start/:end',(req, res) => {
    RainfallStatistic.find().lean()
        .and({$or: [{monitor: req.params.id,start:{$gte:req.params.start,$lte:req.params.end}},{monitor: req.params.id,end:{$gte: req.params.start,$lte:req.params.end}}]})
        .populate({path:'monitor'})
        .exec((err,docs) =>{
                if (err) {
                    res.status(500);
                    res.json(err);
                } else {
                    res.status(200);
                    res.json(docs);
                }
            }
        );
});

router.post('/create', (req, res) => {
    RainfallStatistic.create(req.body.rainfall,(err, doc) =>{
        if (err) {
            res.status(500);
            res.json(err);
        }
        else{
            res.status(200);
            res.json({
                result : true,
                doc : doc
            });
        }
    });
});

router.post('/create/many', (req, res) => {
    RainfallStatistic.insertMany(req.body.rainfalls,(err, docs) =>{
        if (err) {
            res.status(500);
            res.json(err);
        }
        else{
            res.status(200);
            res.json({
                result : true,
                docs : docs
            });
        }
    });
});

router.get('/:id/remove', (req, res) => {
    RainfallStatistic.findOneAndRemove({_id: req.params.id}, (err, result) => {
        if (err) {
            res.status(500);
            res.json(err);
        } else {
            res.status(200);
            res.json({result:true});
        }
    });
});

router.get('/:id/:start/:end/remove', (req, res) =>{
    RainfallStatistic.remove({$or: [{monitor: req.params.id,start:{$gte:req.params.start,$lte:req.params.end}},{monitor: req.params.id,end:{$gte:req.params.start,$lte:req.params.end}}]},(err, recs) => {
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