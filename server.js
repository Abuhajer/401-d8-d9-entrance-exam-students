'use strict';
// -------------------------
// Application Dependencies
// -------------------------
const express = require('express');
const pg = require('pg');
const superagent = require('superagent');
const methodOverride = require('method-override');

// -------------------------
// Environment variables
// -------------------------
require('dotenv').config();
const HP_API_URL = process.env.HP_API_URL;

// -------------------------
// Application Setup
// -------------------------
const app = express();
const PORT = process.env.PORT || 3000;

// Express middleware
// Utilize ExpressJS functionality to parse the body of the request
app.use(express.urlencoded({ extended: true }));

// Application Middleware override
app.use(methodOverride('_method'));

// Specify a directory for static resources
app.use(express.static('./public'));
app.use(express.static('./img'));

// Database Setup

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

// Set the view engine for server-side templating

app.set('view engine', 'ejs');


// ----------------------
// ------- Routes -------
app.get('/home', homePage);
app.post('/house_name/characters', getHouse);
app.post('/addToFav', addToFav);
app.get('/my-characters', myCharters);
app.delete('/character/:id', deleteChar);
app.put('/character/:id', updateChar);
app.get('/character/:id', getChar);

// ----------------------


// --------------------------------
// ---- Pages Routes functions ----
function homePage(req, res) {
  res.render('pages/homePage');
}
//-------
function getHouse(req, res) {
  const houseName = req.body.house;
  const url = `http://hp-api.herokuapp.com/api/characters/house/${houseName}`;
  let house = [];
  superagent.get(url).then((data) => {
    data.body.forEach(element => {
      let charter = new Character(element);
      house.push(charter);
    });

    res.render('pages/Characters', { result: house });
  });
}


// -----------------------------------
// --- CRUD Pages Routes functions ---
//--------------------------------
function addToFav(req, res) {
  const charter = req.body.charter;
  const sqlFav = 'Insert into charters (name,patronus,alive) Values ($1,$2,$3);';
  const safeValues = [charter[0], charter[1], charter[2]];
  client.query(sqlFav, safeValues).then(() => {
  });

  res.redirect('/home');
}
//-----------------------------
function myCharters(req, res) {
  const sqlFavAll = `Select * from charters;`;
  client.query(sqlFavAll).then((data) => {
    res.render('pages/my-characters', { result: data.rows });
  });
}
//-----------------------------
function deleteChar(req, res) {
  const id = req.params.id;
  const sqlDelete=`DELETE FROM charters WHERE id=$1;`;
  client.query(sqlDelete,[id]);
  res.redirect('/my-characters');
}
//------------------------------
function updateChar(req, res) {
  const id = req.params.id;

  const sqlUpdate=`UPDATE charters SET name = $1,patronus = $2 , alive=$3 WHERE id=$4;`;
  const safeValues=[req.body.result[0],req.body.result[1],req.body.result[2],id];
  console.log(safeValues);
  client.query(sqlUpdate,safeValues).then(()=>{
    res.redirect('/my-characters');

  });
}
//---------------------------
function getChar(req,res){
  const id = req.params.id;
  const sqlFavAll = `Select * from charters where id=$1;`;
  client.query(sqlFavAll,[id]).then((data) => {
    res.render('pages/CharterDetails', { element: data.rows[0] });
  });

}
// -----------------------------------

function Character(data) {
  this.name = data.name || 'no name';
  this.patronus = data.patronus || 'no patronus';
  this.alive = data.alive || 'none';
  this.image = data.image || 'https://www.cmsadvocatesug.com/wp-content/uploads/2013/05/Character_Placeholder.png';

}



// Express Runtime
client.connect().then(() => {
  app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
}).catch(error => console.log(`Could not connect to database\n${error}`));


app.use('*',(req,res)=>{
  res.status(404).send('Page Not Found 404');
});
