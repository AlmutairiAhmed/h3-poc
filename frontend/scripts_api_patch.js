/**
 * API Patch for scripts.js
 * This file overrides localStorage functions with API calls
 * Include this AFTER scripts.js in HTML files
 */

// Override saveMerchant to use API
const originalSaveMerchant = window.saveMerchant;
window.saveMerchant = async function(event) {
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
        notes: document.getElementById('notes').value || ''
    };
    
    try {
        // Save to API
        await saveMerchantToAPI(formData);
        
        // Show success message
        document.getElementById('successMessage').style.display = 'block';
        document.getElementById('errorMessage').style.display = 'none';
        
        // Reset form after 2 seconds
        setTimeout(() => {
            document.getElementById('merchantForm').reset();
            clearSelectedHexagons();
            document.getElementById('successMessage').style.display = 'none';
        }, 2000);
    } catch (error) {
        alert('❌ خطأ في حفظ البيانات: ' + error.message);
        document.getElementById('errorMessage').style.display = 'block';
        document.getElementById('successMessage').style.display = 'none';
    }
};

// Override viewMerchants to use API
const originalViewMerchants = window.viewMerchants;
window.viewMerchants = async function() {
    try {
        const merchants = await getMerchants();
        
        if (merchants.length === 0) {
            alert('لا توجد بيانات تجار محفوظة');
            return;
        }
        
        // Convert to CSV format for download
        const csv = Papa.unparse(merchants.map(m => ({
            merchantName: m.merchant_name,
            merchantId: m.merchant_id,
            phone: m.phone,
            email: m.email || '',
            address: m.address || '',
            h3Indices: m.h3_indices.join(','),
            h3Resolution: m.h3_resolution,
            businessType: m.business_type || '',
            status: m.status,
            notes: m.notes || '',
            createdAt: m.created_at
        })), { header: true });
        
        // Create CSV download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'merchants_' + new Date().toISOString().split('T')[0] + '.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.table(merchants);
        alert('تم تحميل ملف CSV. يمكنك أيضاً فتح Console لرؤية البيانات.');
    } catch (error) {
        alert('❌ خطأ في جلب البيانات: ' + error.message);
    }
};

// Override goToCustomerPage to save merchant ID
const originalGoToCustomerPage = window.goToCustomerPage;
window.goToCustomerPage = async function() {
    if (selectedH3Hexagons.size === 0) {
        alert('الرجاء تحديد منطقة الدفع (H3) على الأقل');
        return;
    }
    
    const h3Indices = Array.from(selectedH3Hexagons.keys());
    const firstH3 = Array.from(selectedH3Hexagons.values())[0];
    const merchantId = document.getElementById('merchantId').value;
    
    if (!merchantId) {
        alert('الرجاء إدخال معرف التاجر أولاً');
        return;
    }
    
    // Save merchant ID for customer page
    sessionStorage.setItem('currentMerchantId', merchantId);
    
    window.location.href = '/customer';
};

// Override loadLockedH3Data to use API
const originalLoadLockedH3Data = window.loadLockedH3Data;
window.loadLockedH3Data = async function() {
    try {
        // Try to get merchant ID from sessionStorage, otherwise get latest
        const merchantId = sessionStorage.getItem('currentMerchantId');
        let h3Data;
        
        if (merchantId) {
            h3Data = await getMerchantH3Data(merchantId);
        } else {
            h3Data = await getLatestMerchantH3Data();
        }
        
        if (!h3Data) {
            document.getElementById('validationStatus').style.display = 'block';
            document.getElementById('validationStatus').className = 'validation-status invalid';
            document.getElementById('validationStatus').textContent = '❌ لم يتم تحديد منطقة دفع. يرجى العودة إلى صفحة التاجر.';
            return false;
        }
        
        // Store in lockedH3Data format
        lockedH3Data = {
            h3Indices: h3Data.h3_indices,
            resolution: h3Data.h3_resolution,
            merchantId: h3Data.merchant_id
        };
        
        // Display locked area info
        document.getElementById('lockedH3Display').textContent = `H3: ${h3Data.h3_indices.length} منطقة`;
        document.getElementById('lockedLocationDisplay').textContent = `عدد المناطق: ${h3Data.h3_indices.length}`;
        document.getElementById('lockedAreaInfo').style.display = 'block';
        
        // Draw locked areas on map
        drawLockedArea(h3Data.h3_indices);
        
        return true;
    } catch (error) {
        console.error('Error loading H3 data:', error);
        document.getElementById('validationStatus').style.display = 'block';
        document.getElementById('validationStatus').className = 'validation-status invalid';
        document.getElementById('validationStatus').textContent = '❌ خطأ في تحميل بيانات منطقة الدفع.';
        return false;
    }
};

// Override validateLocation to use API
const originalValidateLocation = window.validateLocation;
window.validateLocation = async function() {
    if (!lockedH3Data || !lockedH3Data.merchantId) {
        if (!await loadLockedH3Data()) return;
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
            document.getElementById('customerCoordinates').value = `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
        }
    }
    
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
    
    try {
        // Validate via API
        const validationResult = await validateLocationAPI(
            coords.lat,
            coords.lng,
            lockedH3Data.merchantId
        );
        
        // Get H3 index for display
        const currentH3Index = String(h3.latLngToCell(coords.lat, coords.lng, lockedH3Data.resolution));
        
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
        
        // Update validation status
        const statusDiv = document.getElementById('validationStatus');
        statusDiv.style.display = 'block';
        
        if (validationResult.is_valid) {
            statusDiv.className = 'validation-status valid';
            statusDiv.textContent = validationResult.message;
            isValidLocation = true;
        } else {
            statusDiv.className = 'validation-status invalid';
            statusDiv.textContent = validationResult.message;
            isValidLocation = false;
        }
    } catch (error) {
        alert('❌ خطأ في التحقق من الموقع: ' + error.message);
        isValidLocation = false;
    }
};

