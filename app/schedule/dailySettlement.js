const moment = require('moment');
module.exports = {
    schedule: {
        cron: '* * * */1 * *',
        type: 'all', // 指定所有的 worker 都需要执行
    },
    async task(ctx) {
        const res = await ctx.service.task.getAllNoSignList();
    }
};