/* jshint esversion: 8 */

const nodemailer=require('nodemailer');

const sendPasswordEmail=(email,newPassword)=>{
console.log(email,newPassword) 
   let transporter=nodemailer.createTransport({
        service:'Outlook',
        auth:{
            user:'testmobile@outlook.co.il',
            pass:'Mobile@1234',
            
        },
    });
console.log(email);
console.log("pass"+newPassword);

    let mailOptions={
        from:'testmobile@outlook.co.il',
        to:`${email}`,
        subject:'Password',
        text:`your new password is:       
        ${newPassword}`,
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




module.exports={sendPasswordEmail};

