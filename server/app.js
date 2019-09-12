const Koa = require('koa')
const loggerAsync  = require('./middleware/logger-async')		// 打印请求的demo中间件
const app = new Koa()
const fs = require('fs');
const path = require('path')
const static = require('koa-static')
const koaBody = require('koa-body')
const Router = require('koa-router')  //路由依赖的中间间
const bodyParser = require('koa-bodyparser')  //请求体，返回体解析类似json，text，图片等

app.use(loggerAsync())
app.use(koaBody())          // 必须先应用
app.use(bodyParser())

// 静态资源目录对于相对入口文件index.js的路径
const staticPath = './static'
app.use(static(
    path.join( path.resolve('./'))
))


app.use(require('./router/index').routes())
app.use(require('./router/configPage').routes())


app.listen(3000)
console.log('server is starting at port 3000')