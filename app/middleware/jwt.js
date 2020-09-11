//
// app\middleware\jwt.js
// config 中配置的 ["/sign/in", "/auth/pubkey"] 这个两个接口将不会通过此中间件
//

"use strict";

const jwt = require('jsonwebtoken');

module.exports = () => {
    return async function Interceptor(ctx, next) {
        let reqUrl = ctx.request.url;
        if (reqUrl == "/") {
            await next();
        } else {
            let token = ctx.header.token;
            if (!token || token === 'null') {
                ctx.body = {
                    success: false,
                    errmsg: '未登录'
                };
            } else {
                const params = jwt.decode(token, 'sara_todo_xiaowu');
                if (params && +params.exp >= Date.now()) {
                    ctx.jwtParams = params;
                    await next();
                } else if (params && +params.exp < Date.now()) {
                    ctx.body = {
                        success: false,
                        errmsg: '登录过期'
                    };
                } else {
                    ctx.body = {
                        success: false,
                        errmsg: '未登录'
                    };
                }
            }
            
            
            // 获取header里的authorization
            // if (authToken) {
            //     // 解密获取的Token
            //     const declassified = ctx.helper.login.verifyToken(authToken);
            //     if (!declassified.exp) {
            //         // 从数据库获取用户信息进行 Token 验证
            //         let userInfo = await ctx.model.Internal.User.find({
            //             userName: declassified.username
            //         });

            //         let user = userInfo[0].toObject();

            //         if (user.token === authToken) {
            //             await next();
            //         } else {
            //             ctx.throwBizError("USER_INFO_EXPIRED");
            //         }
            //     } else {
            //         ctx.throwBizError("USER_INFO_EXPIRED");
            //     }
            // } else {
            //     ctx.throwBizError("UNLOGGED");
            // }
        }
    };
};

