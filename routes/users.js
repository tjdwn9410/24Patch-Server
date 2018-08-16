var express = require('express');
var router = express.Router();

let jwtUtil = require('../util/jwt_util')
let dbPool = require('../util/db_util')

// 회원가입
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

// 로그인
router.post('/signin', async function(req, res, next) {
  const {
    id,
    password
  } = req.body;
  try {
    const connection = await dbPool.getConnection();
    try {
      const result = await connection.query('SELECT id FROM users WHERE id=? and password = password(?)', [id, password]);
      connection.release();
      if(result[0].length === 1) {
        const token = jwtUtil.tokenGenerator({
          "id": id
        });
        res.status(200);
        res.json({
          'msg': 'Success',
          'token': token
        });
      } else {
        res.status(401);
        res.json({
          'msg': 'Invalid Id or Password'
        });
      }
    } catch (err) {
      connection.release();
      console.log(err);
    }

  } catch (err) {
    connection.release();
    res.status(500);
    res.json({
      'msg': 'Server Error'
    })
    console.log(err);
  }
});

module.exports = router;
