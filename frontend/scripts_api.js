// This file is a modified version of scripts.js that uses API instead of localStorage
// It keeps all the frontend logic but replaces localStorage calls with API calls

// Copy the entire scripts.js content here and replace:
// 1. saveMerchant() - use saveMerchantToAPI()
// 2. viewMerchants() - use getMerchants()
// 3. loadLockedH3Data() - use getLatestMerchantH3Data()
// 4. validateLocation() - use validateLocationAPI()

// For now, we'll create a wrapper that loads the original scripts.js
// and then overrides the specific functions that need API calls

// Load API client first
// Then load original scripts.js
// Then override functions

