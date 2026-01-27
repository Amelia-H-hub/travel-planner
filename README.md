# 🏨 Smart Booking Strategy AI
### *Elevating Travel Planning with Machine Learning & Behavioral Insights*

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![LightGBM](https://img.shields.io/badge/LightGBM-FFB900?style=for-the-badge&logo=microsoft&logoColor=white)](https://lightgbm.readthedocs.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 🌟 Overview
This project is an **AI-driven booking consultancy tool** designed to solve the uncertainty of hotel pricing. Unlike traditional search engines, it analyzes historical booking demand and traveler behavior to provide personalized booking strategies. 

By leveraging a **LightGBM Regressor**, the system predicts Average Daily Rates (ADR) and provides actionable insights based on the user's nationality, stay duration, and accommodation style.

---

## 🚀 Key Features

* **AI Price Prediction:** Real-time ADR (Average Daily Rate) estimation using a model trained on over 100k+ booking records.
* **Market-Specific Calibration:** Automatically adjusts EU-based hotel benchmarks to local market price indices (e.g., TW, JP, US) for realistic estimations.
* **Dynamic Insight Engine:** * **Contextual Feedback:** Highlights "**Great Value**" or "**Peak Demand**" periods with Markdown-styled emphasis.
    * **Behavioral Analysis:** Adapts advice based on whether you are staying in an **Urban City Hotel** or a **Holiday Resort**.
* **Global Accessibility:** Supports multi-currency conversion and international date-range selection with localized `Intl.NumberFormat` formatting.

---

## 🧠 The AI Model

The core brain is a **LightGBM Gradient Boosting Model** optimized for hospitality data.

* **Features:** Hotel Type, Market Segment, Lead Time, Nationality, and Customer Type.
* **Preprocessing:** Utilizes a custom `ColumnTransformer` with `OneHotEncoder` and `OrdinalEncoder` for robust categorical data handling.
* **Cross-Regional Logic:** While trained on European datasets, the model focuses on **universal booking patterns** (e.g., lead time tendencies of specific nationalities) to provide global relevance.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS (Modern UI with customized Lucide icons)
- **Data Viz:** Plotly.js for interactive price trend analysis

### Backend & AI (Hugging Face)
- **Engine:** Python / FastAPI
- **Model:** LightGBM (Gradient Boosting)
- **Deployment:** Hosted on Hugging Face Spaces

---

## 📊 Data Source
- **Hotel Dataset:** Historical booking demand from Resort and City hotels (119,390 observations).
- **Geodata:** `cities15000.txt` from [GeoNames](http://www.geonames.org/) for precise nationality-based market analysis.

---

## 🔧 Getting Started

1. **Clone the repo**
   ```bash
   git clone https://github.com/Amelia-H-hub/travel-planner.git
   ```

2. **Install Dependencies**
  ```bash
  npm install
  ```

3. **Run Development Server**
  ```bash
  npm run dev
  ```

## 💡 Note on AI Insights
The AI insights use contextual highlighting to emphasize key metrics. Predictions are calibrated with a Global Market Factor to ensure the ADR feels intuitive regardless of the user's current region.
