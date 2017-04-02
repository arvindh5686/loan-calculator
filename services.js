const express = require('express');
const app = express();
const port = 8000;
const fn = require('./index');

app.post('/facility/add', fn.addNewFacility);
app.put('/loan/assign', fn.assignLoan);
//app.get('/facility', fn.getFacilitiesInfo);

app.listen(port);
