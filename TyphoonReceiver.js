//jshint esversion: 9
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const jimp = require("jimp");
const jimp_resize = require("jimp");
const fs = require("fs");
const util = require('util');
const typhoonUtils = require('./TyphoonUtils');
app.use(express.static(__dirname));
// set the view engine to ejs
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
var Long = require('mongodb').Long;
const express1 = require("express-fileupload");
app.use(express1());
var addTimeStampToReal = 0;
var timestampFail = 0;
var sendData = false;

async function parseJsonMsgInsertToDB(json_obj) {
  var TAG = "/MaintenanceData1"; 
  var json_IMU1 = json_obj.IMU;
  const deviceMAC = json_obj.DEVICE_MAC;
  const json_DC2C = json_obj.DCC;
  const json_DC2V = json_obj.DCV;
  const json_SOUND = json_obj.SOUND;
  const json_DB_METER = json_obj.DB_METER;
  const json_PACKET_NUM = parseInt(json_obj.PACKET_NUM);
  
  //console.log("json_DB_METER = " + json_DB_METER);
  console.log("PACKET_NUM = " + json_obj.PACKET_NUM);
  //FOR IMU
  var imuList = [];
  var IMU_ShootingsList = [];
  var ImuListSize = (json_IMU1.length - 2);
  var diffTimeStampImu = parseInt((json_IMU1[1] - json_IMU1[0]) / (ImuListSize - 1));
  var currTimeStampImu = parseInt(json_IMU1[0]); //205465 , 206473
  if(json_PACKET_NUM == 0) {
	addTimeStampToReal = Date.now() - currTimeStampImu;
	//console.log("now="+ Date.now() + " currIMU=" + currTimeStampImu);
  }

  for(let k = 2; k < json_IMU1.length; k++) {
      	if (json_IMU1[k] != "NC"){
		var acc = parseFloat(json_IMU1[k] / 100);
		var imuItem = {
			acc: acc,
			timeStamp: currTimeStampImu,
			timeStampReal: currTimeStampImu + addTimeStampToReal,
			deviceMac: deviceMAC
		};

		if(k >= 3 && parseFloat(json_IMU1[k] / 100) >= 2 && 
			parseFloat(json_IMU1[k] / 100) >= parseFloat(json_IMU1[k - 1] / 100)) {
		
			if(k == json_IMU1.length - 1 || 
				parseFloat(json_IMU1[k] / 100) >= parseFloat(json_IMU1[k + 1] / 100)) {
				//createIMU_shooting
				var IMU_Shooting = {
					value: parseFloat(json_IMU1[k] / 100),
					timeStamp: imuItem.timeStamp,
					timeStampReal: imuItem.timeStampReal,
					deviceMac: deviceMAC
				};

				IMU_ShootingsList.push(IMU_Shooting);
			} 
		}


		if (imuItem.timeStamp == imuItem.timeStampReal) {
			timestampFail++;
			if(timestampFail == 5) {
			  console.log("tsfail");	
			  return "tsfail";
			}
		} else {
			timestampFail = 0;
		}
		imuList.push(imuItem);
		//await typhoonUtils.InsertImuItem(imuItem, currTimeStampImu + addTimeStampToReal);
	}
	currTimeStampImu = currTimeStampImu + diffTimeStampImu;
  }

  await typhoonUtils.InsertImuList(imuList);
  if(IMU_ShootingsList.length > 0) {
	await typhoonUtils.InsertIMU_ShootingsList(IMU_ShootingsList);
  }
  
 
  //FOR SOUND

  var soundList = [];
  var soundListSize = (json_SOUND.length - 2);
  var diffTimeStampSound = parseInt((json_SOUND[1] - json_SOUND[0]) / (soundListSize-1));
  var currTimeStampSound = parseInt(json_SOUND[0]);
  for(let k=2; k < json_SOUND.length; k++) {
	var sample = {
//		frequency: parseInt(json_SOUND[k]),
//		amplitude: parseFloat(Math.abs(Math.log10(json_SOUND[k + 1] / 10000 / 256) * 20))
                amplitude: parseFloat(json_SOUND[k] / 10)
	};
	var soundItem = {
		sample : sample,
		timeStamp: currTimeStampSound,
		timeStampReal: currTimeStampSound + addTimeStampToReal,
		deviceMac: deviceMAC
	};
	soundList.push(soundItem);
	//await typhoonUtils.InsertSoundItem(soundItem);
	currTimeStampSound = currTimeStampSound + diffTimeStampSound;
  }
  await typhoonUtils.InsertSoundList(soundList);

  //FOR SOUND_DB_METER
  var soundMeterList = [];
  var DB_ShootingsList = [];
  var soundMeterListSize = (json_DB_METER.length - 2);
  var diffTimeStampSoundMeter = parseInt((json_DB_METER[1] - json_DB_METER[0]) / (soundMeterListSize - 1));
  var currTimeStampSoundMeter = parseInt(json_DB_METER[0]);
  for(let k=2; k < json_DB_METER.length; k++) {
	var sampleMeter = {
//		frequency: parseInt(json_DB_METER[k]),
//		amplitude: parseFloat(Math.abs(Math.log10(json_DB_METER[k + 1] / 10000 / 256) * 20))
                amplitude: parseFloat(json_DB_METER[k] / 100)
	};
	var soundMeterItem = {
		sample : sampleMeter,
		timeStamp: currTimeStampSoundMeter,
		timeStampReal: currTimeStampSoundMeter + addTimeStampToReal,
		deviceMac: deviceMAC
	};

	if(k >= 3 && parseFloat(json_DB_METER[k] / 100) >= 60 && 
		parseFloat(json_DB_METER[k] / 100) >= parseFloat(json_DB_METER[k - 1] / 100)) {
		
		if(k == json_DB_METER.length - 1 || parseFloat(json_DB_METER[k] / 100) >= parseFloat(json_DB_METER[k + 1] / 100)) {
			//createDB_shooting
			var DB_Shooting = {
				value: parseFloat(json_DB_METER[k] / 100),
				timeStamp: soundMeterItem.timeStamp,
				timeStampReal: soundMeterItem.timeStampReal,
				deviceMac: deviceMAC
			};

			DB_ShootingsList.push(DB_Shooting);

			
		} 
	}
	soundMeterList.push(soundMeterItem);
	//await typhoonUtils.InsertSoundItem(soundMeterItem);
	currTimeStampSoundMeter = currTimeStampSoundMeter + diffTimeStampSoundMeter;
  }

  if(DB_ShootingsList.length > 0) {
	await typhoonUtils.InsertDBShootingsList(DB_ShootingsList);
  }
  await typhoonUtils.InsertSoundMeterList(soundMeterList);

  //FOR DCC
  var dccList = [];
  var dccListSize = json_DC2C.length - 2;
  var diffTimeStampDcc = parseInt((json_DC2C[1] - json_DC2C[0]) / (dccListSize-1));
  var currTimeStampDcc = parseInt(json_DC2C[0]);
  //console.log("json_DC2C = " + json_DC2C);

  for(let k = 2; k < json_DC2C.length; k++) {
	if (json_DC2C[k] != "NC") {
		//console.log("json_DC2C[k] / 10000 = " + json_DC2C[k] / 10000);
		var dccItem = {
			//current: parseCurrentDcc(json_DC2C[k], true),
			current: parseFloat(json_DC2C[k] / 10000),
			timeStamp: currTimeStampDcc,
			timeStampReal: currTimeStampDcc + addTimeStampToReal,
			deviceMac: deviceMAC
		};
		dccList.push(dccItem);
		//await typhoonUtils.InsertDccItem(dccItem);
	}
	currTimeStampDcc = currTimeStampDcc + diffTimeStampDcc;
  }

  await typhoonUtils.InsertDccList(dccList);
  
    
//FOR DCV
  var dcvList = [];
  var dcvListSize = (json_DC2V.length - 2);
  var diffTimeStampDcv = parseInt((json_DC2V[1] - json_DC2V[0]) / dcvListSize);
  var currTimeStampDcv = parseInt(json_DC2V[0]);

  for(let k = 2; k < json_DC2V.length; k++) {
	if (json_DC2V[k] != "NC") {
		var dcvItem = {
			//voltage: parseCurrentDcc(json_DC2V[k], false),
			voltage: parseFloat(json_DC2V[k] / 10000),
			timeStamp: currTimeStampDcv,
			timeStampReal: currTimeStampDcv + addTimeStampToReal,
			deviceMac: deviceMAC

		};
		//console.log("parseFloat(json_DC2V[k] / 10000) = " + parseFloat(json_DC2V[k] / 10000));	
		dcvList.push(dcvItem);
		//await typhoonUtils.InsertDcvItem(dcvItem, currTimeStampDcv + addTimeStampToReal);	
	}
	currTimeStampDcv = currTimeStampDcv + diffTimeStampDcv;
  }
  
  await typhoonUtils.InsertDcvList(dcvList);	
  
  var result = {status: "OK", reason: "OK"};
  sendData = false;
  return result;
  //console.log("yakir 1");
}

function parseCurrentDcc(value, isDcc) {
    
    var B3 = value.substring(6,8);
    var B4 = value.substring(8,10);

    B3 = parseInt(B3, 16);
    B4 = parseInt(B4, 16);
    
    var interesting_data = ((B3 << 8) | B4);
    var size_data = (interesting_data & 0x7FFF);

    //check if positive or negative:
    if ((interesting_data & 0x8000) == 0x0000)
    {
	//positive 
	if (isDcc) {
		if (Math.abs(size_data) > 56.9438) {
			return (0.00998 * Math.abs(size_data) - 0.5683) / 5;
		} else {
			return 0;	
		}

	} else {
		if (Math.abs(size_data) > 7) {
			return (6 * Math.abs(size_data) / 1000 - 0.042 * 1);
		} else {
			return 0;	
		}

	}
    } else {
	//negative
	if (isDcc) {
		if (Math.abs(size_data) != 0) {
			return (-0.01041 * Math.abs(size_data) - 0.46884) / 5;
		} else {
			return 0;	
		}
		
	} else {
		if (Math.abs(size_data) > 7) {
			return ((6 * Math.abs(size_data) / 1000 - 0.042) * -1);
		} else {
			return 0;	
		}

	}
    }

}

app.post("/MaintenanceData1", async function (req, res) {
  var TAG = "/MaintenanceData1";
  var statusOK = true; 
  var jsonData = JSON.stringify(req.body);
  // console.log(jsonData);
  if ("IMU" in req.body && "SOUND" in req.body && !sendData) {
    if(req.body.IMU == ""){
	res.send("success");
    } else {
	sendData = true;
    	const json_msg = JSON.parse(jsonData);
    	const result = parseJsonMsgInsertToDB(json_msg);
	if(result == "tsfail") {
	   res.status(405);
	} else {
	   res.status(200);
	}
    	res.send(result);

    }
  } else {
    console.log(TAG + "error send DATA = " + sendData);
    //res.send({status: "ERROR", reason: "missing parameters"});
    res.status(400);
    res.send('fail');
  }
});

app.get("/ThypoonData/All/Imu/get/All", async function(req, res) {
    console.log('in getImuThypoonData()');
    var collectionName = 'IMU';
    const result = await typhoonUtils.getTyphoonData(collectionName);
    var data = `acc,timeStamp,timeStampReal\n`; 
    
    for(let k = 0; k < result.length; k++) {
	data = data + result[k].acc + `,` + result[k].timeStamp + `,` + result[k].timeStampReal + `\n`;
    }

    //console.log(data);

    fs.writeFile("./ImuLast.csv", data, "utf-8", (err) => {
  	if (err) {
		console.log(err);
	} else {
	 	console.log("Data saved");
	}
    });
    res.send(result);
});

app.get("/ThypoonData/All/Sound/get/All", async function(req, res) {
    console.log('in getSoundThypoonData()');
    var collectionName = 'SOUND';
    const result = await typhoonUtils.getTyphoonData(collectionName);
    var data = `frequency,amplitude,timeStamp,timeStampReal\n`; 
    
    for(let k = 0; k < result.length; k++) {
	
	data = data + result[k].sample.frequency + `,` + result[k].sample.amplitude + `,` + result[k].timeStamp + `,` + result[k].timeStampReal +  `\n`;
    }

    //console.log(data);

    fs.writeFile("./SoundLast.csv", data, "utf-8", (err) => {
  	if (err) {
		console.log(err);
	} else {
	 	console.log("Data saved");
	}
    });

    res.send(result);
});

app.get("/ThypoonData/All/SoundMeter/get/All", async function(req, res) {
    console.log('in getSoundThypoonData()');
    var collectionName = 'SOUNDMETER';
    const result = await typhoonUtils.getTyphoonData(collectionName);
    var data = `frequency,amplitude,timeStamp,timeStampReal\n`; 
    
    for(let k = 0; k < result.length; k++) {
	
	data = data + result[k].sample.frequency + `,` + result[k].sample.amplitude + `,` + result[k].timeStamp + `,` + result[k].timeStampReal +  `\n`;
    }

    //console.log(data);

    fs.writeFile("./SoundMeterLast.csv", data, "utf-8", (err) => {
  	if (err) {
		console.log(err);
	} else {
	 	console.log("Data saved");
	}
    });

    res.send(result);
});



app.get("/ThypoonData/All/Dcc/get/All", async function(req, res) {
    console.log('in getDccThypoonData()');
    var collectionName = 'DCC';
    const result = await typhoonUtils.getTyphoonData(collectionName);
    var data = `current,timeStamp,timeStampReal\n`; 
    
    for(let k = 0; k < result.length; k++) {
	data = data + result[k].current + `,` + result[k].timeStamp + `,` + result[k].timeStampReal + `\n`;
    }

    //console.log(data);

    fs.writeFile("./DccLast.csv", data, "utf-8", (err) => {
  	if (err) {
		console.log(err);
	} else {
	 	console.log("Data saved");
	}
    });
    
    res.send(result);
});


app.get("/ThypoonData/All/Dcv/get/All", async function(req, res) {
    console.log('in getDcvThypoonData()');
    var collectionName = 'DCV';
    const result = await typhoonUtils.getTyphoonData(collectionName);
    
    var data = `voltage,timeStamp, timeStampReal\n`; 
    
    for(let k = 0; k < result.length; k++) {
	data = data + result[k].voltage + `,` + result[k].timeStamp + `,` + result[k].timeStampReal + `\n`;
    }
    //console.log(data);
    fs.writeFile("./DcvLast.csv", data, "utf-8", (err) => {
  	if (err) {
		console.log(err);
	} else {
	 	console.log("Data saved");
	}
    });

    res.send(result);
});

app.delete("/ThypoonData/All/Imu/delete/All", async function(req, res) {
    console.log('in deleteImuThypoonData()');
    var collectionName = 'IMU';
    const result = await typhoonUtils.deleteThypoonData(collectionName);
    res.send(result);
});

app.delete("/ThypoonData/All/Sound/delete/All", async function(req, res) {
    console.log('in deleteSoundThypoonData()');
    var collectionName = 'SOUND';
    const result = await typhoonUtils.deleteThypoonData(collectionName);
    res.send(result);
});

app.delete("/ThypoonData/All/SoundMeter/delete/All", async function(req, res) {
    console.log('in deleteSoundMeterThypoonData()');
    var collectionName = 'SOUNDMETER';
    const result = await typhoonUtils.deleteThypoonData(collectionName);
    res.send(result);
});


app.delete("/ThypoonData/All/Dcc/delete/All", async function(req, res) {
    console.log('in deleteDccThypoonData()');
    var collectionName = 'DCC';
    const result = await typhoonUtils.deleteThypoonData(collectionName);
    res.send(result);
});

app.delete("/ThypoonData/All/Dcv/delete/All", async function(req, res) {
    console.log('in deleteDcvThypoonData()');
    var collectionName = 'DCV';
    const result = await typhoonUtils.deleteThypoonData(collectionName);
    res.send(result);
});

app.post("/ThypoonData/All/Imu/insert/All", async function(req, res) {
    console.log('in InsertImuThypoonData()');
    imuItem = {
	acc_x: parseFloat(req.query.acc_x),
	acc_y: parseFloat(req.query.acc_y),
	acc_z: parseFloat(req.query.acc_z),
	timeStamp: parseInt(req.query.timeStamp)
    };
    const result = await typhoonUtils.InsertImuItem(imuItem);
    res.send(result);
});

app.post("/ThypoonData/All/Sound/insert/All", async function(req, res) {
    /*console.log('in deleteSoundThypoonData()');
    var collectionName = 'SOUND';
    const result = await typhoonUtils.deleteThypoonData(collectionName);
    */
    res.send('success');
});

app.post("/ThypoonData/All/Dcc/insert/All", async function(req, res) {
    console.log('in InsertDccThypoonData()');
    dccItem = {
	current: parseFloat(req.query.current),
	timeStamp: parseInt(req.query.timeStamp)
    };
    const result = await typhoonUtils.InsertDccItem(dccItem);
    res.send(result);
});

app.post("/ThypoonData/All/Dcv/insert/All", async function(req, res) {
    console.log('in InsertDcvThypoonData()');
    dcvItem = {
	voltage: parseFloat(req.query.voltage),
	timeStamp: parseInt(req.query.timeStamp)
    };
    const result = await typhoonUtils.InsertDcvItem(dcvItem);
    res.send(result);
});


app.get("/ThypoonData/CreateCsvFile", async function(req, res) {
    console.log('in CreateCsvFile()');
    //IMU
    var collectionName = 'IMU';
    var result = await typhoonUtils.getTyphoonDataByTimeStamp(collectionName, req.query.start, req.query.end);
    var data = `acc,timeStamp,timeStampReal\n`; 
    
    for(let k = 0; k < result.length; k++) {
	data = data + result[k].acc + `,` + result[k].timeStamp + `,` + result[k].timeStampReal + `\n`;
    }
    
    fs.writeFile("./Imu" + Date.now() + ".csv", data, "utf-8", (err) => {
  	if (err) {
		console.log(err);
	} else {
	 	console.log("Data saved");
	}
    });

    //SOUND
    collectionName = 'SOUND';
    result = await typhoonUtils.getTyphoonDataByTimeStamp(collectionName, req.query.start, req.query.end);
    data = `frequency,amplitude,timeStamp,timeStampReal\n`; 
    
    for(let k = 0; k < result.length; k++) {
	data = data + result[k].sample.frequency + `,` + result[k].sample.amplitude + `,` + result[k].timeStamp + `,` + result[k].timeStampReal +  `\n`;
    }

    fs.writeFile("./Sound" + Date.now() + ".csv", data, "utf-8", (err) => {
  	if (err) {
		console.log(err);
	} else {
	 	console.log("Data saved");
	}
    });

    //SOUND
    collectionName = 'SOUNDMETER';
    result = await typhoonUtils.getTyphoonDataByTimeStamp(collectionName, req.query.start, req.query.end);
    data = `frequency,amplitude,timeStamp,timeStampReal\n`; 
    
    for(let k = 0; k < result.length; k++) {
	data = data + result[k].sample.frequency + `,` + result[k].sample.amplitude + `,` + result[k].timeStamp + `,` + result[k].timeStampReal +  `\n`;
    }

    fs.writeFile("./SoundMeter" + Date.now() + ".csv", data, "utf-8", (err) => {
  	if (err) {
		console.log(err);
	} else {
	 	console.log("Data saved");
	}
    });


    //DCC
    collectionName = 'DCC';
    result = await typhoonUtils.getTyphoonDataByTimeStamp(collectionName, req.query.start, req.query.end);
    data = `current,timeStamp,timeStampReal\n`; 
    
    for(let k = 0; k < result.length; k++) {
	data = data + result[k].current + `,` + result[k].timeStamp + `,` + result[k].timeStampReal + `\n`;
    }

    fs.writeFile("./Dcc" + Date.now() + ".csv", data, "utf-8", (err) => {
  	if (err) {
		console.log(err);
	} else {
	 	console.log("Data saved");
	}
    });


    //DCV
    collectionName = 'DCV';
    result = await typhoonUtils.getTyphoonDataByTimeStamp(collectionName, req.query.start, req.query.end);
    data = `voltage,timeStamp, timeStampReal\n`; 
    
    for(let k = 0; k < result.length; k++) {
	data = data + result[k].voltage + `,` + result[k].timeStamp + `,` + result[k].timeStampReal + `\n`;
    }
    
    fs.writeFile("./Dcv" + Date.now() + ".csv", data, "utf-8", (err) => {
  	if (err) {
		console.log(err);
	} else {
	 	console.log("Data saved");
	}
    });

    res.send("success");
});

app.listen(4058, function () {
  console.log("Web listener server listens on port 4058");
});

