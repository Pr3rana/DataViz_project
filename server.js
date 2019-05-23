const express = require('express');
const app = express();
var path=require('path');
const port = process.env.PORT || 8080

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
});
app.use(express.static(__dirname));
console.log(__dirname);
app.listen(8080, () => console.log('DataViz app is listening on port '+port+"!"));