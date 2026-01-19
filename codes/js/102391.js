let posts = []; // Initialize

document.addEventListener('DOMContentLoaded', function() {
    loadPosts();
    loadTheme();
    if (posts.length === 0) {
        addStickmanArcherPost();
    }
    handleRouting();
});

// Routing system
function handleRouting() {
    const hash = window.location.hash;
    
    if (hash.startsWith('#post/')) {
        const slug = hash.replace('#post/', '');
        const post = posts.find(p => p.slug === slug);
        if (post) {
            showPost(post.id);
        } else {
            showPostsList();
        }
    } else {
        showPostsList();
    }
}

// Handle browser back/forward buttons
window.addEventListener('hashchange', handleRouting);

// Theme
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    document.querySelector('.theme-icon').textContent = newTheme === 'dark' ? '☀️' : '🌙';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    document.querySelector('.theme-icon').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

// Stickman Archer development post
function addStickmanArcherPost() {
    const stickmanPost = {
        id: Date.now(),
        slug: 'stickman-archer',
        title: 'Building Stickman Archer: My Journey with Amazon Q CLI',
        content: `# Building Stickman Archer: My Journey with Amazon Q CLI

*From Simple Concept to Feature-Rich Gaming Experience*

## Introduction

When I first heard about the [Amazon Q CLI Build Games Challenge](https://dev.to/aws-builders/how-i-built-a-complete-2d-game-using-amazon-q-developer-cli-beginners-guide-i4f), I knew I wanted to push the boundaries of what could be built through conversational prompting. What started as a simple "Stickman Archer" concept evolved into a comprehensive gaming platform with **6 different game modes**, **progressive difficulty**, **advanced physics**, and **mobile optimization**.

This blog documents my complete journey building this game using only Amazon Q CLI prompts—no manual coding required.

## Why Stickman Archer? The Vision Behind the Game

I chose archery as my core mechanic because it perfectly demonstrates several complex programming concepts:
- **Realistic physics** (gravity, air resistance, trajectory)
- **Precision controls** (touch and mouse optimization) 
- **Visual feedback systems** (particles, trails, hit effects)
- **Progressive difficulty** (multiple challenge modes)

My goal was to create something that looked simple but was mechanically deep—a true test of Amazon Q's code generation capabilities.

## The Build Process: From Concept to Completion

### Phase 1: Foundation and Core Mechanics

**My opening prompt:**
> Create an HTML5-based Stickman Archer game that works on both web and mobile. Set up the basic project structure with HTML, CSS, and JavaScript files. The game should use HTML5 Canvas for rendering and be responsive for different screen sizes. Include a simple black background and basic game loop structure.

**Amazon Q's Response:**
Q immediately scaffolded a complete project structure:
- \`index.html\` with responsive viewport settings
- \`styles.css\` with mobile-first responsive design  
- \`game.js\` with 60 FPS game loop and unified input handling
- \`README.md\` with comprehensive documentation

**My Reflection:**
This first prompt showed me Q's strength—it doesn't just write code snippets, it thinks architecturally about the entire project structure.

### Phase 2: Advanced Physics Implementation

**Follow-up prompt:**
> Add realistic physics to the arrow when released. Implement gravity, initial velocity based on bow pull strength, and trajectory calculation. The arrow should arc naturally through the air. Include air resistance for more realistic flight patterns.

**What Q Generated:**
\`\`\` javascript
// Physics constants that felt perfectly balanced
const PHYSICS = {
    gravity: 0.4,           // Natural arc feeling
    airResistance: 0.99,    // Gradual slowdown
    maxVelocity: 25,        // Prevents overpowered shots
    minVelocity: 3,         // Eliminates weak shots
    velocityScale: 0.15,    // Intuitive pull-to-power ratio
    groundLevel: 20
};

// Realistic physics calculation
function updateArrowPhysics(arrow) {
    arrow.vy += PHYSICS.gravity;
    arrow.vx *= PHYSICS.airResistance;
    arrow.vy *= PHYSICS.airResistance;
    arrow.x += arrow.vx;
    arrow.y += arrow.vy;
}
\`\`\`

**Discovery:**
Q didn't just implement basic physics—it created a **complete physics system** with constants that felt immediately satisfying to play with.

### Phase 3: Multi-Ring Scoring and Visual Feedback

**My prompt:**
> Add targets with multiple scoring rings (bullseye, inner, middle, outer). Each ring should have a different color and point value. Implement precise collision detection and floating score feedback.

**Q's Implementation:**
\`\`\`javascript
// Precise circular collision with ring zones
function checkArrowTargetCollision(arrow, arrowIndex) {
    const distance = Math.sqrt(dx * dx + dy * dy);
    let points = 0, ringHit = '';
    
    if (distance <= 8) { points = 10; ringHit = 'bullseye'; }
    else if (distance <= 15) { points = 5; ringHit = 'inner'; }
    else if (distance <= 22) { points = 3; ringHit = 'middle'; }
    else if (distance <= 30) { points = 1; ringHit = 'outer'; }
    
    if (points > 0) {
        createHitEffect(centerX, centerY, points, ringHit);
    }
}
\`\`\`

Plus a complete **particle system** with expanding rings, floating score text, and color-coded effects for each ring type.

### Phase 4: The Game-Changer - Multiple Challenge Modes

This is where things got really exciting. I prompted:
> Create different challenge modes: moving targets, wind effects, obstacles, precision challenges, and time attack modes. Each should unlock progressively as players advance.

**Q's Response Blew My Mind:**

Amazon Q created **6 distinct game modes** with a complete progression system:

#### 🎯 **Classic Mode** (Available from start)
- Standard archery practice
- Progressive difficulty scaling

#### 🎪 **Moving Targets** (Unlocks Level 3)
- Targets with realistic movement physics
- Boundary collision detection
- Movement direction indicators

#### 💨 **Windy Day** (Unlocks Level 5) 
- **Real wind simulation** affecting arrow flight
- Visual wind indicator with direction/strength
- Dynamic wind patterns per level

#### 🧱 **Obstacle Course** (Unlocks Level 7)
- **Three obstacle types** with different physics:
  - **Walls**: Complete arrow stoppage
  - **Bouncers**: Energy-conserving deflection  
  - **Spinners**: Angular deflection based on rotation

#### 🔍 **Precision Challenge** (Unlocks Level 10)
- Progressively smaller targets
- Higher skill requirements

#### ⏱️ **Time Attack** (Unlocks Level 12)
- Individual target timers
- Race-against-the-clock mechanics

### Phase 5: Mobile Optimization and User Experience

**My prompt:**
> Optimize everything for mobile devices. Add haptic feedback, improved touch controls, and visual guidance for mobile users.

**Q's Mobile Enhancements:**

#### **Advanced Touch Controls:**
\`\`\`javascript
// Intelligent touch area detection
const distanceFromStickman = Math.sqrt(
    Math.pow(coords.x - stickmanCenterX, 2) + 
    Math.pow(coords.y - stickmanCenterY, 2)
);
isValidAimingStart = distanceFromStickman <= 150;
\`\`\`

#### **Haptic Feedback System:**
\`\`\`javascript
// Contextual vibration responses
if (navigator.vibrate && e.type.includes('touch')) {
    navigator.vibrate(10); // Start aiming
}
if (stickman.bowPower > 0.8) {
    navigator.vibrate(5); // High power warning
}
if (successfulHit) {
    navigator.vibrate(); // Success pattern
}
\`\`\`

## The Statistics System: Unexpected Depth

One prompt that surprised me was asking for "comprehensive statistics tracking." Q created:

### **Real-Time Performance Analytics:**
- Total score and accuracy percentages
- Ring-specific hit breakdown (bullseye, inner, middle, outer)
- Current and best streak tracking
- Recent shots history with details
- Arrows shot vs targets hit ratios

## Key Prompting Techniques That Worked

### 1. **Progressive Complexity**
Started simple, then layered complexity:
\`\`\`
"Add basic physics" → "Add wind effects" → "Add obstacle collision"
\`\`\`

### 2. **Specific Visual Requests**
\`\`\`
"Add particle bursts with 15 particles for bullseye, 8 for inner ring"
\`\`\`

### 3. **Platform-Specific Optimization**
\`\`\`
"Optimize for mobile with haptic feedback and touch-friendly controls"
\`\`\`
Q understood the unique requirements of touch interfaces.

## The Final Product: Beyond My Expectations

What started as a simple archery game became:

### **Technical Achievements:**
- **1,200+ lines** of optimized JavaScript
- **6 game modes** with unique mechanics
- **Advanced physics** rivaling commercial games  
- **Mobile-first design** with haptic feedback
- **Real-time statistics** and performance tracking
- **Progressive unlocking** system
- **Comprehensive visual effects** system

### **User Experience Features:**
- **Intuitive controls** on any device
- **Visual feedback** for every interaction
- **Clear progression** through levels and modes
- **Professional UI** with responsive design
- **Accessibility features** including visual guidance

## Development Automation That Saved Massive Time

Amazon Q handled tasks that typically take developers days:

### **Project Architecture:**
- Complete file structure with proper separation of concerns
- Responsive CSS with mobile-first approach
- Comprehensive documentation generation

### **Complex Physics Implementation:**
- Gravitational calculations and air resistance
- Wind simulation with vector mathematics
- Multi-type collision detection systems
- Performance-optimized rendering loops

### **Cross-Platform Compatibility:**
- Unified input handling for mouse and touch
- Responsive design adapting to any screen size
- High-DPI display support
- Browser compatibility testing

## Lessons Learned: The Power of AI-Driven Development

### **What Amazed Me:**
1. **Architectural Thinking**: Q doesn't just write code—it designs complete systems
2. **Performance Awareness**: Automatic optimization for mobile devices
3. **User Experience Focus**: Intuitive controls and feedback systems
4. **Code Quality**: Clean, maintainable, well-commented code
5. **Feature Completeness**: Every request resulted in production-ready implementations

### **Effective Prompting Strategies:**
- **Start with architecture, then add features**
- **Be specific about user experience goals**
- **Request performance considerations upfront**
- **Ask for visual feedback and polish**
- **Iterate based on playtesting feedback**

### **Where Human Input Remained Crucial:**
- **Creative direction** and game design decisions
- **Playtesting** and balance feedback
- **Feature prioritization** and scope management
- **Quality assurance** and cross-platform testing

## Try It Yourself

🎮 **[PLAY THE GAME NOW →](https://nitinya9av.github.io/stickman-archer/)**

![Stickman Archer Game Demo](giphy.gif)

### **How to Play:**
1. **Desktop**: Click and drag from stickman to aim, release to shoot
2. **Mobile**: Touch and drag with haptic feedback and visual guides
3. **Progress**: Unlock new modes by completing levels
4. **Master**: Learn each mode's unique challenges and physics

### **Game Modes Available:**
- **Classic** → **Moving Targets** → **Windy Day** → **Obstacle Course** → **Precision Challenge** → **Time Attack**

## Final Thoughts: The Future of Game Development

Building this game with Amazon Q CLI was revelatory. In conversations spanning just a few hours, I created a gaming experience that would typically require weeks of development. The AI handled:

- **Complex physics calculations** I would have struggled with
- **Cross-platform compatibility** that usually requires extensive testing  
- **Performance optimizations** that take years to master
- **User experience polish** that separates good games from great ones

This isn't just about faster development—it's about **democratizing game creation**. Anyone with creative ideas can now build sophisticated interactive experiences through natural conversation.

The future of development isn't human vs. AI—it's **human creativity amplified by AI capability**.

## Share Your Experience

Try building your own game with Amazon Q CLI and share it with **#AmazonQCLI**! 

What will you create when the only limit is your imagination?

---

**Repository:** [Check out the full code](https://github.com/nitinya9av/stickman-archer)  
**#AmazonQCLI #BuildGamesChallenge #GameDev #AI**

*Built entirely through conversational prompting with Amazon Q CLI - no manual coding required.*`,
        date: new Date().toISOString()
    };
    
    posts.push(stickmanPost);
    savePosts();
}

// Navigation
function showPostsList() {
    document.getElementById('post-view').classList.add('hidden');
    document.getElementById('posts-list').classList.remove('hidden');
    window.location.hash = '';
    document.title = '@nitinya9av';
    renderPosts();
}

function showPost(postId) {
    const post = posts.find(p => p.id == postId);
    if (!post) {
        showPostsList();
        return;
    }
    
    document.getElementById('posts-list').classList.add('hidden');
    document.getElementById('post-view').classList.remove('hidden');
    window.location.hash = `post/${post.slug}`;
    document.title = `${post.title} - @nitinya9av`;
    
    document.getElementById('post-display').innerHTML = `
        <div class="post-content">
            <div class="post-header-info">
                <h1>${escapeHtml(post.title)}</h1>
                <div class="post-meta">
                    <span class="post-date">${formatDate(post.date)}</span>
                    <button class="share-btn" onclick="sharePost(${post.id})" title="Share this post">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.50-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                        </svg>
                    </button>
                </div>
            </div>
            ${parseMarkdown(post.content)}
        </div>
    `;
}

// Render posts
function renderPosts() {
    const postsList = document.getElementById('posts-list');
    
    if (posts.length === 0) {
        postsList.innerHTML = `
            <div class="empty-state">
                <h3>No posts yet</h3>
                <p>Nothing to see here yet</p>
            </div>
        `;
        return;
    }
    
    postsList.innerHTML = posts.map(post => `
        <div class="post-item" onclick="showPost(${post.id})">
            <div class="post-title">${escapeHtml(post.title)}</div>
            <div class="post-preview">${getPreview(post.content)}</div>
            <div class="post-date">${formatDate(post.date)}</div>
        </div>
    `).join('');
}

// Utilities
function getPreview(content, maxLength = 120) {
    const plainText = content
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/```[\s\S]*?```/g, '[code]')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\n+/g, ' ')
        .trim();
    
    return plainText.length <= maxLength ? plainText : plainText.substring(0, maxLength) + '...';
}

function parseMarkdown(text) {
    // First, preserve code blocks by replacing them with placeholders
    const codeBlocks = [];
    let codeBlockIndex = 0;
    
    // Extract and preserve code blocks
    text = text.replace(/```([\s\S]*?)```/g, function(match, content) {
        const placeholder = `__CODE_BLOCK_${codeBlockIndex}__`;
        const trimmedContent = content.trim();
        const escapedContent = escapeHtml(trimmedContent);
        codeBlocks[codeBlockIndex] = `
            <div class="code-block-container">
                <button class="copy-button" onclick="copyCodeBlock(this)" title="Copy code">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                </button>
                <pre><code>${escapedContent}</code></pre>
            </div>`;
        codeBlockIndex++;
        return placeholder;
    });
    
    // Process other markdown elements
    text = text
        // Handle headers
        .replace(/^# (.*$)/gm, '<h1>$1</h1>')
        .replace(/^## (.*$)/gm, '<h2>$1</h2>')
        .replace(/^### (.*$)/gm, '<h3>$1</h3>')
        .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
        .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
        .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/(?<!\*)\*([^\*\n]+)\*(?!\*)/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;">')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
        .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/((?:<li>.*?<\/li>\s*)+)/g, '<ul>$1</ul>')
        .replace(/\n\s*\n/g, '</p><p>')
        .replace(/^(?!<[h1-6]|<ul|<blockquote|<pre|__CODE_BLOCK_)/gm, '<p>')
        .replace(/(?<!>)$/gm, '</p>')
        .replace(/<p><\/p>/g, '')
        .replace(/<p>(<[h1-6])/g, '$1')
        .replace(/(<\/[h1-6]>)<\/p>/g, '$1')
        .replace(/<p>(<ul)/g, '$1')
        .replace(/(<\/ul>)<\/p>/g, '$1')
        .replace(/<p>(<blockquote)/g, '$1')
        .replace(/(<\/blockquote>)<\/p>/g, '$1');
    
    for (let i = 0; i < codeBlocks.length; i++) {
        text = text.replace(`__CODE_BLOCK_${i}__`, codeBlocks[i]);
    }
    
    return text;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Utility function to generate URL-friendly slugs
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim('-'); // Remove leading/trailing hyphens
}

// Storage
function savePosts() {
    localStorage.setItem('blog-posts', JSON.stringify(posts));
}

function loadPosts() {
    const saved = localStorage.getItem('blog-posts');
    if (saved) {
        posts = JSON.parse(saved);
    }
}

// Copy code block functionality
function copyCodeBlock(button) {
    const codeBlock = button.parentElement.querySelector('code');
    const text = codeBlock.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        // Visual feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>`;
        button.style.color = '#4CAF50';
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.color = '';
        }, 2000);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Visual feedback
        const originalHTML = button.innerHTML;
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>`;
        button.style.color = '#4CAF50';
        
        setTimeout(() => {
            button.innerHTML = originalHTML;
            button.style.color = '';
        }, 2000);
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !document.getElementById('post-view').classList.contains('hidden')) {
        showPostsList();
    }
});

// Handle page sharing and direct links
function getPostUrl(postId) {
    const post = posts.find(p => p.id == postId);
    return `${window.location.origin}${window.location.pathname}#post/${post.slug}`;
}

function sharePost(postId) {
    const url = getPostUrl(postId);
    if (navigator.share) {
        const post = posts.find(p => p.id == postId);
        navigator.share({
            title: post.title,
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        // Could add a toast notification here
    }
}
