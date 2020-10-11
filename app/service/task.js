const Service = require('egg').Service;
const moment = require('moment');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

class TaskService extends Service {
    async create(params) {
        let res = await this.app.mysql.insert('user_test_task', params);
        if (res && res.affectedRows === 1) {
            const taskId = res.insertId;
            const resLog = this.ctx.service.log.create({
                remark: '创建',
                type: 'create',
                checkTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                taskId: taskId
            });
            if (resLog) {
                return true;
            } else {
                return false;
            }
        }
        return true;
    }
    async getList(params) {
        const whereParams = {
            phone: params.phone,
        };
        if (params.tag) {
            whereParams.tag = params.tag;
        }
        if (params.status) {
            whereParams.status = params.status;
        }
        let tasks = await this.app.mysql.select('user_test_task', {
            where: whereParams,
            orders: [
                ['taskCreated', 'desc']
            ]
        });
        return Object.assign([], tasks).map(item=>{
            const taskCreated = moment(item.taskCreated);
            const currentStatus = item.status;
            const allDays = item.allDays;
            const a = moment().diff(taskCreated, 'days');
            const b = currentStatus === 'ongoing' ?  a + 1 : a;
            item.taskCreated = taskCreated.format('YYYY-MM-DD HH:mm');
            item.currentDay = b > allDays ? allDays : b;
            return item;
        });
    }

    // 获取未打卡任务
    async getNoSignTask() {
        let tasks = await this.app.mysql.select('user_test_task', {
            where: {
                currentStatus: 'nosign'
            },
            orders: [
                ['taskId', 'desc']
            ]
        });
        return tasks;
    }
    async search(params) {
        let tasks = await this.app.mysql.query(
            `select * from user_test_task where phone=?  and title like ?`, [params.phone, `%${params.title}%`]);
        return Object.assign([], tasks).map(item=>{
            const taskCreated = moment(item.taskCreated);
            item.taskCreated = taskCreated.format('YYYY-MM-DD HH:mm');
            item.currentDay = moment().diff(taskCreated, 'days');
            return item;
        });
    }
    async delete(params) {
        const res = await this.app.mysql.delete('user_test_task', {
            phone: params.phone,
            taskId: params.taskId
        });
        if (res && res.affectedRows === 1) {
            return true;
        } else {
            return false;
        }
    }
    async edit(params) {
        let obj = {
            phone: params.phone,
            lastUpdate: params.lastUpdate
        };
        if (params.title) {
            obj.title = params.title;
        }
        if (params.target) {
            obj.target = params.target;
        }
        if (params.currentStatus) {
            // nosign为签到
            // holiday 休假
            // sign 已经签到
            obj.currentStatus = params.currentStatus;
        }
        if (params.dayofftaken) {
            obj.dayofftaken = params.dayofftaken;
        }
        if (params.status) {
            // nosign为签到
            // holiday 休假
            // sign 已经签到
            obj.status = params.status;
        }
        let res = await this.app.mysql.update('user_test_task', obj, {
            where: {
                taskId: params.taskId,
                phone: params.phone
            }
        });
        if (res.affectedRows === 1) {
            return true;
        } else {
            return false;
        }
    }

    async sysUpdateTaskCurrentStatus(arr) {
        let res = await this.app.mysql.query(`
        update user_test_task
        set currentStatus='nosign'
        where taskId in
        (select taskId  from (select * from user_test_task WHERE currentStatus='done' and status='ongoing') as a);       
        `);
        return res;
    }

    async detail(params) {
        let res = await this.app.mysql.get('user_test_task', {
            phone: params.phone,
            taskId: params.taskId
        });
        if (res) {
            const taskCreated = moment(res.taskCreated);
            const allDays = res.allDays;
            res.taskCreated =  taskCreated.format('YYYY-MM-DD HH:mm');
            if (res.status === 'ongoing') {
                const a = moment().diff(taskCreated, 'days') + 1;
                res.currentDay = a > allDays ? allDays : a;
            } else {
                res.currentDay = allDays;
            }
        }
        return res;
    }
}

module.exports = TaskService;