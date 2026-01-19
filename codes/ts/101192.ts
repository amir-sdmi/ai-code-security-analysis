import { PrismaClient } from "../../generated/prisma";
import { withAccelerate } from "@prisma/extension-accelerate";
import { IQuery } from "../interfaces/IRequest";

const prisma = new PrismaClient().$extends(withAccelerate());

export const getAllProducts = async (category: string) => {
  let products;
  if (!category) {
    products = await prisma.product.findMany({
      include: { category: true },
    });
  } else
    products = await prisma.product.findMany({
      include: { category: true },
      where: {
        category: {
          name: category,
        },
      },
    });
  return products;
};

export const getProductById = async (id: number) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  return product;
};

export const searchProducts = async (queryString: IQuery) => {
  const { category, query } = queryString;

  const products = await prisma.product.findMany({
    include: {
      category: true,
    },
    where: {
      AND: [
        {
          name: {
            contains: query,
            mode: "insensitive",
          },
        },
        {
          category: {
            name: {
              contains: category,
              mode: "insensitive",
            },
          },
        },
      ],
    },
  });

  return products;
};

// const deepseek = new OpenAI({
//     apiKey: process.env.DEEPSEEK_API_KEY,
// });

//     // Format products for DeepSeek
//     const productsContext = products.map(p =>
//         `Product: ${p.name}, Price: ${p.salePrice}, Rating: ${p.rating}`
//     ).join('\n');

//     // Use DeepSeek to analyze the query and products
//     const response = await deepseek.chat.completions.create({
//         model: "deepseek-chat",
//         messages: [{
//             role: "user",
//             content: `Given this list of products and a search query, return the most relevant products based on semantic understanding. Consider the context, intent, and any implicit requirements in the query.

// Products:
// ${productsContext}

// Search Query: "${query}"

// Return the results as a JSON array of product IDs that best match the query. Consider:
// 1. Semantic meaning and intent
// 2. Price range implications
// 3. Category relevance
// 4. Rating importance
// 5. Any implicit requirements in the query

// Format: {"relevantProductIds": [1, 2, 3]}`
//         }]
//     });

//     // Parse DeepSeek's response to get relevant product IDs
//     const result = JSON.parse(response.choices[0].message.content || '{"relevantProductIds": []}');
//     const relevantProductIds = result.relevantProductIds;

// Return the full product details for the relevant products
