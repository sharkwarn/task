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
        let tasks = await this.app.mysql.select('user_test_task', {
            where: whereParams,
            orders: [
                ['taskCreated', 'desc']
            ]
        });
        return Object.assign([], tasks).map(item=>{
            item.taskCreated = moment(item.taskCreated).format('YYYY-MM-DD HH:mm');
            return item;
        });
    }
    async search(params) {
        let tasks = await this.app.mysql.query(
            `select * from user_test_task where phone=?  and title like ?`, [params.phone, `%${params.title}%`]);
        return Object.assign([], tasks).map(item=>{
            item.taskCreated = moment(item.taskCreated).format('YYYY-MM-DD HH:mm');
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

    async detail(params) {
        let res = await this.app.mysql.get('user_test_task', {
            phone: params.phone,
            taskId: params.taskId
        });
        if (res) {
            res.taskCreated =  moment(res.taskCreated).format('YYYY-MM-DD HH:mm');
        }
        return res;
    }

    async getAllNoSignList() {
        let tasks = await this.app.mysql.select('user_test_task', {
            where: {
                currentStatus: 'nosign'
            }
        });
        return tasks;
    }
}

module.exports = TaskService;