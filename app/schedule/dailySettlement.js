const moment = require('moment');
module.exports = {
    schedule: {
        cron: '0 0 0 */1 * *',
        type: 'all', // 指定所有的 worker 都需要执行
    },
    async task(ctx) {
        console.log('开始执行任务');
        const res = await ctx.service.task.getNoSignTask();
        const a = res.map(item => {
            return ctx.service.log.validateCreate({
                taskId: item.taskId,
                type: 'autoHoliday',
                isSys: true,
                remark: '系统自动休假'
            }, {
                phone: item.phone
            });
        });
        const finalResult = await Promise.all(a);
        const change = await ctx.service.task.sysUpdateTaskCurrentStatus();
        console.log('将任务重制', change);
        const change2 = await ctx.service.task.sysUpdateWillStartStatus();
        console.log('将明天开始的任务变成可打卡', change2);
    }
};