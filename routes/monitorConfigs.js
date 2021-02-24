var express = require('express');
var router = express.Router();
const comm = require("../utils/comm");
const iotcache = require("../utils/iotcache");

/*
请求示例：{
	"code":"0120040001",
  "config":{"collect_period":60,
  "level_base":0.25
	}
}
*/
router.post('/config/add', (req, res) => {
  comm.createConfigCache(req.body.code, req.body.config);
  res.send("OK");
});

/*
请求示例：{
	"code":"0120040001",
	"params":["monitor_code","send_period","collect_period","level_base"]
}
*/
router.post('/config/req', (req, res) => {
  comm.createReqParamsCache(req.body.code, req.body.params);
  res.send("OK");
});

router.post('/config/params', (req, res) => {
  res.send(cache.getParams(req.body.code));
});

/*
请求示例：{
	"code":"0120040001",
	"update":{"hardv": "0001",
    "softmv": "0101",
    "softav": "0102",
    "server": "",
    "user": "",
    "password": "",
    "url": "139.224.232.57:10000",
    "expire":"2020-04-15 00:00:00"
  }
}
*/
router.post('/config/update', (req, res) => {
  comm.createUpdateCache(req.body.code, req.body.update);
  console.log(iotcache.getUpdate(req.body.code));
  res.send("OK");
});


router.post('/config/pkg', (req, res) => {
  iotcache.addPkg(req.body.code);
  res.send("OK");
});
module.exports = router;
