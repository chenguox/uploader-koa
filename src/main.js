const koa = require("koa");
const multer = require("@koa/multer");
const Router = require("@koa/router");
const cors = require("koa2-cors");
const Views = require("koa-views");
const Static = require("koa-static");
const bodyParser = require("koa-bodyparser");
const path = require("path");
const fs = require("fs");
const fse = require("fs-extra");
const { mergeChunk } = require("./utils/mergeChunk");

const app = new koa();
app.use(bodyParser());

// 配置处理跨域
app.use(
  cors({
    origin: function (ctx) {
      //设置允许来自指定域名请求
      if (ctx.url === "/test") {
        return "*"; // 允许来自所有域名请求
      }
      return "http://localhost:8000"; //只允许http://localhost:8080这个域名的请求
    },
    maxAge: 5, //指定本次预检请求的有效期，单位为秒。
    credentials: true, //是否允许发送Cookie
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], //设置所允许的HTTP请求方法
    allowHeaders: ["Content-Type", "Authorization", "Accept"], //设置服务器支持的所有头信息字段
    exposeHeaders: ["WWW-Authenticate", "Server-Authorization"], //设置获取其他自定义字段
  })
);

// const storage = multer.diskStorage({
//   // 存储路径
//   destination: (req, flie, cb) => {
//     // cb: (error: Error | null, destination: string)
//     //  - 通过将鼠标放入 cb 上，会出现一个提示，传入两个参数
//     //    - 参数一：传入一个错误
//     //    - 参数二：传入存储路径
//     cb(null, "./uploads");
//   },
//   filename: (req, file, cb) => {
//     // path.extname() 方法获取文件后缀名
//     //  - originalname	用户计算机上的文件的名称
//     // 为了保证名称的唯一性，可以使用时间戳作为文件名称
//     // path.extname() 可以获取一个文件的后缀名
//     console.log("file:", req.headers);
//     cb(null, file.fieldname);
//   },
// });

const upload = multer();

const uploadRouter = new Router({
  prefix: "/upload",
});

// 请求文件上传页面
uploadRouter.get("/", async (ctx) => {
  await ctx.render("index.html");
});

// 上传文件请求
uploadRouter.post("/", upload.single("chunk"), (ctx, next) => {
  // console.log('ctx.request.file', ctx.request.file);
  // console.log('ctx.file', ctx.file);
  // console.log('ctx.request.body', ctx.request.body);

  const chunk = ctx.file.buffer;
  const filename = ctx.request.body.filename;

  // 创建 uploads 文件夹
  const uploadDir = path.join(__dirname, '../uploads')
  console.log('uploadDir:',uploadDir)
  if (!fse.existsSync(uploadDir)) {
    fse.mkdirSync(uploadDir);
  }
  const writeStream = fs.createWriteStream(`./uploads/${filename}`);
  writeStream.end(chunk);

  ctx.body = "done";
});

uploadRouter.post("/merge", async (ctx) => {
  // console.log(ctx);
  const { fileName, size } = ctx.request.body;
  hasMergeChunk = {};
  // 文件合并后的路径
  // const mergePath = `${__dirname}/merge/${fileName}`;
  const mergeDir = path.join(__dirname, `../merge`)
  const mergePath = path.join(mergeDir, `${fileName}`)
  console.log("mergePath:", mergeDir, mergePath);
  // 没有就先创建
  if (!fse.existsSync(mergeDir)) {
    fse.mkdirSync(mergeDir);
  }
  // 开始合并分片
  await mergeChunk(mergePath, fileName, size);
  ctx.body = {
    data: "成功",
  };
});

// 多文件上传
// uploadRouter.post("/multer", upload.fields([{
//   name: 'file'
// }]))

app.use(Views(__dirname));
app.use(Static(__dirname));
// 加载uploadRouter路由
app.use(uploadRouter.routes());
app.use(uploadRouter.allowedMethods());

app.listen(8888, () => {
  console.log("服务器启动成功~");
});
