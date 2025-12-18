// Common JavaScript functions for H3 Payment System

/**
 * Parse coordinates from input string
 * Supports both "lat, lng" and "lng, lat" formats
 */
function parseCoordinates(input) {
    if (!input || input.trim() === '') return null;
    
    const cleanInput = input.trim().replace(/\s+/g, ' ');
    const commaIndex = cleanInput.indexOf(',');
    if (commaIndex === -1) return null;
    
    const leftPart = cleanInput.substring(0, commaIndex).trim();
    const rightPart = cleanInput.substring(commaIndex + 1).trim();
    
    const first = parseFloat(leftPart);
    const second = parseFloat(rightPart);
    
    if (isNaN(first) || isNaN(second)) return null;
    
    // Auto-detect format based on value ranges
    const firstIsLat = first >= -90 && first <= 90;
    const secondIsLng = second >= -180 && second <= 180;
    
    if (firstIsLat && secondIsLng) {
        return { lat: first, lng: second };
    } else {
        return { lat: second, lng: first };
    }
}

/**
 * Initialize map with default location
 */
function initializeMap(mapId, defaultLat = 24.7136, defaultLng = 46.6753, defaultZoom = 13) {
    const map = L.map(mapId).setView([defaultLat, defaultLng], defaultZoom);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    return map;
}

/**
 * Draw H3 hexagon on map
 */
function drawH3Hexagon(map, h3Index, resolution, options = {}) {
    const defaultOptions = {
        color: '#28a745',
        fillColor: '#28a745',
        fillOpacity: 0.4,
        weight: 3,
        opacity: 0.8
    };
    
    const style = { ...defaultOptions, ...options };
    
    try {
        const hexBoundary = h3.cellToBoundary(h3Index, true);
        const polygonCoords = hexBoundary.map(coord => [coord[1], coord[0]]);
        
        const hexLayer = L.polygon(polygonCoords, style).addTo(map);
        
        // Get center and add marker
        const center = h3.cellToLatLng(h3Index);
        const marker = L.marker([center[0], center[1]], {
            icon: L.divIcon({
                html: `<div style="background: ${style.color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })
        }).addTo(map);
        
        return { layer: hexLayer, marker: marker };
    } catch (error) {
        console.error('Error drawing H3 hexagon:', error);
        return null;
    }
}

/**
 * Get adjacent H3 hexagons
 */
function getAdjacentHexagons(h3Index, radius = 1) {
    try {
        return h3.gridDisk(h3Index, radius);
    } catch (error) {
        console.error('Error getting adjacent hexagons:', error);
        return [];
    }
}

/**
 * Validate if location is in H3 indices
 */
function validateLocationInH3(lat, lng, h3Indices, resolution) {
    try {
        const currentH3Index = h3.latLngToCell(lat, lng, resolution);
        return h3Indices.includes(currentH3Index);
    } catch (error) {
        console.error('Error validating location:', error);
        return false;
    }
}

// ============================================
// MERCHANT PAGE FUNCTIONS
// ============================================

let selectedH3Hexagons = new Map();
let merchantMap = null;
let previewMarker = null;
let previewHexagon = null;

function initializeMerchantPage() {
    merchantMap = initializeMap('map');
    
    // Handle coordinate input
    const coordinatesInput = document.getElementById('coordinates');
    if (coordinatesInput) {
        coordinatesInput.addEventListener('paste', function(e) {
            setTimeout(() => {
                const coords = parseCoordinates(this.value);
                if (coords) {
                    document.getElementById('latitude').value = coords.lat;
                    document.getElementById('longitude').value = coords.lng;
                    showLocationPreview(coords.lat, coords.lng);
                }
            }, 10);
        });
        
        coordinatesInput.addEventListener('blur', function() {
            const coords = parseCoordinates(this.value);
            if (coords) {
                document.getElementById('latitude').value = coords.lat;
                document.getElementById('longitude').value = coords.lng;
                showLocationPreview(coords.lat, coords.lng);
            }
        });
        
        coordinatesInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const coords = parseCoordinates(this.value);
                if (coords) {
                    document.getElementById('latitude').value = coords.lat;
                    document.getElementById('longitude').value = coords.lng;
                    showLocationPreview(coords.lat, coords.lng);
                }
            }
        });
    }
    
    // Click on map
    merchantMap.on('click', function(e) {
        const clickedLat = e.latlng.lat;
        const clickedLng = e.latlng.lng;
        
        document.getElementById('latitude').value = clickedLat.toFixed(6);
        document.getElementById('longitude').value = clickedLng.toFixed(6);
        document.getElementById('coordinates').value = `${clickedLng.toFixed(6)}, ${clickedLat.toFixed(6)}`;
        
        // Show preview on map
        showLocationPreview(clickedLat, clickedLng);
    });
    
    // Update preview when resolution changes
    const resolutionSelect = document.getElementById('resolution');
    if (resolutionSelect) {
        resolutionSelect.addEventListener('change', function() {
            const lat = parseFloat(document.getElementById('latitude').value);
            const lng = parseFloat(document.getElementById('longitude').value);
            if (lat && lng) {
                showLocationPreview(lat, lng);
            }
        });
    }
    
    // Update preview when latitude/longitude inputs change
    const latInput = document.getElementById('latitude');
    const lngInput = document.getElementById('longitude');
    if (latInput && lngInput) {
        const updatePreview = () => {
            const lat = parseFloat(latInput.value);
            const lng = parseFloat(lngInput.value);
            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                showLocationPreview(lat, lng);
            }
        };
        latInput.addEventListener('blur', updatePreview);
        lngInput.addEventListener('blur', updatePreview);
        latInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') updatePreview();
        });
        lngInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') updatePreview();
        });
    }
}

/**
 * Show location preview (marker + H3 hexagon preview)
 */
function showLocationPreview(lat, lng) {
    // Remove old preview
    if (previewMarker) {
        merchantMap.removeLayer(previewMarker);
        previewMarker = null;
    }
    if (previewHexagon) {
        merchantMap.removeLayer(previewHexagon);
        previewHexagon = null;
    }
    
    // Add marker at clicked location
    previewMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            html: '<div style="background: #007bff; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(merchantMap);
    
    // Show preview H3 hexagon if resolution is selected
    try {
        const resolution = parseInt(document.getElementById('resolution').value) || 9;
        const h3Index = h3.latLngToCell(lat, lng, resolution);
        const hexBoundary = h3.cellToBoundary(h3Index, true);
        const polygonCoords = hexBoundary.map(coord => [coord[0], coord[1]]);
        
        previewHexagon = L.polygon(polygonCoords, {
            color: '#007bff',
            fillColor: '#007bff',
            fillOpacity: 0.2,
            weight: 2,
            opacity: 0.6,
            dashArray: '5, 5'
        }).addTo(merchantMap);
    } catch (error) {
        console.error('Error showing H3 preview:', error);
    }
}

function addH3Hexagon() {
    const lat = parseFloat(document.getElementById('latitude').value);
    const lng = parseFloat(document.getElementById('longitude').value);
    const resolution = parseInt(document.getElementById('resolution').value);
    
    if (isNaN(lat) || isNaN(lng)) {
        alert('الرجاء إدخال إحداثيات صحيحة');
        return;
    }
    
    try {
        const h3Index = h3.latLngToCell(lat, lng, resolution);
        
        if (!h3Index) {
            throw new Error('فشل تحويل الإحداثيات');
        }
        
        // Check if already selected
        if (selectedH3Hexagons.has(h3Index)) {
            alert('هذا H3 محدد مسبقاً');
            return;
        }
        
        // Draw hexagon on map
        const hexBoundary = h3.cellToBoundary(h3Index, true);
        const polygonCoords = hexBoundary.map(coord => [coord[1], coord[0]]);
        
        const hexLayer = L.polygon(polygonCoords, {
            color: '#28a745',
            fillColor: '#28a745',
            fillOpacity: 0.4,
            weight: 3,
            opacity: 0.8
        }).addTo(merchantMap);
        
        const marker = L.marker([lat, lng], {
            icon: L.divIcon({
                html: '<div style="background: #28a745; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                iconSize: [12, 12],
                iconAnchor: [6, 6]
            })
        }).addTo(merchantMap);
        
        // Store hexagon data
        selectedH3Hexagons.set(h3Index, {
            layer: hexLayer,
            marker: marker,
            h3Index: h3Index,
            resolution: resolution,
            lat: lat,
            lng: lng
        });
        
        updateH3Display();
        
        // Fit bounds to show all selected hexagons
        if (selectedH3Hexagons.size > 0) {
            const group = new L.featureGroup(Array.from(selectedH3Hexagons.values()).map(h => h.layer));
            merchantMap.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
        
    } catch (error) {
        alert('خطأ: ' + error.message);
    }
}

function addAdjacentHexagons() {
    if (selectedH3Hexagons.size === 0) {
        alert('الرجاء إضافة H3 واحد على الأقل أولاً');
        return;
    }
    
    const resolution = parseInt(document.getElementById('resolution').value);
    const addedHexagons = [];
    
    // Get all currently selected H3 indices
    const currentIndices = Array.from(selectedH3Hexagons.keys());
    
    // For each selected hexagon, get its neighbors
    currentIndices.forEach(h3Index => {
        try {
            const neighbors = h3.gridDisk(h3Index, 1);
            
            neighbors.forEach(neighborIndex => {
                // Skip if already selected
                if (!selectedH3Hexagons.has(neighborIndex)) {
                    // Get center of neighbor hexagon
                    const center = h3.cellToLatLng(neighborIndex);
                    const lat = center[0];
                    const lng = center[1];
                    
                    // Draw hexagon
                    const hexBoundary = h3.cellToBoundary(neighborIndex, true);
                    const polygonCoords = hexBoundary.map(coord => [coord[1], coord[0]]);
                    
                    const hexLayer = L.polygon(polygonCoords, {
                        color: '#28a745',
                        fillColor: '#28a745',
                        fillOpacity: 0.4,
                        weight: 3,
                        opacity: 0.8
                    }).addTo(merchantMap);
                    
                    const marker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            html: '<div style="background: #28a745; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                            iconSize: [12, 12],
                            iconAnchor: [6, 6]
                        })
                    }).addTo(merchantMap);
                    
                    selectedH3Hexagons.set(neighborIndex, {
                        layer: hexLayer,
                        marker: marker,
                        h3Index: neighborIndex,
                        resolution: resolution,
                        lat: lat,
                        lng: lng
                    });
                    
                    addedHexagons.push(neighborIndex);
                }
            });
        } catch (error) {
            console.error('Error getting neighbors:', error);
        }
    });
    
    if (addedHexagons.length > 0) {
        updateH3Display();
        alert(`تم إضافة ${addedHexagons.length} H3 مجاور`);
        
        // Fit bounds
        const group = new L.featureGroup(Array.from(selectedH3Hexagons.values()).map(h => h.layer));
        merchantMap.fitBounds(group.getBounds(), { padding: [50, 50] });
    } else {
        alert('لا توجد H3 مجاورة جديدة لإضافتها');
    }
}

function clearSelectedHexagons() {
    // Remove all layers from map
    selectedH3Hexagons.forEach((data, h3Index) => {
        merchantMap.removeLayer(data.layer);
        merchantMap.removeLayer(data.marker);
    });
    
    selectedH3Hexagons.clear();
    updateH3Display();
}

function updateH3Display() {
    const count = selectedH3Hexagons.size;
    const resolution = count > 0 ? Array.from(selectedH3Hexagons.values())[0].resolution : '-';
    
    document.getElementById('h3Count').textContent = count;
    document.getElementById('h3Resolution').textContent = resolution;
    
    const h3List = document.getElementById('h3List');
    h3List.innerHTML = '';
    
    if (count === 0) {
        document.getElementById('h3Info').style.display = 'none';
        return;
    }
    
    document.getElementById('h3Info').style.display = 'block';
    
    selectedH3Hexagons.forEach((data, h3Index) => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 8px; margin: 5px 0; background: white; border-radius: 4px; border: 1px solid #ddd; font-size: 12px; font-family: monospace;';
        item.innerHTML = `
            <strong>${h3Index}</strong>
            <button onclick="removeH3Hexagon('${h3Index}')" style="float: left; background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">حذف</button>
        `;
        h3List.appendChild(item);
    });
    
    // Update hidden input
    const h3Indices = Array.from(selectedH3Hexagons.keys()).join(',');
    document.getElementById('h3IndicesInput').value = h3Indices;
    document.getElementById('h3ResolutionInput').value = resolution;
}

function removeH3Hexagon(h3Index) {
    const data = selectedH3Hexagons.get(h3Index);
    if (data) {
        merchantMap.removeLayer(data.layer);
        merchantMap.removeLayer(data.marker);
        selectedH3Hexagons.delete(h3Index);
        updateH3Display();
    }
}

function saveMerchant(event) {
    event.preventDefault();
    
    // Validate H3 selection
    if (selectedH3Hexagons.size === 0) {
        alert('الرجاء تحديد منطقة الدفع (H3) على الأقل');
        return;
    }
    
    // Get all H3 indices
    const h3Indices = Array.from(selectedH3Hexagons.keys());
    const firstH3 = Array.from(selectedH3Hexagons.values())[0];
    
    // Get form data
    const formData = {
        merchantName: document.getElementById('merchantName').value,
        merchantId: document.getElementById('merchantId').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value || '',
        address: document.getElementById('address').value || '',
        h3Indices: h3Indices.join(','),
        h3Resolution: firstH3.resolution,
        businessType: document.getElementById('businessType').value || '',
        status: document.getElementById('status').value,
        notes: document.getElementById('notes').value || '',
        createdAt: new Date().toISOString()
    };
    
    // Load existing merchants
    let merchants = [];
    const existingData = localStorage.getItem('merchantsCSV');
    if (existingData) {
        const parsed = Papa.parse(existingData, { header: true });
        merchants = parsed.data.filter(m => m.merchantName);
    }
    
    // Add new merchant
    merchants.push(formData);
    
    // Convert to CSV
    const csv = Papa.unparse(merchants, {
        header: true
    });
    
    // Save to localStorage
    localStorage.setItem('merchantsCSV', csv);
    
    // Also save for customer page (latest merchant)
    localStorage.setItem('lockedH3Data', JSON.stringify({
        h3Indices: h3Indices,
        resolution: firstH3.resolution
    }));
    
    // Show success message
    document.getElementById('successMessage').style.display = 'block';
    document.getElementById('errorMessage').style.display = 'none';
    
    // Reset form after 2 seconds
    setTimeout(() => {
        document.getElementById('merchantForm').reset();
        clearSelectedHexagons();
        document.getElementById('successMessage').style.display = 'none';
    }, 2000);
}

function viewMerchants() {
    const csvData = localStorage.getItem('merchantsCSV');
    if (!csvData) {
        alert('لا توجد بيانات تجار محفوظة');
        return;
    }
    
    // Create CSV download
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'merchants_' + new Date().toISOString().split('T')[0] + '.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Also show in console/alert
    const parsed = Papa.parse(csvData, { header: true });
    console.table(parsed.data);
    alert('تم تحميل ملف CSV. يمكنك أيضاً فتح Console لرؤية البيانات.');
}

function goToCustomerPage() {
    if (selectedH3Hexagons.size === 0) {
        alert('الرجاء تحديد منطقة الدفع (H3) على الأقل');
        return;
    }
    
    const h3Indices = Array.from(selectedH3Hexagons.keys());
    const firstH3 = Array.from(selectedH3Hexagons.values())[0];
    
    // Save for customer page
    localStorage.setItem('lockedH3Data', JSON.stringify({
        h3Indices: h3Indices,
        resolution: firstH3.resolution
    }));
    
    window.location.href = 'customer.html';
}

// ============================================
// CUSTOMER PAGE FUNCTIONS
// ============================================

let customerMap = null;
let lockedH3Data = null;
let currentLocationMarker = null;
let lockedAreaLayer = null;
let currentLocation = null;
let isValidLocation = false;
let customerPreviewMarker = null;

function initializeCustomerPage() {
    customerMap = initializeMap('map');
    
    // Initialize on page load
    if (!loadLockedH3Data()) {
        return;
    }
    
    // Handle coordinate input
    const customerCoordinates = document.getElementById('customerCoordinates');
    if (customerCoordinates) {
        customerCoordinates.addEventListener('paste', function(e) {
            setTimeout(() => {
                const coords = parseCoordinates(this.value);
                if (coords) {
                    document.getElementById('customerLatitude').value = coords.lat;
                    document.getElementById('customerLongitude').value = coords.lng;
                    showCustomerLocationPreview(coords.lat, coords.lng);
                }
            }, 10);
        });
        
        customerCoordinates.addEventListener('blur', function() {
            const coords = parseCoordinates(this.value);
            if (coords) {
                document.getElementById('customerLatitude').value = coords.lat;
                document.getElementById('customerLongitude').value = coords.lng;
                showCustomerLocationPreview(coords.lat, coords.lng);
            }
        });
        
        customerCoordinates.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const coords = parseCoordinates(this.value);
                if (coords) {
                    document.getElementById('customerLatitude').value = coords.lat;
                    document.getElementById('customerLongitude').value = coords.lng;
                    showCustomerLocationPreview(coords.lat, coords.lng);
                    validateLocation();
                }
            }
        });
    }
    
    // Handle latitude/longitude inputs
    const latInput = document.getElementById('customerLatitude');
    const lngInput = document.getElementById('customerLongitude');
    if (latInput && lngInput) {
        const updatePreview = () => {
            const lat = parseFloat(latInput.value);
            const lng = parseFloat(lngInput.value);
            if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
                document.getElementById('customerCoordinates').value = `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
                showCustomerLocationPreview(lat, lng);
            }
        };
        latInput.addEventListener('blur', updatePreview);
        lngInput.addEventListener('blur', updatePreview);
        latInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') updatePreview();
        });
        lngInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') updatePreview();
        });
    }
    
    // Click on map to select location
    customerMap.on('click', function(e) {
        const clickedLat = e.latlng.lat;
        const clickedLng = e.latlng.lng;
        
        document.getElementById('customerLatitude').value = clickedLat.toFixed(6);
        document.getElementById('customerLongitude').value = clickedLng.toFixed(6);
        document.getElementById('customerCoordinates').value = `${clickedLng.toFixed(6)}, ${clickedLat.toFixed(6)}`;
        
        // Show preview on map
        showCustomerLocationPreview(clickedLat, clickedLng);
    });
}

/**
 * Show customer location preview (marker)
 */
function showCustomerLocationPreview(lat, lng) {
    // Remove old preview marker
    if (customerPreviewMarker) {
        customerMap.removeLayer(customerPreviewMarker);
        customerPreviewMarker = null;
    }
    
    // Add marker at location
    customerPreviewMarker = L.marker([lat, lng], {
        icon: L.divIcon({
            html: '<div style="background: #007bff; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(customerMap);
    
    // Pan to location
    customerMap.setView([lat, lng], customerMap.getZoom());
}

function loadLockedH3Data() {
    const stored = localStorage.getItem('lockedH3Data');
    if (!stored) {
        document.getElementById('validationStatus').style.display = 'block';
        document.getElementById('validationStatus').className = 'validation-status invalid';
        document.getElementById('validationStatus').textContent = '❌ لم يتم تحديد منطقة دفع. يرجى العودة إلى صفحة التاجر.';
        return false;
    }
    
    lockedH3Data = JSON.parse(stored);
    
    // Handle both old format (single H3) and new format (multiple H3s)
    const h3Indices = Array.isArray(lockedH3Data.h3Indices) 
        ? lockedH3Data.h3Indices 
        : [lockedH3Data.h3Index].filter(Boolean);
    
    // Display locked area info
    document.getElementById('lockedH3Display').textContent = `H3: ${h3Indices.length} منطقة`;
    if (lockedH3Data.lat && lockedH3Data.lng) {
        document.getElementById('lockedLocationDisplay').textContent = `الموقع: ${lockedH3Data.lat.toFixed(6)}, ${lockedH3Data.lng.toFixed(6)}`;
    } else {
        document.getElementById('lockedLocationDisplay').textContent = `عدد المناطق: ${h3Indices.length}`;
    }
    document.getElementById('lockedAreaInfo').style.display = 'block';
    
    // Draw locked areas on map
    drawLockedArea(h3Indices);
    
    return true;
}

function drawLockedArea(h3Indices) {
    if (!h3Indices || h3Indices.length === 0) return;
    
    try {
        // Remove old layers
        if (lockedAreaLayer) {
            if (Array.isArray(lockedAreaLayer)) {
                lockedAreaLayer.forEach(layer => customerMap.removeLayer(layer));
            } else {
                customerMap.removeLayer(lockedAreaLayer);
            }
        }
        
        const layers = [];
        
        // Draw all H3 hexagons
        h3Indices.forEach(h3Index => {
            const result = drawH3Hexagon(customerMap, h3Index, lockedH3Data.resolution, {
                color: '#28a745',
                fillColor: '#28a745',
                fillOpacity: 0.3
            });
            
            if (result) {
                layers.push(result.layer);
            }
        });
        
        lockedAreaLayer = layers;
        
        // Fit bounds to show all areas
        if (layers.length > 0) {
            const group = new L.featureGroup(layers);
            customerMap.fitBounds(group.getBounds(), { padding: [50, 50] });
        }
    } catch (error) {
        console.error('Error drawing locked areas:', error);
    }
}

function getCurrentLocation() {
    if (!navigator.geolocation) {
        alert('المتصفح لا يدعم تحديد الموقع الجغرافي');
        return;
    }
    
    const statusDiv = document.getElementById('validationStatus');
    statusDiv.style.display = 'block';
    statusDiv.className = 'validation-status pending';
    statusDiv.textContent = '⏳ جاري الحصول على الموقع...';
    
    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            currentLocation = { lat, lng };
            
            // Update input fields
            document.getElementById('customerCoordinates').value = `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
            const latInput = document.getElementById('customerLatitude');
            const lngInput = document.getElementById('customerLongitude');
            if (latInput) latInput.value = lat.toFixed(6);
            if (lngInput) lngInput.value = lng.toFixed(6);
            
            // Remove preview marker if exists
            if (customerPreviewMarker) {
                customerMap.removeLayer(customerPreviewMarker);
                customerPreviewMarker = null;
            }
            
            // Update location info
            document.getElementById('currentCoords').textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            
            // Get H3 index
            const currentH3Index = h3.latLngToCell(lat, lng, lockedH3Data.resolution);
            document.getElementById('currentH3').textContent = `H3: ${currentH3Index}`;
            document.getElementById('locationInfo').style.display = 'block';
            
            // Remove old marker
            if (currentLocationMarker) {
                customerMap.removeLayer(currentLocationMarker);
            }
            
            // Add current location marker
            currentLocationMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'current-location-marker',
                    html: '<div style="background: #dc3545; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"></div>',
                    iconSize: [16, 16],
                    iconAnchor: [8, 8]
                })
            }).addTo(customerMap).bindPopup('موقعك الحالي').openPopup();
            
            customerMap.setView([lat, lng], 15);
            
            // Auto-validate
            validateLocation();
        },
        function(error) {
            statusDiv.className = 'validation-status invalid';
            statusDiv.textContent = '❌ فشل الحصول على الموقع: ' + error.message;
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

function validateLocation() {
    if (!lockedH3Data) {
        if (!loadLockedH3Data()) return;
    }
    
    // Try to get coordinates from separate fields first, then combined field
    let coords = null;
    const latInput = document.getElementById('customerLatitude');
    const lngInput = document.getElementById('customerLongitude');
    const coordsInput = document.getElementById('customerCoordinates').value;
    
    if (latInput && lngInput && latInput.value && lngInput.value) {
        const lat = parseFloat(latInput.value);
        const lng = parseFloat(lngInput.value);
        if (!isNaN(lat) && !isNaN(lng)) {
            coords = { lat, lng };
            // Update combined field
            document.getElementById('customerCoordinates').value = `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
        }
    }
    
    // If not found in separate fields, try combined field
    if (!coords && coordsInput) {
        coords = parseCoordinates(coordsInput);
        if (coords && latInput && lngInput) {
            latInput.value = coords.lat;
            lngInput.value = coords.lng;
        }
    }
    
    if (!coords) {
        alert('الرجاء إدخال الإحداثيات أو الحصول على الموقع الحالي');
        return;
    }
    
    currentLocation = coords;
    
    // Remove preview marker if exists
    if (customerPreviewMarker) {
        customerMap.removeLayer(customerPreviewMarker);
        customerPreviewMarker = null;
    }
    
    // Get H3 index for current location
    const currentH3Index = h3.latLngToCell(coords.lat, coords.lng, lockedH3Data.resolution);
    
    // Update location info
    document.getElementById('currentCoords').textContent = `${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`;
    document.getElementById('currentH3').textContent = `H3: ${currentH3Index}`;
    document.getElementById('locationInfo').style.display = 'block';
    
    // Add/update marker
    if (currentLocationMarker) {
        customerMap.removeLayer(currentLocationMarker);
    }
    
    currentLocationMarker = L.marker([coords.lat, coords.lng], {
        icon: L.divIcon({
            className: 'current-location-marker',
            html: '<div style="background: #dc3545; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
        })
    }).addTo(customerMap).bindPopup('موقعك الحالي').openPopup();
    
    // Validate against multiple H3 indices
    const statusDiv = document.getElementById('validationStatus');
    statusDiv.style.display = 'block';
    
    const h3Indices = Array.isArray(lockedH3Data.h3Indices) 
        ? lockedH3Data.h3Indices 
        : [lockedH3Data.h3Index].filter(Boolean);
    
    if (h3Indices.includes(currentH3Index)) {
        statusDiv.className = 'validation-status valid';
        statusDiv.textContent = '✅ التحقق ناجح! موقعك داخل منطقة الدفع المسموحة. يمكنك إتمام الدفع.';
        isValidLocation = true;
    } else {
        statusDiv.className = 'validation-status invalid';
        statusDiv.textContent = '❌ التحقق فشل! موقعك خارج منطقة الدفع المسموحة. لا يمكن إتمام الدفع.';
        isValidLocation = false;
    }
}

function processPayment() {
    // Check if location is selected
    let coords = currentLocation;
    
    if (!coords) {
        // Try to get location from input fields
        const latInput = document.getElementById('customerLatitude');
        const lngInput = document.getElementById('customerLongitude');
        const coordsInput = document.getElementById('customerCoordinates').value;
        
        // Try separate fields first
        if (latInput && lngInput && latInput.value && lngInput.value) {
            const lat = parseFloat(latInput.value);
            const lng = parseFloat(lngInput.value);
            if (!isNaN(lat) && !isNaN(lng)) {
                coords = { lat, lng };
            }
        }
        
        // If not found, try combined field
        if (!coords && coordsInput) {
            coords = parseCoordinates(coordsInput);
        }
        
        if (!coords) {
            alert('❌ الرجاء تحديد موقعك أولاً (عن طريق النقر على الخريطة أو إدخال الإحداثيات)');
            return;
        }
    }
    
    // If location exists but not validated, or location changed, validate it first
    if (!isValidLocation || !currentLocation || 
        (coords.lat !== currentLocation.lat) || (coords.lng !== currentLocation.lng)) {
        // Set current location
        currentLocation = coords;
        // Validate location (this sets isValidLocation synchronously)
        validateLocation();
        
        // Check validation result after a brief moment to let UI update
        setTimeout(() => {
            if (!isValidLocation) {
                alert('❌ لا يمكن إتمام الدفع. موقعك خارج منطقة الدفع المسموحة.\n\nالرجاء اختيار موقع داخل المنطقة الخضراء على الخريطة.');
                return;
            }
            // If valid, proceed with payment
            proceedWithPayment();
        }, 50);
        return;
    }
    
    // Location is valid, proceed with payment
    proceedWithPayment();
}

function proceedWithPayment() {
    // Simulate payment processing
    const statusDiv = document.getElementById('validationStatus');
    statusDiv.style.display = 'block';
    statusDiv.className = 'validation-status pending';
    statusDiv.textContent = '⏳ جاري معالجة الدفع...';
    
    setTimeout(() => {
        statusDiv.className = 'validation-status valid';
        statusDiv.textContent = '✅ تم إتمام الدفع بنجاح! شكراً لك.';
        alert('✅ تم إتمام الدفع بنجاح!\n\nالمبلغ: 100.00 ر.س\nالموقع: ' + currentLocation.lat.toFixed(6) + ', ' + currentLocation.lng.toFixed(6));
    }, 2000);
}
