# EmoSense - Video Emotion Analytics Platform

EmoSense is an advanced video emotion analytics platform that combines real-time emotion tracking with comprehensive feedback collection. The platform enables content creators and researchers to gather deep insights into viewer emotional responses and engagement through AI-powered facial expression analysis.

![EmoSense Logo](./src/assets/images/logo.png)

## Features

### 🎭 Real-time Emotion Analytics
- Live emotion detection during video playback
- Advanced calibration for accurate emotion recognition
- Support for 8 core emotions: happiness, surprise, neutral, sadness, anger, disgust, fear, and contempt
- Face detection with stability tracking

### 📊 Comprehensive Analytics
- Emotional response trend visualization
- Timeline-based emotional state analysis
- Overall emotional impact assessment
- Key moment identification
- Survey response analytics

### 📝 Feedback Collection
- Customizable quick rating system
- In-depth survey builder
- Multiple question types (Multiple Choice, Rating Scale, Text, Checkbox, Yes/No)
- Token-based secure sharing

### 🔒 Security & Privacy
- Secure authentication system
- Token-based access control
- No video storage - real-time analysis only
- Anonymous response collection option

## Tech Stack

- **Frontend Framework:** React 18 with Vite
- **Language:** TypeScript
- **Styling:** TailwindCSS + shadcn/ui
- **State Management:** React Context
- **Backend Services:** Firebase (Auth, Firestore)
- **Media Storage:** Cloudinary
- **Charts & Visualization:** Recharts
- **Icons:** Lucide React
- **Date Handling:** date-fns

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js 16.x or higher
- npm or yarn
- Firebase account
- Cloudinary account

## Installation & Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/emosense.git
cd emosense
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Firebase Setup:
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and choose Email/Password sign-in method
   - Create a Firestore database in production mode
   - Navigate to Project Settings > General > Your apps
   - Click on the web icon (</>)
   - Register your app and copy the Firebase configuration
   - Set up Firestore rules:
     ```
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /users/{userId} {
           allow read, write: if request.auth != null && request.auth.uid == userId;
           allow read: if true;
         }
         
         match /projects/{projectId} {
           allow create: if request.auth != null;
           allow read: if true;
           allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
           
           match /responses/{responseId} {
             allow create: if true;
             allow read: if request.auth != null && 
               get(/databases/$(database)/documents/projects/$(projectId)).data.userId == request.auth.uid;
           }
         }
         
         match /tokens/{tokenId} {
           allow create: if request.auth != null;
           allow read: if true;
           allow delete, update: if request.auth != null && 
             get(/databases/$(database)/documents/projects/$(resource.data.projectId)).data.userId == request.auth.uid;
         }
       }
     }
     ```

4. Cloudinary Setup:
   - Create a Cloudinary account at [Cloudinary](https://cloudinary.com/)
   - Navigate to Dashboard
   - Create two upload presets:
     - Name: `emosense_profiles` for profile images
     - Name: `emosense_videos` for project videos
   - Set both presets to "Unsigned" uploading
   - Copy your Cloud Name, API Key, and API Secret

5. Create a `.env` file in the root directory and add your configuration:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
```

6. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Usage

1. **Authentication**
   - Sign up for an account or sign in
   - Manage your profile settings

2. **Creating Projects**
   - Upload your video content
   - Configure quick rating options
   - Build custom surveys
   - Generate share links

3. **Collecting Feedback**
   - Share your project link with viewers
   - Track real-time responses
   - View analytics and insights

4. **Analyzing Results**
   - View emotional response trends
   - Analyze key moments
   - Export response data

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint

# Format code
npm run format
```

## Project Structure

```
src/
├── assets/        # Static assets
├── components/    # React components
├── contexts/      # React contexts
├── lib/           # Utility functions and configurations
├── pages/         # Page components
├── styles/        # Global styles
└── types/         # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [TensorFlow.js](https://www.tensorflow.org/js) for emotion detection capabilities
- [face-api.js](https://github.com/justadudewhohacks/face-api.js/) for face detection

## Project Context

This project was developed as part of a Software Engineering course curriculum. It demonstrates the implementation of modern web technologies and AI integration in a real-world application context.

## Contact

James Torrevillas - [@jamestorrevillas](https://github.com/jamestorrevillas)

Project Link: [https://github.com/jamestorrevillas/emosense](https://github.com/jamestorrevillas/emosense)

---