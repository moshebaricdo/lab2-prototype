import type { ChatMessage } from "../../types/chat";
import type { FileItem } from "../../types/file";

export const fileStructure: FileItem[] = [
  {
    name: "My Project",
    type: "folder",
    children: [
      {
        name: "index.html",
        type: "html",
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My First Webpage</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header class="header">
        <h1>My First Webpage</h1>
    </header>
    <nav class="nav">
        <a href="#home">Home</a>
        <a href="#about">About</a>
        <a href="#services">Services</a>
        <a href="#contact">Contact</a>
    </nav>
    <div class="container">
        <div class="hero">
            <h1>Welcome to My Website</h1>
            <p>Building amazing web experiences with HTML and CSS</p>
            <button class="button">Get Started</button>
        </div>
        <div class="cards">
            <div class="card">
                <h3>Responsive Design</h3>
                <p>This website looks great on all devices, from mobile phones to desktop computers.</p>
            </div>
            <div class="card">
                <h3>Modern Layout</h3>
                <p>Built with modern CSS techniques including flexbox and grid for flexible layouts.</p>
            </div>
            <div class="card">
                <h3>Clean Code</h3>
                <p>Semantic HTML and well-organized CSS make this code easy to understand and maintain.</p>
            </div>
        </div>
    </div>
    <footer class="footer">
        <p>&copy; 2025 My First Webpage. All rights reserved.</p>
    </footer>
</body>
</html>`,
      },
      {
        name: "styles.css",
        type: "css",
        content: `body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f0f0f0;
}

.header {
    background-color: #333;
    color: white;
    padding: 1rem;
    text-align: center;
}

.nav {
    background-color: #444;
    padding: 0.75rem;
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.nav a {
    color: white;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.2s;
}

.nav a:hover {
    background-color: #555;
}

.container {
    max-width: 1200px;
    margin: 2rem auto;
    padding: 0 1rem;
}

.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 3rem 2rem;
    border-radius: 8px;
    text-align: center;
    margin-bottom: 2rem;
}

.hero h1 {
    margin: 0 0 1rem 0;
    font-size: 2.5rem;
}

.hero p {
    font-size: 1.2rem;
    margin: 0 0 1.5rem 0;
}

.button {
    background-color: white;
    color: #667eea;
    border: none;
    padding: 0.75rem 2rem;
    font-size: 1rem;
    font-weight: bold;
    border-radius: 4px;
    cursor: pointer;
    transition: transform 0.2s;
}

.button:hover {
    transform: scale(1.05);
}

.cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.card {
    background-color: white;
    padding: 1.5rem;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.card h3 {
    margin: 0 0 1rem 0;
    color: #333;
}

.card p {
    margin: 0;
    color: #666;
    line-height: 1.6;
}

.footer {
    background-color: #333;
    color: white;
    text-align: center;
    padding: 2rem 1rem;
    margin-top: 2rem;
}

@media (max-width: 768px) {
    .hero h1 {
        font-size: 2rem;
    }
    
    .hero p {
        font-size: 1rem;
    }
    
    .cards {
        grid-template-columns: 1fr;
    }
}`,
      },
      {
        name: "assets",
        type: "folder",
        children: [
          { name: "logo.svg", type: "text" },
          { name: "icon.png", type: "image" },
          { name: "background.jpg", type: "image" },
          { name: "script.js", type: "file" },
          { name: "config.json", type: "file" },
        ],
      },
    ],
  },
];

export const versionLabels: Record<string, string> = {
  current: "Current Version",
  aug30: "Aug 30, 1:30PM",
  aug27: "Aug 27, 1:30PM",
  "aug26-1": "Aug 26, 12:30PM",
  "aug26-2": "Aug 26, 9:30AM",
  aug24: "Aug 24, 12:30PM",
  initial: "Initial Version",
};

export const initialChatMessages: ChatMessage[] = [];
