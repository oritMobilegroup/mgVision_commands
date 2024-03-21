// imei-search.js
const imeiInput = document.getElementById('imei-search-input');
const findJsonBtn = document.getElementById('find-json-btn');

findJsonBtn.addEventListener('click', async () => {
    const enteredImei = imeiInput.value;
    if (enteredImei) {
        // Redirect to the JSON display page with the specified IMEI
        window.location.href = `https://mgactivities.com:4062/jsonRoute/json/${enteredImei}`;
    } else {
        alert('Please enter an IMEI.');
    }
});
