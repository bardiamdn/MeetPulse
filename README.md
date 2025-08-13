# MeetPulse - AI Meeting Visualizer

Transform your meeting recordings into actionable insights with AI-powered transcription, sentiment analysis, and smart action item extraction.

## 🎯 Purpose

MeetPulse is a comprehensive meeting analysis platform that uses artificial intelligence to:

- **Transcribe** audio recordings with high accuracy using OpenAI Whisper
- **Identify speakers** and analyze speaking patterns
- **Extract action items** automatically with assignees and priorities
- **Analyze sentiment** throughout the meeting timeline
- **Generate summaries** and key timeline events
- **Create exportable reports** for easy sharing and follow-up

Perfect for teams, project managers, and professionals who want to maximize the value of their meetings and ensure nothing falls through the cracks.

## 🚀 Technologies Used

### Frontend
- **React 18** - Modern UI library with hooks and functional components
- **TypeScript** - Type-safe JavaScript for better development experience
- **Tailwind CSS** - Utility-first CSS framework for rapid styling
- **Framer Motion** - Smooth animations and micro-interactions
- **Recharts** - Beautiful charts for sentiment visualization
- **React Hot Toast** - Elegant toast notifications
- **Lucide React** - Beautiful, customizable icons

### Backend & Database
- **Supabase** - Backend-as-a-Service with PostgreSQL database
- **Row Level Security (RLS)** - Secure data access policies
- **Supabase Storage** - File storage for audio recordings
- **Supabase Edge Functions** - Serverless functions for AI processing

### AI & Processing
- **OpenAI Whisper** - State-of-the-art speech-to-text transcription
- **OpenAI GPT-4** - Advanced language model for content analysis
- **Custom AI Pipeline** - Speaker identification and sentiment analysis

### Development Tools
- **Vite** - Fast build tool and development server
- **ESLint** - Code linting and quality assurance
- **PostCSS** - CSS processing and optimization

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn** package manager
- **Supabase account** (free tier available)
- **OpenAI API key** (for transcription and analysis)

## 🛠️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/bardiamdn/MeetPulse.git
cd meetpulse
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_AUDIO_BUCKET=meeting-audio

# OpenAI Configuration (for edge functions)
OPENAI_API_KEY=your_openai_api_key
```

### 4. Supabase Setup

#### A. Create a New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy your project URL and anon key to the `.env` file

#### B. Run Database Migrations
The project includes pre-built migrations. Apply them in your Supabase dashboard:

1. Go to **SQL Editor** in your Supabase dashboard
2. Run the migration files in order (they're in `/supabase/migrations/`)

#### C. Create Storage Bucket
1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket named `meeting-audio`
3. Set it to **public** for file access

#### D. Deploy Edge Functions
1. Install Supabase CLI (if not already installed)
2. Deploy the audio processing function:

```bash
supabase functions deploy process-audio
```

### 5. OpenAI API Setup

1. Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file
3. Ensure you have sufficient credits for transcription and analysis

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main analysis dashboard
│   ├── UploadModal.tsx  # Audio file upload
│   ├── TranscriptViewer.tsx # Conversation display
│   ├── ActionItemsPanel.tsx # Task management
│   ├── SentimentChart.tsx   # Sentiment visualization
│   └── ...
├── hooks/              # Custom React hooks
│   └── useAuth.ts      # Authentication logic
├── lib/                # Utilities and configurations
│   └── supabase.ts     # Supabase client and types
└── main.tsx           # Application entry point

supabase/
├── functions/          # Edge functions
│   └── process-audio/  # AI processing pipeline
└── migrations/         # Database schema
```

## 📊 Database Schema

The application uses the following main tables:

- **profiles** - User account information
- **meetings** - Meeting metadata and audio files
- **analyses** - AI analysis results and status
- **transcript_segments** - Individual conversation segments
- **action_items** - Extracted and user-created tasks

All tables include Row Level Security (RLS) policies for data protection.

## 🎨 Features

### Core Functionality
- **Audio Upload** - Support for MP3, WAV, M4A files up to 100MB
- **Real-time Processing** - Live status updates during AI analysis
- **Speaker Identification** - Automatic detection and naming of participants
- **Smart Transcription** - Timestamped, searchable conversation text

### Analysis Tools
- **Action Item Extraction** - Automatic task identification with priorities
- **Sentiment Analysis** - Emotional tone tracking throughout the meeting
- **Timeline Events** - Key moments and topic changes
- **Speaking Time Analysis** - Participation metrics for each speaker

### User Experience
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Mode** - Comfortable viewing in any environment
- **Export Functionality** - CSV export of complete analysis
- **Search & Filter** - Find specific conversations or speakers

### Task Management
- **Custom Tasks** - Add your own action items
- **Assignment** - Assign tasks to meeting participants
- **Due Dates** - Set deadlines for follow-up
- **Priority Levels** - Organize by importance
- **Completion Tracking** - Mark tasks as done

## 🔒 Security & Privacy

- **End-to-End Encryption** - All data encrypted in transit and at rest
- **Row Level Security** - Users can only access their own data
- **Automatic Cleanup** - Audio files deleted after 30 days
- **GDPR Compliant** - Full data control and deletion rights

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Netlify (Recommended)

1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy with build command: `npm run build`
4. Set publish directory: `dist`

### Deploy to Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts to deploy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](../../issues) page for existing solutions
2. Create a new issue at https://github.com/bardiamdn/MeetPulse/issues with detailed information
3. Include error messages, browser console logs, and steps to reproduce

## 🎉 Acknowledgments

- **OpenAI** for Whisper and GPT models
- **Supabase** for the excellent backend platform
- **React Team** for the amazing framework
- **Tailwind CSS** for beautiful, utility-first styling

---

**Made with ❤️ for better meetings and productivity**