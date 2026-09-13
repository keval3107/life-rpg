# LifeRPG — Turn Your Real Life Into An Adventure

LifeRPG turns real-life goals into RPG-style quests. Start a focus timer, work on the quest, and claim server-calculated XP, Gold, attribute growth and streak progress when you finish.

## Tech Zephyr 4.0

This project is designed around the Life RPG problem statement: meaningful real-life tasks become an engaging progression system with quests, XP, levels, streaks, character attributes and rewards.

## Core Features

- User registration and JWT authentication
- Show / hide password controls
- Secure forgot-password and reset-password flow
- Personal quests with categories and difficulty
- Persistent focus timer per quest
- Timer-based XP and Gold rewards
- Server-authoritative progression
- Non-linear level progression
- Daily streaks
- Character attributes
- Gold reward economy
- Reward shop and inventory
- Recycle Bin with restore and permanent delete
- Responsive dashboard and quest views
- Dark-first RPG-inspired UI with a matching light mode
- Accessible focus states and reduced-motion support

## Main Flow

`Create Quest → Start Focus Timer → Work → Complete & Claim → XP + Gold + Attribute + Streak → Level Up → Spend Gold on Rewards`

## Reward System

Users do not manually enter XP or Gold.

Rewards are based on actual focus time and quest difficulty. The backend calculates the final values.

- Easy: 1.00×
- Medium: 1.25×
- Hard: 1.50×
- Epic: 2.00×

Base progression is calculated from focused minutes with a streak bonus. The exact implementation lives in `backend/app.py`.

## Timer

Each quest has a persistent server-backed focus timer.

Users can:

- Start
- Pause
- Resume
- Reset
- Complete the quest and claim the timer-based reward

A quest must have at least 30 seconds of recorded focus time before its reward can be claimed.

## Recycle Bin

Deleting a quest moves it into the Recycle Bin instead of immediately destroying it.

From the Recycle Bin a user can:

- Restore the quest
- Permanently delete the quest

Deleting a completed quest does not roll back previously earned progression; the progress remains part of the user's history.

## Security

- Passwords are hashed with Werkzeug's password hashing helpers
- JWT secret is required from an environment variable
- User-specific resource ownership checks
- Server-side XP and Gold calculation
- Duplicate quest completion protection
- Database transactions for progression and reward purchases
- Password reset tokens are hashed, single-use and time-limited
- Secrets are kept in `.env`, not source code

## Technology Stack

### Frontend

- React 18
- Vite
- JavaScript / JSX
- CSS
- Lucide React
- React Router

### Backend

- Python
- Flask
- Flask-CORS
- PyJWT
- Werkzeug
- MySQL Connector

### Database

- MySQL

Only the MySQL database is used for application persistence.

## Project Structure

```text
life-rpg/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── index.html
│   └── package.json
├── backend/
│   ├── app.py
│   ├── auth.py
│   ├── config.py
│   ├── database.py
│   ├── requirements.txt
│   └── .env.example
├── database/
│   └── schema.sql
└── README.md
```

## Database Setup

1. Start MySQL.
2. Open `database/schema.sql` in MySQL Workbench or the MySQL CLI.
3. Execute the schema.
4. The backend also creates missing timer/reset support tables and columns at startup without deleting existing data.

## Backend Setup

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Update `.env` with your actual MySQL password and a real secret key.

Run:

```powershell
python app.py
```

Backend:

`http://localhost:5000`

Health check:

`http://localhost:5000/api/health`

## Frontend Setup

Open a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Frontend:

`http://localhost:5173`

For a hosted backend, create `frontend/.env`:

```env
VITE_API_URL=https://your-backend-domain.com/api
```

## Password Reset

The app creates a single-use reset token that expires after 30 minutes.

For local development, when `RESET_EXPOSE_LINK=true`, the reset URL is shown in the recovery screen so the flow can be tested without SMTP.

For production email delivery, configure:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
MAIL_FROM=
```

Set `NODE_ENV=production` so reset links are not returned directly by the API.

## Responsive UX

The UI is designed for:

- Desktop
- Laptop
- Tablet
- Mobile

The dashboard uses a dark navy / warm gold palette inspired by the supplied RPG reference screen, while keeping the existing LifeRPG structure and features.

## Accessibility

- Keyboard-friendly controls
- Visible focus states
- Semantic form labels
- Accessible dialogs and icon buttons
- Reduced-motion support
- Responsive mobile navigation

## Testing Checklist

After setup, verify:

1. Register
2. Login
3. Show / hide password
4. Forgot password
5. Reset password
6. Create a quest
7. Start focus timer
8. Pause / resume timer
9. Complete quest and claim reward
10. Verify XP / Gold / attribute / streak update
11. Refresh and verify database persistence
12. Move quest to Recycle Bin
13. Restore quest
14. Permanently delete quest
15. Buy a reward
16. Verify User A cannot access User B's quest

## Team and Submission

Add the four team members and their real contributions before the final submission.

Also add the final live URL and demo-video URL when available.

## AI / Third-Party Disclosure

Disclose the AI coding assistance, libraries, APIs, templates or boilerplate actually used by the team, as required by the hackathon rules.
