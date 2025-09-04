# Vynd QR Verifier

A comprehensive Angular application for device verification through QR code scanning and IMEI validation.

## 🚀 Features

- **USB Barcode Scanner Integration**: Seamless scanning of Quectel module IMEIs
- **QR Code Validation**: Automatic extraction and validation of IMEIs from enclosure QR codes  
- **Real-time Validation**: Instant feedback on IMEI matching and URL format validation
- **File Upload Support**: Upload battery data and QA results documentation
- **Professional UI**: Clean, responsive design with Vynd branding

## 🏗️ Architecture

### Frontend (Angular 18)
- **Framework**: Angular 18 with standalone components
- **Styling**: SCSS with Vynd brand colors
- **Build Tool**: Angular CLI with Vite
- **Deployment**: Azure Static Web Apps

### Backend (Planned)
- **Database**: Azure SQL Database
- **API**: ASP.NET Core (.NET 9)
- **Authentication**: JWT-based

## 📦 Quick Start

### Prerequisites
- Node.js 18+
- Angular CLI 18+

### Installation
```bash
cd frontend
npm install
```

### Development Server
```bash
npm run start
```
Navigate to `http://localhost:4200`

### Production Build
```bash
npm run build
```

## 🔄 Workflow

1. **Login**: Authenticate user
2. **Step 1**: Scan Quectel module IMEI (15 digits)
3. **Step 2**: Scan enclosure QR code (extracts IMEI from URL)
4. **Validation**: Compare IMEIs and validate URL format
5. **File Upload**: Upload battery data and QA results
6. **Save**: Store verification data to database

## 🌐 URL Format

The system validates QR codes containing URLs in this format:
```
https://dev-vynd-full.web.app/#/scan-device/{15-digit-IMEI}
```

## 🚀 Deployment

This application is deployed on Azure Static Web Apps with a custom domain:
- **Production**: https://qr-verifier.vynd.tech
- **Staging**: Available via Azure staging slots

## 📝 License

Proprietary software for Vynd device manufacturing and quality assurance.