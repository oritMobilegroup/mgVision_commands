// // const express = require("express");
// // const app = express();
// // const bodyParser = require("body-parser");
// // const { InsertImuItem } = require('./utils');

// // // Middleware for handling errors
// // app.use((err, req, res, next) => {
 
// //   // Customize the error response
// //   res.status(500).json({ error: 'Internal Server Error', message: err.message });
// // });

// // app.use(express.static(__dirname));
// // app.set("view engine", "ejs");
// // app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
// // app.use(bodyParser.json({ limit: "50mb" }));

// // app.post("/:error", async function (req, res, next) {
// //     console.log('in InsertImuThyponData()');
// //     const imu = {
// //         Imei: req.body.Imei,
// //         Message: req.body.Message,
// //         App: req.body.App,
// //         Date: req.body.Date,
// //         Timestemp: req.body.Timestemp
// //     };
// //     try {
// //         const { client, db } = await InsertImuItem(imu); // Call InsertImuItem function from utils module
// //         res.status(200).send('Internal Server ');    
// //         client.close();
// //     } catch (error) {
// //         // Pass the error to the error-handling middleware
// //         next(error);
// //     }
// // });

// // // Error handler for unhandled errors
// // app.use((err, req, res, next) => {
// //   console.error('Unhandled Error:', err);
// //   res.status(500).json({ error: 'Internal Server Error', message: err.message });
// // });

// // app.listen(4061, function () {
// //     console.log("web listener server listening on port 4061");
// // });
// const express = require('express');
// const bodyParser = require('body-parser');
// const fs = require('fs');

// const app = express();
// app.use(bodyParser.json());

// // Endpoint to add IMEI information to the TXT file
// app.post('/insert', (req, res) => {
//     const imeis = req.body.IMEIs;
    
//     if (!imeis || !Array.isArray(imeis)) {
//         return res.status(400).json({ message: 'Invalid data format' });
//     }

//     try {
//         const formattedData = imeis.map(imei => {
//             return `IMEI: ${imei.IMEI}\nMessage: ${imei.Message}\nApp: ${imei.App}\nDate: ${imei.Date}\nTimestamp: ${imei.Timestemp}\n`;
//         });

//         // Write the formatted data to a text file
//         fs.appendFile('imeiData.txt', formattedData.join('\n') + '\n', (err) => {
//             if (err) {
//                 console.error(err);
//                 res.status(500).json({ message: 'Internal Server Error' });
//             }
//         });

//         res.status(201).json({ message: 'Data inserted successfully' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ message: 'Internal Server Error' });
//     }
// });

// // Endpoint to retrieve information for a specific IMEI
// app.get('/get-info/:imei', (req, res) => {
//   const imeiToRetrieve = req.params.imei;

//   // Read the data from imeiData.txt
//   fs.readFile('imeiData.txt', 'utf8', (err, data) => {
//     if (err) {
//       console.error(err);
//       res.status(500).json({ message: 'Internal Server Error' });
//       return;
//     }

//     const lines = data.trim().split('\n');

//     // Find and return the information for the specified IMEI
//     const info = lines
//       .map((line) => JSON.parse(line))
//       .find((entry) => entry.imei === imeiToRetrieve);

//     if (info) {
//       res.json(info);
//     } else {
//       res.status(404).json({ message: 'IMEI not found' });
//     }
//   });
// });

// const PORT = 4061;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });  

// '''
// const express = require('express');
// const bodyParser = require('body-parser');
// require("./db")

// // const mongoose = require('mongoose');
// const app = express();
// const port = 4061;
// app.use(express.json()); // Enable JSON request body parsing



// async function connectToDatabase() {
//     try {
//       await mongoose.connect('mongodb+srv://oritmobile:213142771@cluster0.9kccieg.mongodb.net/ImeiMongo', {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//       });
//       console.log('Connected to MongoDB');
//     } catch (error) {
//       console.error('Error connecting to MongoDB:', error);
//     }
//   }
  
  // connectToDatabase();
  

// const imeiSchema = new mongoose.Schema({
//   imei: String,
//   odometer_correction_value: Number,
// distance: Number,
// timestamp: String,
// });


// const IMEIModel = mongoose.model('IMEI', imeiSchema);

// app.post('/search', (req, res) => {
//   const imei = req.body.imei;
//   searchIMEI(imei, (result) => {
//     res.json(result);
//   });
// });

// async function searchIMEI(imei, callback, retries = 3) {
//     try {
//       const data = await IMEIModel.findOne({ imei }).exec();
//       if (data) {
//         callback(data);
//       } else {
//         callback('No data found for the provided IMEI.');
//       }
//     } catch (err) {
//       console.error('Error searching for IMEI:', err);
//       if (retries > 0) {
//         // Retry the operation after a short delay
//         setTimeout(() => {
//           searchIMEI(imei, callback, retries - 1);
//         }, 1000); // Adjust the delay as needed
//       } else {
//         callback('An error occurred.');
//       }
//     }
//   }
// // ==== בקשת פוסט לDB

// app.post('/save-data', (req, res) => {
//   // Extract data from the request body
//   const { imei, odometer_correction_value, distance, timestamp } = req.body;

//   // Create a new document with the extracted data and save it to the database
//   const newData = new IMEIModel({
//     imei,
//     odometer_correction_value,
//     distance,
//     timestamp,
//   });

//   newData.save()
//   .then((savedData) => {
//     res.status(200).json(savedData);
//   })
//   .catch((err) => {
//     console.error('Error saving data:', err);
//     res.status(500).json({ error: 'Failed to save data' });
//   });


    
//   });
// const ImeiModel = require('./Models/IMEIModel');

// app.use('/search',ImeiModel);

  
// //   ====

// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });
// const express = require('express');
// const bodyParser = require('body-parser');
// const fs = require('fs');
// const app = express();
// const port = 3008;

// app.use(bodyParser.json());

// const txtFilePath = 'imei_data.txt';

// app.post('/search', (req, res) => {
//   const imei = req.body.imei;
//   searchIMEI(imei, (result) => {
//     res.json(result);
//   });
// });

// function searchIMEI(imei, callback) {
//   const readStream = fs.createReadStream(txtFilePath, 'utf-8');
//   let found = false;

//   readStream.on('data', (data) => {
//     const lines = data.split('\n');
//     for (const line of lines) {
//       try {
//         const json = JSON.parse(line);
//         if (json.hasOwnProperty('imei') && json.imei === imei) {
//           found = true;
//           callback( json);
//           break;
//         }
//       } catch (err) {
//         console.error('Error parsing JSON:', err.message);
//       }
//     }
//   });

//   readStream.on('end', () => {
//     if (!found) {
//       callback( "no data" );
//     }
//   });
// }




// app.use(express.json()); // Enable JSON request body parsing

// app.post('/save-data', (req, res) => {
//   // Extract data from the request body
//   const { imei, odometer_correction_value, distance, timestamp } = req.body;

//   // Create a JavaScript object to represent the data
//   const dataToSave = {
//     imei,
//     odometer_correction_value,
//     distance,
//     timestamp,
//   };

//   // Convert the JavaScript object to a JSON string
//   const dataToSaveString = JSON.stringify(dataToSave, null, 2);

//   // Specify the file path where you want to save the data
//   const filePath = 'imei_data.txt';

//   // Write the data to the text file
//   fs.appendFile(filePath, dataToSaveString, (err) => {
//     if (err) {
//       console.error('Error saving data to file:', err);
//       return res.status(500).json({ error: 'Failed to save data' });
//     }

//     res.status(200).json({ message: 'Data saved to file' });
//   });
// });



// app.use(bodyParser.json());
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const port = 4061;
const saveSchema = require('./Models/saveModel');


const IMEI1 = require('./Models/ImeiSchema');
const searchIMEI = require('./Models/search');
const saveData = require('./Models/save');

const { connectToDatabase } = require('./db');

app.use(express.json()); // Enable JSON request body parsing

app.use(bodyParser.json())

connectToDatabase(); // Establish the database connection

// app.post('/search', (req, res) => {
//   const imei = req.body.imei;
//   searchIMEI(imei, (result) => {
//     res.json(result); 
//   });
// });

app.post('/save-data', (req, res) => {
  const { imei, odometer_correction_value, distance, timestamp } = req.body;
  const data = {
    imei,
    odometer_correction_value,
    distance,
    timestamp,
  };

  saveData(data, (err, savedData) => {
    if (err) {
      res.status(500).json({ error: 'Failed to save data' });
    } else {
      res.status(200).json(savedData);
    }
  });
});


app.post('/insert', (req, res) => {
  const imeis = req.body.IMEIs;

  if (!imeis || !Array.isArray(imeis)) {
    return res.status(400).json({ message: 'Invalid data format' });
  }

  try {
    const formattedData = imeis.map((imei) => {
      return {
        imei: imei.imei,
        message: imei.message,
        app: imei.app,
        date: imei.date,
        timestamp: imei.Timestamp,
      };
    });

    // Insert the formatted data into the MongoDB collection
    IMEI1.insertMany(formattedData)
      .then(() => {
        res.status(201).json({ message: 'Data inserted successfully' });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.post('/update', async (req, res) => {
  const imeis = req.body.IMEIs;

  if (!imeis || !Array.isArray(imeis)) {
    return res.status(400).json({ message: 'Invalid data format' });
  }

  try {
    for (const imei of imeis) {
      // Find existing data for the IMEI
      const existingData = await saveSchema.findOne({ imei: imei.imei }).exec();

      if (existingData) {
        // If an entry already exists, check if the fingerprint is different
        if (existingData.distance !== imei.distance) {
          // If different, update the existing entry with the new data
          await saveSchema.findOneAndUpdate(
            { imei: imei.imei },
            {
              $set: {
                fingerprint: imei.fingerprint,
                distance: imei.distance,
                odometer: imei.odometer,
              },
            },
            { new: true }
          ).exec();
        }
      } else {
        // If no entry exists, create a new one
        const formattedData = {
          imei: imei.imei,
          fingerprint: imei.fingerprint,
          distance: imei.distance,
          odometer: imei.odometer,
        };
        
        await saveSchema.create(formattedData);
      }
    }

    res.status(201).json({ message: 'Data inserted/updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

    // Insert the formatted data into the MongoDB collection
  //   saveSchema.insertMany(formattedData)
  //     .then(() => {
  //       res.status(201).json({ message: 'Data inserted success' });
  //     })
  //     .catch((err) => {
  //       console.error(err);
  //       res.status(500).json({ message: 'Internal Server Error' });
  //     });
  // } catch (error) {
  //   console.error(error);
  //   res.status(500).json({ message: 'Internal Server Error' });
  // }
// });

//check fingerprint
app.post('/search', async (req, res) => {
  const { imei, fingerprint } = req.body;

  try {// check -update
// jityopo577657
// לבדוק  
// החלק השני 
    // Look up the previous fingerprint in the database based on IMEI
    const imeiData = await saveSchema.findOne({ imei }).exec();

    if (!imeiData) {
      console.log('IMEI not found:', imei);
      return res.status(404).json({ message: 'IMEI not found' });
    }

    console.log('Stored Fingerprint:', imeiData.fingerprint);
    console.log('Provided Fingerprint:', fingerprint);

    if (imeiData.fingerprint !== fingerprint) {
      // Fingerprint has changed, return IMEI and DISTANCE
      console.log(imeiData)
      console.log('Fingerprint has changed. Returning DISTANCE.' + imeiData.distance);
      console.log('odometer_correction_value.' +imeiData.odometere);

      return res.status(200).json({ imei, distance: imeiData.distance,odometer: imeiData.odometer });
    }

    // Fingerprint is the same
    console.log('Fingerprint is unchanged.');
    return res.status(200).json({ imei,odometer: imeiData.odometer });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
