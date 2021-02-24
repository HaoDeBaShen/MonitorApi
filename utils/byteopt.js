module.exports = {
  parseHex2Float: function (str) {
    if (str == "ffffffff")
      return -999;
    const buf = Buffer.from(str, "hex");
    return buf.readFloatBE();
  },

  parseHex2Int16: function (str) {
    const buf = Buffer.from(str, "hex");
    return buf.readInt16BE();
  },
  parseHex2Int32: function (str) {
    const buf = Buffer.from(str, "hex");
    return buf.readInt32BE();
  },
  float2FourHex: function (num) {
    const buf = Buffer.allocUnsafe(4);
    buf.writeFloatBE(num, 0);
    return buf.toString('hex')
  },

  int2TwoHex: function (num) {
    const buf = Buffer.allocUnsafe(2);
    buf.writeInt16BE(num, 0);
    return buf.toString('hex')
  },

  int2FourHex: function (num) {
    const buf = Buffer.allocUnsafe(4);
    buf.writeInt32BE(num, 0);
    return buf.toString('hex')
  },

  createCRC16: function (data) {

    if (data.length > 0) {
      let crc = 0xFFFF;
      for (let i = 0; i < data.length; i++) {
        crc = (crc ^ (data[i]));
        for (let j = 0; j < 8; j++) {
          crc = (crc & 1) != 0 ? ((crc >> 1) ^ 0xA001) : (crc >> 1);
        }
      }
      const hi = ((crc & 0xFF00) >> 8);  //高位置
      const lo = (crc & 0x00FF);         //低位置
      return [hi, lo];
    }
    return [0, 0];
  },

  parseHex2FloatAnother: function (str) {
    var float = 0, sign, order, mantiss, exp,
      int = 0, multi = 1;
    if (/^0x/.exec(str)) {
      int = parseInt(str, 16);
    } else {
      for (var i = str.length - 1; i >= 0; i -= 1) {
        if (str.charCodeAt(i) > 255) {
          console.log('Wrong string parametr');
          return false;
        }
        int += str.charCodeAt(i) * multi;
        multi *= 256;
      }
    }
    sign = (int >>> 31) ? -1 : 1;
    exp = (int >>> 23 & 0xff) - 127;
    mantissa = ((int & 0x7fffff) + 0x800000).toString(2);
    for (i = 0; i < mantissa.length; i += 1) {
      float += parseInt(mantissa[i]) ? Math.pow(2, exp) : 0;
      exp--;
    }
    return float * sign;
  }
}
