const express = require('express');
const path = require('path');

const app = express();

app.use(express.static(__dirname+'/dist/my-test-rockwell-dc'));
app.get('/*',function(req,res){
    res.sendFile(path.join(__dirname+'/dist/my-test-rockwell-dc/index.html'));
});

app.listen(process.env.PORT || 4200);