# AhmedJ POC for H3 - Payment Location Validation System

A payment validation system that uses H3 hexagons to restrict payment transactions to specific geographic areas.

## 🚀 How to Run the Project

### Option 1: Open Directly in Browser (Simplest)

1. **Open the Merchant Page:**
   - Double-click `merchant.html` or
   - Right-click → Open with → Your web browser (Chrome, Firefox, Safari, etc.)

2. **Or use a local web server (Recommended):**

   **Using Python:**
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```
   Then open: `http://localhost:8000/merchant.html`

   **Using Node.js (if you have it):**
   ```bash
   npx http-server -p 8000
   ```
   Then open: `http://localhost:8000/merchant.html`

   **Using PHP:**
   ```bash
   php -S localhost:8000
   ```
   Then open: `http://localhost:8000/merchant.html`

### Option 2: Using VS Code Live Server

1. Install "Live Server" extension in VS Code
2. Right-click on `merchant.html`
3. Select "Open with Live Server"

## 📋 Project Structure

```
h3/
├── merchant.html      # Merchant registration page
├── customer.html      # Customer payment page
├── common.js          # All JavaScript functions
├── styles.css         # All CSS styles
├── index.html         # Original demo page (optional)
└── README.md         # This file
```

## 🎯 How to Use

### For Merchants:

1. Open `merchant.html`
2. Fill in merchant information:
   - Merchant name
   - Merchant ID
   - Phone number
   - Email (optional)
   - Address (optional)
3. **Select Payment Area:**
   - Enter coordinates or click on the map
   - Click "➕ إضافة H3" to add a hexagon
   - Click "🔗 إضافة المجاورة" to add adjacent hexagons
   - Select resolution level (0-15)
4. Click "💾 حفظ بيانات التاجر" to save
5. Click "➡️ صفحة العميل" to go to customer page

### For Customers:

1. Open `customer.html` (or navigate from merchant page)
2. Enter your location coordinates or click "📍 الحصول على الموقع الحالي"
3. Click "✅ التحقق من الموقع" to validate
4. If validation passes (green), click "💳 إتمام الدفع"

## ✨ Features

- ✅ **Merchant Registration Form** - Complete merchant information form
- ✅ **Multiple H3 Selection** - Select multiple adjacent hexagons
- ✅ **All Resolution Levels** - Support for H3 resolutions 0-15
- ✅ **CSV Database** - Merchant data stored in CSV format (localStorage)
- ✅ **Location Validation** - Real-time validation of customer location
- ✅ **Payment Processing** - Simulated payment flow
- ✅ **Arabic RTL Support** - Full Arabic interface
- ✅ **Responsive Design** - Works on desktop and mobile

## 🔧 Technical Details

### Dependencies (Loaded via CDN):
- **Leaflet.js** - Map visualization
- **H3-js** - H3 geospatial indexing
- **PapaParse** - CSV parsing (for merchant data)

### Browser Requirements:
- Modern browser with ES6 support
- Geolocation API support (for customer location)
- LocalStorage support (for data persistence)

## 📝 Notes

- **Geolocation**: Customer page requires browser permission for location access
- **Data Storage**: Currently uses browser localStorage (data persists in browser)
- **CSV Export**: Merchant data can be exported as CSV file
- **No Backend**: This is a frontend-only POC. In production, you'd need a backend server

## 🌐 Example Workflow

1. Merchant opens `merchant.html`
2. Merchant fills form and selects payment area (H3 hexagons)
3. Merchant saves data → stored in localStorage
4. Customer opens `customer.html`
5. Customer enters location → system validates against merchant's H3 area
6. If valid → payment allowed ✅
7. If invalid → payment blocked ❌

## 🐛 Troubleshooting

- **Map not showing?** Check internet connection (needs to load map tiles)
- **Geolocation not working?** Grant browser permission for location access
- **H3 not displaying?** Check browser console for errors
- **Data not saving?** Check if localStorage is enabled in browser

## 📄 License

This is a POC (Proof of Concept) project for AhmedJ.
