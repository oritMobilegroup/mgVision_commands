
// const fs = require('fs');
// const path = require('path');
// const csv = require('csv-parser');
// const fastcsv = require('fast-csv');
// const { sendPasswordEmail } = require('../server/mailService');

// // Function to compare two CSV files and write changes to a new file
// function compareAndWriteChanges(currentDate, outputFileName) {
//   const changes = [];
// // "../../../../../../"
//   // Generate file names based on dates
//   const todayFile = path.join("/home/ec2-user", `report1-${currentDate}.csv`);
//   const yesterdayDate = new Date();
//   yesterdayDate.setDate(yesterdayDate.getDate() - 1);
//   const yesterdayFile = path.join("/home/ec2-user", `report2-${yesterdayDate.toISOString().split('T')[0]}.csv`);

//   // Read the current day's CSV file
//   const data1 = new Map();
//   fs.createReadStream(todayFile)
//     .pipe(csv())
//     .on('data', (row) => {
//       data1.set(row.id, row);
//     })
//     .on('end', () => {
//       // Read the previous day's CSV file and compare with the current day
//       fs.createReadStream(yesterdayFile)
//         .on('error', (err) => {
//           console.error('Error reading yesterday\'s file:', err);
//         })
//         .pipe(csv())
//         .on('data', (row2) => {
//           const matchingRow = data1.get(row2.id); // Assuming 'id' is a unique identifier
//           if (!matchingRow) {
//             changes.push({ type: 'added', data: row2 });
//           } else {
//             // Compare the fields and check for changes
//             const changedFields = Object.keys(row2).filter((key) => row2[key] !== matchingRow[key]);
//             if (changedFields.length > 0) {
//               changes.push({
//                 type: 'changed',
//                 id: row2.id,
//                 fields: changedFields,
//                 values: changedFields.map((field) => ({ field, oldValue: matchingRow[field], newValue: row2[field] })),
//               });
//             }
//           }
//         })
//         .on('end', () => {
//           // Write changes to a new CSV file
//           const outputStream = fs.createWriteStream(outputFileName);
//           const csvStream = fastcsv.format({ headers: true });

//           // Include only rows with changes or additions in the output file
//           changes.forEach((change) => {
//             if (change.type === 'added') {
//               csvStream.write(change.data);
//             } else if (change.type === 'changed') {
//               csvStream.write({
//                 id: change.id,
//                 type: 'changed',
//                 fields: change.fields.join(','),
//                 values: change.values.map((value) => `${value.newValue}`).join(','),
//               });
//             }
//           });

//           csvStream.pipe(outputStream);
//           csvStream.end();
//           outputStream.on('finish', () => {
//             console.log('Changes written to', outputFileName);

//             // Send email with the attachment
//             // sendEmailWithAttachment(outputFileName, 'oritkoreng@gmail.com');
//           });
//         });
//     });
// }


//   // Function to send an email with an attachment
// function sendEmailWithAttachment(attachmentPath, recipientEmail) {
//     try {
//       // Read the file content
//       const fileContent = fs.createReadStream(attachmentPath);
  
//       // Send the email
//       sendPasswordEmail(fileContent.path, recipientEmail);
//     } catch (error) {
//       console.error('Error sending email:', error);
//     }
//   }
  

// // Get the current date in the format YYYY-MM-DD
// const currentDate = new Date().toISOString().split('T')[0];
// ""
// // Example usage: Output file will be named 'changes.csv' for the current date
// const outputFileName = path.join("/home/ec2-user", `changes_${currentDate}.csv`);
// compareAndWriteChanges(currentDate, outputFileName);
// sendEmailWithAttachment(outputFileName, 'gadi@mobilegroup.co.il');

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const fastcsv = require('fast-csv');
const CronJob = require('cron').CronJob;

const { sendPasswordEmail } = require('../server/mailService');

const currentDate = new Date().toISOString().split('T')[0];
const outputFileName = path.join(__dirname, `changes_${currentDate}.csv`);
const changesDetectedFile = path.join(__dirname, `changesDetected_${currentDate}.txt`);

function compareAndWriteChanges() {
  // if (fs.existsSync(changesDetectedFile)) {
  //   console.log('Changes already detected. Skipping...');
  //   return;
  // }

  const changes = [];
  const todayFile = path.join(__dirname, `../../../../../../../home/ec2-user/report1-${currentDate}.csv`);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayFile = path.join(__dirname, `../../../../../../../home/ec2-user/report2-${yesterdayDate.toISOString().split('T')[0]}.csv`);

  const data1 = new Map();
  fs.createReadStream(todayFile)
    .pipe(csv())
    .on('data', (row) => {
      data1.set(row.id, row);
    })
    .on('end', () => {
      fs.createReadStream(yesterdayFile)
        .on('error', (err) => {
          console.error('Error reading yesterday\'s file:', err);
        })
        .pipe(csv())
        .on('data', (row2) => {
          const matchingRow = data1.get(row2.id);
          if (!matchingRow) {
            changes.push({ type: 'added', data: row2 });
          } else {
            const changedFields = Object.keys(row2).filter((key) => row2[key] !== matchingRow[key]);
            if (changedFields.length > 0) {
              changes.push({
                type: 'changed',
                id: row2.id,
                fields: changedFields,
                values: changedFields.map((field) => ({ field, oldValue: matchingRow[field], newValue: row2[field] })),
              });
            }
          }
        })
        .on('end', () => {
          const outputStream = fs.createWriteStream(outputFileName);
          const csvStream = fastcsv.format({ headers: true });

          changes.forEach((change) => {
            if (change.type === 'added') {
              csvStream.write(change.data);
            } else if (change.type === 'changed') {
              csvStream.write({
                id: change.id,
                type: 'changed',
                fields: change.fields.join(','),
                values: change.values.map((value) => `${value.newValue}`).join(','),
              });
            }
          });

          csvStream.pipe(outputStream);
          csvStream.end();

          outputStream.on('finish', () => {
            console.log('Changes written to', outputFileName);
            sendEmailWithAttachment(outputFileName, 'oritkoreng@gmail.com',todayFile);
            // fs.writeFileSync(changesDetectedFile, 'Changes detected'); 
            //  writeLastExecutionDate(currentDate);
          });
        });
    });
}

 async function sendEmailWithAttachment(attachmentPath, recipientEmail,todayFile) {
  try {
    const fileContent = fs.createReadStream(attachmentPath);
   // sendPasswordEmail("hi", recipientEmail);
   const todayFile = path.join(__dirname, `../../../../../../../home/ec2-user/report1-${currentDate}.csv`);

await sendPasswordEmail(
  fileContent.path, recipientEmail,todayFile);}
catch (error) {
    console.error('Error sending email:', error);
  }
}

// Execute the function
compareAndWriteChanges();

const job = new CronJob('14 5 * * *', () => {
   compareAndWriteChanges();
   console.log("hi")
}, null, true, 'UTC');

job.start();