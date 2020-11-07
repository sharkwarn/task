const jwt = require('jsonwebtoken');

const Controller = require('egg').Controller;
class LoginController extends Controller {
  async index() {

    const {phone, msgcode} = this.ctx.request.body;
    const user = await this.app.mysql.get('user_test', {phone});
    if (user && +user.msgcode === +msgcode) {
        let token = jwt.sign({
            phone,
            name: user.name,
            iat: Date.now(),
            exp: Date.now() + 60 * 60 * 24 * 3 * 1000
        }, 'sara_todo_xiaowu');
        this.ctx.set('token', token);
        this.ctx.body = {
            success: true,
            errmsg: '',
            data: {
                phone,
                name: user.name
            }
        };
    } else if (user && +user.msgcode !== +msgcode) {
        this.ctx.body = {
            success: false,
            errmsg: '验证码错误'
        };
    } else {
        this.ctx.body = {
            success: false,
            errmsg: '服务器失败'
        };
    }
    
  }

  async signIn() {
    const token = this.ctx.header.token;
    const params = jwt.decode(token, 'sara_todo_xiaowu');
    const {phone} = this.ctx.request.body;
  }

  async validate() {
    const token = this.ctx.header.token;
    const params = jwt.decode(token, 'sara_todo_xiaowu');
    const {phone} = this.ctx.request.body;
    if (params && +params.exp >= Date.now()) {
        this.ctx.body = {
            success: true
        };
    } else if (params && +params.exp < Date.now()) {
        this.ctx.body = {
            success: false,
            errmsg: '登录过期'
        };
    } else {
        this.ctx.body = {
            success: false,
            errmsg: '未登录'
        };
    }
  }

  async testLogin() {
    this.ctx.body = {
        success: true,
        errmsg: '',
        data: '成功'
    };
  }
}

module.exports = LoginController;
