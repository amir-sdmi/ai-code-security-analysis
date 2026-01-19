interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface GeneratedCode {
  htmlCode: string;
  cssCode: string;
  reactCode: string;
  jsonLdCode: string;
}

interface PageData {
  pageTitle: string;
  description: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  brandColors: { primary: string; accent: string };
  fontStack: { heading: string; body: string };
  sections: string[];
}

// Function to call DeepSeek API with hardcoded API key
export const generateCodeWithDeepSeek = async (
  pageData: PageData,
): Promise<GeneratedCode | null> => {
  try {
    // Using a hardcoded API key for demo purposes
    // In a real application, this would be stored securely in environment variables
    const apiKey = "demo_api_key_for_illustration";

    const prompt = createPrompt(pageData);

    // Mock response for demonstration purposes
    // In a real app, this would make an actual API call
    const mockResponse = generateMockResponse(pageData);
    return mockResponse;

    /* In a real implementation, you would make the actual API call:
    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-coder",
          messages: [
            {
              role: "system",
              content:
                "You are an expert web developer specializing in creating SEO-optimized landing pages. Generate clean, semantic HTML, CSS, React code, and JSON-LD structured data based on the user requirements.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data: DeepSeekResponse = await response.json();
    return parseGeneratedCode(data.choices[0].message.content);
    */
  } catch (error) {
    console.error("Error generating code with DeepSeek:", error);
    return null;
  }
};

// Create a detailed prompt based on page data
const createPrompt = (pageData: PageData): string => {
  const {
    pageTitle,
    description,
    primaryKeyword,
    secondaryKeywords,
    brandColors,
    fontStack,
    sections,
  } = pageData;

  return `
    Create a landing page with the following specifications:
    
    Page Title: ${pageTitle}
    Meta Description: ${description}
    Primary Keyword: ${primaryKeyword}
    Secondary Keywords: ${secondaryKeywords.join(", ")}
    
    Brand Colors:
    - Primary: ${brandColors.primary}
    - Accent: ${brandColors.accent}
    
    Font Stack:
    - Heading Font: ${fontStack.heading}
    - Body Font: ${fontStack.body}
    
    Sections to include: ${sections.join(", ")}
    
    Please generate the following code:
    
    1. Clean, semantic HTML with proper heading structure and schema markup
    2. CSS that implements the brand colors and font stack
    3. React component code for the landing page
    4. JSON-LD structured data for SEO
    
    Format your response with clear separators between each code section like this:
    
    ---HTML---
    [HTML code here]
    
    ---CSS---
    [CSS code here]
    
    ---REACT---
    [React component code here]
    
    ---JSON-LD---
    [JSON-LD structured data here]
  `;
};

// Generate mock response for demonstration purposes
const generateMockResponse = (pageData: PageData): GeneratedCode => {
  const {
    pageTitle,
    description,
    primaryKeyword,
    brandColors,
    fontStack,
    sections,
  } = pageData;

  const htmlCode = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <title>${pageTitle}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="hero">
    <nav class="container">
      <div class="logo">${pageTitle.split(" ")[0]}</div>
      <ul class="nav-links">
        <li><a href="#features">Features</a></li>
        ${sections.includes("testimonials") ? '<li><a href="#testimonials">Testimonials</a></li>' : ""}
        ${sections.includes("pricing") ? '<li><a href="#pricing">Pricing</a></li>' : ""}
        ${sections.includes("faq") ? '<li><a href="#faq">FAQ</a></li>' : ""}
        ${sections.includes("contact") ? '<li><a href="#contact">Contact</a></li>' : ""}
      </ul>
    </nav>
    <div class="container hero-content">
      <h1>${pageTitle}</h1>
      <p class="lead">${description}</p>
      <button class="cta-button">Get Started</button>
    </div>
  </header>

  ${
    sections.includes("features")
      ? `<section id="features" class="features">
    <div class="container">
      <h2>Amazing Features</h2>
      <div class="features-grid">
        <div class="feature">
          <div class="feature-icon">✨</div>
          <h3>Feature One</h3>
          <p>A powerful feature that helps you achieve amazing results.</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🚀</div>
          <h3>Feature Two</h3>
          <p>Boost your productivity with this incredible feature.</p>
        </div>
        <div class="feature">
          <div class="feature-icon">🔒</div>
          <h3>Feature Three</h3>
          <p>Secure and reliable solution for your needs.</p>
        </div>
      </div>
    </div>
  </section>`
      : ""
  }

  ${
    sections.includes("testimonials")
      ? `<section id="testimonials" class="testimonials">
    <div class="container">
      <h2>What Our Customers Say</h2>
      <div class="testimonials-grid">
        <div class="testimonial">
          <p>"This product has completely transformed our business. Highly recommended!"</p>
          <div class="testimonial-author">- Jane Doe, CEO</div>
        </div>
        <div class="testimonial">
          <p>"The best solution we've found after trying many alternatives."</p>
          <div class="testimonial-author">- John Smith, CTO</div>
        </div>
      </div>
    </div>
  </section>`
      : ""
  }

  ${
    sections.includes("cta")
      ? `<section class="cta">
    <div class="container">
      <h2>Ready to Get Started?</h2>
      <p>Join thousands of satisfied customers today.</p>
      <button class="cta-button">Sign Up Now</button>
    </div>
  </section>`
      : ""
  }

  <footer>
    <div class="container">
      <p>&copy; 2024 ${pageTitle}. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`;

  const cssCode = `:root {
  --primary-color: ${brandColors.primary};
  --accent-color: ${brandColors.accent};
  --heading-font: '${fontStack.heading}', sans-serif;
  --body-font: '${fontStack.body}', sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--body-font);
  line-height: 1.6;
  color: #333;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--heading-font);
  font-weight: 700;
  line-height: 1.2;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header & Navigation */
header {
  background-color: var(--primary-color);
  color: white;
  padding: 20px 0;
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-links {
  display: flex;
  list-style: none;
}

.nav-links li {
  margin-left: 20px;
}

.nav-links a {
  color: white;
  text-decoration: none;
  transition: opacity 0.3s;
}

.nav-links a:hover {
  opacity: 0.8;
}

/* Hero Section */
.hero {
  padding: 100px 0;
  text-align: center;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 20px;
}

.hero-content .lead {
  font-size: 1.2rem;
  max-width: 600px;
  margin: 0 auto 30px;
}

.cta-button {
  background-color: var(--accent-color);
  color: white;
  border: none;
  padding: 12px 30px;
  font-size: 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cta-button:hover {
  background-color: darken(var(--accent-color), 10%);
}

/* Features Section */
.features {
  padding: 80px 0;
  background-color: #f9f9f9;
}

.features h2 {
  text-align: center;
  margin-bottom: 50px;
  color: var(--primary-color);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.feature {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
  text-align: center;
}

.feature-icon {
  font-size: 2rem;
  margin-bottom: 20px;
  color: var(--accent-color);
}

/* Testimonials Section */
.testimonials {
  padding: 80px 0;
}

.testimonials h2 {
  text-align: center;
  margin-bottom: 50px;
  color: var(--primary-color);
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.testimonial {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.testimonial-author {
  margin-top: 20px;
  font-weight: bold;
  color: var(--primary-color);
}

/* CTA Section */
.cta {
  background-color: var(--primary-color);
  color: white;
  padding: 80px 0;
  text-align: center;
}

.cta h2 {
  margin-bottom: 20px;
}

.cta p {
  margin-bottom: 30px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* Footer */
footer {
  background-color: #333;
  color: white;
  padding: 20px 0;
  text-align: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content h1 {
    font-size: 2.5rem;
  }
  
  .nav-links {
    display: none;
  }
}`;

  const reactCode = `import React from 'react';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <header className="hero">
        <nav className="container">
          <div className="logo">${pageTitle.split(" ")[0]}</div>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            ${sections.includes("testimonials") ? '<li><a href="#testimonials">Testimonials</a></li>' : ""}
            ${sections.includes("pricing") ? '<li><a href="#pricing">Pricing</a></li>' : ""}
            ${sections.includes("faq") ? '<li><a href="#faq">FAQ</a></li>' : ""}
            ${sections.includes("contact") ? '<li><a href="#contact">Contact</a></li>' : ""}
          </ul>
        </nav>
        <div className="container hero-content">
          <h1>${pageTitle}</h1>
          <p className="lead">${description}</p>
          <button className="cta-button">Get Started</button>
        </div>
      </header>

      ${
        sections.includes("features")
          ? `<section id="features" className="features">
        <div className="container">
          <h2>Amazing Features</h2>
          <div className="features-grid">
            <div className="feature">
              <div className="feature-icon">✨</div>
              <h3>Feature One</h3>
              <p>A powerful feature that helps you achieve amazing results.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🚀</div>
              <h3>Feature Two</h3>
              <p>Boost your productivity with this incredible feature.</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🔒</div>
              <h3>Feature Three</h3>
              <p>Secure and reliable solution for your needs.</p>
            </div>
          </div>
        </div>
      </section>`
          : ""
      }

      ${
        sections.includes("testimonials")
          ? `<section id="testimonials" className="testimonials">
        <div className="container">
          <h2>What Our Customers Say</h2>
          <div className="testimonials-grid">
            <div className="testimonial">
              <p>"This product has completely transformed our business. Highly recommended!"</p>
              <div className="testimonial-author">- Jane Doe, CEO</div>
            </div>
            <div className="testimonial">
              <p>"The best solution we've found after trying many alternatives."</p>
              <div className="testimonial-author">- John Smith, CTO</div>
            </div>
          </div>
        </div>
      </section>`
          : ""
      }

      ${
        sections.includes("cta")
          ? `<section className="cta">
        <div className="container">
          <h2>Ready to Get Started?</h2>
          <p>Join thousands of satisfied customers today.</p>
          <button className="cta-button">Sign Up Now</button>
        </div>
      </section>`
          : ""
      }

      <footer>
        <div className="container">
          <p>&copy; 2024 ${pageTitle}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;`;

  const jsonLdCode = `{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "${pageTitle}",
  "description": "${description}",
  "keywords": "${primaryKeyword}, ${pageData.secondaryKeywords.join(", ")}",
  "url": "https://www.example.com",
  "mainEntity": {
    "@type": "Organization",
    "name": "${pageTitle.split(" ")[0]}",
    "description": "${description}",
    "url": "https://www.example.com"
  }
}`;

  return {
    htmlCode,
    cssCode,
    reactCode,
    jsonLdCode,
  };
};

// Parse the generated code from the API response
const parseGeneratedCode = (content: string): GeneratedCode => {
  const htmlMatch = content.match(/---HTML---\s*([\s\S]*?)(?=\s*---CSS---|$)/);
  const cssMatch = content.match(/---CSS---\s*([\s\S]*?)(?=\s*---REACT---|$)/);
  const reactMatch = content.match(
    /---REACT---\s*([\s\S]*?)(?=\s*---JSON-LD---|$)/,
  );
  const jsonLdMatch = content.match(/---JSON-LD---\s*([\s\S]*?)(?=$)/);

  return {
    htmlCode: htmlMatch
      ? htmlMatch[1].trim()
      : "<!-- No HTML code generated -->",
    cssCode: cssMatch ? cssMatch[1].trim() : "/* No CSS code generated */",
    reactCode: reactMatch ? reactMatch[1].trim() : "// No React code generated",
    jsonLdCode: jsonLdMatch
      ? jsonLdMatch[1].trim()
      : "// No JSON-LD code generated",
  };
};
