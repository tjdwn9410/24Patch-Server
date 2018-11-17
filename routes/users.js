var express = require('express');
var router = express.Router();

let jwtUtil = require('../util/jwt_util')
let dbPool = require('../util/db_util')
let formidable = require('formidable');
let util = require('util');
let fs = require('fs-extra');
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
      if (result[0].length === 1) {
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
  console.log(jwtToken, req.headers, id);
  const isTokenValid = jwtUtil.verifyToken(jwtToken)
  if (isTokenValid.isValid) {
    try {
      const connection = await dbPool.getConnection();
      try {
        const result = await connection.query('DELETE FROM users WHERE id=?', [id]);
        connection.release();
        console.log(result[0].affectedRows);
        if (result[0].affectedRows === 1) {
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


router.put('/emergency/add', async function(req, res, next) {
  const {
    id,
    name,
    phoneNumber,
  } = req.body;
  const jwtToken = req.headers['x-access-token'];
  console.log(id, name, phoneNumber);
  const isTokenValid = jwtUtil.verifyToken(jwtToken);
  if (isTokenValid.isValid) {
    try {
      const connection = await dbPool.getConnection();
      try {
        const result = await connection.query('INSERT INTO emergency(user_id, name, phone_number) VALUES(?,?,?)', [id, name, phoneNumber]);
        connection.release();
        if (result) {
          res.status(200);
          res.json({
            'msg': 'Success'
          });
        } else {
          res.status(500);
          res.json({
            'msg': 'Server Error'
          })
          console.log("ERR");
        }
      } catch (err) {
        connection.release();
        res.status(500);
        res.json({
          'msg': 'Server Error'
        })
      }
    } catch (err) {
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

router.delete('/emergency/delete', async function(req, res, next) {
  const {
    id,
    phoneNumber
  } = req.body;
  const jwtToken = req.headers['x-access-token'];
  console.log(jwtToken, req.headers, id);
  const isTokenValid = jwtUtil.verifyToken(jwtToken)
  if (isTokenValid.isValid) {
    try {
      const connection = await dbPool.getConnection();
      try {
        const result = await connection.query('DELETE FROM emergency WHERE user_id =? AND phone_number = ?', [id, phoneNumber]);
        connection.release();
        console.log(result[0].affectedRows);
        if (result[0].affectedRows === 1) {
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


router.get('/emergency/list/:id', async function(req, res, next) {
  const jwtToken = req.headers['x-access-token'];
  const id = req.params.id;
  const isTokenValid = jwtUtil.verifyToken(jwtToken)
  if (isTokenValid.isValid) {
    try {
      const connection = await dbPool.getConnection();
      try {
        const result = await connection.query('SELECT name, phone_number FROM emergency WHERE user_id =?', [id]);
        connection.release();
        let contacts = [];
        for (let i = 0; i < result[0].length; i++) {
          contacts.push({
            'name': result[0][i]['name'],
            'phoneNumber': result[0][i]['phone_number']
          });
        }
        console.log(contacts);
        res.status(200);
        res.json({
          'msg': 'Success',
          'contacts': contacts
        });
      } catch (err) {
        connection.release();
        res.status(500);
        res.json({
          'msg': 'Server Error'
        })
      }
    } catch (err) {
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

router.put('/symptom/add', async function(req, res, next) {
  const {
    id,
    symptoms,
    time,
    type
  } = req.body;
  const jwtToken = req.headers['x-access-token'];
  const isTokenValid = jwtUtil.verifyToken(jwtToken);
  console.log(time);
  if (isTokenValid.isValid) {
    let check = false;
    try {
      const connection = await dbPool.getConnection();
      for (let symptom of symptoms) {
        try {
          const result = await connection.query('INSERT INTO symptoms(user_id, symptom, time,type) VALUES(?,?,?,?)', [id, symptom, time, type]);
        } catch (err) {
          connection.release();
          check = true;
          console.log(err);
          res.status(500);
          res.json({
            'msg': 'Server Error'
          })
        }
      }
    } catch (err) {
      console.log(err);
      check = true;
      res.status(500);
      res.json({
        'msg': 'Server Error'
      })
    }
    if (check == false) {
      res.status(200);
      res.json({
        'msg': 'Success'
      });
    }
  } else {
    res.status(401);
    res.json({
      'msg': 'Invalid Token'
    })
  }
});

router.get('/symptom/list/:id', async function(req, res, next) {
  const id = req.params.id;
  const jwtToken = req.headers['x-access-token'];
  const isTokenValid = jwtUtil.verifyToken(jwtToken)
  if (isTokenValid.isValid) {
    try {
      const connection = await dbPool.getConnection();
      try {
        const result = await connection.query('SELECT time, symptom,type FROM symptoms WHERE user_id = ?', id);

        connection.release();
        let symptom_list = [];
        let dict = {};
        let type = {};
        for (let i = 0; i < result[0].length; i++) {
          console.log(result[0][i]['time']);
          const datetime = result[0][i]['time'].toISOString().replace('T', ' ').substr(0, 19).replace(/-/g, '.');
          console.log(datetime);
          if (!dict[datetime]) {
            dict[datetime] = [];
          }
          dict[datetime].push(result[0][i]['symptom']);
          type[datetime] = result[0][i]['type'];
        }
        for (let key in dict) {
          symptom_list.push({
            'time': key,
            'symptoms': dict[key],
            'type': type[key]
          });
        }
        res.status(200);
        res.json({
          'msg': 'Success',
          'symptom_list': symptom_list
        });
      } catch (err) {
        connection.release();
        console.log(err);
        res.status(500);
        res.json({
          'msg': 'Server Error'
        })
      }
    } catch (err) {
      console.log(err);
      res.status(500);
      res.json({
        'msg': 'Server Error'
      })
    }
  } else {
    res.status(401);
    res.json({
      'msg': 'Invalid Token'
    })
  }
});

router.post('/signal', (req, res, next) => {
  const jwtToken = req.headers['x-access-token'];
  const isTokenValid = jwtUtil.verifyToken(jwtToken);
  if (isTokenValid.isValid) {
    let form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.multiples = true;
    form.uploadDir = '/home/ubuntu/signalus/files/';
    form.on('end', function(fields, files) {});
    form.parse(req, function(err, field, file) {
      console.log(err, field, file.file.path);
      let timeTrans = field.time;
      timeTrans = timeTrans.replace(/\./g, "").replace(/:/g, "").replace(/\s/g, "");
      // console.log(timeTrans);
      // console.log(file.file.path, form.uploadDir +'/' + field['id'] + '/' + timeTrans + "_" + file.name);
      try {
        fs.mkdirSync(form.uploadDir + field['id']);
      } catch (e) {
        console.log(e.code);
        if (e.code != 'EEXIST') throw e; // 존재할경우 패스처리함.
      }
      fs.move(file.file.path, form.uploadDir + field['id'] + '/' + timeTrans + "_" + file.file.name);
      if (!err) {
        res.json({
          'msg': 'success'
        });
      } else {
        res.json({
          'msg': 'upload fail'
        });
      }
    });
  } else {
    res.status(401);
    res.json({
      'msg': 'Invalid Token'
    })
  }
});
module.exports = router;
