const moment = require('moment');
const Controller = require('egg').Controller;
const mail = require('../../utils/mail');

class LoginController extends Controller {
  async index() {
    const {phone} = this.ctx.request.body;
    let user = await this.app.mysql.get('user_test', {phone});
    const random = Math.random();
    let msgCode = Math.floor((random < 0.1 ? 0.1 + random : random) * 1000000);
    let flag = false;
    if (this.ctx.helper.isEmail(phone)) {
        const mailRes = await mail('568469228@qq.com', msgCode);
        if (!mailRes) {
            this.ctx.body = {
                success: false,
                errmsg: '',
                data: '验证码发送失败'
            };
            return;
        }
        flag = true;
    }

    if (this.ctx.helper.isMobile(phone)) {
        msgCode = 123456;
        flag = true;
    }
    if (flag === false) {
        this.ctx.body = {
            success: false,
            errmsg: '',
            data: '验证码发送失败，填写的手机号或者邮箱格式不对'
        };
        return;
    }
    const params = {
        name: 'sara',
        msgcode: msgCode,
        msgcodetime: moment().format('YYYY-MM-DD HH:MM:ss')
    };
    let res;
    if (!user) {
        res = await this.app.mysql.insert('user_test', {
            ...params,
            phone
        });
    } else {
        res = await this.app.mysql.update('user_test', params, {
            where: {
                phone
            }
        });
    }
    if (res && res.affectedRows === 1) {
        this.ctx.body = {
            success: true,
            errmsg: '',
            data: '验证码发送成功'
        };
    } else {
        this.ctx.body = {
            success: false,
            errmsg: '',
            data: '验证码发送失败'
        };
    }
  }
}

module.exports = LoginController;
