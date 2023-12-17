/* jshint esversion: 9 */

const nodemailer=require('nodemailer');
const path = require('path'); // Add this line to include the path module
const fs=require("fs")
const sendPasswordEmail=(attachmentPath,email,todayFile)=>{
console.log(email,attachmentPath) 
   let transporter=nodemailer.createTransport({
        service:'Outlook',
        auth:{
            user:'testmobile@outlook.co.il',
            pass:'Mobile@1234',
            
        },
    });
console.log(email);
    let mailOptions={
        from:'testmobile@outlook.co.il',
        to:`${email}`,
        html: `<p>Your CSV file with changes is attached. Click <a href="cid:attachment">here</a> to download.</p>`,
  attachments: [
    {
      filename: path.basename(attachmentPath),
      content: fs.createReadStream(attachmentPath),
      encoding: 'base64',
      cid: 'attachment',
    },
    {
        todayFile: path.basename(todayFile),
        content: fs.createReadStream(todayFile),
        encoding: 'base64',
        cid: 'attachment',
      },
  ],
    };
    

    transporter.sendMail(mailOptions,function(error,info){
        if(error){
            console.error(error);
        }
        else {
            console.log('email sent:',info.response);
        }
    });
};


// Options for the email



module.exports={sendPasswordEmail};

