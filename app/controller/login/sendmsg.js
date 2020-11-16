const moment = require('moment');
const Controller = require('egg').Controller;
const mail = require('../../utils/mail');

class LoginController extends Controller {
  async index() {
    const {user, type} = this.ctx.request.body;
    let person = await this.app.mysql.get('user_test', {user});
    if (type === 'register' && person && person.status == 1) {
        this.ctx.body = {
            success: false,
            errmsg: '该账号已经注册'
        };
        return;
    }
    const random = Math.random();
    let msgCode = Math.floor((random < 0.1 ? 0.1 + random : random) * 1000000);
    let flag = false;
    let userType;
    if (this.ctx.helper.isEmail(user)) {
        userType = 'mail';
        const mailRes = await mail(user, msgCode);
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

    if (this.ctx.helper.isMobile(user)) {
        userType = 'phone'
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
        user: user,
        status: 0,
        msgcode: msgCode,
        msgcodetime: moment().format('YYYY-MM-DD HH:MM:ss')
    };
    let res;
    if (!person) {
        res = await this.app.mysql.insert('user_test', {
            ...params,
            phone: userType === 'phone' ? user : undefined
        });
    } else {
        res = await this.app.mysql.update('user_test', params, {
            where: {
                user
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
