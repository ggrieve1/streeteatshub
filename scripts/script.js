// Initialize Mapbox map after the DOM content is loaded
document.addEventListener("DOMContentLoaded", function() {
  // Initialize Mapbox map
  mapboxgl.accessToken = 'pk.eyJ1IjoiZ2dyaWV2ZTEiLCJhIjoiY2x0Y2JldHRnMGV5MjJrbnNyaTd2dGFxZyJ9.SchDEdmDC5yMa9MnHyukdA';
  const map = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-86.456017, 36.976524],
      zoom: 12
  });

  // Function to get the day of the week from a given date
  function getDayOfWeek(dayOfMonth, month, year) {
      const date = new Date(year, month - 1, dayOfMonth);
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayIndex = date.getDay();
      return daysOfWeek[dayIndex];
  }

  // Keep track of the previously clicked card
  let previousCard;

  // Listen for the 'load' event on the map before executing any map-related code
  map.on('load', function() {
      // Define marker variable outside of the geocodeAndAddMarker function
      let marker;

      // Function to geocode an address and add a marker to the map
      function geocodeAndAddMarker(address, job, truckName, truckColor) {
          fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}`)
              .then(response => response.json())
              .then(data => {
                  const coordinates = data.features[0].geometry.coordinates;
                  console.log('Coordinates:', coordinates); // Log coordinates

                  // Create the marker
                  marker = new mapboxgl.Marker({ color: truckColor }) // Set marker color
                      .setLngLat(coordinates)
                      .addTo(map);
                  console.log('Marker added:', marker); // Log marker

                  // Add popup with job information
                  const popup = new mapboxgl.Popup()
                      .setHTML(`<h5>${truckName}</h5><h6>${job.jobTitle}</h6><p>${job.startTime} - ${job.endTime}</p><p>${job.businessName}</p>`);

                  // Attach popup to marker
                  marker.setPopup(popup);
                  console.log('Popup added:', popup); // Log popup

                  // Move the map to the location of the marker when clicked
                  marker.getElement().addEventListener('click', () => {
                      console.log('Marker clicked:', coordinates);

                      // Fly to the location of the marker
                      map.flyTo({
                          center: coordinates,
                          essential: true // Ensure smooth transition
                      });
                  });
              })
              .catch(error => {
                  console.error('Error geocoding address:', error);
              });
      }

      // Function to populate cards based on data
function populateCards(dataArray) {
    const currentDate = new Date();
    const currentDay = currentDate.getDate();
    const currentMonth = currentDate.getMonth() + 1; // Months are zero-indexed
    const currentYear = currentDate.getFullYear();

    const cardContainer = document.querySelector('.card-container');
    if (!cardContainer) {
        console.error('Card container not found.');
        return;
    }

    if (!dataArray || !Array.isArray(dataArray)) {
        console.error('Invalid data array.');
        return;
    }

    dataArray.forEach(data => {
        console.log('Data:', data); // Log data to check its structure
        if (!data.days || !Array.isArray(data.days)) {
            console.error('Invalid days data for truck:', data.truckName);
            return;
        }

        data.days.forEach(day => {
            console.log('Day:', day); // Log day to check its structure
            if (day.dayOfMonth === currentDay && day.jobs && Array.isArray(day.jobs)) {
                const truckName = data.truckName;
                const dayOfWeek = getDayOfWeek(day.dayOfMonth, currentMonth, currentYear);
                day.jobs.forEach(job => {
                    if (!job.truckColor) {
                        console.error('Truck color not specified for job:', job);
                        return;
                    }
                    const card = document.createElement('div');
                    card.classList.add('card');
                    card.classList.add(`truck-${job.truckColor}`); // Add class based on truck color
                    card.innerHTML = `
                       <div class="card-body">
                            <h5 class="card-title">${truckName}</h5>
                            <h6 class="card-subtitle mb-2 text-muted">${job.jobTitle}</h6>
                            <p class="card-text">
                                ${job.address ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/></svg>' : ''}
                                ${job.startTime} - ${job.endTime}
                            </p>
                            <p class="card-text">
                            ${job.address ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg>' : ''}

            ${job.address}
                            </p>
                            <p class="card-text">${job.businessName}</p>
                    `;
                    // Append the card to your card container
                    cardContainer.appendChild(card);

                    // Add click event listener to the card
                    card.addEventListener('click', () => {
                        // Remove glow from previous card
                        if (previousCard) {
                            previousCard.style.boxShadow = 'none';
                        }

                        // Get the marker color
                        const markerColor = job.truckColor;

                        // Set the card glow color to match the marker color
                        card.style.boxShadow = `0 0 20px ${markerColor}`;

                        // Set the current card as the previous card
                        previousCard = card;

                        updateMap(job.address, job);
                    });

                    // Add glow effect to the card
                    card.classList.add('card-glow');

                    // Geocode the address and add marker to the map
                    geocodeAndAddMarker(job.address, job, truckName, job.truckColor);
                });
            }
        });
    });
}


      // Define the updateMap function
function updateMap(address, job) {
    fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}`)
        .then(response => response.json())
        .then(data => {
            const coordinates = data.features[0].geometry.coordinates;

            // Fly to the location of the marker
            map.flyTo({
                center: coordinates,
                zoom: 14, // Zoom in a little closer
                essential: true // Ensure smooth transition
            });

        })
        .catch(error => {
            console.error('Error fetching location data:', error);
        });
}


      // Array of JSON file paths
      const jsonFilePaths = ['../json/wrap-and-roll.json', '../json/truck-2.json'];

      // Fetch data from JSON files and populate cards
      Promise.all(jsonFilePaths.map(filePath => fetch(filePath).then(response => response.json())))
          .then(dataArrays => {
              console.log('Data Arrays:', dataArrays); // Log data arrays to check their content
              dataArrays.forEach(dataArray => {
                  console.log('Data Array:', dataArray); // Log data array to check its content
                  populateCards(dataArray);
              });
          })
          .catch(error => {
              console.error('Error fetching JSON data:', error);
          });

  });
});
