# Prakriti Odyssey

Prakriti Odyssey is a Pokémon- and Tamagotchi-inspired environmental education game. Students care for a virtual eco-pet, complete sustainability quests, and compete on leaderboards while teachers and school admins track collective progress.

## Features at a Glance
- **Virtual eco-pets** with five evolution stages, mood/health stats, and interactive care loops powered by Phaser.js
- **Quest-driven learning** including quizzes, daily eco-actions, QR hunts, and photo submissions with configurable rewards
- **Role-based dashboards** for students, teachers, and school admins featuring Supabase-backed analytics (mocked for local development)
- **Leaderboard & achievements** with badges, store items, and coin economy to reinforce sustainable habits
- **Modern frontend stack** using Next.js 15, TypeScript, Tailwind CSS, Framer Motion animations, and Lucide icons

## Tech Stack
- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS, custom UI library
- **Game Engine**: Phaser 3
- **Data Layer**: Supabase client (mock mode runs locally without credentials)
- **Tooling**: ESLint 9, TypeScript 5, PostCSS/Autoprefixer

## Getting Started (Windows)
The repository includes a one-step setup script that prepares a fresh Windows environment. All commands below are meant to be run from an elevated PowerShell window unless noted otherwise.

### Prerequisites
- Windows 10/11 with access to PowerShell 5.1 or PowerShell 7+
- Git (already used to clone the repository)
- `winget` package manager (bundled with Windows 11 and recent Windows 10 builds)

> If `winget` is unavailable, install Node.js LTS manually from [nodejs.org](https://nodejs.org/en/download) and rerun the setup script.

### Automated setup
From the project root (`prakriti-odyssey/`), run:

```powershell
# Allow running the script the first time (if not already enabled)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Execute the setup routine
./setup.ps1
```

The script will:
1. Ensure Node.js 18.17+ is installed (installs the latest LTS via `winget` when needed)
2. Install the project dependencies with `npm install`
3. Provide next steps for launching the development server

Re-open PowerShell and rerun `./setup.ps1` if the script reports that Node.js is not yet available in the current session.

### Manual setup (alternative)
If you prefer a manual install or are on a machine without `winget`:

1. Install Node.js 18.17+ from [nodejs.org](https://nodejs.org/en/download)
2. Install npm dependencies
   ```bash
   npm install
   ```

### Environment variables
Local development runs in mocked mode and needs no environment variables. To connect to a real Supabase instance, create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=development
```

### Run the development server
```bash
npm run dev
```
Then open [http://localhost:3000](http://localhost:3000) to play.

## Demo Accounts
Use the built-in mock accounts to explore each role:

| Role | Username | Password | Notes |
|------|----------|----------|-------|
| Student | `student1` | `eco123` | Eco Turtle "Leafy", 350 pts, 2 badges |
| Student | `student2` | `nature456` | Nature Fox "Swift", 520 pts, 3 badges |
| Student | `student3` | `earth321` | Green Dragon "Ember", 750 pts, 4 badges |
| Teacher | `teacher1` | `teach789` | Ms. Green at Greenwood Elementary |
| Admin | `admin1` | `admin999` | Principal Johnson, full analytics access |

## Project Structure
```
prakriti-odyssey/
├── src/
│   ├── app/                # Next.js App Router routes
│   ├── components/         # UI, auth, dashboard, and game components
│   ├── data/               # Mock quests, pets, badges, users, and store data
│   ├── game/               # Phaser-based pet engine and animations
│   ├── lib/                # Auth helpers, Supabase client, utilities
│   └── types/              # Shared TypeScript definitions
├── public/                 # Static assets
├── setup.ps1               # Windows bootstrap script
└── ...                     # Config files for Next.js, ESLint, Tailwind, TS
```

## Available npm Scripts
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the production bundle |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint against the codebase |

## Roadmap Highlights
- **Phase 1 (current)**: Core pet care loop, quests, store, leaderboards, mock authentication
- **Phase 2**: Teacher/admin dashboards, photo & QR quests, advanced customization, responsive layouts
- **Phase 3**: Multiplayer features, extended evolution, community events, reporting & sharing tools

## Contributing
1. Fork the repository
2. Create a branch (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m "Add amazing feature"`)
4. Push (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.

---
Made with 🌱 for a sustainable future.
