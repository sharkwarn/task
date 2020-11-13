const Service = require('egg').Service;
const moment = require('moment');
const Sequelize = require('sequelize');

function formatCurrentDay(detail) {
    try {
        let completedDay, currentDay;
        const currentStatus = detail.currentStatus;
        const taskCreated = moment(detail.taskCreated);
        const allDays = detail.allDays;
        if (detail.status === 'ongoing') {
            const a = moment().endOf('day').diff(taskCreated, 'days');
            const b = currentStatus === 'nosign' ? a : a + 1;
            currentDay = a + 1 > allDays ? allDays : a + 1;
            completedDay = b > allDays ? allDays : b;
        } else {
            currentDay = allDays;
            completedDay = allDays;
        }
        return [currentDay, completedDay];
    } catch (err) {
        console.log(err);
        return [
            detail.allDays,
            detail.allDays
        ];
    }
}

class TaskService extends Service {
    async create(params) {
        let res = await this.app.mysql.insert('user_test_task', params);
        if (res && res.affectedRows === 1) {
            const taskId = res.insertId;
            const resLog = this.ctx.service.log.create({
                remark: '创建',
                type: 'create',
                checkTime: moment().format('YYYY-MM-DD HH:mm:ss'),
                changetime: moment().format('YYYY-MM-DD'),
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
        if (params.currentStatus) {
            whereParams.currentStatus = params.currentStatus;
        }
        let tasks = await this.app.mysql.select('user_test_task', {
            where: whereParams,
            orders: params.orders || [
                ['taskCreated', 'desc']
            ]
        });
        return Object.assign([], tasks).map(item=>{
            const taskCreated = moment(item.taskCreated);
            const [currentDay, completedDay] = formatCurrentDay(item)
            item.taskCreated = taskCreated.format('YYYY-MM-DD HH:mm');
            item.currentDay = currentDay;
            item.completedDay = completedDay;
            return item;
        });
    }

    // 获取未打卡任务
    async getNoSignTask() {
        let tasks = await this.app.mysql.select('user_test_task', {
            where: {
                currentStatus: 'nosign',
                status: 'ongoing'
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
            const [currentDay, completedDay] = formatCurrentDay(item)
            item.taskCreated = taskCreated.format('YYYY-MM-DD HH:mm');
            item.currentDay = currentDay;
            item.completedDay = completedDay;
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
        };
        if (params.lastUpdate) {
            obj.lastUpdate = params.lastUpdate
        }
        if (params.title !== undefined) {
            obj.title = params.title;
        }
        if (params.target !== undefined) {
            obj.target = params.target;
        }
        if (params.punishment !== undefined) {
            obj.punishment = params.punishment;
        }
        if (params.reward !== undefined) {
            obj.reward = params.reward;
        }
        if (params.target !== undefined) {
            obj.target = params.target;
        }
        if (params.tag) {
            obj.tag = params.tag;
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
        if (params.haveSignDays) {
            obj.haveSignDays = params.haveSignDays;
        }
        if (params.status) {
            // nosign为签到
            // holiday 休假
            // sign 已经签到
            // delete 删除
            obj.status = params.status;
        }
        if (params.counter !== undefined && params.counter !== null) {
            obj.counter = params.counter;
        }
        if (params.count) {
            obj.count = params.count;
        }
        if (params.countTime) {
            obj.countTime = params.countTime;
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
    // 将即将开始的任务状态改为ongoing
    async sysUpdateWillStartStatus(arr) {
        let res = await this.app.mysql.query(`
        update user_test_task
        set status='ongoing'
        where taskId in
        (select taskId  from (select * from user_test_task WHERE status='willStart') as a);       
        `);
        return res;
    }

    async detail(params) {
        let res = await this.app.mysql.get('user_test_task', {
            phone: params.phone,
            taskId: params.taskId
        });
        console.log(111111);
        if (res) {
            const taskCreated = moment(res.taskCreated);
            const [currentDay, completedDay] = formatCurrentDay(res)
            res.taskCreated = taskCreated.format('YYYY-MM-DD HH:mm');
            res.currentDay = currentDay;
            res.completedDay = completedDay;
            const countTime = res.countTime;
            if (moment().diff(moment(countTime), 'days') > 0) {
                res.count = 0;
            }
        }
        return res;
    }

    async restart(params) {
        let res = await this.app.mysql.update('user_test_task', params, {
            where: {
                taskId: params.taskId,
                phone: params.phone
            }
        });
        if (!res.affectedRows === 1) {
            return false;
        }
        const insertLog = await this.ctx.service.log.create({
            remark: '再来一次',
            type: 'restart',
            checkTime: moment().format('YYYY-MM-DD HH:mm'),
            changetime: moment().format('YYYY-MM-DD'),
            taskId: params.taskId
        });
        if (insertLog) {
            return true;
        } else {
            return false;
        }
    }

    // async a(task) {
    //     const res = await this.ctx.service.log.getList({
    //         taskId: task.taskId
    //     });
    //     const obj = {
    //         ...task,
    //         log: res
    //     };
    //     const detail = this.ctx.service.task.computeddays(obj);
    //     const result = this.ctx.service.task.setHaveSignDays(detail.taskId, detail.haveSignDays);
    //     return result;
    // }

    // computeddays(task) {
    //     const log = Object.assign([], task.log);
    //     const arr = log.filter(item => item.type === 'autoHoliday' || item.type === 'holiday' || item.type === 'sign');
    //     task.haveSignDays = arr.length;
    //     return task;
    // }

    // async setHaveSignDays(taskId, day) {
    //     let res = await this.app.mysql.update('user_test_task', {
    //         haveSignDays: day
    //     }, {
    //         where: {
    //             taskId: taskId
    //         }
    //     });
    //     if (res.affectedRows === 1) {
    //         return true;
    //     } else {
    //         console.log('失败了。', taskId);
    //         return false;
    //     }
    // }

    // async computeHaveSignDays() {
    //     const tasks = await this.app.mysql.query('SELECT * FROM `user_test_task`');
    //     const arr = tasks.map(item => {
    //         return this.ctx.service.task.a(item);
    //     });
    //     const res = await Promise.all(arr);
    //     return res;
    // }

    async editReward(params) {
        let obj = {
            rewardTime: moment().format('YYYY-MM-DD'),
            rewardstatus: params.rewardstatus
        };
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

    async getRewardList(params) {
        const currentDay = moment();
        const day = currentDay.format('YYYY-MM-DD');
        let res = await this.app.mysql.query(`
        select a.lastUpdate , 
            a.taskId,
            b.name as 'tagName',
            b.color as 'tagColor',
            a.title, 
            a.reward , 
            a.punishment,
            a.rewardstatus,
            a.rewardTime
        from (
            select
            taskId,
            lastUpdate, 
            title, 
            reward , 
            punishment,  
            tag,
            rewardstatus,
            rewardTime
            from user_test_task
            where phone = ?
            and (reward != '' or punishment !='')
            and status in ('ongoing') or lastUpdate like ?
        ) a
        inner join (
            select tagId, name, color
            from user_test_tag
            ${params.tagId ? 'where tagId = ?' : ''}
        ) b
        on a.tag = b.tagId   
        `, [params.phone, `&${day}%`, params.tagId]);
        return Object.assign([], res).map(item => {
            if (item.rewardTime) {
                const rewardTime = moment(item.rewardTime)
                const diff = currentDay.diff(rewardTime, 'days');
                item.rewardstatus = diff === 0 ? item.rewardstatus : null;
            }
            return item;
        });
    }
}

module.exports = TaskService;