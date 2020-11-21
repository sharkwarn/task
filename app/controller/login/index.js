const jwt = require('jsonwebtoken');

const Controller = require('egg').Controller;
class LoginController extends Controller {
  async index() {
    const {user, msgcode, password} = this.ctx.request.body;
    const person = await this.app.mysql.get('user_test', {
        user
    });
    if (person && (+person.msgcode === +msgcode || person.password === password)) {
        let token = jwt.sign({
            user,
            userid: person.id,
            name: person.name,
            iat: Date.now(),
            exp: Date.now() + 60 * 60 * 24 * 3 * 1000
        }, 'sara_todo_xiaowu');
        this.ctx.set('token', token);
        this.ctx.body = {
            success: true,
            errmsg: '',
            data: {
                user,
                name: person.name
            }
        };
        await this.app.mysql.update('user_test', {
            status: 1
        }, {
            where: {
                user
            }
        });
    } else if (person && msgcode && +person.msgcode !== +msgcode) {
        this.ctx.body = {
            success: false,
            errmsg: '验证码错误'
        };
    } else if (person && password && person.password !== password) {
        this.ctx.body = {
            success: false,
            errmsg: '账号或密码错误'
        };
    } else {
        this.ctx.body = {
            success: false,
            errmsg: '服务器失败'
        };
    }
    
  }

  async signIn() {
    const {user, password, msgcode} = this.ctx.request.body;
    const person = await this.app.mysql.get('user_test', {user});
    if (person && +person.status === 1) {
        this.ctx.body = {
            success: false,
            errmsg: '该账号已经注册'
        };
        return;
    }
    if (person && +person.msgcode === +msgcode) {
        await this.app.mysql.update('user_test', {
            status: 1,
            password
        }, {
            where: {
                user
            }
        });
        this.ctx.body = {
            success: true,
            errmsg: '',
            data: {
                user,
                name: person.name
            }
        };
    } else if (person && +person.msgcode !== +msgcode) {
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

  async validate() {
    const token = this.ctx.header.token;
    const params = jwt.decode(token, 'sara_todo_xiaowu');
    if (params && +params.exp >= Date.now()) {
        this.ctx.body = {
            success: true
        };
    } else if (params && +params.exp < Date.now()) {
        this.ctx.body = {
            success: false,
            errmsg: '登录过期',
            code: 2
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
