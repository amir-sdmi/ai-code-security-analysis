const path = require("path");
const fs = require("fs");

module.exports = (req, res) => {
  const metadataPath = path.join(__dirname, "..", "metadata.json");
  fs.readFile(metadataPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading metadata file:", err);
      res.status(500).send("Error reading metadata file");
    } else {
      const metadata = JSON.parse(data);
      const fileList = Object.keys(metadata)
        .map((file) => {
          const { title, desc, createdAt } = metadata[file];
          return {
            file,
            title,
            desc,
            createdAt: new Date(createdAt),
          };
        })
        .sort((a, b) => b.createdAt - a.createdAt) // Sort by createdAt in descending order
        .map(({ file, title, desc, createdAt }) => {
          return `
          <div class="card">
            <a href="/articles/${file}">
              <h2>${title}</h2>
            </a>
            <p>${desc}</p>
            <div class="card-footer">
              <small class="date">Created at: ${createdAt.toISOString()}</small>
              <small class"comment-count"><a href="/articles/${file}#disqus_thread" data-disqus-identifier="${file}">0 Comment</a></small>
            </div>
          </div>`;
        });

      const title = "Akbar Sahata's Blog";
      const description =
        "Welcome to my personal blog where I share my thoughts, opinions, and a comprehensive archive of my interactions with ChatGPT. Dive into the knowledge and fun!";
      const imageUrl = "/image.webp";
      const pageUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
      const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta name="description" content="${description}">
            <meta property="og:title" content="${title}">
            <meta property="og:description" content="${description}">
            <meta property="og:image" content="${imageUrl}">
            <meta property="og:url" content="${pageUrl}">
            <title>${title}</title>
            <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f0f2f5;
            color: #333;
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100vh;
            overflow-x: hidden; /* Prevent horizontal overflow */
          }
          .container {
            padding: 20px;
            max-width: 100%;
            width: 100%;
            text-align: left;
            box-sizing: border-box; /* Include padding in width calculation */
          }
          h1 {
            color: #007acc;
            font-size: 32px;
            margin-bottom: 20px;
          }
          p {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .card {
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }
          .card h2 {
            font-size: 24px;
            color: #007acc;
            margin: 0 0 10px 0;
          }
          .card p {
            font-size: 16px;
            color: #333;
            margin: 0 0 10px 0;
          }
          a {
            color: #1e90ff;
            text-decoration: none;
            font-weight: bold;
          }
          a:hover {
            text-decoration: underline;
          }
          .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 10px;
          }
          .card-footer small {
            display: block;
            margin-top: 10px;
            color: #666;
          }
          .search-container {
            margin: 20px auto;
            max-width: 100vw;
          }
          .search-container input {
            padding: 10px;
            font-size: 16px;
            border: 1px solid #ddd;
            border-radius: 4px;
            width: 100%; /* Ensure the input takes the full width of its container */
            box-sizing: border-box; /* Include padding and border in the element's total width */
          }
          .search-results {
            margin-top: 20px;
          }
          .search-results .result-item {
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }
          .search-results .result-item a {
            font-size: 18px;
            color: #007acc;
          }
          .search-results .result-item p {
            font-size: 14px;
            color: #333;
            margin: 5px 0 5px 0;
          }
          .search-results .result-item a:hover {
            text-decoration: underline;
          }
            </style>
          </head>
          <body>
            <div class="container">
          <h1>Welcome to ${title}!</h1>
          <p>${description}</p>
          <div class="search-container">
            <input type="text" id="search-input" placeholder="Search posts...">
          </div>
          <div class="search-results" id="search-results"></div>
          <div class="card-container">${fileList.join("")}</div>
            </div>
            <script src="https://cdn.jsdelivr.net/npm/fuse.js@6.4.6"></script>
            <script>
              document.querySelectorAll('small.date').forEach((element) => {
                const date = new Date(element.textContent.replace('Created at: ', ''));
                element.textContent = 'Created at: ' + date.toLocaleString();
              });

              const searchInput = document.getElementById('search-input');
              const searchResults = document.getElementById('search-results');

              fetch('/metadata.json')
                .then(response => response.json())
                .then(result => Object.keys(result)
                  .map(fileName => ({
                    file: fileName,
                    title: result[fileName].title,
                    desc: result[fileName].desc
                  }))
                )
                .then(data => {
                  const fuse = new Fuse(data, {
                    keys: ['title', 'desc'],
                    minMatchCharLength: 3,
                    distance: 500,
                  });

                  searchInput.addEventListener('input', () => {
                    const searchTerm = searchInput.value;
                    const results = fuse.search(searchTerm);

                    searchResults.innerHTML = results.map(result => {
                      const { file, title, desc } = result.item;
                      return \`
                    <div class="result-item">
                      <a href="/articles/\${file}">\${title}</a>
                      <p>\${desc}</p>
                    </div>
                      \`;
                    }).join('');
                  });
                });
            </script>
            <script id="dsq-count-scr" src="//copasan-chatgpt.disqus.com/count.js" onload="DISQUSWIDGETS.getCount({reset: true});" async></script>
          </body>
          </html>
        `;
      res.send(html);
    }
  });
};
