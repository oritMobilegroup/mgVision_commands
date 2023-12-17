
document.addEventListener('DOMContentLoaded', () => {
  const requestForm = document.getElementById('request-password-form');
  const responseDiv = document.getElementById('response');
  const resetButton = document.getElementById('reset-button');
  // const resetButton1 = document.getElementById('reset-button1');


  requestForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = requestForm.username.value.toLowerCase();

    try {
      const response = await fetch(`https://mgactivities.com:4062/login/${username}`, {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        responseDiv.innerText = data.message;
      } else {
        const errorData = await response.json();
        responseDiv.innerText = `Error: ${errorData.error || 'Unknown error'}`;
      }
    } catch (error) {
      console.error(error);
      responseDiv.innerText = 'An error occurred while making the request.';
    }
  });

  resetButton.addEventListener('click', () => {
    requestForm.reset(); // Reset the form to clear the input fields
    responseDiv.innerText = ''; // Clear the response
  });

  const loginForm = document.getElementById('login-form');
 
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Retrieve username and special password from login form
    // const username = loginForm.username.value;
    const specialPassword = loginForm.specialPassword.value.trim();    
      const username = requestForm.username.value.trim().toLowerCase();

    try {
      const response = await fetch(`https://mgactivities.com:4062/login/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, specialPassword }),
      });

      if (response.ok) {
        // Password is correct, redirect to the INDEX page
        // window.location.href = '/client/index'; // Uncomment to redirect
        responseDiv.innerText = 'Password is correct!';
        window.location.href = 'command.html'; // You can use this to display a message
      } else {
        const errorData = await response.json();
        responseDiv.innerText = `Error: ${errorData.error || 'Unknown error'}`;
      }
    } catch (error) {
      console.error(error);
      responseDiv.innerText = 'An error occurred while making the request.';
    }

  });
  
});
