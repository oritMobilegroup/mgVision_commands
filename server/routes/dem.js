const axios = require('axios');

async function pollingRequest() {
  const baseUrl = 'http://34.241.178.69:4062/api/retrieve';
  const device_id = getIMEI(); // Assuming getIMEI() is a function to retrieve the IMEI

  const requestBody = {
    IMEI: device_id,
  };

  console.log('request body =', JSON.stringify(requestBody));

  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await axios.post(baseUrl, requestBody, { headers });

    console.log('response =', response.data.toLowerCase());

    if (!response.data || response.data.toLowerCase().includes('no data') || response.data.toLowerCase().includes('"command":"1"')) {
      return;
    }

    stopPolling();
    runCommand('');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

function getIMEI() {
  // Implement your logic to retrieve the IMEI here
  // For example, return a hardcoded IMEI for testing purposes
  return '123456789012345';
}

// Example usage
pollingRequest();
