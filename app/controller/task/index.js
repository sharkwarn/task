const moment = require('moment');
const Controller = require('egg').Controller;

class TaskController extends Controller {
    async create() {
        const jwtParams = this.ctx.jwtParams;
        const params = this.ctx.request.body;
        const createRule = {
            title: {
                type: 'string',
                require: true
            },
            target: {
                type: 'string',
                require: true
            },
            allDays: {
                type: 'number',
                require: true
            },
            holidayDays: {
                type: 'number',
                require: true
            },
            fine: {
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
        const res = await this.ctx.service.task.create({
            title: params.title,
            target: params.target,
            allDays: params.allDays,
            holidayDays: params.holidayDays,
            fine: params.fine,
            tag: params.tag ? params.tag : 2,
            phone: jwtParams.phone,
            dayofftaken: 0,
            currentStatus: 'nosign',
            status: 'ongoing',
            lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss'),
            taskCreated: moment().format('YYYY-MM-DD HH:mm:ss')
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
        const params = this.ctx.request.body;
        const [res, resTag, defaultTag] = await Promise.all([
            this.ctx.service.task.getList({
                phone: jwtParams.phone,
                title: params.title,
                tag: params.tag
            }),
            this.ctx.service.tag.getList({
                phone: jwtParams.phone
            }),
            this.ctx.service.tag.getList({
                phone: 1
            })
        ]);
        if (res && resTag) {
            if (defaultTag && defaultTag[0]) {
                resTag.push(defaultTag[0]);
            }
            const tagMap = new Map(resTag.map(item => {
                return [item.tagId, item];
            }))
            const list = res.map(item => {
                if (tagMap.has(item.tag)) {
                    item.tagInfo = tagMap.get(item.tag);
                } else {
                    item.tagInfo = {
                        name: '',
                        color: '#FFFFFF'
                    }
                }
                return item;
            })
            this.ctx.body = {
                success: true,
                errmsg: '',
                data: list
            };
        } else {
            this.ctx.body = {
                success: false,
                errmsg: '',
                data: res
            };
        }
    }


    async getNoSignTask() {
        const res = await this.ctx.service.task.getNoSignTask();
        this.ctx.body = {
            success: true,
            errmsg: '',
            data: res
        };
    }

    async search() {
        const jwtParams = this.ctx.jwtParams;
        const params = this.ctx.request.body;
        const [res, resTag, defaultTag] = await Promise.all([
            this.ctx.service.task.search({
                phone: jwtParams.phone,
                title: params.title
            }),
            this.ctx.service.tag.getList({
                phone: jwtParams.phone
            }),
            this.ctx.service.tag.getList({
                phone: 1
            })
        ]);
        if (res && resTag) {
            if (defaultTag && defaultTag[0]) {
                resTag.push(defaultTag[0]);
            }
            const tagMap = new Map(resTag.map(item => {
                return [item.tagId, item];
            }))
            const list = res.map(item => {
                if (tagMap.has(item.tag)) {
                    item.tagInfo = tagMap.get(item.tag);
                } else {
                    item.tagInfo = {
                        name: '',
                        color: '#FFFFFF'
                    }
                }
                return item;
            })
            this.ctx.body = {
                success: true,
                errmsg: '',
                data: list
            };
        } else {
            this.ctx.body = {
                success: false,
                errmsg: '',
                data: res
            };
        }
    }

    async delete() {
        const jwtParams = this.ctx.jwtParams;
        const params = this.ctx.request.body;
        const res = await this.ctx.service.task.delete({
            taskId: params.taskId,
            phone: jwtParams.phone,
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
        if (!params.title && !params.target) {
            this.ctx.body = {
                success: false,
                errmsg: '修改名称和目的不可以同时为空'
            };
            return;
        }
        const res = await this.ctx.service.task.edit({
            taskId: params.taskId,
            title: params.title,
            target: params.target,
            phone: jwtParams.phone,
            lastUpdate: moment().format('YYYY-MM-DD HH:mm:ss')
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

    async detail() {
        const jwtParams = this.ctx.jwtParams;
        const params = this.ctx.request.body;
        await new Promise((resolve) => {
            setTimeout(()=>{
                resolve();
            }, 1000);
        });
        const [detail, logs] = await Promise.all([
            this.ctx.service.task.detail({
                taskId: params.taskId,
                phone: jwtParams.phone,
            }),
            this.ctx.service.log.getList({
                taskId: params.taskId
            })
        ]);
        if (detail && logs) {
            const tagInfo = await this.ctx.service.tag.getDetail({
                tagId: detail.tag
            });
            if (tagInfo) {
                detail.tagInfo = tagInfo;
            } else {
                detail.tagInfo = {
                    name: '',
                    color: '#FFFFFF'
                };
            }
            detail.currentDay = moment().startOf('day').diff(
                moment(detail.taskCreated).startOf('day'),
                'days'
            ) + 1;
            detail.logs = logs;
            this.ctx.body = {
                success: true,
                errmsg: '',
                data: detail
            };
        } else {
            this.ctx.body = {
                success: false,
                errmsg: '',
                data: null
            };
        }
    }
}

module.exports = TaskController;
