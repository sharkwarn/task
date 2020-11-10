// app/extend/helper.js
const moment = require('moment');
exports.relativeTime = time => moment(new Date(time * 1000)).fromNow();


// 判断是否是手机号
exports.isMobile = function (mobile) {
  return /^1\d{10}$/.test(mobile)
}


// 判断是否是邮箱
exports.isEmail = function (val) {
    var pattern = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
    var domains= ["qq.com","163.com","vip.163.com","263.net","yeah.net","sohu.com","sina.cn","sina.com","eyou.com","gmail.com","hotmail.com","42du.cn"];
    if(pattern.test(val)) {
        var domain = val.substring(val.indexOf("@")+1);
        for(var i = 0; i< domains.length; i++) {
            if(domain == domains[i]) {
                return true;
            }
        }
    }
    return false;
}