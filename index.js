// express 설정
const express = require('express');
const app = express();

//미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static('uploads'));

//시퀄라이즈 설정
const Sequelize = require('sequelize');
const config = require('./config/config.json')[process.env.NODE_ENV || 'development'];
const sequelize = new Sequelize(config.database, config.username, config.password, config);

// 모델 import 및 관계 설정
const user = require('./models/user');
const item = require('./models/item');
const cart = require('./models/cart.js');
user.hasMany(cart, { foreignKey: 'userId' });
cart.belongsTo(user, { foreignKey: 'userId' });
item.hasMany(cart, { foreignKey: 'itemId' });
cart.belongsTo(item, { foreignKey: 'itemId' });

// 세션 설정
const session = require('express-session');
app.use(session({
    secret: 'jwcs',
    resave: false,
    saveUnionitialized: true,
    cookie: { secure: false }
}));

//업로드 설정
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, 'img-' + Date.now())
    }
});
const upload = multer({ storage: storage });

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
    item.findAll({})
        .then(items => {
            res.render('index', { name: req.session.username, items: items });
        })
        .catch(error => {
            res.send('error');
        })
});

//장바구니 추가 설정
app.get('/cart', (req, res) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    if (!req.query.item) {

        res.render('cart', { cartItem: req.session.cart });
        return;
    }
    const cartItem = req.session.cart.find(obj => obj[req.query.item] !== undefined);
    if (cartItem) {
        cartItem[req.query.item] += +1;
    }
    else {
        const newItem = {};
        newItem[req.query.item] = 1;
        req.session.cart.push(newItem);
    }
    res.render('cart', { cartItem: req.session.cart });
    return;
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
                res.send("<script>alert('이미 계정이 있습니다'); location.href='/'</script>");
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
            else {
                res.send("<script>alert('로그인에 실패했습니다!'); location.href='/'</script>")
            }
        })
});

//로그아웃 설정
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.send('err');
        }
        else {
            res.redirect('/');
        }
    })
})

//상품 등록
app.get('/admin', (req, res) => {
    if (req.session.username === 'admin') {
        res.render(__dirname + '/views/admin.ejs');
    }
    else {
        res.send("<script>location.href='/'</script>");
    }
});

app.post('/upload', upload.single('imgPath'), function (req, res) {
    item.create({
        name: req.body.name,
        category: req.body.category,
        imgPath: req.file.path
    })
        .then(success => {
            res.send("<script>alert('등록했습니다'); location.href='/admin';</script>")
        })
        .catch(error => {
            res.send("<script>alert('error'); location.href='/admin'</script>")
        })
});

// 프로그램 동작 설정
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});