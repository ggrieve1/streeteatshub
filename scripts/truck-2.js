// Your JavaScript code goes here
document.addEventListener("DOMContentLoaded", function() {
    const cardContainer = document.querySelector('.card-container');
    let geocoder; // Define geocoder variable in the outer scope
    const jobMarkers = [];

    // Function to get the day of the week from a given dayOfMonth
    function getDayOfWeek(dayOfMonth) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // Month is zero-based
        const date = new Date(currentYear, currentMonth, dayOfMonth);
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayIndex = date.getDay();
        return daysOfWeek[dayIndex];
    }

    mapboxgl.accessToken = 'pk.eyJ1IjoiZ2dyaWV2ZTEiLCJhIjoiY2x0Y2JldHRnMGV5MjJrbnNyaTd2dGFxZyJ9.SchDEdmDC5yMa9MnHyukdA';
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [-86.456017, 36.976524], // Centered on Bowling Green, KY
        zoom: 10
    });

    // Fetch data on DOMContentLoaded
    fetchData();

    // Function to fetch data
    function fetchData() {
        fetch('../json/truck-2.json') // Adjust the path to your JSON file
            .then(response => response.json())
            .then(data => {
                console.log('Fetched data:', data); // Add this line to see the fetched data
                populateCards(data);
            })
            .catch(error => {
                console.error('Error fetching data:', error);
            });
    }

    // Function to populate cards
    function populateCards(data) {
        cardContainer.innerHTML = '';
        jobMarkers.forEach(marker => marker.remove());

        if (!data || !Array.isArray(data)) {
            console.error('Invalid data format.');
            return;
        }

        const currentDate = new Date();
        const currentDayOfMonth = currentDate.getDate(); // Get the current day of the month
        const currentDayOfWeek = currentDate.getDay(); // Get the current day of the week (0 = Sunday, 1 = Monday, ...)

        // Determine the start and end days for the current week (Monday to Sunday)
        let startDay = currentDayOfMonth - currentDayOfWeek + 1;
        let endDay = startDay + 6;
        if (currentDayOfWeek === 0) { // If today is Sunday, start from previous Monday
            startDay = currentDayOfMonth - 6;
            endDay = currentDayOfMonth;
        }
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(); // Get the total number of days in the current month
        if (startDay < 1) {
            startDay = 1;
        }
        if (endDay > daysInMonth) {
            endDay = daysInMonth;
        }

        // Filter the truck schedule data to include only the days within the current week
        const currentWeekSchedule = data.filter(truck => {
            return truck.days.some(day => day.dayOfMonth >= startDay && day.dayOfMonth <= endDay);
        });

        // Display the schedule for the current week
        for (let i = startDay; i <= endDay; i++) {
            const truckSchedule = currentWeekSchedule.find(truck => {
                return truck.days.some(day => day.dayOfMonth === i);
            });
            if (truckSchedule) {
                const day = truckSchedule.days.find(day => day.dayOfMonth === i);
                renderCard(truckSchedule, day);
                console.log('Address for day:', day.address);
                if (day && day.address) {
                    // Place marker on map
                    placeMarker(day.address);
                }
            }
        }
    }

    // Function to render cards
function renderCard(truckSchedule, day) {
    const dayOfMonth = day.dayOfMonth;
    const dayOfWeek = getDayOfWeek(dayOfMonth);
    const currentDate = new Date();
    const formattedDate = `${currentDate.getMonth() + 1}/${dayOfMonth}`;

    day.jobs.forEach(job => {
        const card = document.createElement('div');
        card.classList.add('col-md-4');
        card.innerHTML = `
            <div class="card clickable">
                <div class="card-body">
                    <h5 class="card-title">${dayOfWeek} ${formattedDate}</h5>
                    <p class="card-text">
                        ${job.address ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-clock-fill" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71z"/></svg>' : ''}
                        ${job.startTime} - ${job.endTime}
                    </p>
                    <p class="card-address">
                    ${job.address ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-geo-alt-fill" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg>' : ''}

            ${job.address}
            </p>
                    <p class="card-business">${job.businessName}</p>
                </div>
            </div>
        `;
        cardContainer.appendChild(card);

        // Attach event listener to the card
        card.addEventListener('click', () => {
            if (job.address) {
                // Place marker on map
                placeMarker(job.address);
            } else {
                console.error('No address provided for job:', job.jobTitle);
            }
        });
    });
}



    // Function to place marker on map
    function placeMarker(address) {
        if (!geocoder) {
            console.error('Geocoder not initialized.');
            return;
        }

        // Use geocoder to get coordinates
        geocoder.query(address, function(err, result) {
            if (err || !result || !result.features || result.features.length === 0) {
                console.error('Error geocoding address:', address);
                return;
            }

            const coordinates = result.features[0].geometry.coordinates;

            // Create a marker and add it to the map
            const marker = new mapboxgl.Marker()
                .setLngLat(coordinates)
                .addTo(map);

                map.flyTo({
                    center: coordinates,
                    zoom: 14, // Zoom in a little closer
                    essential: true // Ensure smooth transition
                });
        

            // Add marker to jobMarkers array
            jobMarkers.push(marker);
        });
    }

    // Event listener for map load
    map.on('load', function() {
        // Initialize Mapbox Geocoder
        geocoder = new MapboxGeocoder({
            accessToken: mapboxgl.accessToken,
            mapboxgl: mapboxgl
        });

        // Add the geocoder to the map
        map.addControl(geocoder);

        // Hide the geocoder control
        document.querySelector('.mapboxgl-ctrl-geocoder').style.display = 'none';
    });
});
