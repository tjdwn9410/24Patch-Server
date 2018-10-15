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
      res.status(500);
      res.json({
        'msg': 'Server Error'
      })
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


//회원탈퇴
router.delete('/withdrawal', async function(req, res, next) {
  const {
    id
  } = req.body;
  const jwtToken = req.headers['x-access-token'];
  console.log(jwtToken, req.headers,id);
  const isTokenValid = jwtUtil.verifyToken(jwtToken)
  if(isTokenValid.isValid) {
    try {
      const connection = await dbPool.getConnection();
      try {
        const result = await connection.query('DELETE FROM users WHERE id=?', [id]);
        connection.release();
        console.log(result[0].affectedRows);
        if(result[0].affectedRows === 1) {
          res.status(200);
          res.json({
            'msg': 'Success'
          });
        } else {
          res.status(404);
          res.json({
            'msg': 'Can\'t find id'
          });
        }
      } catch (err) {
        connection.release();
        res.status(500);
        res.json({
          'msg': 'Server Error'
        })
      }
    } catch (err) {
      connection.release();
      res.status(500);
      res.json({
        'msg': 'Server Error'
      })
      console.log(err);
    }
  } else {
    res.status(401);
    res.json({
      'msg': 'Invalid Token'
    })
  }
});

module.exports = router;
