exports.keys = 'sssssss';

exports.view = {
    defaultViewEngine: 'nunjucks',
    mapping: {
        '.tpl': 'nunjucks',
    },
};


exports.mysql = {
    // 单数据库信息配置
    client: {
        // host
        host: 'rm-bp1909aklt69hxjd7to.mysql.rds.aliyuncs.com',
        // 端口号
        port: '3306',
        // 用户名
        user: 'xiaowu_test',
        // 密码
        password: 'xiaowu))101218',
        // 数据库名
        database: 'tasks_user_info',
    },
    // 是否加载到 app 上，默认开启
    app: true,
    // 是否加载到 agent 上，默认关闭
    agent: false,
};

exports.middleware = ["jwt"];

exports.jwt = {
    enable: true,
    ignore: ['/login', '/login/sendmsg', '/validate'] // 哪些请求不需要认证
};

exports.security = {
    csrf: {
        enable:false
    },
};

exports.alinode = {
    server: 'wss://agentserver.node.aliyun.com:8080',
    appid: '86308',
    secret: 'c500502d6cd87f20bfb341941fb5612b4656ad8b',
    logdir: '',
    error_log: [],
    agentidMode:''
};

