const moment = require('moment');
const Controller = require('egg').Controller;

class LogController extends Controller {
    async create() {
        const params = this.ctx.request.body;
        const jwtParams = this.ctx.jwtParams;
        const createRule = {
            type: {
                type: 'enum',
                require: true,
                values: [
                    'sign',
                    'holiday',
                    'nosign',
                    'create',
                    'done',
                    'fail',
                    'stop',
                    'delete',
                    'restart',
                    // 下面两个为系统打卡，用户不会提交。
                    'autoHoliday',
                    // 计次功能
                    'count'
                ]
            },
            taskId: {
                type: 'number',
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
        await this.ctx.service.log.validateCreate(params, jwtParams);
    }
    
    async counter() {
        const params = this.ctx.request.body;
        const jwtParams = this.ctx.jwtParams;
        const createRule = {
            taskId: {
                type: 'number',
                require: true
            },
            count: {
                type: 'number',
                require: true,
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
        const flag = await this.ctx.service.log.counter(params, jwtParams);
        this.ctx.body = {
            success: flag,
            errmsg: flag ? '成功' : '服务器错误'
        };
        return;
    }

    async getList() {
        const params = this.ctx.request.body;
        const res = await this.ctx.service.log.getList({
            taskId: params.taskId
        });
        this.ctx.body = {
            success: true,
            errmsg: '',
            data: res
        };
    }
}

module.exports = LogController;
