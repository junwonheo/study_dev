// express 설정
const express = require('express');
const app = express();
//미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//시퀄라이즈 설정
const Sequelize = require('sequelize');
const config = require('./config/config.json')[process.env.NODE_ENV || 'development'];
const sequelize = new Sequelize(config.database, config.username, config.password, config);
// 모델 import
const user = require('./models/user');
// 세션 설정
const session = require('express-session');
app.use(session({
    secret: 'jwcs',
    resave: false,
    saveUnionitialized: true,
    cookie: { secure: false }
}));
//뷰 엔진 설정
app.set('view engine', 'ejs');

//데이터베이스 연결
sequelize.sync({ force: false })
    .then(() => {
        console.log('데이터베이스 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    });

//인덱스 페이지 설정
app.get('/', (req, res) => {
    res.render('index', { name: req.session.username });
});

//회원가입 페이지 설정
app.get('/signup', (req, res) => {
    res.render('signup', { name: req.session.username });
});

app.post('/signup', (req, res) => {
    user.findOne({
        where: {
            username: req.body.username,
        },
    })
        .then(alreadyAccount => {
            if (alreadyAccount) {
                res.send('이미 계정이 있습니다');
            }
            else {
                user.create({
                    name: req.body.name,
                    username: req.body.username,
                    password: req.body.password,
                    address: req.body.address,
                    phone: req.body.phone
                })
                    .then(success => {
                        res.redirect('/login');
                    })
                    .catch(error => {
                        res.send('error');
                    })
            }
        });
});

//로그인 페이지 설정
app.get('/login', (req, res) => {
    res.render('login', { name: req.session.username });
});

app.post('/login', (req, res) => {
    user.findOne({
        where: {
            username: req.body.username,
            password: req.body.password
        }
    })
        .then(success => {
            if (success) {
                req.session.username = req.body.username;
                res.redirect('/');
            }
        })
});

//

// 프로그램 동작 설정
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});