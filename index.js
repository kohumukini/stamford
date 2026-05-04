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

const locationsMap = new Map([
    ["Seattle", [47.54, -122.11]],
    ["Spokane", [47.69, -117.34]],
    ["Tri-Cities", [45.99, -118.18]]
]);

const locationMarkersLayer = L.layerGroup(); 
let showMarkers = false; 

function showLocations() {
    locationMarkersLayer.clearLayers(); 

    for (let [city, coordinates] of locationsMap) {
        L.marker(coordinates).bindPopup(`<b>${city}</b>`).addTo(locationMarkersLayer); 
    }

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