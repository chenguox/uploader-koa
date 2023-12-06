const koa = require('koa')

const app = new koa()

app.listen(8888, () => {
  console.log("服务器启动成功~")
})