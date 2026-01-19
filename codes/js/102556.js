import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [input, setInput] = useState('');
  const [rewritten, setRewritten] = useState('');
  const [loading, setLoading] = useState(false);
  // AI detection loading state removed
  const [error, setError] = useState('');
  const [preserveStyle, setPreserveStyle] = useState(false);
  const [humanizationStrength, setHumanizationStrength] = useState('medium');
  // AI percentage feature removed
  const [characterCount, setCharacterCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);
  const outputRef = useRef(null);
  const inputRef = useRef(null);

  // AI detection function removed

  async function handleRewrite() {
    const trimmedInput = input.trim();
    if (!trimmedInput) {
      setError('Please enter some text to humanize');
      return;
    }
    
    if (trimmedInput.length < 250) {
      setError('Please enter at least 250 characters for better results');
      return;
    }
    
    if (trimmedInput.length > 8000) {
      setError('Text exceeds the maximum limit of 8000 characters');
      return;
    }
    
    setError('');
    setLoading(true);
    
    try {
      
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: input,
          preserveStyle,
          humanizationStrength
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to rewrite text');
      }
      
      const data = await res.json();
      setRewritten(data.rewritten);
      
      // AI percentage detection removed
      
    } catch (err) {
      setError(err.message || 'An error occurred while processing your request');
      console.error('Rewrite error:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleTryAgain() {
    if (humanizationStrength === 'light') {
      setHumanizationStrength('medium');
    } else if (humanizationStrength === 'medium') {
      setHumanizationStrength('strong');
    }
    handleRewrite();
  }

  function handleCopyOutput() {
    if (rewritten) {
      navigator.clipboard.writeText(rewritten)
        .then(() => {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 1500);
        })
        .catch(err => {
          setError('Failed to copy text: ' + err.message);
        });
    }
  }

  // AI score color function removed

  useEffect(() => {
    // Add keyframes and styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes moveStripes { from { background-position: 0 0; } to { background-position: 100px 0; } }
      @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
      @keyframes shimmer { 0% { background-position: -1000px 0; } 100% { background-position: 1000px 0; } }
      
      * { box-sizing: border-box; }
      
      button {
        transition: all 0.2s ease;
      }
      
      button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      }
      
      button:active:not(:disabled) {
        transform: translateY(1px);
      }
      
      textarea:focus {
        border-color: #4299e1;
        box-shadow: 0 0 0 3px rgba(66, 153, 225, 0.15);
      }
    `;
    document.head.appendChild(style);
    
    // Load Inter font
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);
    
    return () => {
      document.head.removeChild(style);
      document.head.removeChild(fontLink);
    };
  }, []);

  return (
    <>
      <Head>
        <title>MakeAIHuman.org - Transform AI Text to Sound Naturally Human</title>
        <meta name="google-site-verification" content="CVBuUi3ueMfmls-iuSBuBJ_RtZFjHhoxtQAyq4RxutI" />
        <meta name="description" content="Transform AI-generated text into natural human writing. Our AI text humanizer helps professionals, writers and content creators make their content sound more naturally human and authentic." />
        <meta name="keywords" content="AI text humanizer, make AI text sound human, bypass AI detection, humanize AI text, AI essay rewriter, AI paraphraser, AI text converter, ChatGPT humanizer, AI writing tool" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://makeaihuman.org/" />
        <meta property="og:title" content="MakeAIHuman.org - Transform AI Text to Sound Naturally Human" />
        <meta property="og:description" content="Transform AI-generated text into natural human writing. Our tool helps professionals, writers and content creators make their content sound more naturally human and authentic." />
        <meta property="og:image" content="https://makeaihuman.org/og-image.jpg" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://makeaihuman.org/" />
        <meta property="twitter:title" content="MakeAIHuman.org - Transform AI Text to Sound Naturally Human" />
        <meta property="twitter:description" content="Transform AI-generated text into natural human writing. Our tool helps professionals, writers and content creators make their content sound more naturally human and authentic." />
        <meta property="twitter:image" content="https://makeaihuman.org/og-image.jpg" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://makeaihuman.org/" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        
        {/* Robots */}
        <meta name="robots" content="index, follow" />
        
        {/* Google AdSense */}
        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4611074664474947"
          crossorigin="anonymous"></script>
        <script>
          (adsbygoogle = window.adsbygoogle || []).push({});
        </script>
        
        {/* Schema.org structured data */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "MakeAIHuman.org",
            "url": "https://makeaihuman.org/",
            "description": "Transform AI-generated text into natural human writing. Our AI text humanizer helps professionals, writers and content creators make their content sound more naturally human and authentic.",
            "applicationCategory": "Education",
            "operatingSystem": "All",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "keywords": "AI text humanizer, make AI text sound human, bypass AI detection, humanize AI text, AI essay rewriter, AI paraphraser, AI text converter, ChatGPT humanizer, AI writing tool",
            "softwareHelp": {
              "@type": "CreativeWork",
              "text": "A tool that helps transform AI-generated text to sound more human and bypass AI detection tools."
            }
          })}
        </script>
        
        {/* FAQ Schema */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does MakeAIHuman.org improve AI-generated text?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "MakeAIHuman.org uses advanced language processing to rewrite AI-generated text in a way that preserves the original meaning while making it sound more naturally human and authentic."
                }
              },
              {
                "@type": "Question",
                "name": "Can MakeAIHuman.org help with my content?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes! MakeAIHuman.org is designed to help with all types of content including articles, reports, marketing copy, and creative writing by making AI-generated text sound more natural and authentic while maintaining the original meaning."
                }
              },
              {
                "@type": "Question",
                "name": "How does MakeAIHuman.org enhance writing?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "When you use MakeAIHuman.org to rewrite your AI-generated content, the resulting text sounds more authentic and natural, with improved flow and readability while preserving your original message and intent."
                }
              },
              {
                "@type": "Question",
                "name": "Is MakeAIHuman.org free to use?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, MakeAIHuman.org is a free tool that helps transform AI-generated text into naturally human-sounding content that reads more authentically."
                }
              }
            ]
          })}
        </script>
      </Head>
      <div style={{
      fontFamily: '"Inter", system-ui, sans-serif',
      maxWidth: '1000px',
      margin: '0 auto',
      padding: '40px 20px',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #e4ecfb 100%)',
      minHeight: '100vh'
    }}>
      <header style={{
        textAlign: 'center', 
        marginBottom: '50px',
        position: 'relative',
        padding: '20px 0'
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(0,210,255,0.1) 0%, rgba(58,123,213,0.05) 70%, rgba(255,255,255,0) 100%)',
          borderRadius: '50%',
          zIndex: '0'
        }}></div>
        <h1 style={{
          fontSize: '42px',
          background: 'linear-gradient(90deg, #3a7bd5, #00d2ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          margin: '0 0 15px',
          fontWeight: '700',
          letterSpacing: '-0.5px',
          position: 'relative',
          zIndex: '1'
        }}>
          MakeAIHuman.org
        </h1>
        <p style={{
          color: '#4a5568', 
          fontSize: '20px',
          maxWidth: '650px',
          margin: '0 auto 15px',
          lineHeight: '1.5',
          position: 'relative',
          zIndex: '1'
        }}>
          Transform AI-generated essays and content to sound naturally human 
        </p>
        <h2 style={{
          fontSize: '18px',
          color: '#4a5568',
          margin: '15px 0 0',
          fontWeight: '500',
          padding: '8px 24px',
          background: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '20px',
          display: 'inline-block',
          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
          position: 'relative',
          zIndex: '1'
        }}>
          Advanced AI text humanizer for natural-sounding content
        </h2>
      </header>
      
      <div style={{
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
        marginBottom: '30px',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        border: '1px solid rgba(226, 232, 240, 0.5)'
      }}>
        <label style={{
          display: 'block',
          marginBottom: '16px',
          fontWeight: '600',
          fontSize: '18px',
          color: '#2d3748',
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: 'rgba(66, 153, 225, 0.1)',
            marginRight: '8px',
            color: '#3182ce',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>1</span>
          Paste Your AI Text
        </label>
        <section style={{
  backgroundColor: 'white',
  padding: '30px',
  borderRadius: '16px',
  marginBottom: '30px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  border: '1px solid #e2e8f0'
}}>
  <h2 style={{ fontSize: '22px', color: '#2d3748', marginBottom: '12px' }}>What is MakeAIHuman.org?</h2>
  <p style={{ fontSize: '16px', color: '#4a5568', lineHeight: '1.7' }}>
    MakeAIHuman.org is a free AI text rewriting tool that helps you transform robotic, AI-generated content into
    naturally human-sounding writing. Whether you're using ChatGPT, Jasper, or another model, our tool rewrites your
    text with improved flow, tone, and authenticity — while staying true to your original meaning.
  </p>

  <h3 style={{ fontSize: '18px', marginTop: '20px', marginBottom: '10px', color: '#2d3748' }}>How does it work?</h3>
  <p style={{ fontSize: '16px', color: '#4a5568', lineHeight: '1.7' }}>
    Just paste your AI-generated content into the box below, select a rewrite strength, and click the "Make AI Text
    Sound Human" button. You'll get a new version that's more readable and less detectable by tools like GPTZero.
  </p>

  <h3 style={{ fontSize: '18px', marginTop: '20px', marginBottom: '10px', color: '#2d3748' }}>Why use it?</h3>
  <ul style={{ paddingLeft: '20px', color: '#4a5568', lineHeight: '1.6' }}>
    <li>✔ Improve clarity and natural tone</li>
    <li>✔ Avoid AI detection tools in school or online</li>
    <li>✔ Make essays, reports, and blog posts sound more human</li>
    <li>✔ Free to use, with no login required</li>
  </ul>
</section>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setCharacterCount(e.target.value.length);
          }}
          placeholder="Paste your AI-generated essay or text here to make it sound human and bypass detection..."
          style={{
            width: '100%',
            minHeight: '180px',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            resize: 'vertical',
            fontFamily: 'inherit',
            fontSize: '16px',
            lineHeight: '1.6',
            boxSizing: 'border-box',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.02)',
            transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            outline: 'none',
            ':focus': {
              borderColor: '#4299e1',
              boxShadow: 'inset 0 2px 4px rgba(66, 153, 225, 0.1), 0 0 0 3px rgba(66, 153, 225, 0.15)'
            }
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between', 
          fontSize: '14px', 
          color: '#a0aec0', 
          marginTop: '12px',
          alignItems: 'center'
        }}>
          <span style={{
            color: characterCount < 250 ? '#e53e3e' : (characterCount > 8000 ? '#e53e3e' : '#38a169'),
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            {characterCount < 250 ? (
              <>
                <span style={{ color: '#e53e3e', fontSize: '18px' }}>•</span>
                <span>{250 - characterCount} more characters needed</span>
              </>
            ) : ''}
            {characterCount > 8000 ? (
              <>
                <span style={{ color: '#e53e3e', fontSize: '18px' }}>•</span>
                <span>{characterCount - 8000} characters over limit</span>
              </>
            ) : ''}
            {characterCount >= 250 && characterCount <= 8000 ? (
              <>
                <span style={{ color: '#38a169', fontSize: '18px' }}>•</span>
                <span>Text length is good</span>
              </>
            ) : ''}
          </span>
          <span style={{
            backgroundColor: characterCount < 250 || characterCount > 8000 ? 'rgba(229, 62, 62, 0.1)' : 'rgba(56, 161, 105, 0.1)',
            color: characterCount < 250 || characterCount > 8000 ? '#e53e3e' : '#38a169',
            padding: '4px 10px',
            borderRadius: '12px',
            fontWeight: '500'
          }}>
            {characterCount} / 8000
          </span>
        </div>
        
        {/* AI percentage feature removed */}
      </div>

      <div style={{
        display: 'flex',
        gap: '30px',
        flexWrap: 'wrap',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
        padding: '30px',
        marginBottom: '30px',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        border: '1px solid rgba(226, 232, 240, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, #3a7bd5, #00d2ff)',
          opacity: 0.7
        }}></div>
        <div style={{flex: '1', minWidth: '250px'}}>
          <label style={{
            display: 'block',
            marginBottom: '16px',
            fontWeight: '600',
            fontSize: '18px',
            color: '#2d3748',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'rgba(66, 153, 225, 0.1)',
              marginRight: '8px',
              color: '#3182ce',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>2</span>
            Humanization Settings
          </label>
          <div style={{
            marginBottom: '20px',
            backgroundColor: 'rgba(237, 242, 247, 0.5)',
            padding: '15px',
            borderRadius: '10px',
            transition: 'background-color 0.2s ease'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              gap: '12px',
              fontWeight: '500',
              color: '#4a5568'
            }}>
              <div style={{
                position: 'relative',
                width: '40px',
                height: '20px',
                backgroundColor: preserveStyle ? '#4299e1' : '#cbd5e0',
                borderRadius: '20px',
                transition: 'background-color 0.2s',
                cursor: 'pointer'
              }}>
                <div style={{
                  position: 'absolute',
                  left: preserveStyle ? '20px' : '0px',
                  top: '0px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  transition: 'left 0.2s',
                  backgroundColor: 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}></div>
                <input
                  type="checkbox"
                  checked={preserveStyle}
                  onChange={e => setPreserveStyle(e.target.checked)}
                  style={{
                    opacity: 0,
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    cursor: 'pointer',
                    zIndex: 1
                  }}
                />
              </div>
              <span>Preserve original tone/style</span>
            </label>
            <p style={{
              margin: '10px 0 0 52px',
              fontSize: '14px',
              color: '#718096',
              lineHeight: '1.5'
            }}>
              Maintain the author's voice while making the text sound more human
            </p>
          </div>
        </div>
        
        <div style={{flex: '1', minWidth: '250px'}}>
          <label style={{
            display: 'block',
            marginBottom: '16px',
            fontWeight: '600',
            fontSize: '18px',
            color: '#2d3748',
            display: 'flex',
            alignItems: 'center'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: 'rgba(66, 153, 225, 0.1)',
              marginRight: '8px',
              color: '#3182ce',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>3</span>
            Humanization Strength
          </label>
          <div style={{display: 'flex', gap: '10px', flexDirection: 'column'}}>
            {['light', 'medium', 'strong'].map(strength => (
              <button
                key={strength}
                onClick={() => setHumanizationStrength(strength)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 15px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: humanizationStrength === strength 
                    ? 'rgba(66, 153, 225, 0.1)' 
                    : 'rgba(237, 242, 247, 0.5)',
                  color: humanizationStrength === strength ? '#2b6cb0' : '#4a5568',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  backgroundColor: humanizationStrength === strength ? '#4299e1' : 'transparent',
                  transition: 'background-color 0.2s ease'
                }}></div>
                
                <div style={{
                  marginLeft: '8px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <span style={{
                    textTransform: 'capitalize', 
                    marginBottom: '2px',
                    fontWeight: humanizationStrength === strength ? '600' : '500',
                  }}>
                    {strength}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: '#718096'
                  }}>
                    {strength === 'light' && 'Subtle changes, closest to original'}
                    {strength === 'medium' && 'Balanced humanization (recommended)'}
                    {strength === 'strong' && 'Maximum humanization, most undetectable'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{
          color: '#c53030',
          backgroundColor: '#fff5f5',
          padding: '18px 20px',
          borderRadius: '12px',
          border: '1px solid rgba(252, 129, 129, 0.5)',
          fontSize: '15px',
          marginBottom: '25px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(229, 62, 62, 0.06)',
          lineHeight: '1.5',
          animation: 'fadeIn 0.3s ease'
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#FED7D7" />
            <path d="M12 8v4M12 16h.01" stroke="#C53030" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {error}
        </div>
      )}
      
      <button 
        onClick={handleRewrite} 
        disabled={loading}
        style={{
          backgroundColor: '#4299e1',
          backgroundImage: 'linear-gradient(135deg, #3a7bd5, #00d2ff)',
          color: 'white',
          padding: '16px 32px',
          border: 'none',
          borderRadius: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.8 : 1,
          fontSize: '18px',
          fontWeight: '600',
          width: '100%',
          height: '70px',
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: loading ? '0 5px 15px rgba(66, 153, 225, 0.2)' : '0 10px 25px rgba(66, 153, 225, 0.3)',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
          backgroundSize: '100px 100px',
          animation: loading ? 'moveStripes 2s linear infinite' : 'none',
          opacity: 0.2
        }}></div>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          justifyContent: 'center'
        }}>
          {loading ? (
            <>
              <span style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                animation: 'spin 1s linear infinite'
              }}></span>
              <span>Humanizing Your Text...</span>
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{marginTop: '-2px'}}>
                <path d="M12 16L7 11H17L12 16Z" fill="white" />
              </svg>
              <span>Make AI Text Sound Human</span>
            </>
          )}
        </span>
      </button>
      {/* --- Manual Ad Block: After Rewrite Button --- */}
      <div style={{ margin: '30px 0', textAlign: 'center' }}>
        <ins className="adsbygoogle"
        style={{ display: 'block', margin: 'auto' }}
        data-ad-client="ca-pub-4611074664474947"
        data-ad-slot="6324829605"  // replace with your slot ID
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
        <script>
        {`(adsbygoogle = window.adsbygoogle || []).push({});`}
        </script>
        </div>

      {rewritten && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.05)',
          padding: '30px',
          border: '1px solid rgba(226, 232, 240, 0.5)',
          animation: 'fadeIn 0.5s ease-out',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: 'linear-gradient(90deg, #38A169, #9AE6B4)',
            opacity: 0.7
          }}></div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            position: 'relative'
          }}>
            <div>
              <h3 style={{
                margin: '0',
                fontSize: '20px',
                fontWeight: '600',
                color: '#2d3748',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(56, 161, 105, 0.1)',
                  color: '#38A169',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>✓</span>
                Humanized Text
              </h3>
              <div style={{marginTop: '12px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                <button
                  onClick={handleTryAgain}
                  style={{
                    backgroundColor: 'rgba(66, 153, 225, 0.1)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#3182ce',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                  }}
                  title="Try stronger humanization"
                  onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(66, 153, 225, 0.15)'}
                  onMouseOut={e => e.currentTarget.style.backgroundColor = 'rgba(66, 153, 225, 0.1)'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 11C19.7554 8.24023 17.9874 5.7775 15.3162 4.51677C12.6451 3.25604 9.47584 3.35401 6.89712 4.78568C4.3184 6.21736 2.61147 8.82016 2.2301 11.7724C1.84872 14.7247 2.82024 17.6799 4.90087 19.8004C6.9815 21.9209 9.95847 22.9888 13.0008 22.7157C16.0432 22.4426 18.7874 20.857 20.5344 18.3523C22.2815 15.8476 22.8342 12.6576 22.0425 9.68036" stroke="#3182CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14L9 11" stroke="#3182CE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Try Stronger Humanization
                </button>
                <div style={{
                  backgroundColor: 'rgba(56, 161, 105, 0.1)',
                  color: '#38A169',
                  fontWeight: '500',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '13px'
                }}>
                  Ready to use
                </div>
              </div>
            </div>
            <div style={{display: 'flex', gap: '10px'}}>
              <button
                onClick={() => setShowOriginalComparison(!showOriginalComparison)}
                style={{
                  backgroundColor: showOriginalComparison ? 'rgba(66, 153, 225, 0.1)' : 'white',
                  border: '1px solid',
                  borderColor: showOriginalComparison ? 'rgba(66, 153, 225, 0.3)' : '#e2e8f0',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  color: showOriginalComparison ? '#3182ce' : '#4a5568',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M16 2v4M8 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" 
                    stroke={showOriginalComparison ? "#3182ce" : "#4a5568"} 
                    strokeWidth="2" 
                    strokeLinecap="round"
                  />
                </svg>
                {showOriginalComparison ? 'Hide Original' : 'Compare with Original'}
              </button>

              <button
                onClick={handleCopyOutput}
                style={{
                  backgroundColor: copied ? 'rgba(56, 161, 105, 0.1)' : 'white',
                  border: '1px solid',
                  borderColor: copied ? 'rgba(56, 161, 105, 0.3)' : '#e2e8f0',
                  borderRadius: '12px',
                  padding: '10px 16px',
                  cursor: 'pointer',
                  fontWeight: '500',
                  color: copied ? '#38A169' : '#4a5568',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8 4v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.242a2 2 0 0 0-.602-1.43L16.083 2.57A2 2 0 0 0 14.685 2H10a2 2 0 0 0-2 2z" 
                    stroke={copied ? "#38A169" : "#4a5568"} 
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path d="M16 18v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h2" 
                    stroke={copied ? "#38A169" : "#4a5568"} 
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  {copied && <path d="M9 15l3 3L21 9" stroke="#38A169" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
                </svg>
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
          </div>
          
          {showOriginalComparison ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '15px',
              marginTop: '15px'
            }}>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '10px'
                }}>
                  Original Text
                </div>
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '20px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'inherit',
                  fontSize: '16px',
                  lineHeight: '1.7',
                  maxHeight: '500px',
                  overflowY: 'auto'
                }}>
                  {input}
                </div>
              </div>
              <div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '10px'
                }}>
                  Humanized Text
                </div>
                <pre 
                  ref={outputRef}
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'inherit',
                    fontSize: '16px',
                    lineHeight: '1.7',
                    margin: 0,
                    maxHeight: '500px',
                    overflowY: 'auto'
                  }}
                >
                  {rewritten}
                </pre>
              </div>
            </div>
          ) : (
            <pre 
              ref={outputRef}
              style={{
                backgroundColor: '#f8fafc',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'inherit',
                fontSize: '16px',
                lineHeight: '1.7',
                margin: '15px 0 0 0',
                maxHeight: '500px',
                overflowY: 'auto'
              }}
            >
              {rewritten}
            </pre>
          )}
          
          {/* AI detection loading indicator removed */}
        </div>
      )}
      
      <div style={{
        marginTop: '60px',
        fontSize: '14px',
        color: '#718096',
        borderTop: '1px solid rgba(226, 232, 240, 0.5)',
        paddingTop: '30px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(237, 242, 247, 0) 0%, rgba(237, 242, 247, 0.5) 100%)',
        borderRadius: '0 0 16px 16px',
        padding: '30px'
      }}>
        <p>© 2025 MakeAIHuman.org — The #1 Tool to Transform AI Text into Natural Human Writing</p>
        <p>
          <a href="/terms" style={{ margin: '0 10px', color: '#4299e1' }}>Terms of Service</a> | 
           <a href="/privacy" style={{ margin: '0 10px', color: '#4299e1' }}>Privacy Policy</a>
        </p>

        <div style={{
          marginTop: '20px',
          fontSize: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <p>Trusted by professionals, writers and content creators to enhance AI-generated text</p>
          <div style={{ marginTop: '10px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#4a5568' }}>Why Use MakeAIHuman.org?</h3>
            <ul style={{ 
              textAlign: 'left', 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '10px',
              padding: '0',
              margin: '0',
              listStyle: 'none'
            }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#4299e1' }}>✓</span> Enhance AI-generated content
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#4299e1' }}>✓</span> Create more authentic writing
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#4299e1' }}>✓</span> Maintain original meaning
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: '#4299e1' }}>✓</span> Sound naturally human
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}