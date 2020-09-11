const moment = require('moment');
const Controller = require('egg').Controller;

class LoginController extends Controller {
  async index() {
    const {phone} = this.ctx.request.body;
    let user = await this.app.mysql.get('user_test', {phone});
    const params = {
        name: 'sara',
        msgcode: 123456,
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
