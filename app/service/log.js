const Service = require('egg').Service;
const moment = require('moment');

class LogService extends Service {
    async create(params) {
        let res = await this.app.mysql.insert('user_test_log', params);
        if (res && res.affectedRows === 1) {
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
                ['checkTime', 'desc']
            ]
        });
        return Object.assign([], logs).map(item=>{
            item.checkTime = moment(item.checkTime).format('YYYY-MM-DD HH:mm');
            return item;
        });;
    }
}

module.exports = LogService;