const Service = require('egg').Service;
const moment = require('moment');
const utils = require('./utils');
const {
    verifyCurrentSign,
    verifyHoliday,
    verifySign
} = utils;

class LogService extends Service {
    async create(params) {
        let res = await this.app.mysql.insert('user_test_log', params);
        const len = Array.isArray(params) ? params.length : 1;
        if (res && res.affectedRows === len) {
            return true;
        } else {
            return false;
        }
    }

    async counter(params, jwtParams) {
        let day = moment();
        let res = await this.app.mysql.query(`
        select
        *
        from user_test_log
        where taskId = ?
        and type = 'counter'
        and changetime = ?  
        `, [params.taskId, `${day.format('YYYY-MM-DD')}`]);

        let flag = false;
        if (res && res.length === 0) {
            const obj = {
                type: 'counter',
                taskId: +params.taskId,
                checkTime: day.format('YYYY-MM-DD HH:mm:ss'),
                changetime: day.format('YYYY-MM-DD'),
                count: params.count
            };
            flag = await this.ctx.service.log.create(obj);
        } else if (res && res.length === 1) {
            const obj = {
                checkTime: day.format('YYYY-MM-DD HH:mm:ss'),
                changetime: day.format('YYYY-MM-DD'),
                count: params.count
            };
            flag = await this.ctx.service.log.edit(res[0].logId, obj);
        }
        if (flag) {
            const res = await this.ctx.service.task.edit({
                phone: jwtParams.phone,
                taskId: params.taskId,
                count: params.count,
                countTime: day.format('YYYY-MM-DD')
            });
            return res;
        }
        return flag;
    }

    async edit(logId, params) {
        let res = await this.app.mysql.update('user_test_log', params, {
            where: {
                logId: logId
            }
        });
        if (res.affectedRows === 1) {
            return true;
        } else {
            return false;
        }
    }

    async getList(params) {
        let logs = await this.app.mysql.select('user_test_log', {
            where: {
                taskId: params.taskId
            },
            orders: [
                ['checkTime', 'desc'],
                ['logId', 'desc'],
            ]
        });
        return Object.assign([], logs).map(item=>{
            item.checkTime = moment(item.checkTime).format('YYYY-MM-DD HH:mm');
            return item;
        });;
    }


    async validateCreate(params, jwtParams) {
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
            holidayDays,
            status,
            haveSignDays
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
                type: params.type,
                status
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
                type: params.type,
                status
            });
        } else if (params.type === 'fail') {
            actions = [
                {type: 'fail'},
                {type: 'taskFail'}
            ];
        }
        await this.ctx.service.log.submitService(actions, params, jwtParams, {dayofftaken, haveSignDays});
        
    }


    async submitService(arr, params, jwtParams, {dayofftaken, haveSignDays = 0}) {
        const err = arr.find(item => item.type === 'error');
        let newDayofftaken = dayofftaken || 0;
        if (err) {
            this.ctx.body = {
                success: false,
                errmsg: err.message
            };
            return false;
        }
        let submits = [];
        const mom = params.isSys
        ? moment().startOf('days').add(-1, 'seconds')
        : moment();
        const date = mom.format('YYYY-MM-DD HH:mm:ss');
        const changetime = mom.format('YYYY-MM-DD');
        for(let i = 0; i < arr.length; i++) {
            let func;
            let opeates = [];
            if (arr[i].type === 'holiday' || arr[i].type === 'autoHoliday') {
                newDayofftaken = dayofftaken + 1;
            }
            switch(arr[i].type) {
                case 'holiday':
                    func = this.ctx.service.log.create;
                    opeates.push({
                        remark: params.remark,
                        type: params.type,
                        checkTime: date,
                        changetime,
                        taskId: params.taskId
                    });
                    break;
                case 'autoHoliday':
                    func = this.ctx.service.log.create;
                    opeates.push({
                        remark: '未打卡，自动休假',
                        type: 'autoHoliday',
                        checkTime: date,
                        changetime,
                        taskId: params.taskId
                    });
                    break;
                case 'sign':
                    func = this.ctx.service.log.create;
                    opeates.push({
                        remark: params.remark,
                        type: params.type,
                        checkTime: date,
                        changetime,
                        taskId: params.taskId
                    });
                    break;
                case 'done':
                    func = this.ctx.service.log.create;
                    opeates.push({
                        remark: '成功',
                        type: 'done',
                        checkTime: date,
                        changetime,
                        taskId: params.taskId
                    });
                    break;
                case 'fail':
                    func = this.ctx.service.log.create;
                    opeates.push({
                        remark: params.remark || '失败',
                        type: 'fail',
                        checkTime: date,
                        changetime,
                        taskId: params.taskId
                    });
                    break;
                case 'taskDone':
                    func = this.ctx.service.task.edit;
                    opeates.push({
                        phone: jwtParams.phone,
                        taskId: params.taskId,
                        currentStatus: 'done',
                        status: 'success',
                        lastUpdate: date,
                        haveSignDays: haveSignDays + 1
                    });
                    break;
                case 'taskFail':
                    func = this.ctx.service.task.edit;
                    opeates.push({
                        phone: jwtParams.phone,
                        taskId: params.taskId,
                        currentStatus: 'done',
                        status: 'fail',
                        lastUpdate: date
                    });
                    break;
                case 'changeCurrentStatus':
                    func = this.ctx.service.task.edit;
                    opeates.push({
                        phone: jwtParams.phone,
                        currentStatus: 'done',
                        taskId: params.taskId,
                        lastUpdate: date,
                        dayofftaken: newDayofftaken,
                        haveSignDays: haveSignDays + 1
                    });
                    break;
                default:
                    break;
            }
            if(arr[i].status === 'done') {
                opeates.push({
                    remark: '成功',
                    type: 'done',
                    checkTime: date,
                    changetime,
                    taskId: params.taskId
                })
            } else {
                opeates = opeates[0];
            }
            submits.push(func.call(this, opeates));
        }
        const res = await Promise.all(submits);
        let a = res.filter(item => item !== true);
        if (a.length > 0) {
            this.ctx.body = {
                success: false,
                errmsg: '服务器开小差了',
                errcode: JSON.stringify(res)
            };
        } else {
            this.ctx.body = {
                success: true
            };
        }
    }
}

module.exports = LogService;