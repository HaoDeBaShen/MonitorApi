var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var monitorsRouter = require('./routes/monitors');
var monitorIndexsRouter = require('./routes/monitorIndexs');
var monitorRecordsRouter = require('./routes/monitorRecords');
var monitorLogsRouter = require('./routes/monitorLogs');
var monitorStatisticsRouter = require('./routes/monitorStatistics');
var rainfallStatisticsRouter = require('./routes/rainfallStatistics');
var monitorAlarmsRouter = require('./routes/monitorAlarms');
var configsRouter = require('./routes/monitorConfigs');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.all('*', function (req, res, next) {
  //res.header("Access-Control-Allow-Origin", "http://localhost:9999");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
  res.header("X-Powered-By", ' 3.2.1');
  //res.header("Content-Type", "application/json;charset=utf-8");
  next();
});

app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'configs')));

app.use('/', indexRouter);
app.use('/monitors', monitorsRouter);
app.use('/monitorIndexs', monitorIndexsRouter);
app.use('/monitorRecords', monitorRecordsRouter);
app.use('/monitorLogs', monitorLogsRouter);
app.use('/monitorStatistics', monitorStatisticsRouter);
app.use('/rainfallStatistics', rainfallStatisticsRouter);
app.use('/monitorAlarms', monitorAlarmsRouter);
app.use('/monitorConfig', configsRouter);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
