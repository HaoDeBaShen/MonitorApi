const moment = require('moment');
const Monitor = require("../models/monitor");
const byteopt = require("../utils/byteopt");
const monitorindex = require("../configs/monitorindex");
const monitorparam = require("../configs/monitorparam");
const iotcache = require("./iotcache");
const param = require('../configs/param');

module.exports = {
  getRecordArr: async function (code, content) {
    const monitor = await Monitor.findOne({ code: code });
    const starttime = "20" + content.slice(0, 2) + "-" + content.slice(2, 4) + "-" + content.slice(4, 6) + " " + content.slice(6, 8) + ":" + content.slice(8, 10) + ":" + content.slice(10, 12);//起始时间
    const step = parseInt(content.slice(12, 16), 16);//步长，单位：分钟
    const reccnt = parseInt(content.slice(16, 18), 16);//组数
    const idxcnt = parseInt(content.slice(18, 20), 16);//标识符数量
    let result = [];
    for (let i = 0; i < reccnt; i++) {
      const date = moment(moment(starttime).add(step * i, 'minutes')).format('YYYY-MM-DD HH:mm:ss');
      let origin = [];
      for (let j = 0; j < idxcnt; j++) {
        origin.push(byteopt.parseHex2Float(content.slice(20 + 4 * idxcnt + i * idxcnt * 8 + j * 8, 20 + 4 * idxcnt + i * idxcnt * 8 + j * 8 + 8)).toFixed(3));
      }
      //软件版本
      origin.push(parseInt(content.slice(content.length - 24, content.length - 20)));
      //硬件版本
      origin.push(parseInt(content.slice(content.length - 20, content.length - 16)));
      //信号强度
      origin.push(parseInt(content.slice(content.length - 16, content.length - 12), 16));
      //信号质量
      origin.push(parseInt(content.slice(content.length - 12, content.length - 10), 16));
      //信噪比
      origin.push(parseInt(content.slice(content.length - 10, content.length - 6), 16));
      //覆盖等级
      origin.push(parseInt(content.slice(content.length - 6, content.length - 4), 16));
      //电压
      origin.push(parseInt(content.slice(content.length - 4, content.length), 16) / 100);

      const record = {
        monitor: monitor,
        date: date,
        origin: origin,
      };

      result.push(record);
    }
    return result;
  },

  getAlarm: async function (code, content) {
    const monitor = await Monitor.findOne({ code: code });
    const starttime = "20" + content.slice(0, 2) + "-" + content.slice(2, 4) + "-" + content.slice(4, 6) + " " + content.slice(6, 8) + ":" + content.slice(8, 10) + ":" + content.slice(10, 12);//起始时间
    const origin = byteopt.parseHex2Float(content.slice(18, 26)).toFixed(3);
    const index = monitorindex.getIndexForMELVV1(content.slice(14, 18));
    const alarm = {
      start_time: moment(starttime).format('YYYY-MM-DD HH:mm:ss'),
      origin: origin,
      monitor: monitor,
      index: index
    };
    return alarm;
  },

  getParams: function (code, content) {
    let ps = {};
    //递归解包
    this.getFirstParam(ps, content);
    iotcache.addParams(code, ps);
  },

  getFirstParam: function (ps, content) {
    if (content.length > 0) {
      const p = monitorparam.getParamForMELVV1(content.slice(0, 2));
      const p_length = param[p].hex_length;
      ps[p] = monitorparam.getParamValueForMELVV1(content.slice(0, 2), content.slice(2, 2 + p_length * 2));
      this.getFirstParam(ps, content.substr(2 + p_length * 2, content.length));
    }
  },

  getSendBuffer: function (sendmsg) {
    const mmbuf = Buffer.from(sendmsg, 'hex')
    const json = JSON.parse(JSON.stringify(mmbuf)).data;
    const buf = byteopt.createCRC16(json);
    const hi = buf[0], lo = buf[1];
    return Buffer.from(sendmsg + (hi * 0x100 + lo).toString(16).toUpperCase().padStart(4, '0'), 'hex')
  },

  createConfigCache: function (code, configs) {
    let content = "";
    Object.keys(configs).forEach(key => {
      content = content + monitorparam.getFormatForConfigParam(key, configs[key]);
    })

    iotcache.addConfig(code, content);
  },

  createReqParamsCache: function (code, params) {
    let content = "";
    for (var item in params) {
      content = content + param[params[item]].code;
    }
    iotcache.addReqParams(code, content);
  },

  createUpdateCache: function (code, update) {
    //硬件版本，软件主版本，软件副版本
    let content = "01" + update.hardv + update.softmv + update.softav;
    //升级服务器接入点
    if (update.server)
      content = content + Buffer.from(update.server).toString('hex') + "00";
    else
      content = content + "00";
    //升级服务器用户名
    if (update.user)
      content = content + Buffer.from(update.user).toString('hex') + "00";
    else
      content = content + "00";
    //升级服务器密码
    if (update.password)
      content = content + Buffer.from(update.password).toString('hex') + "00";
    else
      content = content + "00";
    //升级服务器URL地址
    content = content + Buffer.from(update.url).toString('hex') + "00";
    //服务器有效期
    content = content + moment(update.expire).format("YYMMDDHHmmss");
    iotcache.addUpdate(code, content);
  }

}
