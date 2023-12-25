const jsonContainer = document.getElementById('json-container');
const editBtn = document.getElementById('edit-btn');
const editForm = document.getElementById('edit-form');
const keyValueList = document.getElementById('key-value-list');
const saveBtn = document.getElementById('save-btn');
const addBtn = document.getElementById('add-btn');
let originalData;
async function fetchAndDisplayJSON() {
    try {
        const response = await fetch('https://mgactivities.com:4062/jsonRoute/json');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        originalData = await response.json();  // Assign the retrieved JSON data to originalData
        displayJSON(originalData);
    } catch (error) {
        alert("json not found");
        console.error('Error retrieving JSON:', error.message);
    }
}

function displayJSON(data) {
    jsonContainer.innerText = JSON.stringify(data, null, 2);
}

document.addEventListener('DOMContentLoaded', async () => {
    // Call the function when the page loads
    console.log('Page loaded. Calling fetchAndDisplayJSON...');
    await fetchAndDisplayJSON();
});


editBtn.addEventListener('click', () => {
  editForm.style.display = 'block';
  jsonContainer.style.display = 'none';

  try {
    if (Object.keys(originalData).length === 0) {
      console.error('Error: JSON is empty');
      return;
    }
    createInputsForObject(originalData);

    // Removed the line that clears existing entries

  } catch (error) {
    console.error('Error parsing JSON in edit mode:', error);
  }
});


function createInputsForObject(obj) {
    Object.entries(obj).forEach(([key, value]) => {
      if (key !== '__v' && key !== '_id') { // Adjust excluded keys as needed
        if (typeof value === 'object') {
          const nestedList = document.createElement('ul');
          keyValueList.appendChild(nestedList);
          createInputsForObject(value, nestedList); // Recursive call for nested objects
        } else {
          const keyInput = createInput('text', key);
          const valueInput = createInput('text', value);
  
          const listItem = document.createElement('li');
          listItem.appendChild(keyInput);
          listItem.appendChild(document.createTextNode(': '));
          listItem.appendChild(valueInput);
  
          keyValueList.appendChild(listItem);
        }
      }
    });
  }

addBtn.addEventListener('click', () => {
    const newKeyInput = createInput('text', '');
    const newValueInput = createInput('text', '');

    const listItem = document.createElement('li');
    listItem.appendChild(newKeyInput);
    listItem.appendChild(document.createTextNode(': '));
    listItem.appendChild(newValueInput);

    keyValueList.appendChild(listItem);
});

saveBtn.addEventListener('click', () => {
    const editedData = {};
    const keyInputs = document.querySelectorAll('#key-value-list input[type="text"]:first-child');
    const valueInputs = document.querySelectorAll('#key-value-list input[type="text"]:last-child');

    for (let i = 0; i < keyInputs.length; i++) {
        editedData[keyInputs[i].value] = valueInputs[i].value;
    }

    // Send edited data to the server using AJAX request
    fetch('https://mgactivities.com:4062/jsonRoute/json', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
    })
        .then(response => response.json())
        .then(data => {
            editForm.style.display = 'none';
            jsonContainer.style.display = 'block';
            displayJSON(data);
        })
        .catch(error => {
            console.error('Error saving JSON:', error);
        });
});

function createInput(type, value) {
    const input = document.createElement('input');
    input.type = type;
    input.value = value;
    return input;
}