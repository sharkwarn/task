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
                    'autoHoliday'
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
