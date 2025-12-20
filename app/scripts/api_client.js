/**
 * API Client for H3 Payment System
 * Replaces localStorage calls with API calls
 */

const API_BASE_URL = window.location.origin + '/api/v1';

/**
 * Save merchant to API
 */
async function saveMerchantToAPI(merchantData) {
    try {
        const response = await fetch(`${API_BASE_URL}/merchants/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                merchant_name: merchantData.merchantName,
                merchant_id: merchantData.merchantId,
                phone: merchantData.phone,
                email: merchantData.email || null,
                address: merchantData.address || null,
                business_type: merchantData.businessType || null,
                status: merchantData.status || 'active',
                notes: merchantData.notes || null,
                h3_indices: merchantData.h3Indices.split(','),
                h3_resolution: parseInt(merchantData.h3Resolution)
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to save merchant');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error saving merchant:', error);
        throw error;
    }
}

/**
 * Get list of merchants
 */
async function getMerchants() {
    try {
        const response = await fetch(`${API_BASE_URL}/merchants/`);
        if (!response.ok) {
            throw new Error('Failed to fetch merchants');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching merchants:', error);
        throw error;
    }
}

/**
 * Get latest merchant H3 data (for customer page)
 */
async function getLatestMerchantH3Data() {
    try {
        const response = await fetch(`${API_BASE_URL}/merchants/latest/h3-data`);
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error('Failed to fetch H3 data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching H3 data:', error);
        return null;
    }
}

/**
 * Get merchant H3 data by merchant ID
 */
async function getMerchantH3Data(merchantId) {
    try {
        const response = await fetch(`${API_BASE_URL}/merchants/${merchantId}/h3-data`);
        if (!response.ok) {
            throw new Error('Failed to fetch H3 data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching H3 data:', error);
        throw error;
    }
}

/**
 * Validate location against merchant's H3 area
 */
async function validateLocationAPI(latitude, longitude, merchantId) {
    try {
        const response = await fetch(`${API_BASE_URL}/validation/location`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                latitude: latitude,
                longitude: longitude,
                merchant_id: merchantId
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Validation failed');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error validating location:', error);
        throw error;
    }
}

