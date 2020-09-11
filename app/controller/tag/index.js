const moment = require('moment');
const Controller = require('egg').Controller;

class TagController extends Controller {
  async index() {
    const jwtParams = this.ctx.jwtParams;
    const params = this.ctx.request.body;
    this.ctx.body = {
        success: true,
        errmsg: '',
        data: '测试成功'
    };
  }

  async create() {
    const jwtParams = this.ctx.jwtParams;
    const params = this.ctx.request.body;
    const createRule = {
        name: {
            type: 'string',
            require: true
        },
        color: {
            type: 'string',
            require: true
        }
    };
    try {
        this.ctx.validate(createRule);
      } catch (err) {
        this.ctx.logger.warn(err.errors);
        this.ctx.body = {
            success: false,
            errmsg: err.errors
        };
        return;
    }
    const res =  await this.ctx.service.tag.create({
        ...params,
        phone: jwtParams.phone
    });
    if (res === true) {
        this.ctx.body = {
            success: true,
            errmsg: '',
            data: '测试成功'
        };
    } else {
        this.ctx.body = {
            success: false,
            errmsg: ''
        };
    }
  }
  async getList() {
    const jwtParams = this.ctx.jwtParams;
    const res = await this.ctx.service.tag.getList({
        phone: jwtParams.phone
    });
    this.ctx.body = {
        success: true,
        errmsg: '',
        data: res
    };
  }
  async delete() {
    const jwtParams = this.ctx.jwtParams;
    const params = this.ctx.request.body;
    const res = await this.ctx.service.tag.delete({
        phone: jwtParams.phone,
        tagId: params.tagId
    });
    if (res) {
        this.ctx.body = {
            success: true,
            errmsg: ''
        };
    } else {
        this.ctx.body = {
            success: false,
            errmsg: ''
        };
    }
  }
  async edit() {
    const jwtParams = this.ctx.jwtParams;
    const params = this.ctx.request.body;
    const res = await this.ctx.service.tag.edit({
        ...params,
        phone: jwtParams.phone
    });
    if (res) {
        this.ctx.body = {
            success: true,
            errmsg: ''
        };
    } else {
        this.ctx.body = {
            success: false,
            errmsg: ''
        };
    }
  }
}

module.exports = TagController;
