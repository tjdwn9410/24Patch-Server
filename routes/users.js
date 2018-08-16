var express = require('express');
var router = express.Router();

let jwtUtil = require('../util/jwt_util')
let dbPool = require('../util/db_util')
/* GET home page. */

router.post('/signup', async function(req, res, next) {
  const {
    id,
    password,
    age,
    gender,
    height,
    weight
  } = req.body;
  try {
    const connection = await dbPool.getConnection();
    try {
      const result = await connection.query('INSERT INTO users(id, password, age, gender, height, weight) VALUES(?,password(?),?,?,?,?)', [id, password, age, gender, height, weight]);
      connection.release();
      const token = jwtUtil.tokenGenerator({
        "id": id
      });
      res.status(200);
      res.json({
        'msg': 'Success',
        'token': token
      });
    } catch (err) {
      connection.release();
      if (err.code === 'ER_DUP_ENTRY') {
        res.status(409);
        res.json({
          'msg': 'Duplicated Id'
        })
      } else {}
    }

  } catch (err) {
    connection.release();
    res.status(500);
    res.json({
      'msg': 'Server Error'
    })
  }
});
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
