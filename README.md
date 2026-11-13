
A full-stack job portal that connects job seekers and recruiters through a single platform. CareerConnect provides account registration, authentication, role-based experiences, job discovery, job posting, and application workflows.

## Live Demo

- **Frontend:** https://career-connect-blond.vercel.app/
- **Backend API:** https://careerconnect-api-0trr.onrender.com
- **API Documentation:** https://careerconnect-api-0trr.onrender.com/docs
- **GitHub Repository:** https://github.com/Sachin-0109-yadav/CareerConnect

> The backend is hosted on Render's free service. If it has been idle, the first request may take a little longer while the service starts.

## Features

### Authentication and accounts
- User registration and login
- Separate job-seeker and recruiter roles
- Protected routes for authenticated users
- Profile and session management

### Job seeker experience
- Browse and search job opportunities
- View job details
- Apply for jobs
- Access the user dashboard

### Recruiter experience
- Post and manage job listings
- View applicants
- Manage application statuses

### Application
- React-based responsive interface
- REST API powered by FastAPI
- PostgreSQL database
- Database schema migrations with Alembic
- Production deployment with Vercel and Render

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Routing | React Router |
| HTTP client | Axios |
| Backend | Python, FastAPI |
| ORM | SQLAlchemy |
| Database | PostgreSQL |
| Migrations | Alembic |
| Frontend hosting | Vercel |
| Backend hosting | Render |

## Project Structure

```text
CareerConnect/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── ...
│   ├── alembic/
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
└── README.md
```

The exact internal folders may vary as the project evolves.

## Run Locally

### Prerequisites

Install the following before starting:

- Python 3.12
- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Sachin-0109-yadav/CareerConnect.git
cd CareerConnect
```

### 2. Configure the backend

Open a terminal:

```powershell
cd backend
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create the backend environment file using the project's environment template, if provided. Configure your local PostgreSQL connection and the other settings required by the backend.

**Do not commit `.env` files or publish database passwords, JWT secrets, API keys, or other credentials.**

### 3. Set up the database

Create a PostgreSQL database for the project. Update the backend's local environment configuration with the database connection details.

If the project uses Alembic migrations, apply them from the backend directory:

```powershell
alembic upgrade head
```

### 4. Start the backend

From the backend directory, with the virtual environment activated:

```powershell
python -m uvicorn app.main:app --reload
```

The API should be available at:

- API: http://127.0.0.1:8000
- Swagger documentation: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/api/v1/health

### 5. Configure and start the frontend

Open a second terminal:

```powershell
cd frontend
npm install
```

Create the frontend environment file and configure the API base URL for your local backend. For a Vite app, the variable used by the frontend is:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Then start the development server:

```powershell
npm run dev
```

Open the local URL printed by Vite in your terminal (usually http://localhost:5173).

## Deployment

CareerConnect is deployed using:

- **Vercel** for the React frontend
- **Render** for the FastAPI backend
- **PostgreSQL** for persistent data

For production, configure the frontend API base URL and backend CORS/frontend origin settings in the hosting providers' environment-variable dashboards. Run database migrations as part of the backend deployment process.

Vite environment variables prefixed with `VITE_` are embedded into the client-side bundle and are visible to website visitors. Only put public configuration, such as the API base URL, in these variables. Keep secrets on the backend.

## Testing Checklist

When validating a deployment, test the following flows:

- [ ] Register a job-seeker account
- [ ] Log in and open the dashboard
- [ ] Refresh a protected page and verify the session behavior
- [ ] Open and update the profile
- [ ] Log out and verify protected pages require authentication
- [ ] Register or log in with a recruiter account
- [ ] Create and manage a job listing
- [ ] Browse and search job listings as a job seeker
- [ ] Submit a job application
- [ ] Review applicants and update application statuses as a recruiter

## Future Improvements

Potential areas for further development include:

- Email notifications for applications and status changes
- Advanced job filters and sorting
- Resume upload and management
- Saved jobs
- Recruiter and candidate analytics
- Automated tests and CI/CD improvements

## Author

**Sachin**

- GitHub: https://github.com/Sachin-0109-yadav
- LinkedIn: https://linkedin.com/in/sachin-31y08

