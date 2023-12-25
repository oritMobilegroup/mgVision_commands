
document.addEventListener('DOMContentLoaded', async () => {
    const imeiSelect = document.getElementById('IMEI');
    const resetButton = document.getElementById('reset-button');
  const status = document.getElementById('status');
  
  const allowedReferrer = "http://mgactivities.com:4062/login.html";
  const referringPage = document.referrer;

  if (referringPage !== allowedReferrer) {
    alert("Blocked!!");
    // Redirect to the login page or handle unauthorized access
    window.location.href = "http://mgactivities.com:4062/login.html";
    return;
  }

  // Check if the page is loaded from the authorized page

    // Retrieve the list of IMEIs from the server
    //https://mgactivities.com:4062/
    //http://34.241.178.69:4062
    try {
      const response = await fetch('http://mgactivities.com:4062/api/imeis');
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const imeisData = await response.json();
  
      // Populate the selection element with the returned IMEI
      imeisData.forEach((imei) => {
        const option = document.createElement('option');
        option.value = imei;
        option.text = imei;
        imeiSelect.appendChild(option);
      });
    } catch (error) {
      alert("Error retrieving IMEIs"); // Notify the user about the error with an alert
      console.error('Error retrieving IMEIs:', error.message);
    }
  
    document.getElementById('dataForm').addEventListener('submit', async function (event) {
      event.preventDefault();
      document.getElementById('submit').disabled = true;
      const formData = new FormData(event.target);
      const data = {};
  
      formData.forEach((value, key) => {
        data[key.toUpperCase()] = value;
      });
      // http://mgactivities.com:5001/send-command
      try {
        const response = await fetch('http://mgactivities.com:4062/api/store', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
  
        // Check for errors based on the status code
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 400) {
            console.log(`Error: ${errorData.error}`);
            alert('IMEI already exists in the database'); // Display an alert
          } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
        } else {
          // Read the response body only once
          const resultData = await response.json();
          console.log(resultData.message);         
          
             status.innerText = "waiting the result";

  
          // Check if the STATUS is in progress and start polling
          if (resultData.message === 'Data updated successfully' ) {  
                      pollForResult(data.IMEI);
            // setInterval(resetData, 120000);
            
            
            document.getElementById('submit').disabled = true;


          }
       
        }
      } catch (error) {
        console.error('Error:', error.message);
      }
    });
   resetButton.addEventListener('click', () => {
  // If the button is clicked, clear the timeout
  // clearTimeout(timeoutId);
  // Call resetData function
  resetData();
  document.getElementById('submit').disabled = false;
});
    
    async function resetData() {
      try {
        const imeiInput = document.getElementById('IMEI');
        const imei = imeiInput.value;
    
        const response = await fetch('http://mgactivities.com:4062/api/restart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ IMEI: imei }),
        });
    
        if (response.ok) {
          const result = await response.json();
          console.log(result.message); // Log the server response
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      } catch (error) {
        console.error('Error during data reset:', error);
      }
      status.innerText = ' ';
    
      // Reset input fields or update UI as needed
      document.getElementById('COMMAND').value = '';
      document.getElementById('RESULT').value = '';

    }

    function pollForResult(imei) {
      // Create a flag to track whether the polling should continue
      let pollingEnabled = true;
    
      // Store the interval ID
      const pollingInterval = setInterval(async () => {
        try {
          // Check if polling is still enabled
          if (!pollingEnabled) {
            clearInterval(pollingInterval); // Stop the interval
            return;
          }
          const response = await fetch('http://mgactivities.com:4062/api/retrieve-result', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              IMEI: imei,
            }),
          });
    
          if (response.ok) {
            // Check if the response body is not empty
            if (response.status !== 204) {
              const resultData = await response.json();
    
              // Check if the result is available
              if (resultData.STATUS="done") {
                            pollingEnabled = false;
             document.getElementById('submit').disabled = false;


                console.log(resultData)
                // Update the UI with the retrieved result
                const resultContainer = document.getElementById('RESULT');

                // Replace /n with \n for newline characters
                const resultText = resultData.RESULT.replace(/\/n/g, '\n');
                
                // Set the text content of the result container
                resultContainer.textContent = resultText;
                
                // Apply CSS style to preserve line breaks
                resultContainer.style.whiteSpace = 'pre-line';

                    status.innerText = "";
                    // resetData()

              } else {
                console.log('Result not available yet.');
             document.getElementById('submit').disabled = true;
            setInterval(resetData, 120000);
            status.innerText = "Result not available yet";



              }
            } else {
              console.log('Response is empty.');  // Handle empty response
            }
          } else {
            console.error('Error checking result status');
          }
        } catch (error) {
          console.error('Error during polling:', error);
        }
      }, 10000); // Poll every 5 seconds 
    }
    
  });
  function executeCommand() {
    const imei = document.getElementById('IMEI').value;
    const command = document.getElementById('COMMAND').value;

    fetch("http://mgactivities.com:5001/send-command", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            imei: imei,
            command: command,
        }),
    })
    .then(response => response.json())
    .then(data => {
        // Display the result
        document.getElementById('RESULT').innerText = data.result;
    })
    .catch(error => {
        console.error('Error:', error);
    });
}
  