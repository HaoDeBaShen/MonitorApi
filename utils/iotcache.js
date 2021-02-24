const iotcache = {};             // (key,value); key: monitor.code; value: configstr

module.exports.init = function () {
    this.iotcache = {};
};

module.exports.addConfig = function (code, config) {
    iotcache[code] = config;
};

module.exports.getConfig = function (code) {
    return iotcache[code];
};

module.exports.removeConfig = function (code) {
    delete iotcache[code];
};

module.exports.addReqParams = function (code, req) {
    iotcache[code + 'req'] = req;
};

module.exports.getReqParams = function (code) {
    return iotcache[code + 'req'];
};

module.exports.removeReqParams = function (code) {
    delete iotcache[code + 'req'];
};

module.exports.addParams = function (code, params) {
    iotcache[code + 'params'] = params;
};

module.exports.getParams = function (code) {
    return iotcache[code + 'params'];
};

module.exports.addUpdate = function (code, req) {
    iotcache[code + 'update'] = req;
};

module.exports.getUpdate = function (code) {
    return iotcache[code + 'update'];
};

module.exports.removeUpdate = function (code) {
    delete iotcache[code + 'update'];
};

module.exports.addPkg = function (code) {
    iotcache[code + 'pkg'] = true;
};

module.exports.getPkg = function (code) {
    return iotcache[code + 'pkg'];
};

module.exports.removePkg = function (code) {
    delete iotcache[code + 'pkg'];
};
