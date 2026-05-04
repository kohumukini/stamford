// Map Initialization
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

// Legend Initialization
const legend = L.control({ position: "bottomright" }); 


// Zoom Control
L.control.zoom({
    position: 'topright'
}).addTo(map); 

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

// Section1 Dropdown
const data = ["Washington", "Arizona", "Utah", "Wyoming", "Montana", "California", "Florida", "Maine", "New York"]; 
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

/* Leaflet mark*/ 
/**
 * @important Make changes here in the future. This is hard-coded information
 */ 
const stations = new Map([
    { city: "Olympia", coordinates: [47.03778, -122.90069], dist: 12.4, signal: "Very Strong", frequency: 98.5, color: "rgb(0, 174, 239)" }, 
    { city: "Seattle", coordinates: [47.60621, -122.33207], dist: 12.0, signal: "Very Strong", frequency: 104.5, color: "rgb(0, 174, 239)" }, 
    { city: "Spokane", coordinates: [47.65889, -117.42500], dist: 3.8, signal: "Very Strong", frequency: 106.5, color: "rgb(0, 174, 239)" }, 
    { city: "Tri-Cities", coordinates: [46.22263, -119.18307], dist: 56.6, signal: "Moderate", frequency: 93.3, color: "rgb(0, 174, 239)" }, 
    { city: "Longview", coordinates: [46.14011, -122.93789], dist: 51.3, signal: "Moderate", frequency: 90.3, color: "rgb(0, 174, 239)" }, 
])

const locationMarkersLayer = L.layerGroup(); 
let showMarkers = false; 
let activeCircle = null;

function showLocations() {
    locationMarkersLayer.clearLayers(); 

    const signalStyles = {
        "very strong": { opacity: 0.5, color: '#e91e63' },
        "strong":      { opacity: 0.3, color: '#e91e63' },
        "moderate":    { opacity: 0.15, color: '#e91e63' },
        "weak":        { opacity: 0.08, color: '#666666' }, 
        "very weak":   {opacity: 0.05, color: '#777777'}
    };

    stations.forEach(station => {
        const marker = L.marker(station.coordinates).bindPopup(`
            <b>${station.city}</b></br>
            Status: ${station.signal.toUpperCase()}<br>
            Tower Distance: ${station.dist} miles
            Frequency: ${station.frequency}
            `);
        const signalStrength = signalStyles[station.signal.toLowerCase()] || signalStyles["strong"]; 
        const radius = station.dist * 1609.344;

        
    })

    locationMarkersLayer.addTo(map); 
    showMarkers = true; 
}

function hideMarkers() {
    map.removeLayer(locationMarkersLayer);
    showMarkers = false; 
}

function toggleMarkers() {
    if (showMarkers) {
        hideMarkers(); 
    } else {
        showLocations(); 
    }
}