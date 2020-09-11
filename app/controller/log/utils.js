

/**
 * 验证当前是否打卡
 * @param {*} currentStatus 当前任务状态
 * @returns 返回错误信息，没有代表验证通过。
 */
function verifyCurrentSign(currentStatus) {
    let errmsg;
    switch (currentStatus) {
        case 'sign':
            errmsg = '今天已经签到';
            break;
        case 'holiday':
            errmsg = '今天已经签到';
            break;
        case 'done':
            errmsg = '任务已经完成';
            break;
        case 'fail':
            errmsg = '任务已经失败';
            break;
        case 'delete':
            errmsg = '任务已经删除';
            break;
        default:
            break;
    }
    return errmsg;
}



/**
 * 验证假期
 * @param {*} {dayofftaken 已经休假, holiday: 所有休假}
 * @returns 
 */
function verifyHoliday({dayofftaken, holidayDays, type}) {
    let actions = [];
    if (dayofftaken + 1 > holidayDays && type !== 'autoHoliday') {
        // 返回失败，没有可用假期
        actions.push({
            type: 'error',
            message: '没有可用休假'
        });
    } else if (dayofftaken + 1 > holidayDays && type === 'autoHoliday') {
        actions.push({
            type: 'fail'
        });
        actions.push({
            type: 'taskFail'
        });
    }
    // 还有可用假期
    else {
        actions = verifySign(arguments[0]);
    }
    return actions;
}



/**
 * 验证打卡，并判断打卡类型。
 *
 * @param {*} currentDate 当前日期
 * @param {*} createDate 任务创建日期
 * @param {*} allDays 打卡周期
 * @param {*} type 打卡类型，holiday 休假、 sign 签到
 * @returns 返回打卡后需要进行的操作
 */
function verifySign({currentDate, createDate, allDays, type}) {
    const haveSign = currentDate.diff(createDate, 'day');
    const actions = [];
    // 最后一天打卡
    if (haveSign + 1 === allDays) {
        //插入最后一次打卡记录。
        // 插入完成标记
        // 更改任务状态status & currentStatus
        actions.push({
            type: type,
        });
        actions.push({
            type: 'done'
        });
        actions.push({
            type: 'taskDone'
        });
    }
    // 不应该出现这种情况
    else if (haveSign + 1 > allDays) {
        // 提示不可以打卡，任务已经结束
        actions.push({
            type: 'error',
            message: '任务已经结束'
        });
    }
    // 正常打卡
    else if (haveSign + 1 < allDays) {
        // 插入打卡记录，更改任务状态，currentStatus
        actions.push({
            type: type
        });
        actions.push({
            type: 'changeCurrentStatus'
        })
    }
    return actions;
}

exports.verifySign = verifySign;

exports.verifyHoliday = verifyHoliday;

exports.verifyCurrentSign = verifyCurrentSign;