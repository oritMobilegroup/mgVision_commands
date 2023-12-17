document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('data-form');
  const responseDiv = document.getElementById('response');
  const responseDiv1 = document.getElementById('response1');

  const resetButton = document.getElementById('reset-button');

  // Function to save IMEI
  const saveIMEI = async (imei) => {
    try {
      const saveResponse = await fetch('http://34.241.178.69:4062/api/save-imei', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ IMEI: imei }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(`Error saving IMEI: ${errorData.error || 'Unknown error'}`);
      }

      console.log('IMEI saved successfully');
    } catch (error) {
      console.error(error);
    }
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    responseDiv.innerText = 'Sending request...';

    const imei = form.imei.value;
    // const command = form.command.value;

    try {
      await saveIMEI(imei);

      // // Initial request to start the process
      // const initialResponse = await fetch(`http://34.241.178.69:4062/api/retrieve`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({}),
      // });

      // if (!initialResponse.ok) {
      //   const errorData = await initialResponse.json();
      //   throw new Error(`Error: ${errorData.error || 'Unknown error'}`);
      // }

      // Function to poll for updates
      const pollForUpdates = async () => {
        try {
          const response = await fetch(`http://34.241.178.69:4062/api/retrieve`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
          });

          if (response.ok) {
            const data = await response.json();
            console.log(data)
            if (data.STATUS === 'done') {

              // Stop polling when the condition is met
              responseDiv.innerText = JSON.stringify(data.RESULT);
              responseDiv1.innerText = JSON.stringify(data.COMMAND);

            } else {
              // Continue polling after a 10-second delay
              setTimeout(pollForUpdates, 10);
            }
          } else {
            const errorData = await response.json();
            throw new Error(`Error: ${errorData.error || 'Unknown error'}`);
          }
        } catch (error) {
          console.error(error);
          responseDiv.innerText = 'An error occurred while making the request.';
        }
      };

      // Start polling for updates
      pollForUpdates();
    } catch (error) {
      console.error(error);
      responseDiv.innerText = 'An error occurred while making the request.';
    }
  });

  resetButton.addEventListener('click', () => {
    form.reset();
    responseDiv.innerText = '';
    responseDiv1.innerText = '';

  });
  const saveResult = async (result) => {
    try {
      const saveResponse = await fetch('http://34.241.178.69:4062/api/save-result', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ RESULT: result }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(`Error saving IMEI: ${errorData.error || 'Unknown error'}`);
      }

      console.log('result saved successfully');
    } catch (error) {
      console.error(error);
    }
  };
  
});
