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

// Defining Filters
const DEFAULT_FILTERS = {
    city: "", 
    service: [], 
    owner: "", 
    state: ""
}

let activeFilters = { ...DEFAULT_FILTERS, service: [] };

function applyFilters(feature) {
    return Object.entries(activeFilters).every(([type, filterValue]) => {
        if (Array.isArray(filterValue) && filterValue.length === 0) return true;
        if (!filterValue || filterValue === "--ALL--") return true; 
        if (!STATION_MAP[type]) return true; 

        const actualValue = STATION_MAP[type](feature); 

        if (Array.isArray(filterValue)) {
            return filterValue.includes(String(actualValue).toUpperCase());
        }

        return String(actualValue).toLowerCase() === String(filterValue).toLowerCase(); 
    })
}

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
    latlng: (f) => {
        const coords = f.geometry.coordinates; 
        return [coords[1], coords[0]];
    },
    call_sign: (f) => f.properties.call_sign, 
    city: (f) => f.properties.city, 
    state: (f) => f.properties.state, 
    frequency: (f) => f.properties.frequency, 
    status: (f) => f.properties.status,
    owner: (f) => f.properties.owner,
    service: (f) => f.properties.service,
    radius: (f) => f.properties.radius_km,
}

// ==========================================
// 4. Station Search & Dropdown Logic
// ==========================================

let licenseeData; 
const limit = 12; 

const stationInput = document.getElementById("station-search");
const stateInput = document.getElementById("state-search");
const cityInput = document.getElementById("city-search");
const stationList = document.getElementById("station-list"); 
const stateList = document.getElementById("state-list"); 
const cityList = document.getElementById("city-list");

function displayList(listElement, inputElement, data, filterText = "", onSelect) {
    const filteredData = data.filter(item => item.toLowerCase().includes(filterText.toLowerCase()));
    const topResults = filteredData.slice(0, limit); 

    listElement.innerHTML = ""; 

    if (topResults.length > 0) {
        listElement.classList.remove("hidden"); 
        topResults.forEach(listItem => {
            let li = document.createElement("li"); 
            li.textContent = listItem; 
            li.addEventListener("mousedown", () => {
                inputElement.value = listItem; 
                listElement.classList.add("hidden");
                onSelect(listItem)
            });

            listElement.appendChild(li);
        });
    } else {
        listElement.classList.add('hidden');
    }
}

stationInput.addEventListener('input', (e) => {
    if (!stationData) return;
    displayList(stationList, stationInput, stationData, e.target.value, (selected) => onFilterChange("owner", selected));
});

stateInput.addEventListener('input', (e) => {
    if (!stateData) return;
    displayList(stateList, stateInput, stateData, e.target.value, (selected) => onStateSelect(selected));
});

cityInput.addEventListener('input', (e) => {
    if (!cityData) return;
    displayList(cityList, cityInput, cityData, e.target.value, (selected) => onFilterChange("city", selected));
});

document.addEventListener('click', (event) => {
    const inputs = [stationInput, stateInput, cityInput];
    const lists = [stationList, stateList, cityList];

    lists.forEach((list, i) => {
        if (event.target !== inputs[i] && event.target !== list) {
            list.classList.add('hidden');
        }
    });
});

function setCheckbox(id, value, checked) {
    document.getElementById(id).checked = checked; 
    if (checked && !activeFilters.service.includes(value)) {
        activeFilters.service.push(value); 
    } else if (!checked) {
        const index = activeFilters.service.indexOf(value); 
        if (index > -1) activeFilters.service.splice(index, 1);
    }
}

// ==========================================
// 4.5 Radio Station Service
// ==========================================
const checkBoxes = document.querySelectorAll('fieldset input[type="checkbox"]'); 

checkBoxes.forEach(checkbox => {
    checkbox.addEventListener("change", function (e) {
        const checkBoxText = e.target.nextElementSibling.textContent.trim(); 

        if (e.target.checked) {
            console.log(`${e.target.nextElementSibling.textContent.trim()} was checked`);

            if (!activeFilters["service"].includes(checkBoxText)) {
                onFilterChange("service", checkBoxText, "array");
            }            
        } else {
            console.log(`${e.target.nextElementSibling.textContent.trim()} was checked`);
            if (activeFilters["service"].includes(checkBoxText)) {
                onFilterChange("service", checkBoxText, "array", true);
            }          
        }
    });
});

// ==========================================
// 5. Leaflet Layer Management
// ==========================================

/**
 * @important Make changes here in the future. This is hard-coded information
 */ 
let geoJsonData = null;
let showMarkers = false; 
let activeCircle = null

const locationMarkersLayer = L.geoJSON(null, {
    filter: feature => applyFilters(feature), 
    onEachFeature: function (feature, layer) {
        layer.on('click', function() {
            if (activeCircle && map.hasLayer(activeCircle)) {
                map.removeLayer(activeCircle); 
            }

            activeCircle = L.circle(STATION_MAP.latlng(feature), {
                radius: STATION_MAP.radius(feature) * 1000, 
                color: 'red', 
                weight: 1, 
                fillOpacity: 0.2
            }).addTo(map);
            
            map.flyTo(STATION_MAP.latlng(feature), 9)
        })

        layer.bindPopup(`
            <strong>${STATION_MAP.call_sign(feature)}</strong><br>
            ${STATION_MAP.city(feature)}, ${STATION_MAP.state(feature)}<br>
            ${STATION_MAP.owner(feature)}<br>
            ${STATION_MAP.frequency(feature)} ${STATION_MAP.service(feature)}
        `);
    }
}).addTo(map); 

function updateMapFilters() {
    if (!geoJsonData) {
        return; 
    }

    locationMarkersLayer.clearLayers(); 

    if (activeCircle && map.hasLayer(activeCircle)) {
        map.removeLayer(activeCircle); 
    }

    if (showMarkers) {
        locationMarkersLayer.addData(geoJsonData); 
    }
}

function onFilterChange(filterKey, newValue, type = null, clear = null) {
    if (type == "array") {
        if (clear) {
            const index = activeFilters[filterKey].indexOf(newValue); 
            activeFilters[filterKey].splice(index, 1); 
        } else {
            activeFilters[filterKey].push(newValue); 
        }
        
        updateMapFilters();
        return; 
    } 

    activeFilters[filterKey] = newValue; 
    updateMapFilters(); 
}

function clearFilters() {
    activeFilters = { ...DEFAULT_FILTERS, service: [] }; 

    checkBoxes.forEach(checkbox => {
        checkbox.checked = false; 
    })
    stationInput.value = ""; 
    stateInput.value = ""; 
    cityInput.value = ""; 

    document.getElementById("radio-am").checked = true;
    activeFilters.service = ["AM"];

    onStateSelect("OH");
    stateInput.value = "OH";
    updateMapFilters(); 
}

function showLocations() {
    locationMarkersLayer.addTo(map); 
    console.log("Location Markers added successfully!");
    showMarkers = true; 
    updateMapFilters();
}

function hideMarkers() {
    showMarkers = false; 
    updateMapFilters();    

    if (map) {
        map.flyTo([40, -95.46], 5);
    } 
}

function onStateSelect(state) {
    if (state != "--ALL--") {
        cityData = geoJsonData.metadata?.cities[state] || []; 
    } else {
        cityData = geoJsonData.metadata?.cities || [];
    }
    cityInput.value = "";
    onFilterChange("state", state);
}

/**
 * @important Set to focus Ohio state
 */

function toggleMarkers() {
    const toggleButton = document.getElementById("toggle-plots"); 
    if (showMarkers) {
        hideMarkers(); 
        toggleButton.textContent = "Show Plots"
    } else {
        showLocations(); 
        map.flyTo([40.361667, -82.741667], 7);
        toggleButton.textContent = "Hide Plots"
    }
}

// ==========================================
// 6. Data Loading & Execution
// ==========================================

async function loadData() { 
    const filePath = './radio_data/all_radio_stations.geojson'; 

    try {
        const response = await fetch(filePath); 
        
        if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`); 

        geoJsonData = await response.json(); 

        stationData = geoJsonData.metadata?.owners || []; 
        stationData = [...new Set(stationData)];
        stationData.unshift("--ALL--");

        stateData = geoJsonData.metadata?.states || []; 
        stateData = [...new Set(stateData)];
        stateData.unshift("--ALL--")

        cityData = geoJsonData.metadata?.cities['OH'] || []; 
        cityData.unshift("--ALL--");

        clearFilters(); 
        console.log(activeFilters);
        toggleMarkers();

        console.log("GeoJSON data loaded and added to layer successfully!");
        
    } catch (error) {
        console.log(`Couldn't load geojson data: ${error}`)
    }
}

loadData(); 