# Digital Footprint Map

Digital Footprint Map is a web application designed to help users visualize and understand their digital presence. By scanning Gmail inboxes for service-related emails, it identifies various platforms where the user has registered accounts and maps them out in an interactive radial visualization.

## Key Features

- **Google Authentication**: Secure login using Google OAuth.
- **Gmail Radar Scan**: Automatically detects registered services by analyzing email headers (last 100 emails).
- **Interactive Visualization**: Uses `React Flow` to create a radial map of your digital footprint, categorized by service types.
- **Risk Assessment**: Assigns risk levels (High, Medium, Low) to different platforms to help users prioritize data privacy actions.
- **Data Privacy Insights**: Provides descriptions and easy access to request data deletion (conceptual).

## Architecture

The project is split into two main components:

### Backend (`/backend`)
- **Framework**: FastAPI (Python)
- **Database**: SQLModel (SQLAlchemy + Pydantic)
- **Migrations**: Alembic
- **Integration**: Google Gmail API for scanning.

### Frontend (`/frontend`)
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Visualization**: React Flow (@xyflow/react)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (implied/used in similar patterns)

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- Google Cloud Project with Gmail API enabled and OAuth 2.0 credentials.

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd digital-footprint-map
   ```

2. **Setup Backend**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   # Create a .env file with DATABASE_URL and Google credentials
   alembic upgrade head
   uvicorn app.main:app --reload
   ```

3. **Setup Frontend**:
   ```bash
   cd ../frontend
   npm install
   # Create a .env file with VITE_GOOGLE_CLIENT_ID
   npm run dev
   ```

## Usage

1. Login with your Google account.
2. Click "INITIALIZE GMAIL RADAR SCAN" to start identifying your accounts.
3. Explore the generated map and click on nodes to see risk assessments.
