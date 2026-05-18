const statusElement = document.getElementById('app-status');
const outputElement = document.getElementById('data-output');
const fetchBtn = document.getElementById('fetch-button');

fetchBtn.addEventListener('click', () => {

    statusElement.textContent = 'Status: Fetching data...';
    outputElement.innerHTML = '<p class="placeholder">Loading...</p>';

    // 1. 
    fetch('https://restcountries.com/v3.1/all?fields=name,population')

        // 2. 
        .then(response => {
            return response.json();
        })

       // 3. 
        .then(data => {

            statusElement.textContent = 'Status: Success! Loaded ' + data.length + ' countries.';

            let htmlList = '<ul>';

            data.forEach(country => {
                const name = country.name.common;
                const population = country.population.toLocaleString();

                htmlList += '<li> <span>' + name + '</span> <strong>' + population + '</strong> </li>';
            });

            htmlList += '</ul>';

            outputElement.innerHTML = htmlList;
        })

        // 4. 
        .catch(error => {
            statusElement.textContent = 'Status: FAILED';
            
            outputElement.innerHTML = '<div class="error-msg">' +  'Error: ' + error.message + '</div>';
        });
});