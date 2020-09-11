const moment = require('moment');
const Controller = require('egg').Controller;
const utils = require('./utils');
const {
    verifyCurrentSign,
    verifyHoliday,
    verifySign
} = utils;

class LogController extends Controller {
    async create() {
        const params = this.ctx.request.body;
        const jwtParams = this.ctx.jwtParams;
        const createRule = {
            remark: {
                type: 'string',
                trim: true
            },
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
        const findDetail = await this.ctx.service.task.detail({
            taskId: params.taskId,
            phone: jwtParams.phone
        });
        if (!findDetail) {
            this.ctx.body = {
                success: false,
                errmsg: '服务器开小差了，没有查询到该任务。'
            };
            return;
        }

        // 判断今天是否打卡
        const {
            currentStatus,
            allDays,
            dayofftaken,
            holidayDays
        } = findDetail;
        const taskCreated = moment(findDetail.taskCreated).startOf('day');
        const currentDate = moment().startOf('day');

        let errmsg = verifyCurrentSign(currentStatus);
        if (errmsg) {
            this.ctx.body = {
                success: false,
                errmsg: errmsg
            };
            return;
        }
        let actions;
        // 如果是休假
        if (params.type === 'holiday' || params.type === 'autoHoliday') {
            actions = verifyHoliday({
                currentStatus,
                allDays,
                dayofftaken,
                holidayDays,
                taskCreated,
                currentDate,
                type: params.type
            });
        }
        // 如果是打卡
        else if (params.type === 'sign') {
            actions = verifySign({
                currentStatus,
                allDays,
                dayofftaken,
                holidayDays,
                taskCreated,
                currentDate,
                type: params.type
            });
        }
        this.ctx.body = actions;
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
    submitService(arr, params, jwtParams) {
        const err = arr.find(item => item.type === 'error');
        if (err) {
            this.ctx.body = {
                success: false,
                errmsg: err.message
            }
        }
        let submits = [];
        const date = moment().add(-1, 'day').endOf().format('YYYY-MM-DD HH:mm:ss');
        for(let i = 0; i < arr.length; i++) {
            switch(arr[i].type) {
                case 'holiday':
                    submits.push(
                        this.ctx.service.log.create({
                            remark: params.remark,
                            type: params.type,
                            checkTime: date,
                            taskId: params.taskId
                        })
                    );
                    break;
                case 'autoHoliday':
                    submits.push(
                        this.ctx.service.log.create({
                            remark: '未打卡，自动休假',
                            type: 'autoHoliday',
                            checkTime: date,
                            taskId: params.taskId
                        })
                    );
                    break;
                case 'sign':
                    submits.push(
                        this.ctx.service.log.create({
                            remark: params.remark,
                            type: params.type,
                            checkTime: date,
                            taskId: params.taskId
                        })
                    );
                    break;
                case 'done':
                    submits.push(
                        this.ctx.service.log.create({
                            remark: '成功',
                            type: 'done',
                            checkTime: date,
                            taskId: params.taskId
                        })
                    );
                    break;
                case 'fail':
                    submits.push(
                        this.ctx.service.log.create({
                            remark: '失败',
                            type: 'fail',
                            checkTime: date,
                            taskId: params.taskId
                        })
                    );
                    break;
                case 'taskDone':
                    submits.push(
                        this.ctx.service.task.edit({
                            phone: jwtParams.phone,
                            taskId: params.taskId,
                            currentStatus: 'done',
                            status: 'success',
                            lastUpdate: date
                        })
                    );
                    break;
                case 'taskFail':
                    submits.push(
                        this.ctx.service.task.edit({
                            phone: jwtParams.phone,
                            taskId: params.taskId,
                            currentStatus: 'done',
                            status: 'fail',
                            lastUpdate: date
                        })
                    );
                    break;
                case 'changeCurrentStatus':
                    submits.push(
                        this.ctx.service.task.create({
                            phone: jwtParams.phone,
                            currentStatus: 'done',
                            taskId: params.taskId,
                            lastUpdate: date
                        })
                    );
                    break;
            }
        }
    }
}

module.exports = LogController;
