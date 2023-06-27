const Post = require("../models/post");
const User = require("../models/user");
module.exports = class PostService {
  static async create(req, res, next) {
    try {
      const post = await Post.create({
        content: req.body.content,
        userIdx: /*post 모델에서 관계 설정한 foreignKey 컬럼명*/ req.user.id,
        //passport를 통해서 로그인하면 세션 데이터 해석 후 user 정보가 req.user에 담겨서 id값이 생김
      });
      const fullPost = await Post.findOne({
        where: { id: post.id }, //게시글 쓰면 자동으로 id 생성
        include: [
          {
            model: User,
            attributes: ["id", "email", "nickname"],
          },
        ],
      });
      res.status(200).json(fullPost);
    } catch (err) {
      console.error(err);
      next(err); //status 500임
    }
  }
  //----------------------------------------------------------------------

  static async update(req, res, next) {
    try {
      const postId = req.params.postId;
      await Post.update(
        {
          content: req.body.content,
        },
        {
          where: {
            id: postId,
            userIdx: req.user.id,
          },
        }
      );
      res.status(200).json({
        PostId: parseInt(postId, 10), //PostId로 해도 되고 postId로 해도 작동하는 이유?? 리듀서도 마찬가지
        content: req.body.content,
      });
    } catch (err) {
      console.log(err);
      next(err);
    }
  }
  //----------------------------------------------------------------------

  static async readAll(req, res, next) {
    try {
      const posts = await Post.findAll({
        // where: { userIdx: req.uer.id },내 것만 가져오기 *로그인 하면 req.user.id 생김
        limit: 10,
        //  offset: 0, //0~10  0에서 limit 만큼 가져와라
        include: [{ model: User, attributes: ["id", "email", "nickname"] }],
        order: [["createdAt", "DESC"]], //DESC 내림차순 ASC 오름차순
      });
      res.status(200).json(posts);
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
  //----------------------------------------------------------------------

  static async read(req, res, next) {
    try {
      const post = await Post.findOne({
        where: { id: req.params.postId },
      });
      if (!post) {
        return res.status(404).send("존재하지 않는 게시글입니다");
      }
      const fullPost = await Post.findOne({
        where: { id: post.id },
        include: [
          {
            model: User,
            attributes: ["id", "email", "nickname"],
          },
        ],
      });
      res.status(200).json(fullPost);
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
  //----------------------------------------------------------------------

  static async delete(req, res, next) {
    try {
      const postId = req.params.postId;
      await Post.destroy({
        where: {
          id: postId,
          UserIdx: req.user.id,
        },
      });

      res.status(200).json({ PostId: parseInt(postId, 10) });
    } catch (error) {
      console.error(error);
      next(error);
    }
  }
};
