import {Request, Response} from 'express';
import {Product} from '../entities/Product';
import "reflect-metadata";
import axios from "axios";
import {AppDataSource} from "../index";
import app from "../app";
import {authenticateJWT} from "../authenticationJWT";

//D1
//Optymalizacja opisu produktu pod kątem SEO


async function generateSeoDescription(productData: any) {
    const apiKey = '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';
    const url = 'https://api.groq.com/openai/v1/chat/completions';

    const seoDescriptionPrompt = `
You are an SEO expert. Your task is to take a product description and generate an SEO-optimized product description in HTML. The description should be structured and include the following:

1. The main title should be in <h1> and include the product's name and its main selling point.
2. Key features of the product should be listed in a <ul> with <li> tags.
3. A paragraph summarizing the product's benefits should be wrapped in a <p> tag.
4. Include the product's dimensions and weight as part of the description in a clear <p> tag.
5. Add a <meta description> tag in the HTML head for SEO optimization with relevant keywords.
6. The HTML should be clean and well-structured (no unnecessary newline characters or excessive formatting).
7. If the product has a price and category, include them clearly in <p> tags with strong emphasis on the price and category.
8. Ensure that all text is properly formatted and includes relevant SEO keywords.
9. Do not use unnecessary newlines (\n) or backticks.
10. If possible, add a clear call-to-action at the end of the description encouraging users to purchase the product.
11. You can use coloured text.

You will be given the details regarding the product in an upcoming message.
After analysing it, generate the HTML code with the SEO-optimized structure.
Do NOT add any unnecessary comments or notes regarding the generated code.
Always respond in English.

`;
// prompt generated using chatGPT

    const requestBody = {
        model: 'llama3-8b-8192',
        messages: [
            {
                role: 'system',
                content: seoDescriptionPrompt
            },
            {
                role: 'user',
                content: `Product Name: ${productData.name}, Description: ${productData.description}, Price: ${productData.price}, Weight: ${productData.weight}kg, Category: ${productData.category}.`
            }
        ]
    };

    try {
        // Wysyłamy zapytanie do Groq API
        const response = await axios.post(url, requestBody, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            }
        });

        // Zwracamy wygenerowany HTML z odpowiedzi Groq
        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error calling Groq API:", error);
        throw new Error("Failed to generate SEO description");
    }
}


// @ts-ignore
app.get('/products/:id/seo-description', authenticateJWT(["MANAGER"]), async (req: Request, res: Response) => {
    try {
        // Pobieramy produkt z bazy danych

        const productId = parseInt(req.params.id);
        const productRepository = AppDataSource.getRepository(Product);
        const product = await productRepository.findOne({
            // @ts-ignore
            where: {_id: productId},
            relations: ["_category"]
        });

        // Sprawdzamy, czy produkt istnieje
        if (!product) {
            return res.status(404).json({error: "Product not found"});
        }

        // Przygotowujemy dane wejściowe do API Groq
        const productData = {
            name: product.name,
            description: product.description,
            price: product.price,
            weight: product.weight,
            category: product.category.name,
        };

        // Przesyłamy dane do API Groq, aby wygenerować SEO opis
        const seoDescription = await generateSeoDescription(productData);

        res.setHeader('Content-Type', 'text/html');

        // Zwracamy wygenerowany opis SEO w formacie HTML
        return res.status(200).send(seoDescription);
    } catch (error) {
        console.error("Error generating SEO description:", error);
        res.status(500).send("Internal Server Error");
    }
});