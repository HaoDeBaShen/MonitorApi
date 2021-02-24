const moment = require('moment');
const Monitor = require("../models/monitor");
const MonitorRecord = require("../models/monitorRecord");
const MonitorLog = require("../models/monitorLog");
const MonitorAlarm = require("../models/monitorAlarm");

module.exports = {
  addMonitor: function (name, code, indexes) {
    const monitor = {
      name: name,
      code: code,
      indexes: indexes,
    };
    Monitor.create(monitor, (err, doc) => {
    });
  },

  saveMonitorRecords: function (records) {
    MonitorRecord.insertMany(records);
  },

  addMonitorAlarm: function (alarm) {
    MonitorAlarm.create(alarm, (err, doc) => {
    });
  },

  log: async function (code, level, message, source) {
    const monitor = await Monitor.findOne({ code: code });
    const log = {
      monitor: monitor,
      date: moment(),
      level: level,
      type: "数据",
      auto: "自动",
      source: source,
      description: message
    };
    MonitorLog.create(log, (err, doc) => {
    });
  }
}
