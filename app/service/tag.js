const Service = require('egg').Service;
const moment = require('moment');

class TagService extends Service {
    async create(params) {
        let res = await this.app.mysql.insert('user_test_tag', {
            name: params.name,
            color: params.color,
            tagCreated: moment().format('YYYY-MM-DD HH:mm:ss'),
            tagStatus: 'create',
            userid: params.userid
        });
        return true;
    }
    async getList(params) {
        let tags = await this.app.mysql.select('user_test_tag', {
            where: {
                userid: params.userid
            },
            orders: [
                ['tagCreated', 'desc']
            ]
        });
        return tags;
    }
    async getDetail(params) {
        let tags = await this.app.mysql.get('user_test_tag', {
            tagId: params.tagId
        });
        if (tags) {
            return tags;
        } else {
            return false;
        }
    }
    async delete(params) {
        const list = await this.ctx.service.task.getList({
            userid: params.userid,
            tag: params.tagId
        });
        const lastUpdate = moment().format('YYYY-MM-DD HH:mm:ss');
        const arr = list.map(item => {
            return this.ctx.service.task.edit({
                taskId: item.taskId,
                lastUpdate,
                userid: params.userid,
                status: 'delete'
            });
        })
        const batchRes = await Promise.all(arr);
        // 失败情况下怎么处理。
        let flag = batchRes.find(item => item === false);
        const res = await this.app.mysql.delete('user_test_tag', {
            userid: params.userid,
            tagId: params.tagId
        });

        if (res && res.affectedRows === 1) {
            return true;
        } else {
            return false;
        }
    }
    async edit(params) {
        let res = await this.app.mysql.update('user_test_tag', {
            name: params.name,
            color: params.color,
            tagStatus: 'update',
        }, {
            where: {
                tagId: params.tagId,
                userid: params.userid
            }
        });
        if (res.affectedRows === 1) {
            return true;
        } else {
            return false;
        }
    }
}

module.exports = TagService;