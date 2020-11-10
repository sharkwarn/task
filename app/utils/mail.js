const nodemailer = require("nodemailer");

// async..await is not allowed in global scope, must use a wrapper
async function mail(url, code) {

  // create reusable transporter object using the default SMTP transport
  try {
    let transporter = nodemailer.createTransport({
        // host: "pop.163.com",
        service: '163',
        // port: 80,
        secure: true, // true for 465, false for other ports
        auth: {
          user: 'sharkwarn@163.com', // generated ethereal user
          pass: 'DGQYELFHERHPWSZM', // generated ethereal password
        },
      });
    
      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: '"打卡APP" <sharkwarn@163.com>', // sender address
        to: url, // list of receivers
        subject: "打卡App 验证码", // Subject line
        text: "", // plain text body
        html: `<p>欢迎使用打卡App， 你的验证码为<b>${code}</b></p>`, // html body
      });
      return info;
  } catch (err) {
      return false;
  }
}
module.exports = mail;