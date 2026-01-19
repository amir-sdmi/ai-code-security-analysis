/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.jsonc`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return new Response(
			`<?xml version="1.0" encoding="UTF-8"?>
    <?xml-stylesheet type="text/xsl" href="/rss.xsl"?>
    <rss version="2.0"
         xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
         xmlns:podcast="https://podcastindex.org/namespace/1.0"
         xmlns:atom="http://www.w3.org/2005/Atom"
         xmlns:content="http://purl.org/rss/1.0/modules/content/">
      <channel>
        <title>The Bikeshed Pod</title>
        <description>The Bikeshed Pod is a weekly show where developers dive deep into the small but important details of software development that we all love to debate.</description>
        <link>https://bikeshedpod.com</link>
        <language>en-us</language>
        <atom:link href="https://bikeshedpod.com/rss.xml" rel="self" type="application/rss+xml"/>
        <itunes:category text="Technology"/>
        <itunes:explicit>true</itunes:explicit>
        <itunes:image href="https://bikeshedpod.com/bikeshed-pod-square.png"/>

        <!-- Recommended Channel Elements -->
        <podcast:locked>no</podcast:locked>
        <podcast:guid>bikeshed-podcast</podcast:guid>
        <itunes:author>Matt Hamlin, Dillon Curry &amp; Scott Kaye</itunes:author>
        <itunes:owner>
          <itunes:name><![CDATA[Matt Hamlin]]></itunes:name>
          <itunes:email>hi@bikeshedpod.com</itunes:email>
        </itunes:owner>

        <!-- Optional Channel Elements -->
        <copyright>© 2025 The Bikeshed Pod</copyright>
        <itunes:type>episodic</itunes:type>

        
          <item>
            <!-- Required Item Elements -->
            <title>Vibe Coding When The Vibes Are Off</title>
            <enclosure url="https://assets.bikeshedpod.com/episodes/1/audio.mp3"
                      type="audio/mpeg"
                      length="85070912"/>
            <guid isPermaLink="false">1</guid>

            <!-- Recommended Item Elements -->
            <link>https://bikeshedpod.com/episodes/1/vibe-coding-when-the-vibes-are-off</link>
            <pubDate>Mon, 17 Mar 2025 15:40:11 GMT</pubDate>
            <description><![CDATA[Dillon, Matt & Scott dive into AI's impact on coding, discussing its role in daily work, how to use it effectively, and balancing creativity with automation in 2025.]]></description>
            <content:encoded><![CDATA[
<p><a href="https://dilloncurry.vercel.app/">Dillon</a>, <a href="https://matthamlin.me/">Matt</a> &amp; <a href="https://scottykaye.com/">Scott</a> record an episode with some semblance of quality.</p>
<p>The gang dove directly into software&#x27;s hottest topic: AI. We believe in using AI in your day to day job to be more successful.</p>
<p>In this episode we discuss;</p>
<ul>
<li>use cases for AI in software development,</li>
<li>the fun tasks AI has taken away and,</li>
<li>how to be successful using AI tools.</li>
</ul>
<p>Listen to us explain navigating writing code in a world where more and more companies are increasingly advocating the usage of AI at your day job.</p>
<p>How do we continue to learn and grow as human while still maintaining fun, creativity and human interaction as an engineer in 2025?</p>
<p>AI is a powerful tool used correctly, however that AI will submit to confirmation bias and your role is to prompt AI to be as unbiased as possible to the best of your ability.</p>
<h3>Episode Summary:</h3>
<p>In this episode of The Bikeshed Podcast, hosts Scott Kaye, Matt Hamlin, and Dillon Curry discuss the role of AI in software development, sharing their experiences with various AI-powered tools and debating the impact of AI on engineering workflows, learning, and job satisfaction.</p>
<p>Key Topics Discussed:</p>
<ol>
<li>AI in Software Development</li>
</ol>
<ul>
<li>The hosts discuss how AI has become integral to software engineering, particularly for writing code and automating tasks.</li>
<li>Matt introduces the main discussion: how AI is used in development today and the broader implications of its adoption.</li>
</ul>
<ol start="2">
<li>Preferred AI Tools</li>
</ol>
<ul>
<li>Dillon shares that he used Cursor until his company restricted it, forcing him to switch to Copilot, which he finds inferior.</li>
<li>Scott uses NeoVim with NeoCodium and Avante, but acknowledges their limitations compared to Cursor.</li>
<li>Matt relies on Cursor at work, noting that his company prefers it over other AI tools.</li>
</ul>
<ol start="3">
<li>AI&#x27;s Impact on Development</li>
</ol>
<ul>
<li>AI enables developers to work faster but can remove the learning process.</li>
<li>Over-reliance on AI can lead to shallow understanding of code and a decrease in creativity.</li>
<li>AI often acts like a junior engineer whose code must be reviewed, making debugging a larger part of the job.</li>
<li>Using AI can lead to less collaboration with teammates, as developers tend to consult AI over their colleagues.</li>
</ul>
<ol start="4">
<li>Concerns About AI in Software Engineering</li>
</ol>
<ul>
<li>Some engineers feel less engaged with their work as AI handles boilerplate and repetitive tasks.</li>
<li>AI&#x27;s agreeable nature can reinforce incorrect assumptions, leading to confirmation bias.</li>
<li>Companies may use AI to increase efficiency and reduce hiring, raising concerns about job displacement.</li>
</ul>
<ol start="5">
<li>AI vs. Traditional Search (Google)</li>
</ol>
<ul>
<li>Unlike Google, where users must craft precise search queries, AI allows more fluid back-and-forth conversations.</li>
<li>AI can provide immediate answers but might not always offer the best or most optimized solution.</li>
</ul>
<ol start="6">
<li>The “No AI” Challenge</li>
</ol>
<ul>
<li>The hosts agree to a two-and-a-half-day challenge of coding without AI, to evaluate how it affects their work and problem-solving abilities.</li>
</ul>
<ol start="7">
<li>Game Segment – “Two Takes and a Fake”</li>
</ol>
<ul>
<li>Scott introduces a new segment where Matt and Dillon guess which of three AI-related tweets is fake.</li>
<li>Matt wins this round, showing a keen eye for spotting AI discourse trends.</li>
</ul>
<ol start="8">
<li>What&#x27;s New?</li>
</ol>
<ul>
<li>Dillon is learning piano and music theory to slow down and disconnect from work.</li>
<li>Matt is exploring Cloudflare workers and running Deepseek R1 locally for AI experimentation.</li>
<li>Scott is focused on improving his Golang skills and debating Cherry Pepsi Zero vs. Cherry Coke Zero.</li>
</ul>
<ol start="9">
<li>Closing Thoughts</li>
</ol>
<ul>
<li>The hosts discuss burnout, learning in tech, and how side projects keep programming fun.</li>
<li>They tease next week&#x27;s episode on burnout and side projects.</li>
</ul>
<p>The episode wraps up with some lighthearted banter and a call for listeners to like, subscribe, and share.</p>]]></content:encoded>
            <itunes:duration>3544</itunes:duration>
            <podcast:transcript url="https://assets.bikeshedpod.com/episodes/1/captions.vtt" type="text/vtt"/>
            <itunes:explicit>true</itunes:explicit>
          </item>
        

          <item>
            <!-- Required Item Elements -->
            <title>Is The Web Getting Worse?!?!?</title>
            <enclosure url="https://assets.bikeshedpod.com/episodes/2/audio.mp3"
                      type="audio/mpeg"
                      length="93307007"/>
            <guid isPermaLink="false">2</guid>

            <!-- Recommended Item Elements -->
            <link>https://bikeshedpod.com/episodes/2/is-the-web-getting-worse</link>
            <pubDate>Wed, 19 Mar 2025 14:14:20 GMT</pubDate>
            <description><![CDATA[Scott and Matt talk about how things have been feeling worse on the internet in recent years, and how everything has focused on incremental optimizations over large innovations.]]></description>
            <content:encoded><![CDATA[<h2>Summary:</h2>
<p>This episode of the Bikeshed Podcast explores the concept of &quot;enshittification,&quot; the idea that the quality of products and services deteriorates over time, often accompanied by increased monetization and decreased customer value. They further discuss how this relates to web development and the broader tech industry. They explore potential cultural factors behind this.</p>
<p>Key Discussion Points:</p>
<ul>
<li>Enshittification Examples: The hosts provide examples of enshittification in popular services like Spotify (increased ads with subscription) and Netflix (higher prices for premium features). Facebook is also mentioned as a product that has seemingly declined in popularity as it has aged.</li>
<li>AI Integration: The hosts discussed the trend of tacking on AI to products just to say that they offer AI features, which can often be annoying and not serve the original purpose of the product.</li>
<li>Lost Focus on User Needs: They discuss how companies sometimes lose sight of their original mission and focus more on monetization through KPIs rather than solving customer needs. The hosts share that as measures become metrics, they become less valuable over time.</li>
<li><a href="https://grantslatton.com/nobody-cares">&quot;Nobody Cares&quot; Blog Post</a>: They discuss the Grant Slatton blog post, interpreting it as a reflection of how engineers may be disempowered from caring about the overall product due to narrow focus and lack of agency in larger organizations.</li>
<li>“Shadification of the Web”: They introduce the term &quot;shadification&quot; to describe the growing trend of websites looking the same due to the widespread use of component libraries like Shadcn/ui (copy-paste) along with Material UI and Bootstrap.</li>
<li>Optimization vs. Innovation: They discuss how companies often prioritize optimization and A/B testing over true innovation, resulting in a lack of creativity and unique user experiences.</li>
<li>Performance Costs: Optimizations made at the expense of performance degrade the customer experience.</li>
<li>Blurred Ownership: In larger companies, it becomes harder to draw ownership lines when there are more people owning things and there isn&#x27;t clear defined guidelines.</li>
<li>Impact of AI on UI Creativity: The hosts explore the potential for AI to further standardize UI patterns and stifle creativity, as AI models are trained on existing designs and may not generate truly novel solutions.</li>
<li>AI Dependency: Discussion of companies choosing to support new libraries based on the amount of support AI models know about them and recommend them, which can lead to everything becoming the same.</li>
</ul>
<p>Personal Updates:</p>
<ul>
<li>Scott has been digging into <a href="https://github.com/yetone/avante.nvim">Avante</a>, finding it helpful for learning Go. He plans to build a backend service in Node and then refactor it to Go as a learning exercise.</li>
<li>Matt has been experimenting with Cursor&#x27;s Composer agent feature and a tool called <a href="https://block.github.io/goose/">Codename Goose</a>, which uses AI to infer functionality on his computer.</li>
</ul>]]></content:encoded>
            <itunes:duration>3888</itunes:duration>
            <podcast:transcript url="https://assets.bikeshedpod.com/episodes/2/captions.vtt" type="text/vtt"/>
            <itunes:explicit>true</itunes:explicit>
          </item>
        
      </channel>
    </rss>`,
			{
				headers: {
					"Content-Type": "application/rss+xml",
				},
			},
		);
	},
} satisfies ExportedHandler<Env>;
