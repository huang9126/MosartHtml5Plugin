/**
 * 配置参数页面路由地址
 */
const fs = require('fs');
const path = require('path')
const router = require('koa-router')();

let mosID = 'MOSART.CCTV.MOS';
let mosPlugInID = 'ENPSHTMLHost';
let mosItemBrowserProgID = 'ENPSHTMLHost';
let mosItemEditorProgID = 'ENPSHTMLHost';
let status = true;


router.get('/config', async(ctx, next) => {
	"use strict";
    ctx.body = await getViews('/config')
})

// 返回配置信息
router.get('/getConfig', async(ctx, next) => {
	"use strict";
	if (status) {
		let obj = {
			mosID: mosID,
			mosPlugInID: mosPlugInID,
			mosItemBrowserProgID: mosItemBrowserProgID,
			mosItemEditorProgID: mosItemEditorProgID
		}
		ctx.body = {
			success: 1,
			data: {data: obj},
			error: {}
		}
	} else {
		ctx.body = {
			success: 0,
			data: {},
			error: {code: '0001', msg: '服务状态已关闭，请开启后重试！'}
		};
	}
})

// 设置配置信息
router.post('/setConfig', async(ctx, next) => {
	var query = ctx.request.body;
    console.log(query)
	if (query.mosID) {
		mosID = query.mosID;
		mosPlugInID = query.mosPlugInID;

		mosItemBrowserProgID = query.mosItemBrowserProgID;
		mosItemEditorProgID=query.mosItemEditorProgID;
	}
	ctx.body = {
		success: 1,
		data: {},
		error: {}
	}
})

// 状态改变
router.get('/changeStatus', async (ctx, next) => {
	status = !status;
	ctx.body = {
		success: 1,
		data: {status: status},
		error: {}
	}
})

// 获取改变
router.get('/getStatus', async (ctx, next) => {
	ctx.body = status;
})

/**	
 * 根据请求参数获取页面地址
 * @param  {[type]} page [description]
 * @return {[type]}      [description]
 */
function getViews (page) {
	return new Promise((resolve, reject) => {
		let viewUrl = path.resolve('./') + page + '.html';
		fs.readFile(viewUrl, "binary", (err, data) => {
			if (err) {
				reject(err)
			} else {
				resolve(data)
			}
		})
	});
}

module.exports = router;