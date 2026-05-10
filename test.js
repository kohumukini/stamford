/**
 * @important Consider splitting json files for organization for later sprints
 */

// ==========================================
// 1. Map & Legend Initialization
// ==========================================

const map = L.map('map', { zoomControl: false }).setView([40, -95.46], 5);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19, 
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">Open Street Map</a>'
}).addTo(map)

window.addEventListener('load', () => {
    map.invalidateSize();
});

/*
Optional for dark mode users

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

*/

const legend = L.control({ position: "bottomright" }); 

L.control.zoom({
    position: 'topright'
}).addTo(map); 

// ==========================================
// 2. UI Transitions & Animations
// ==========================================

// Filter Transitions 
let reveals = document.querySelectorAll(".reveal");

reveals.forEach(btn => {
    btn.addEventListener('click', function() {
        this.classList.toggle("active"); 

        const content = this.nextElementSibling; 
        if (content.style.maxHeight) {
            content.style.maxHeight = null;
        } else {
            content.style.maxHeight = content.scrollHeight + "px";
        }
    })
})

// Aside Transition
const filterBar = document.getElementById("filter-bar");
const filterBarToggle = document.getElementById("filter-toggle");

filterBarToggle.addEventListener('click', () => {
    filterBar.classList.toggle('open');
});

// ==========================================
// 3. Data Processing Utilities
// ==========================================

/**
 * @important Build validation functions later 
 * @important Add other variables here later. 
 */

const STATION_MAP = {
    id: (f) => f.properties.id,
    call_sign: (f) => f.properties.call_sign, 
    city: (f) => f.properties.city, 
    state: (f) => f.properties.state, 
    frequency: (f) => f.properties.frequency, 
    status: (f) => f.properties.status,
    owner: (f) => f.properties.owner,
    service: (f) => f.properties.owner,
}

// ==========================================
// 4. Station Search & Dropdown Logic
// ==========================================

const data = []; 
const limit = 8; 

const input = document.getElementById("station-search");
const list = document.getElementById("station-list"); 

function displayList(filterText = "") {
    const filteredData = data.filter(item => item.toLowerCase().includes(filterText.toLowerCase())); 

    let topEightResults = filteredData.slice(0, limit);
    
    list.innerHTML = ""; 

    if (topEightResults.length > 0) {
        // Reveals the list
        list.classList.remove("hidden"); 
        topEightResults.forEach(listItem => {
            let li = document.createElement('li'); 
            li.textContent = listItem; 
            li.onclick = () => {
                input.value = listItem; 
                list.classList.add('hidden'); 
            };
            list.appendChild(li); 
        });
    } else {
        list.classList.add('hidden'); 
    }
}

input.addEventListener('input', (event) => displayList(event.target.value)); 

document.addEventListener('click', (target) => {
    if (target.target !== input) {
        list.classList.add('hidden'); 
    }
})

// ==========================================
// 5. Leaflet Layer Management
// ==========================================

/**
 * @important Make changes here in the future. This is hard-coded information
 */ 
let locationMarkersLayer = L.geoJSON(); 
let stations = null; 
let showMarkers = false; 
let activeCircle = null; 

function showLocations() {
    locationMarkersLayer.addTo(map); 
    console.log("Location Markers added successfully!");
    showMarkers = true; 
}

function hideMarkers() {
    if (locationMarkersLayer && map.hasLayer(locationMarkersLayer)) {
        map.removeLayer(locationMarkersLayer); 
    }

    if (activeCircle && map.hasLayer(activeCircle)) {
        map.removeLayer(activeCircle); 
    }

    if (map) {
        map.flyTo([40, -95.46], 5);
    }

    showMarkers = false; 
}

/**
 * @important Set to focus Washington state
 */

function toggleMarkers() {
    if (showMarkers) {
        hideMarkers(); 
    } else {
        showLocations(); 
        map.flyTo([47.4, -121.5], 7);
    }
}

// ==========================================
// 6. Data Loading & Execution
// ==========================================

const allCities = new Set(); 
const allFrequencies = new Set(); 
const allServices = new Set(); 
const allOwners = new Set(); 

async function loadData() { 
    const filePath = './radio_data/wa_radio_stations.geojson'; 

    try {
        const response = await fetch(filePath); 
        
        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`); 
        }

        stations = await response.json(); 

        stations.features.forEach(station, () => {
            const city = STATION_MAP.city(station); 
            const frequency = STATION_MAP.frequency(station);
            const service = STATION_MAP.service(station); 
            const owner = STATION_MAP.owner(station); 

            if (city) allCities.add(city); 
            if (frequency) allFrequencies.add(frequency); 
            if (service) allServices.add(service); 
            if (owner) allOwners.add(owner); 

        })

        locationMarkersLayer.addData(stations); 
        console.log("GeoJSON data loaded and added to layer successfully!");
        
    } catch (error) {
        console.log(`Couldn't load geojson data: ${error}`)
    }
}

loadData(); 

// Path discovery call

console.log(stations); 