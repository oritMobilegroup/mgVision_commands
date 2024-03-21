const axios = require('axios');
const https = require('https');
const fs = require('fs');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);

const URL_OTOFUSION_TEST_SERVER = 'https://handlers.otofusion.io/api/accountHandler';
const HTTP_POST_TOKEN_OTOFUSION = 'ncr2b4S9YNb7q';

const TIMEOUT_FOR_SENDING_POST_REQ = 5000; // 5 seconds
let TAG = "TestOtofusion.js sendDataTestOtofusionURL";
async function sendDataTestOtofusionURL(json_data, msg_type) {
    
    try {
        // console.log(TAG + 'hilakTEST_yishay sendDataTestOtofusionURL called()');
        // console.log(TAG + 'hilakTEST_yishay send msgType: ' + msg_type + ' and json_data: ' + json_data);

        const url = `${URL_OTOFUSION_TEST_SERVER}?token=${HTTP_POST_TOKEN_OTOFUSION}`;
        const agent = new https.Agent({ rejectUnauthorized: false });

        // Read the JSON data from a file or use it directly if it's a JSON string
        if (!json_data.startsWith('{')) {
            json_data = await readFileAsync(json_data, 'utf-8');
        }

        const config = {
            method: 'post',
            url: url,
            httpsAgent: agent,
            timeout: TIMEOUT_FOR_SENDING_POST_REQ,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            data: json_data,
            
        };

        const response = await axios(config);
        // const responseJson=JSON.stringify(response)
        // console.log( TAG + " responseJson: " + responseJson)
        console.log(TAG + ' Sending "POST" request to URL: ' + url);
        console.log(TAG + ' Post parameters: ' + json_data + ' as JSON');

        if (response.status === 200 || response.status === 201) {
            console.log(TAG + 'hilakTEST_OTOFUSION_NEW_SERVER Response Code: ' + response.status);
            const responseData = response.data;

            if (responseData) { //will enter here if the responseData is not null.
                try {
                    const response_json = JSON.parse(responseData);
                    
                    if (Object.keys(response_json).length === 0) {
                        console.error(TAG + 'Response is empty!');
                        return false;
                    }

                    return true;
                } catch (e) {
                    console.error(TAG + 'Exception JSONException: ' + e.message);
                    return false;
                }
            } else {
                
                console.error(TAG + 'responseData is null!');
                return false;
            }
        } else {
            console.error(TAG + 'Response Code: ' + response.status);
            return false;
        }
    } catch (error) {
        console.error(TAG + 'Error:', error);
        return false;
    }
}

module.exports={sendDataTestOtofusionURL}