const mysql = require('mysql');

var host = process.env.DB_HOST;
var port = process.env.DB_PORT;
var user = process.env.DB_USR;
var password = process.env.DB_PWD;
var dbase = process.env.DBASE;
var pool_size = process.env.P_SIZE;

console.log("database: Creating database connection pool: Size: ", pool_size);

const pool = mysql.createPool({
  connectionLimit : pool_size,
  host            : host,
  port            : port,
  user            : user,
  password        : password,
  database        : dbase
});


module.exports.get_pool = function() {
  return pool;
};
