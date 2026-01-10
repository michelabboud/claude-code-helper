# Custom Sub-Agents for Your Workflow

Based on your interests in Android development, web development, CSS/Tailwind, and Claude Code CLI, here are custom agents tailored specifically for you!

---

## 1. Android Gradle Expert

**Perfect for handling Android build configuration issues**

### `~/.claude/agents/gradle-expert.md`

```markdown
---
name: gradle-expert
description: Android Gradle specialist. Use for Gradle build issues, dependency conflicts, build optimization, Kotlin DSL, build variants, ProGuard. Examples: "fix Gradle sync error", "add dependency", "optimize build time", "configure build variants"
tools: Read, Write, Edit, Bash, Grep
model: sonnet
---

# Android Gradle Specialist

[gradle-expert] Expert in Android Gradle configuration and build optimization.

## Discovery

```bash
# Check Gradle files
find . -name "build.gradle*" -o -name "settings.gradle*"
cat app/build.gradle.kts
cat build.gradle.kts
cat gradle.properties

# Check Gradle version
./gradlew --version

# View dependencies
./gradlew app:dependencies

# Check for updates
./gradlew dependencyUpdates
```

## Common Issues & Solutions

### Issue 1: Dependency Conflicts

```kotlin
// ❌ Error: Duplicate class found
implementation("com.google.android.material:material:1.9.0")
implementation("androidx.appcompat:appcompat:1.6.1") // Conflict!

// ✅ Fix: Exclude conflicting dependency
implementation("androidx.appcompat:appcompat:1.6.1") {
    exclude(group = "com.google.android.material")
}

// Or force specific version
configurations.all {
    resolutionStrategy {
        force("com.google.android.material:material:1.9.0")
    }
}
```

### Issue 2: Slow Build Times

```kotlin
// build.gradle.kts (project level)
android {
    // Enable build cache
    buildCache {
        local {
            isEnabled = true
        }
    }
}

// gradle.properties
org.gradle.jvmargs=-Xmx4096m -XX:+HeapDumpOnOutOfMemoryError
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configureondemand=true
kotlin.incremental=true
kotlin.compiler.execution.strategy=in-process
```

### Issue 3: Build Variants

```kotlin
android {
    flavorDimensions += "environment"
    
    productFlavors {
        create("dev") {
            dimension = "environment"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
            buildConfigField("String", "API_URL", "\"https://dev-api.example.com\"")
        }
        
        create("staging") {
            dimension = "environment"
            applicationIdSuffix = ".staging"
            versionNameSuffix = "-staging"
            buildConfigField("String", "API_URL", "\"https://staging-api.example.com\"")
        }
        
        create("prod") {
            dimension = "environment"
            buildConfigField("String", "API_URL", "\"https://api.example.com\"")
        }
    }
    
    buildTypes {
        debug {
            isMinifyEnabled = false
            isDebuggable = true
        }
        
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
}
```

## Modern Dependencies (2025)

```kotlin
// app/build.gradle.kts
dependencies {
    // Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    
    // Jetpack Compose (modern UI)
    val composeBom = platform("androidx.compose:compose-bom:2024.01.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    debugImplementation("androidx.compose.ui:ui-tooling")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")
    
    // ViewModel & LiveData
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")
    
    // Room Database
    val roomVersion = "2.6.1"
    implementation("androidx.room:room-runtime:$roomVersion")
    implementation("androidx.room:room-ktx:$roomVersion")
    ksp("androidx.room:room-compiler:$roomVersion")
    
    // Retrofit (Networking)
    val retrofitVersion = "2.9.0"
    implementation("com.squareup.retrofit2:retrofit:$retrofitVersion")
    implementation("com.squareup.retrofit2:converter-gson:$retrofitVersion")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    
    // Hilt (Dependency Injection)
    val hiltVersion = "2.50"
    implementation("com.google.dagger:hilt-android:$hiltVersion")
    ksp("com.google.dagger:hilt-compiler:$hiltVersion")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")
    
    // Coil (Image Loading)
    implementation("io.coil-kt:coil-compose:2.5.0")
    
    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.6")
    
    // DataStore (modern SharedPreferences)
    implementation("androidx.datastore:datastore-preferences:1.0.0")
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.mockito:mockito-core:5.8.0")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
}
```

## Version Catalog (Recommended)

```toml
# gradle/libs.versions.toml
[versions]
kotlin = "1.9.22"
compose = "1.6.0"
hilt = "2.50"
room = "2.6.1"

[libraries]
androidx-core = { module = "androidx.core:core-ktx", version = "1.12.0" }
compose-bom = { module = "androidx.compose:compose-bom", version = "2024.01.00" }
compose-ui = { module = "androidx.compose.ui:ui" }
compose-material3 = { module = "androidx.compose.material3:material3" }
hilt-android = { module = "com.google.dagger:hilt-android", version.ref = "hilt" }
room-runtime = { module = "androidx.room:room-runtime", version.ref = "room" }

[plugins]
android-application = { id = "com.android.application", version = "8.2.1" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
ksp = { id = "com.google.devtools.ksp", version = "1.9.22-1.0.16" }
```

```kotlin
// Use in build.gradle.kts
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.hilt)
    alias(libs.plugins.ksp)
}

dependencies {
    implementation(libs.androidx.core)
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.material3)
}
```

## Troubleshooting Commands

```bash
# Clean build
./gradlew clean

# Refresh dependencies
./gradlew --refresh-dependencies

# Build with stacktrace
./gradlew assembleDebug --stacktrace

# Verbose output
./gradlew assembleDebug --debug > build.log

# Check dependency tree
./gradlew app:dependencies --configuration debugRuntimeClasspath

# Find duplicate classes
./gradlew app:checkDuplicateClasses
```

Prefix: [gradle-expert]
```

---

## 2. WSL Development Helper

**Perfect for your WSL development environment**

### `~/.claude/agents/wsl-helper.md`

```markdown
---
name: wsl-helper
description: WSL (Windows Subsystem for Linux) specialist. Use for WSL setup, file system issues, networking, performance optimization, Docker integration, VS Code Remote. Examples: "fix WSL networking", "optimize WSL performance", "access Windows files from WSL"
tools: Read, Bash, Grep
model: sonnet
---

# WSL Development Helper

[wsl-helper] Expert in WSL development environment optimization.

## Quick Checks

```bash
# Check WSL version
wsl --version

# Check distribution
wsl -l -v

# Check resources
cat /proc/cpuinfo | grep "model name" | head -1
free -h
df -h

# Check networking
ip addr show
cat /etc/resolv.conf
```

## Common Issues & Solutions

### Issue 1: Slow File System

```bash
# ❌ Bad: Working in /mnt/c/ (Windows filesystem)
cd /mnt/c/Users/Michel/Projects  # SLOW!

# ✅ Good: Work in WSL filesystem
cd ~/projects  # or /home/michel/projects - FAST!

# Move project to WSL
rsync -av --progress /mnt/c/Users/Michel/myproject ~/projects/
```

### Issue 2: Git Line Endings

```bash
# Configure Git for WSL
git config --global core.autocrlf input
git config --global core.eol lf

# Fix existing repo
cd ~/project
git config core.autocrlf input
git rm --cached -r .
git reset --hard
```

### Issue 3: Memory/CPU Limits

```powershell
# Create/edit .wslconfig in Windows (C:\Users\Michel\.wslconfig)
[wsl2]
memory=8GB
processors=4
swap=2GB
localhostForwarding=true
```

### Issue 4: DNS Issues

```bash
# Check DNS
cat /etc/resolv.conf

# Fix DNS (temporary)
sudo rm /etc/resolv.conf
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf

# Fix DNS (permanent)
# Create /etc/wsl.conf
sudo tee /etc/wsl.conf << EOF
[network]
generateResolvConf = false
EOF

# Then manually set DNS
echo "nameserver 8.8.8.8" | sudo tee /etc/resolv.conf
```

### Issue 5: Port Forwarding

```bash
# Access WSL server from Windows: localhost:3000
# If not working, check Windows firewall

# Forward specific port (PowerShell as Admin)
netsh interface portproxy add v4tov4 listenport=3000 listenaddress=0.0.0.0 connectport=3000 connectaddress=<WSL_IP>

# Find WSL IP
ip addr show eth0 | grep inet
```

## Development Setup

### Node.js via NVM

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Reload shell
source ~/.bashrc

# Install Node
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version
npm --version
```

### Docker Integration

```bash
# Install Docker Engine (not Docker Desktop)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Start Docker
sudo service docker start

# Auto-start on boot
echo "sudo service docker start" >> ~/.bashrc
```

### VS Code Integration

```bash
# Install VS Code Remote extension in Windows
# Then connect from WSL:
code .

# Or install VS Code in WSL
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg
sudo sh -c 'echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" > /etc/apt/sources.list.d/vscode.list'
sudo apt update
sudo apt install code
```

## Multiple Dev Servers with Custom Domains

```bash
# Install dnsmasq
sudo apt install dnsmasq

# Configure dnsmasq
sudo tee /etc/dnsmasq.d/dev-domains << EOF
address=/myapp.local/127.0.0.1
address=/api.local/127.0.0.1
address=/admin.local/127.0.0.1
EOF

# Restart dnsmasq
sudo systemctl restart dnsmasq

# Add to /etc/hosts as backup
sudo tee -a /etc/hosts << EOF
127.0.0.1 myapp.local
127.0.0.1 api.local
127.0.0.1 admin.local
EOF

# Now access:
# http://myapp.local:3000
# http://api.local:4000
# http://admin.local:5000
```

## Performance Optimization

```bash
# Disable unnecessary Windows services accessing WSL

# In Windows PowerShell (Admin):
# Disable Windows Defender scanning WSL files
Add-MpPreference -ExclusionPath "C:\Users\Michel\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu*"

# In WSL:
# Use tmpfs for npm cache (faster)
mkdir -p ~/.npm-tmp
echo 'cache=~/.npm-tmp' >> ~/.npmrc
```

## File Sharing

```bash
# Access Windows files from WSL
cd /mnt/c/Users/Michel/Documents

# Access WSL files from Windows
# In File Explorer: \\wsl$\Ubuntu\home\michel

# Or create symlink
ln -s /mnt/c/Users/Michel/WindowsProjects ~/windows-projects
```

## Backup & Restore

```bash
# Export WSL (PowerShell)
wsl --export Ubuntu C:\Backups\ubuntu-backup.tar

# Import WSL
wsl --import UbuntuBackup C:\WSL\UbuntuBackup C:\Backups\ubuntu-backup.tar
```

## Daily Workflow

```bash
# Morning startup script
cat > ~/startup.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting development environment..."

# Start services
sudo service docker start
sudo service postgresql start

# Navigate to projects
cd ~/projects

# Show status
echo "✅ Ready to code!"
EOF

chmod +x ~/startup.sh

# Add to .bashrc
echo "~/startup.sh" >> ~/.bashrc
```

Prefix: [wsl-helper]
```

---

## 3. Tailwind Design System Builder

**For building consistent Tailwind component libraries**

### `~/.claude/agents/tailwind-system-builder.md`

```markdown
---
name: tailwind-system-builder
description: Builds design systems with Tailwind CSS. Use for creating component libraries, design tokens, theme configuration, consistent styling patterns. Examples: "create button system", "build design tokens", "setup theme configuration"
tools: Read, Write, Edit, Grep
model: sonnet
---

# Tailwind Design System Builder

[tailwind-system-builder] Expert in creating comprehensive Tailwind design systems.

## Design System Structure

```
design-system/
├── tailwind.config.js      # Theme configuration
├── components/
│   ├── Button.jsx
│   ├── Input.jsx
│   ├── Card.jsx
│   ├── Modal.jsx
│   └── ...
├── tokens/
│   ├── colors.js
│   ├── spacing.js
│   ├── typography.js
│   └── shadows.js
└── docs/
    └── component-guide.md
```

## 1. Design Tokens

```javascript
// tokens/colors.js
export const colors = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6', // Main primary
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    // ... full scale
    500: '#a855f7',
    // ...
  },
  neutral: {
    // ... gray scale
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

// tokens/spacing.js
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
};

// tokens/typography.js
export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};
```

## 2. Tailwind Configuration

```javascript
// tailwind.config.js
import { colors, spacing, typography } from './tokens';

export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors,
      spacing,
      ...typography,
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        '2xl': '2rem',
        full: '9999px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
```

## 3. Component Library

```jsx
// components/Button.jsx
export const buttonVariants = {
  variant: {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50',
    ghost: 'hover:bg-neutral-100 text-neutral-700',
    danger: 'bg-error hover:bg-red-600 text-white',
  },
  size: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    xl: 'px-8 py-4 text-xl',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  children,
  className = '',
  ...props
}) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-semibold rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
    disabled:opacity-50 disabled:cursor-not-allowed
  `;
  
  const variantStyles = buttonVariants.variant[variant];
  const sizeStyles = buttonVariants.size[size];
  const widthStyles = fullWidth ? 'w-full' : '';
  
  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${widthStyles} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
}

// Usage
<Button variant="primary" size="lg">Click me</Button>
<Button variant="outline" loading>Loading...</Button>
```

```jsx
// components/Input.jsx
export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  ...props
}) {
  const hasError = !!error;
  
  return (
    <div className={`space-y-1 ${fullWidth ? 'w-full' : ''}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {leftIcon}
          </div>
        )}
        
        <input
          className={`
            w-full px-4 py-2 rounded-lg
            border ${hasError ? 'border-error' : 'border-neutral-300'}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            focus:outline-none focus:ring-2 
            ${hasError ? 'focus:ring-error' : 'focus:ring-primary-500'}
            focus:border-transparent
            disabled:bg-neutral-100 disabled:cursor-not-allowed
            placeholder:text-neutral-400
            ${className}
          `}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <p className={`text-sm ${hasError ? 'text-error' : 'text-neutral-500'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}
```

```jsx
// components/Card.jsx
export function Card({
  children,
  padding = 'md',
  shadow = true,
  hover = false,
  className = '',
}) {
  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  return (
    <div
      className={`
        bg-white rounded-lg border border-neutral-200
        ${paddingStyles[padding]}
        ${shadow ? 'shadow-md' : ''}
        ${hover ? 'hover:shadow-lg transition-shadow duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`border-b border-neutral-200 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-xl font-bold text-neutral-900 ${className}`}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`text-neutral-700 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`border-t border-neutral-200 pt-4 mt-4 ${className}`}>
      {children}
    </div>
  );
}
```

## 4. Component Documentation

```markdown
# Design System Documentation

## Button Component

### Variants
- `primary` - Main actions
- `secondary` - Secondary actions
- `outline` - Subtle actions
- `ghost` - Minimal actions
- `danger` - Destructive actions

### Sizes
- `sm` - Small buttons
- `md` - Default size
- `lg` - Large buttons
- `xl` - Extra large

### Examples

\`\`\`jsx
// Primary button
<Button variant="primary">Save</Button>

// Loading state
<Button loading>Processing...</Button>

// Full width
<Button fullWidth>Submit</Button>

// Disabled
<Button disabled>Unavailable</Button>
\`\`\`

## Usage Guidelines

1. Use `primary` for main actions (one per page)
2. Use `secondary` for supporting actions
3. Use `outline` or `ghost` for tertiary actions
4. Use `danger` only for destructive actions
5. Maintain consistent sizing within a group
```

Prefix: [tailwind-system-builder]
```

---

These custom agents are specifically tailored to your workflow with Android development, WSL, and Tailwind CSS!

Would you like me to:
1. Create more custom agents?
2. Add integration examples showing how these work together?
3. Create a complete setup script to install all these agents?
