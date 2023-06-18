const postRouter = require("./routes/post");
const userRouter = require("./routes/user");
const express = require("express");
const app = express();
const morgan = require("morgan");
app.set("port", 3075);
const path = require("path");
const session = require("express-session");
const cookieParser = require("cookie-parser"); //middleware
const jwt = require("jsonwebtoken");
const db = require("./models");
const dotenv = require("dotenv");
const passportConfig = require("./passport");
const passport = require("passport");

app.use(
  morgan("dev"), //로그를 찍어줌 ,종류 dev(개발용), combined(배포용), common, short, tiny
  express.json(), //json req.body 데이터 읽는 것 허용
  express.urlencoded({ extended: false }) //url에 있는 정보를 express 내에 있는 해석툴로 읽을 것이냐
  // extended: false (nodeJS에 내장된 qureystring 모듈로 해석)
  // extended: true (추가로 설치하여 외부 해석툴 qs로 해석)
);
//sequelize-----------------------------------
dotenv.config();
db.sequelize
  .sync()
  .then(() => {
    console.log("db 연결 성공");
  })
  .catch(console.error);

//passport--------------------------------------
app.use(passport.initialize());
app.use(passport.session());
passportConfig();
//session------------------------------------
app.use(
  session({
    secret: "node-secret", //암호키 이름
    resave: false, //세션이 값이 똑같으면 다시 저장 안 함
    saveUninitialized: false, //req 메시지가 들어왔을 때 session에 아무런 작업이 이뤄지지 않을 때 상황
    //보통은 false, 만약 true 시 아무 내용이 없는 session 저장될 수 있음
    cookie: {
      httpOnly: true,
      maxAge: 5 * 60000,
    },
  })
);

app.post("/logout", (req, res) => {
  console.log(req.session);
  req.session.destroy(() => {
    console.log("로그아웃이 실행되었습니다");
  });
  res.status(200).send({ message: "success" });
});

//----------------------------------------------
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/", express.static(path.join(__dirname, "public")));
//---------jwt token----------------------------
app.use(cookieParser());

app.post("/jwtsetcookie", (req, res, next) => {
  try {
    const token = jwt.sign(
      { email: req.body.email },
      process.env.SECRET_JWT_TOKEN_KEY
    );

    // res.cookie(
    //   "token" /*cookie의 이름*/,
    //   {
    //     token: req.email,
    //     expired: 5 * 60000, //생명 주기, front한테 요청
    //   },
    //   {
    //     maxAge: 5 * 60000, //생명주기, backend에서 요청
    //     httpOnly: true, //웹 서버에서만 사용 가능
    //     //signed: true, //암호화된 쿠키, cookieParser()안에 암호화 키 등록
    //     secure: false, //https에서만 사용 가능
    //   }
    // );
    res.header("LYH", token);
    res.cookie("access_token", token, { httpOnly: true });
    res.send({ message: "success" });
  } catch (err) {
    console.log(err);
    next(err);
  }
});

app.get("/jwtshowcookie", (req, res) => {
  const token = req.cookies.access_token;
  res.send(token);
  console.log(jwt.verify(token, process.env.SECRET_JWT_TOKEN_KEY)); //verify 복호화키 검사
  console.log(jwt.decode(token)); //decode 복호화 키 없이 해석
  // res.send(req.signedCookies.token); // signed: true 일 때
});

app.post("/clearcookie", (req, res) => {
  res.clearCookie("token");
  res.send({ message: "성공" });
});

app.use("/post", postRouter);
app.use("/user", userRouter);

app.listen(app.get("port"), () => {
  console.log(`${app.get("port")}번으로 서버 실행 중`);
});
