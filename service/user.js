const bcrypt = require("bcrypt");
const User = require("../models/user");
const passport = require("passport");

module.exports = class UserService {
  static async signUp(req, res, next) {
    try {
      const exUser = await User.findOne({
        where: {
          email: req.body.email,
        },
      });
      if (exUser) {
        return res.status(403).send("이미 사용 중인 이메일입니다.");
      }
      const hashedPassword = await bcrypt.hash(req.body.password, 10); //패스워드 단방향 암호화
      await User.create({
        email: req.body.email,
        nickname: req.body.nickname,
        password: hashedPassword,
      });
      // res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
      res.status(200).send("ok"); //200 성공, 201 잘 생성됨
    } catch (err) {
      console.error(err);
      next(err); //status 500임
    }
  }
  //----------------------------------------------------------------------

  static async logIn(req, res, next) {
    passport.authenticate("local" /*인증 로직*/, (err, user, message) => {
      if (err) {
        console.log(err);
        return next(err);
      }
      if (message) {
        return res.status(401).send(message);
      }

      /*login 실행 함수 , passport에서 주입*/
      return req.login(user, async (loginErr) => {
        if (loginErr) {
          console.error(loginErr);
          return next(loginErr);
        }
        const fullUser = await User.findOne({
          where: { id: user.id },
          //["id", "nickname", "email"], <- 이것만 가져오겠다
          attributes: {
            exclude: ["password"],
          },
        });
        return res.status(200).json(fullUser);
      });
    })(req, res, next); //이걸 써줘야 passport로 전달됨
  }
  //----------------------------------------------------------------------

  static async main(req, res, next) {
    console.log(req.headers); //headers 안에 쿠키 있음
    try {
      if (req.user) {
        const fullUserWithoutPassword = await User.findOne({
          where: { id: req.user.id },
          //attributes : ["id", "nickname", "email"], <- 이것만 가져오겠다
          attributes: {
            exclude: ["password"],
          },
          include: [
            {
              model: Post,
              attributes: ["id"],
            },
            {
              model: User,
              as: "Followings",
              attributes: ["id"],
            },
            {
              model: User,
              as: "Followers",
              attributes: ["id"],
            },
          ],
        });
        res.status(200).json(fullUserWithoutPassword);
      } else {
        res.status(200).json(null);
      }
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
  //----------------------------------------------------------------------

  static async logOut(req, res, next) {
    req.logout();
    req.session.destroy();
    res.send("ok");
  }
};
