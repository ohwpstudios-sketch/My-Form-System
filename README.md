markdown# 🚀 Dynamic Form System

A production-ready, serverless form builder platform that empowers you to create, customize, and deploy forms with payments in minutes - no backend server required.

## ✨ Features

### 🎯 Visual Form Builder
- **Drag & drop** interface with real-time preview
- **25+ field types** across 4 categories (Recent, General, Advanced, Container)
- **No coding required** - build forms visually from your browser
- **Form history** - manage all your created forms in one place

### 🧠 Smart Features
- **Conditional Logic** - Show/hide fields based on user input
- **Multi-column Layouts** - Create professional forms with 1-5 column containers
- **Price Calculations** - Automatic price calculations with multipliers
- **Save & Resume** - Let users save progress and continue later
- **File Uploads** - Handle image and document uploads

### 💳 Payment Integration
- **Paystack Integration** - Accept payments in GHS, NGN, USD, ZAR
- **Payment Verification** - Server-side payment confirmation
- **Automatic Receipts** - Email confirmations via Resend

### 🔒 Security & Validation
- **reCAPTCHA v3** - Google spam protection
- **Cloudflare Turnstile** - Alternative CAPTCHA solution
- **Server-side Validation** - All inputs validated on backend
- **API Authentication** - Protected admin endpoints

### 📊 Analytics & Management
- **Submission Dashboard** - View, search, and filter submissions
- **Export to CSV** - Download submission data
- **Real-time Analytics** - Track form views, starts, and completions
- **Webhook Support** - Integrate with external services

## 🏗️ Architecture

### Edge-First Design
┌─────────────────────────────────────────────────┐
│  Cloudflare Pages (Frontend)                    │
│  React + Tailwind CSS + Lucide Icons            │
└──────────────────┬──────────────────────────────┘
│
│ HTTPS/API Calls
│
┌──────────────────▼──────────────────────────────┐
│  Cloudflare Workers (Backend API)               │
│  Serverless Functions at the Edge               │
└──────────────────┬──────────────────────────────┘
│
┌──────────┼──────────┐
│          │          │
▼          ▼          ▼
┌─────┐   ┌──────┐   ┌──────┐
│  D1 │   │  KV  │   │  R2  │
│ DB  │   │Store │   │Bucket│
└─────┘   └──────┘   └──────┘

### Tech Stack

**Frontend:**
- ⚛️ React 18
- 🎨 Tailwind CSS
- 🎭 Lucide React Icons
- 🔄 React Router

**Backend:**
- ⚡ Cloudflare Workers (Serverless)
- 🗄️ Cloudflare D1 (SQL Database)
- 💾 Cloudflare KV (Key-Value Store)
- 📦 Cloudflare R2 (Object Storage)

**Integrations:**
- 💳 Paystack (Payment Processing)
- 📧 Resend (Email Notifications)
- 🛡️ reCAPTCHA v3 / Cloudflare Turnstile

## 🎯 Field Types (25+)

### General (16 fields)
Name Fields • Email • Simple Text • Mask Input • Text Area • Address Fields • Country List • Numeric Field • Dropdown • Radio Buttons • Website URL • Date/Time • Image Upload • File Upload • Custom HTML • Phone/Mobile

### Advanced (9 fields)
Hidden Field • Section Break • reCAPTCHA • Turnstile • Shortcode • Terms & Conditions • Color Picker • Rich Text • Save & Resume

### Container (6 layouts)
1 Column • 2 Columns • 3 Columns • 4 Columns • 5 Columns • Repeat Container

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare account
- Paystack account (for payments)

### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/dynamic-form-system.git
cd dynamic-form-system

# Run automated setup
setup-enhanced.bat  # Windows
# OR
./setup-enhanced.sh  # Linux/Mac

# Follow the prompts to configure:
# - Cloudflare authentication
# - Database creation
# - API secrets
# - Paystack keys
Manual Setup
bash# Backend
cd form-system-backend
npm install
wrangler login
wrangler d1 create form_submissions
wrangler kv:namespace create "FORMS_KV"
wrangler secret put PAYSTACK_SECRET_KEY
wrangler secret put API_SECRET
wrangler deploy

# Frontend
cd ../form-system-frontend
npm install
npm run build
npx wrangler pages deploy dist/client --project-name=my-form-system
📖 Documentation

Complete Setup Guide
API Documentation
Field Types Reference
Conditional Logic Guide
Deployment Guide

🎨 Use Cases

✅ Event Registration Forms
✅ Product Order Forms
✅ School Application Forms
✅ Job Application Forms
✅ Membership Signups
✅ Consultation Bookings
✅ Survey Forms
✅ Booking Forms
✅ Contact Forms
✅ And much more!

💰 Pricing
100% FREE on Cloudflare's generous free tier:

✅ 100,000 requests/day (Workers)
✅ 5GB database storage (D1)
✅ Unlimited bandwidth (Pages)
✅ 100,000 reads/day (KV)

Scales automatically - only pay if you exceed free limits!
📊 Performance

⚡ < 50ms API response time (global edge network)
🌍 Deployed to 300+ locations worldwide
📈 Handles 100,000+ submissions/day on free tier
🔒 99.99% uptime (Cloudflare SLA)

🤝 Contributing
Contributions are welcome! Please read CONTRIBUTING.md for details.

Fork the repository
Create your feature branch (git checkout -b feature/AmazingFeature)
Commit your changes (git commit -m 'Add some AmazingFeature')
Push to the branch (git push origin feature/AmazingFeature)
Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.
🙏 Acknowledgments

Built on Cloudflare's Edge Platform
Payments powered by Paystack
Icons by Lucide
Email by Resend

📞 Support

📧 Email: ohwpstudios@gmail.com
💬 Discord: Join our community
🐛 Issues: GitHub Issues
📚 Docs: Documentation

🌟 Star History
Show Image

Built with ❤️ using Cloudflare's Edge Platform
Live Demo • Documentation • Report Bug • Request Feature

---

## 🏷️ GitHub Topics/Tags

Add these topics to your GitHub repository:
cloudflare
cloudflare-workers
cloudflare-pages
form-builder
no-code
serverless
edge-computing
react
tailwindcss
paystack
payment-integration
form-system
d1-database
drag-and-drop
conditional-logic
file-upload
webhook
analytics
typescript
javascript

---

## 📦 Repository Structure Suggestion
dynamic-form-system/
├── README.md
├── LICENSE
├── CONTRIBUTING.md
├── .gitignore
├── docs/
│   ├── SETUP.md
│   ├── API.md
│   ├── FIELD_TYPES.md
│   ├── CONDITIONAL_LOGIC.md
│   └── DEPLOYMENT.md
├── form-system-backend/
│   ├── src/
│   │   └── index.js
│   ├── wrangler.toml
│   ├── schema.sql
│   └── package.json
├── form-system-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EnhancedFormBuilder.jsx
│   │   │   ├── DynamicForm.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── AdminAuth.jsx
│   │   └── App.jsx
│   ├── public/
│   └── package.json
├── scripts/
│   ├── setup-enhanced.bat
│   └── setup-enhanced.sh
└── examples/
└── form-configs/
├── event-registration.json
├── job-application.json
└── product-order.json

---

## 🎯 Short Description for GitHub (280 chars)
A serverless form builder with 25+ field types, conditional logic, and payment integration. Built on Cloudflare's edge network. Create, customize, and deploy forms in minutes - no backend required. Free tier handles 100K submissions/day. 🚀

---

## 🔖 Social Media Descriptions

**Twitter/X:**
🚀 Just open-sourced Dynamic Form System!
✨ 25+ field types
🧠 Conditional logic
💳 Payment integration
⚡ Serverless (Cloudflare)
📊 Analytics built-in
🆓 FREE tier (100K/day)
Perfect for events, orders, applications & more!
#OpenSource #Serverless #NoCode

**LinkedIn:**
Excited to share Dynamic Form System - an open-source, serverless form builder platform!
Key Features:

Visual form builder with 25+ field types
Conditional logic for smart forms
Payment integration (Paystack)
Deployed on Cloudflare's edge network
Handles 100,000 submissions/day on FREE tier

Tech Stack: React, Cloudflare Workers, D1, KV, R2
Perfect for startups, agencies, and developers who need powerful forms without backend complexity.
Check it out on GitHub! [https://my-form-system.pages.dev/admin/builder]
