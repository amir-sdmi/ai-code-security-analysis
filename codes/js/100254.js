// Source: https://github.com/Interactiv4/shopify-chatgpt-product-descriptions (adapted for Stratix)
// Content Optimization - Fetch, optimize, and update product descriptions using OpenAI and Shopify API

const Shopify = require('shopify-api-node');
const { Configuration, OpenAIApi } = require('openai');

const shopify = new Shopify({
  shopName: process.env.SHOP_NAME,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN
});
const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

async function optimizeProductDescription(productId) {
  // 1. Retrieve the current product description from Shopify
  const product = await shopify.product.get(productId);
  const originalDesc = product.body_html || "";
  // 2. Use ChatGPT to generate an optimized description (SEO-friendly)
  const prompt = `Generate an SEO-optimized, engaging product description. Keep the tone on-brand.\nOriginal: "${originalDesc}"`;
  const chatRes = await openai.createChatCompletion({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7
  });
  const optimizedDesc = chatRes.data.choices[0].message.content;
  // 3. Update the product with the optimized description via Shopify API
  await shopify.product.update(productId, { body_html: optimizedDesc });
  console.log(`Product ${productId} description updated.`);
  return optimizedDesc;
}

// Example: optimize description of product with ID 123456
// optimizeProductDescription(123456);

module.exports = { optimizeProductDescription }; 