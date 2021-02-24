const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Jimp = require("jimp");
const multer  = require('multer');
//var soap = require('soap');
/* GET home page. */
router.get('/',  (req, res) => {
  res.render('index', { title: 'Express' });
});

const file_path = path.join(path.join(path.dirname(__dirname), 'public'),'files');

if (!fs.existsSync(file_path)){
    fs.mkdirSync(file_path);
}
const photo_path = path.join(file_path,'photos');
const photo_upload = multer({ dest: photo_path });

const photo_thumbs_path = path.join(photo_path,'thumbs');
if (!fs.existsSync(photo_thumbs_path)){
    fs.mkdirSync(photo_thumbs_path);
}

router.post('/upload',photo_upload.array('file'),  (req, res) => {
    const out_path = [];
    req.files.forEach( file => {
        const origin_path = file.path;
        const ext = path.extname(file.originalname);
        fs.renameSync(origin_path, origin_path + ext);
        if (ext === '.jpg' || ext === '.png' || ext === '.bmp' || ext === '.jpeg') {
            const thumb_path = path.join(photo_thumbs_path, path.basename(file.path) + ext);
            out_path.push({
                original_name: file.originalname,
                auto_name: path.basename(file.path) + ext,
                file_type: 'image'
            });
            Jimp.read(origin_path + ext).then(  (image) => {
                image.resize(Jimp.AUTO, 200)
                    .quality(50)
                    .write(thumb_path);
            }).catch(  (err) => {
                console.error(err);
            });
        } else {
            out_path.push({
                original_name: file.originalname,
                auto_name: path.basename(file.path) + ext,
                file_type: ext
            });
        }
    });
    res.status(200);
    res.json({
        result: true,
        paths : out_path
    });
});

router.get('/load/json', (req, res, next) => {
    const file = path.join(path.join(path.dirname(__dirname), 'configs'), 'monitor.json');
    fs.readFile(file, 'utf8', (err,data) => {
        if(err){
            res.status(404);
            res.json("NO FILE");
        }else{
            res.status(200);
            res.json(data);
        }
    });
});

router.post('/save/json', (req, res, next) => {
    const file = path.join(path.join(path.dirname(__dirname), 'configs'), 'monitor.json');
    fs.writeFile(file, req.body.json, (err) => {
        if (err) {
            res.status(500);
            res.json({
                result : false
            });
        }else{
            res.status(200);
            res.json({
                result : true
            });
        }
    });
});

/*router.get('/test',  (req, res) => {
    var url = 'http://www.thuwater.com/dataservice/datafetch.asmx?wsdl';
    var args = {userName: 'data20190022', passwd: 'data20190022lflc0823', equipID: '1990023'};
    soap.createClient(url, function(err, client) {
        client.GetRealData(args, function(err, result) {
            res.status(200);
            res.json(JSON.parse(result.GetRealDataResult));
        });
    });
});*/

module.exports = router;
