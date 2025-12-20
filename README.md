# H3 Payment System - Payment Location Validation

A payment validation system that uses H3 hexagons to restrict payment transactions to specific geographic areas. Built with FastAPI backend and vanilla JavaScript frontend.

## 📋 Table of Contents

- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [How to Use](#-how-to-use)
- [API Documentation](#-api-documentation)
- [Features](#-features)
- [Technical Details](#-technical-details)
- [Configuration](#-configuration)
- [Git Workflow](#-git-workflow)
- [Troubleshooting](#-troubleshooting)
- [Production Deployment](#-production-deployment)

## 🏗️ Project Structure

```
h3/
├── app/                          # Backend application (FastAPI)
│   ├── api/                      # API routes
│   │   └── v1/
│   │       └── endpoints/
│   │           ├── merchants.py  # Merchant endpoints
│   │           └── validation.py # Validation endpoints
│   ├── core/                     # Core configuration
│   │   ├── config.py            # Settings
│   │   └── database.py          # Database setup
│   ├── models/                   # SQLAlchemy models
│   │   └── merchant.py
│   ├── schemas/                  # Pydantic schemas
│   │   └── merchant.py
│   └── scripts/                  # Frontend API client
│       └── api_client.js
│
├── frontend/                     # Frontend files
│   ├── merchant.html            # Merchant registration page
│   ├── customer.html            # Customer payment page
│   ├── scripts.js               # Main frontend logic
│   ├── scripts_api_patch.js     # API integration patch
│   ├── scripts_api.js           # (unused, legacy file)
│   └── styles.css               # Styles
│
├── main.py                       # FastAPI application entry point
├── init_db.py                    # Database initialization script
├── run.py                        # Run script
├── requirements.txt              # Python dependencies
├── Dockerfile                    # Docker image definition
├── docker-compose.yml            # Docker Compose for development
├── docker-compose.prod.yml       # Docker Compose for production
├── .dockerignore                 # Docker ignore file
├── .gitignore                    # Git ignore rules
├── data/                         # Database storage (created at runtime)
└── README.md                     # This file
```

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

#### Prerequisites
- Docker installed
- Docker Compose installed

#### Steps

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Or run in detached mode:**
   ```bash
   docker-compose up -d --build
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f
   ```

4. **Stop the application:**
   ```bash
   docker-compose down
   ```

5. **Access the Application:**
   - **Merchant Page**: http://localhost:8000/merchant
   - **Customer Page**: http://localhost:8000/customer
   - **API Documentation**: http://localhost:8000/api/docs
   - **ReDoc**: http://localhost:8000/api/redoc

### Option 2: Local Development

#### 1. Install Dependencies

```bash
# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

#### 2. Initialize Database

```bash
python init_db.py
```

This creates the SQLite database file `h3_payment.db` in the root directory with all necessary tables.

**Note:** When using Docker, the database is stored in `./data/h3_payment.db` for persistence.

#### 3. Run the Application

```bash
# Option 1: Using run.py
python run.py

# Option 2: Using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 4. Access the Application

- **Merchant Page**: http://localhost:8000/merchant
- **Customer Page**: http://localhost:8000/customer
- **API Documentation**: http://localhost:8000/api/docs
- **ReDoc**: http://localhost:8000/api/redoc

## 🎯 How to Use

### For Merchants:

1. Open http://localhost:8000/merchant
2. Fill in merchant information:
   - Merchant name
   - Merchant ID
   - Phone number
   - Email (optional)
   - Address (optional)
3. **Select Payment Area:**
   - Click on the map to automatically add H3 hexagons
   - Or enter coordinates and press Enter
   - Only adjacent hexagons can be added (maintains connectivity)
   - Click on a selected hexagon to remove it (if it won't disconnect the area)
   - Select resolution level (0-15)
   - Use "🔗 إضافة المجاورة" to add all adjacent hexagons at once
4. Click "💾 حفظ بيانات التاجر" to save
5. Click "➡️ صفحة العميل" to go to customer page

### For Customers:

1. Open http://localhost:8000/customer (or navigate from merchant page)
2. Enter your location:
   - Click on the map
   - Enter coordinates manually
   - Or click "📍 الحصول على الموقع الحالي" for GPS location
3. Click "💳 إتمام الدفع" - it will automatically validate the location
4. If validation passes (green), payment is processed
5. If validation fails (red), payment is blocked

## 📡 API Documentation

### Merchants Endpoints

- `POST /api/v1/merchants/` - Create a new merchant
- `GET /api/v1/merchants/` - List all merchants
- `GET /api/v1/merchants/{merchant_id}` - Get specific merchant
- `GET /api/v1/merchants/{merchant_id}/h3-data` - Get H3 data for merchant
- `GET /api/v1/merchants/latest/h3-data` - Get latest merchant H3 data
- `PUT /api/v1/merchants/{merchant_id}` - Update merchant
- `DELETE /api/v1/merchants/{merchant_id}` - Delete merchant

### Validation Endpoints

- `POST /api/v1/validation/location` - Validate customer location

**Example Request:**
```json
{
  "latitude": 24.7136,
  "longitude": 46.6753,
  "merchant_id": "MERCHANT001"
}
```

**Example Response:**
```json
{
  "is_valid": true,
  "current_h3_index": "8a1fb46622d7fff",
  "message": "✅ التحقق ناجح! موقعك داخل منطقة الدفع المسموحة. يمكنك إتمام الدفع."
}
```

### Interactive API Documentation

Visit http://localhost:8000/api/docs for interactive Swagger UI or http://localhost:8000/api/redoc for ReDoc.

## ✨ Features

- ✅ **FastAPI Backend** - Modern, fast Python web framework
- ✅ **SQLite Database** - Easy to use, can upgrade to PostgreSQL
- ✅ **Merchant Registration** - Complete merchant information form
- ✅ **Smart H3 Selection** - Automatic selection on map click
- ✅ **Adjacency Validation** - Only allows connected hexagon areas
- ✅ **Connectivity Check** - Prevents disconnecting payment areas
- ✅ **Multiple H3 Selection** - Select multiple adjacent hexagons
- ✅ **All Resolution Levels** - Support for H3 resolutions 0-15
- ✅ **Resolution Consistency** - All hexagons must use same resolution
- ✅ **Location Validation** - Real-time validation of customer location
- ✅ **Auto-Validation on Payment** - Validates automatically when clicking pay
- ✅ **Payment Processing** - Simulated payment flow
- ✅ **Arabic RTL Support** - Full Arabic interface
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **API Documentation** - Auto-generated Swagger/ReDoc
- ✅ **Docker Support** - Fully containerized with Docker and Docker Compose
- ✅ **Database Persistence** - SQLite with easy PostgreSQL upgrade path

## 🔧 Technical Details

### Backend Stack
- **FastAPI** - Web framework
- **SQLAlchemy** - ORM for database
- **Pydantic** - Data validation
- **H3** - Geospatial indexing (Python library)

### Frontend Stack
- **Leaflet.js** - Map visualization (CDN)
- **H3-js** - H3 geospatial indexing (CDN)
- **PapaParse** - CSV parsing (CDN)
- **Vanilla JavaScript** - No frameworks

### Browser Requirements
- Modern browser with ES6 support
- Geolocation API support (for customer location)
- Fetch API support (for API calls)

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Application Settings
PROJECT_NAME=H3 Payment System
API_V1_STR=/api/v1

# Database
# For local development (creates h3_payment.db in root)
DATABASE_URL=sqlite:///./h3_payment.db
# For Docker (creates h3_payment.db in ./data directory)
# DATABASE_URL=sqlite:///./data/h3_payment.db
# For PostgreSQL: DATABASE_URL=postgresql://user:password@localhost/h3_payment

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:8000,http://localhost:3000,http://127.0.0.1:8000

# Security (change in production)
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Database

The application uses SQLite by default. To use PostgreSQL:

1. Update `DATABASE_URL` in `.env`
2. Install PostgreSQL adapter:
   ```bash
   pip install psycopg2-binary
   ```

## 🔄 Git Workflow

### Branch Structure
- **`main`** - Protected branch (production-ready code)
- **`dev`** - Development branch (all new work happens here)

### Daily Workflow

1. **Switch to dev branch:**
   ```bash
   git checkout dev
   ```

2. **Pull latest changes:**
   ```bash
   git pull origin dev
   ```

3. **Make your changes**

4. **Stage and commit:**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

5. **Push to dev:**
   ```bash
   git push origin dev
   ```

6. **Create Pull Request:**
   - Go to: https://github.com/AlmutairiAhmed/h3-poc/pulls
   - Click "New Pull Request"
   - Select: `dev` → `main`
   - Review and merge when ready

### Important Notes
- ✅ Always work on `dev` branch
- ✅ Never commit directly to `main` (it's protected)
- ✅ Use Pull Requests to merge `dev` → `main`
- ✅ Write clear commit messages

## 🐛 Troubleshooting

### Map not showing?
- Check internet connection (needs to load map tiles)
- Check browser console for errors

### Geolocation not working?
- Grant browser permission for location access
- Ensure you're using HTTPS or localhost

### H3 not displaying?
- Check browser console for errors
- Verify H3 library is loaded

### Database errors?
- Run `python init_db.py` to initialize database
- Check database file permissions

### API errors?
- Check that the server is running
- Verify API endpoints in browser console
- Check CORS settings in `.env`

### Frontend not loading?
- Ensure FastAPI server is running
- Check that files are in `frontend/` directory
- Verify static file paths in HTML

### Docker issues?
- Ensure Docker and Docker Compose are installed
- Check container logs: `docker-compose logs -f`
- Verify port 8000 is not already in use
- Try rebuilding: `docker-compose up --build --force-recreate`
- Database is stored in `./data/` directory (created automatically)
- For production, use `docker-compose -f docker-compose.prod.yml up -d`

## 🚢 Production Deployment

### Using Docker

1. **Create `.env` file with production settings:**
   ```bash
   SECRET_KEY=your-strong-secret-key-here
   CORS_ORIGINS=https://yourdomain.com
   DATABASE_URL=sqlite:///./data/h3_payment.db
   ```

2. **Build and run production container:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

3. **Set up reverse proxy (Nginx example):**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

4. **Enable HTTPS with Let's Encrypt**

### Manual Deployment

1. Set proper `SECRET_KEY` in `.env`
2. Use PostgreSQL instead of SQLite
3. Configure proper CORS origins
4. Use a production ASGI server (e.g., Gunicorn with Uvicorn workers)
5. Set up reverse proxy (Nginx)
6. Enable HTTPS
7. Set up proper logging
8. Configure database backups

### Docker Commands

```bash
# Build image
docker build -t h3-payment:latest .

# Run container
docker run -d -p 8000:8000 \
  -v $(pwd)/data:/app/data \
  -e DATABASE_URL=sqlite:///./data/h3_payment.db \
  --name h3-payment-api \
  h3-payment:latest

# View logs
docker logs -f h3-payment-api

# Stop container
docker stop h3-payment-api

# Remove container
docker rm h3-payment-api
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [H3 Documentation](https://h3geo.org/)

## 📄 License

This is a POC (Proof of Concept) project for AhmedJ.
