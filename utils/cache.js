/**
 * Created by Administrator on 2016/7/21 0021.
 */
const { Observable, from, of, interval, timer } = require('rxjs');
const { map, filter, startWith } = require('rxjs/operators');
const moment = require('moment');
const config = require('../config');
const MonitorRecord = require("../models/monitorRecord");
const MonitorIndex = require("../models/monitorIndex");
const Monitor = require("../models/monitor");
const alarm = require('../utils/alarm').event;

//const redis = require('redis');
//const {promisify} = require('util');

module.exports = {
    //client: null,
    now  : [],
    prev : [],
    init :  async function(){
        this.now = await MonitorRecord.aggregate([
            {$match : { date : { $gte : moment().subtract(7, 'days').startOf('day').toDate() } } },
            {$sort: {date: 1} },
            {$group:
                    {
                        _id: "$monitor",
                        lastDate: { $last: "$date" },
                        lastOrigin: { $last: "$origin" },
                        lastModify: { $last: "$modify" }
                    }
            }
        ]);
    },
    all: function() {
        return this.now;
    },
    get: function(key) {
        return this.now.find( obj => obj._id && obj._id.toString() === key );
    },
    update :  function(record) {
        const now_item = this.now.find( obj => obj._id && obj._id.toString() === record.monitor._id.toString() );
        if (now_item) {
            if(moment(record.date).diff(now_item.lastDate) > 0){
                const prev_item = this.prev.find( obj => obj._id && obj._id.toString() === now_item._id.toString() );
                if(prev_item){
                    prev_item.lastOrigin = now_item.lastOrigin;
                    prev_item.lastModify = now_item.lastModify;
                    prev_item.lastDate = now_item.lastDate;
                }else{
                    this.prev.push(Object.assign({},now_item));
                }
                now_item.lastOrigin = record.origin;
                now_item.lastModify = record.modify;
                now_item.lastDate = record.date;
            }
        }else{
            this.now.push({
                _id : record.monitor._id,
                lastOrigin : record.origin,
                lastModify : record.modify,
                lastDate : record.date
            });
        }
    }

    /*init: function() {
        this.client = redis.createClient({ "host": config.redis_connection, "port": config.redis_port });
        this.client.on('connect', async () => {
            const now = await MonitorRecord.aggregate([
                {$match : { date : { $gte : moment().subtract(7, 'days').startOf('day').toDate() } } },
                {$sort: {date: 1} },
                {$group:
                        {
                            _id: "$monitor",
                            lastDate: { $last: "$date" },
                            lastOrigin: { $last: "$origin" },
                            lastModify: { $last: "$modify" }
                        }
                }
            ]);
            now.forEach( item => {
                item._id = item._id.toString();
                this.client.set(item._id, JSON.stringify(item));
            })
        });
    },

    get: async function(key) {
        if (!this.client.connected) return;
        const getAsync = promisify(this.client.get).bind(this.client);
        return await getAsync(key);
    },

    all: async function() {
        if (!this.client.connected) return;
        const keysAsync = promisify(this.client.keys).bind(this.client);
        const mgetAsync = promisify(this.client.mget).bind(this.client);
        const keys = await keysAsync('*');
        const values = keys ? await mgetAsync(keys) : [];
        return values ? values.map( item => JSON.parse(item) ) : [];
    },

    update :  function(record) {
        if (!this.client.connected) return;
        this.client.get(record.monitor._id.toString(), (err, value) => {
            if (value != null) {
                const now_item = JSON.parse(value);
                if(moment(record.date).diff(now_item.lastDate) > 0){
                    now_item.lastOrigin = record.origin;
                    now_item.lastModify = record.modify;
                    now_item.lastDate = record.date;
                }
                this.client.set(record.monitor._id.toString(), JSON.stringify(now_item));
            } else {
                this.client.set(record.monitor._id.toString(), JSON.stringify({
                    _id : record.monitor._id.toString(),
                    lastOrigin : record.origin,
                    lastModify : record.modify,
                    lastDate : record.date
                }));
            }
        });
    }*/

};