const Service = require('egg').Service;
const moment = require('moment');

class TagService extends Service {
    async create(params) {
        let res = await this.app.mysql.insert('user_test_tag', {
            name: params.name,
            color: params.color,
            tagCreated: moment().format('YYYY-MM-DD HH:mm:ss'),
            tagStatus: 'create',
            phone: params.phone
        });
        return true;
    }
    async getList(params) {
        let tags = await this.app.mysql.select('user_test_tag', {
            where: {
                phone: params.phone
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
        const res = await this.app.mysql.delete('user_test_tag', {
            phone: params.phone,
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
                phone: params.phone
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