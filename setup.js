import { mkdir, writeFile, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Directory structure
const directories = [
  // Components
  'src/components/auth',
  'src/components/dashboard',
  'src/components/projects/ProjectForm',
  'src/components/projects/ProjectList',
  'src/components/projects/ProjectDetail',
  'src/components/review',
  'src/components/shared/Layout',
  'src/components/shared/ui',
  
  // Pages
  'src/pages/auth',
  'src/pages/dashboard',
  'src/pages/projects',
  'src/pages/review',
  'src/pages/settings',
  
  // Core functionality
  'src/lib/firebase',
  'src/lib/hooks',
  'src/lib/utils',
  
  // Types
  'src/types',
  
  // Contexts
  'src/contexts',
  
  // Styles
  'src/styles'
];

// Initial files to create with basic content
const files = {
  // Auth Components
  'src/components/auth/SignInForm.tsx': `import React from 'react';\n\nexport const SignInForm = () => {\n  return (\n    <div>\n      <h2>Sign In Form</h2>\n    </div>\n  );\n};\n`,
  'src/components/auth/SignUpForm.tsx': `import React from 'react';\n\nexport const SignUpForm = () => {\n  return (\n    <div>\n      <h2>Sign Up Form</h2>\n    </div>\n  );\n};\n`,

  // Dashboard Components
  'src/components/dashboard/StatCards.tsx': `import React from 'react';\n\nexport const StatCards = () => {\n  return (\n    <div>\n      <h2>Statistics Overview</h2>\n    </div>\n  );\n};\n`,
  'src/components/dashboard/RecentProjects.tsx': `import React from 'react';\n\nexport const RecentProjects = () => {\n  return (\n    <div>\n      <h2>Recent Projects</h2>\n    </div>\n  );\n};\n`,
  'src/components/dashboard/ActivityFeed.tsx': `import React from 'react';\n\nexport const ActivityFeed = () => {\n  return (\n    <div>\n      <h2>Activity Feed</h2>\n    </div>\n  );\n};\n`,

  // Layout Components
  'src/components/shared/Layout/Navbar.tsx': `import React from 'react';\n\nexport const Navbar = () => {\n  return (\n    <nav>\n      <h1>EmoSense</h1>\n    </nav>\n  );\n};\n`,
  'src/components/shared/Layout/Sidebar.tsx': `import React from 'react';\n\nexport const Sidebar = () => {\n  return (\n    <aside>\n      <h2>Navigation</h2>\n    </aside>\n  );\n};\n`,

  // Pages
  'src/pages/auth/SignInPage.tsx': `import React from 'react';\nimport { SignInForm } from '../../components/auth/SignInForm';\n\nexport const SignInPage = () => {\n  return (\n    <div>\n      <SignInForm />\n    </div>\n  );\n};\n`,
  'src/pages/dashboard/DashboardPage.tsx': `import React from 'react';\nimport { StatCards } from '../../components/dashboard/StatCards';\nimport { RecentProjects } from '../../components/dashboard/RecentProjects';\nimport { ActivityFeed } from '../../components/dashboard/ActivityFeed';\n\nexport const DashboardPage = () => {\n  return (\n    <div>\n      <h1>Dashboard</h1>\n      <StatCards />\n      <RecentProjects />\n      <ActivityFeed />\n    </div>\n  );\n};\n`,

  // Firebase Configuration
  'src/lib/firebase/config.ts': `// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase configuration here
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);\n`,

  // Types
  'src/types/auth.ts': `export interface User {\n  id: string;\n  email: string;\n  displayName?: string;\n}\n`,
  'src/types/project.ts': `export interface Project {\n  id: string;\n  title: string;\n  description: string;\n  createdAt: Date;\n  userId: string;\n}\n`,

  // Context
  'src/contexts/AuthContext.tsx': `import React, { createContext, useContext, useState } from 'react';\n\nconst AuthContext = createContext(null);\n\nexport const AuthProvider = ({ children }) => {\n  return (\n    <AuthContext.Provider value={null}>\n      {children}\n    </AuthContext.Provider>\n  );\n};\n`,

  // Styles
  'src/styles/globals.css': `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`
};

// Create directories
for (const dir of directories) {
  const fullPath = join(process.cwd(), dir);
  if (!existsSync(fullPath)) {
    mkdir(fullPath, { recursive: true }, (err) => {
      if (err) {
        console.error(`Error creating directory ${dir}:`, err);
      } else {
        console.log(`Created directory: ${dir}`);
      }
    });
  }
}

// Create files
for (const [filePath, content] of Object.entries(files)) {
  const fullPath = join(process.cwd(), filePath);
  if (!existsSync(fullPath)) {
    writeFile(fullPath, content, (err) => {
      if (err) {
        console.error(`Error creating file ${filePath}:`, err);
      } else {
        console.log(`Created file: ${filePath}`);
      }
    });
  }
}

console.log('Project structure setup complete!');