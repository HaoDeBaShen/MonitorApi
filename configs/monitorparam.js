const byteopt = require("../utils/byteopt");
const param = require("./param.json")

module.exports = {
  getFormatForConfigParam: function (p, value) {
    switch (p) {
      case "center_code":
        return param[p].code + value;
      case "monitor_code":
        return param[p].code + value;
      case "monitor_time":
        return param[p].code + moment(value).format("YYMMDDHHmmss");
      case "send_period":
        return param[p].code + byteopt.int2TwoHex(value);
      case "collect_period":
        return param[p].code + byteopt.int2FourHex(value);
      case "level_base":
        return param[p].code + byteopt.int2FourHex(Math.round(value * 1000));
      case "alarm_level":
        return param[p].code + byteopt.int2FourHex(Math.round(value * 1000));
      case "danger_level":
        return param[p].code + byteopt.int2FourHex(Math.round(value * 1000));
      case "alarm_quantity":
        return param[p].code + byteopt.int2FourHex(Math.round(value * 1000));
      case "alarm_velocity":
        return param[p].code + byteopt.int2FourHex(Math.round(value * 1000));
      case "bluetooth":
        return param[p].code + value;
    }
  },
  getParamForMELVV1: function (paramcode) {
    switch (paramcode) {
      case "01":
        return "center_code";
      case "02":
        return "monitor_code";
      case "03":
        return "monitor_time";
      case "04":
        return "send_period";
      case "05":
        return "collect_period";
      case "06":
        return "level_base";
      case "07":
        return "alarm_level";
      case "08":
        return "danger_level";
      case "09":
        return "alarm_quantity";
      case "0a":
        return "alarm_velocity";
      case "0b":
        return "bluetooth";
      default:
        return "na";
    }
  },
  getParamValueForMELVV1: function (paramcode, value) {
    switch (paramcode) {
      case "04":
        return byteopt.parseHex2Int16(value);
      case "05":
        return byteopt.parseHex2Int32(value);
      case "06":
        return byteopt.parseHex2Int32(value) / 1000;
      case "07":
        return byteopt.parseHex2Int32(value) / 1000;
      case "08":
        return byteopt.parseHex2Int32(value) / 1000;
      case "09":
        return byteopt.parseHex2Int32(value) / 1000;
      case "0a":
        return byteopt.parseHex2Int32(value) / 1000;
      default:
        return value;
    }
  },
}