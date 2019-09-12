const router = require('koa-router')();
const fs = require('fs');
const path = require('path')
const parseString = require('xml2js').parseString
const packageJson = require('../../package.json');

// 跳转到主页面
router.get('/', async (ctx, next) => {
	ctx.redirect('/index')
})

// 跳转到主页面
router.get('/index', async(ctx, next) => {
	"use strict";
    ctx.body = await getViews('/index');
})

// 将解析后的xml文件作为json返回
router.get('/getJson',async(ctx, next) => {
    ctx.body = await getTemplateJson();
})

// 将解析后的xml文件作为json返回
router.get('/getAvConfigJson',async(ctx, next) => {
    ctx.body = await getAvconfigJson();
})

// 将解析后的xml文件作为json返回
router.get('/getDefaultTrans',async(ctx, next) => {
    ctx.body = await getDefaultTrans();
})

// 解析xml
async function getTemplateJson () {
	let a2;
	await readTemplateFile().then((data) => {
		parseString(data, { explicitArray : false}, (err, result) => {
			a2 = JSON.stringify(result)
		})
	})
    console.log(a2)
	return a2;
}

// 解析xml
async function getAvconfigJson () {
    let a2;
    await readAvConfigFile().then((data) => {
        parseString(data, { explicitArray : false}, (err, result) => {
            a2 = JSON.stringify(result)
        })
    })
    return a2;
}

// 解析xml
async function getDefaultTrans () {
    let a2;
    await getDefaultTransFile().then((data) => {
        parseString(data, { explicitArray : false}, (err, result) => {
            a2 = JSON.stringify(result)
        })
    })

    return a2;
}

module.exports = router


// 异步获取文件信息
async function readTemplateFile () {
    let urls = '/opt/h5plugin/server/xmls/channeltemplates.xml';
    console.log(urls);
    const a1 = await getXml(urls);
	return a1.toString();
}

// 异步获取文件信息
async function readAvConfigFile () {
    let urls = packageJson.env == "online" ? 'C:/channeltemplates/avconfig.xml' : '/opt/templates/avconfig.xml';
    const a1 = await getXml(urls);
    return a1.toString();
}

// 异步获取文件信息
async function getDefaultTransFile () {
    let urls = './server/xmls/defaultTransitions.xml';
    const a1 = await getXml(urls);
    return a1.toString();
}

/**
 * 读取xml文件
 */
function getXml (urls) {
    return new Promise((resolve, reject) => {
        fs.readFile(path.resolve(urls), (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data)
            }
        })
    });
}

/**
 * 根据请求参数获取页面地址
 * @param  {[type]} page [description]
 * @return {[type]}      [description]
 */
function getViews (page) {
	return new Promise((resolve, reject) => {
		let viewUrl = path.resolve('./') + page + '.html';
		fs.readFile(viewUrl, "UTF-8", (err, data) => {
			if (err) {
				reject(err)
			} else {
				resolve(data)
			}
		})
	});
}