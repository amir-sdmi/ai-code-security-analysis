import Cheerio from "cheerio"
import OpenAI from "openai";
import showdown from "showdown";
import cloudinary from 'cloudinary'
import ProductModel from "../../../db/models/products.model.js"
import UserModel from "../../../db/models/user.model.js"
import ImageModel from '../../../db/models/images.model.js'


cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dzfwntfw7",
    api_key: process.env.CLOUDINARY_API_KEY || "829143719124888",
    api_secret: process.env.CLOUDINARY_API_SECRET || "7DAHUmv8z3HXcUQV2AEdZMI2mkc"
})



// Generate the product detail after getting the information from the url provided
const scrapperController = async (req, res) => {
    let apiKey = process.env.OPENAI_APIKEY;
    let scraperAPIKEY = "6e034eadd83df54d13f64a7fdbcf45fb";
    const openai = new OpenAI({ apiKey: apiKey });

    try {

        let { url, language, item, regen, title: productTitle, description: productDescriptiom } = req.body;
        if (!url) {
            throw new Error("Url Doesn't Exist!")
        }
        console.log(language)
        let user = await UserModel.findById(req.user.id).exec()
        let product = await ProductModel.findOne({ user: req.user.id, url: url });
        console.log(regen)

        if (product && product[item] && !regen && product[item].length != 0) {
            return res.status(200).json(product);
        }

        let result = {};
        let isAmazonUrl = url.includes("amazon");

        if (isAmazonUrl) {
            const asin = url.split("dp/")[1]?.split("/")[0];
            if (!asin) throw new Error("Invalid ASIN extraction from URL");

            const response = await fetch(`https://api.scraperapi.com/structured/amazon/product?api_key=${scraperAPIKEY}&asin=${asin}`);
            result = await response.json();
            result = {
                content: Object.keys(result).map(key => `${key}: ${result[key]}`).join(', '),
                title: asin,
                url
            };
        } else {
            const response = await fetch(url);
            result = await response.text();
            const $ = Cheerio.load(result);
            $('script, style, head, meta').remove();
            $('*').each((index, element) => {
                $(element).removeAttr(Object.keys(element.attribs));
            });
            const cleanedHTML = $.html();

            result = { content: cleanedHTML, title: $("h1").text(), url };
        }

        const data = {
            title: [],
            overview: [],
            description: [],
            marketing_angles: [],
            reviews: [],
            faqs: [],
            "after-sale": [],
            successful: [],
            influencer: [],
            email: [],
            images: [],
            productTitle: productTitle,
            productDescription: productDescriptiom,
            legal_policies: []

        };

        if (item) {
            // Generate content if item is provided
            const converter = new showdown.Converter();
            if (item == 'title') {
                item = 'Legal Polices'
                console.log(item)
            }

            if (item == 'images') {
                let completion;
                try {
                    completion = await openai.chat.completions.create({
                        messages: [
                            { role: "system", content: `Give prompt to generate an fake image of the product with  description.` },
                            { role: "user", content: result.content }
                        ],
                        model: "gpt-4o-mini",
                    });

                    const options = {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer sk-proj-EO8srdYN70SrNl4ADvXsT3BlbkFJLhX44CiiruceQR0gydVH"
                        },
                        body: {
                            "model": "dall-e-3",
                            "prompt": completion.choices[0].message.content,
                            "n": 1,
                            "size": "1024x1024"
                        }
                    }

                    try {
                        const resp = await fetch("https://api.openai.com/v1/images/generations", options)

                        const openAIResponse = resp.json()

                        //  const uploadFile = await cloudinary.v2.uploader.upload(resp.data[0].url);


                        console.log("Image Generated Data : ", openAIResponse.data[0].url)
                    } catch (e) {
                        console.log("ERROR IN IMAGE : ", e)
                    }

                    //console.log("URL: ", uploadFile.secure_url)


                } catch (err) {
                    console.error("Error details: ", err.response ? err.response.data : err.message); // Log the error content
                    throw new Error("Error generating Images with Dalle 2 : " + err);
                }

                const htmlContent = converter.makeHtml(completion.choices[0].message.content);
                data[item] = [htmlContent];
            } else {
                let completion;
                try {
                    completion = await openai.chat.completions.create({
                        messages: [
                            { role: "system", content: `Make sure to Generate the result for following pormpt in ${language} \n. Generate fake product ${item} details for the provided content. Create 3-4 different variants, each with at least 200 words unless generating a title.` },
                            { role: "user", content: result.content }
                        ],
                        model: "gpt-4o-mini",
                    });
                } catch (err) {
                    throw new Error("Error generating content with OpenAI: " + err.message);
                }

                const htmlContent = converter.makeHtml(completion.choices[0].message.content);
                data[item] = [htmlContent];
            }


        }

        //    user.regenerations += 1
        await user.save()



        if (!product) {
            // Create a new product if it doesn't exist
            product = await ProductModel.create({ ...data, user: req.user.id, url: url });
            user.product += 1
            await user.save()
            return res.status(201).json(product);
        }
        console.log(user)
        // Merge new data with existing data
        const updatedData = {
            ...product.toObject(),
            [item]: item ? [...(product[item] || []), ...(data[item] || [])] : (product[item] || [])
        };

        // Update the product
        product = await ProductModel.findOneAndUpdate({ user: req.user.id, url: url }, updatedData, { new: false }).exec();
        return res.status(200).json(product);

    } catch (error) {
        console.error("Error Message: ", error.message);
        console.error("Error: ", error);

        return res.status(500).json({ msg: "Internal server error", error: error.message });
    }
};



// Generate the product detail from the information
/* const userInfoProductGeneratorController = async (req, res) => {
    let apiKey = process.env.OPENAI_APIKEY
    const openai = new OpenAI({ apiKey: apiKey });
    try {
        let { content: info, service } = req.body

        if (!service) {
            service = "Need to genrate product details similar to what we are giving you"
        }

        if (!info || info.length <= 250)
            return res.status(403).json({ msg: "Please Provide Proper Information to generate Product on!" })


        const completion = await openai.chat.completions.create({
            messages: [{ "role": "system", "content": service },
            { "role": "user", "content": info }],
            model: "gpt-4o-mini",
        });
        let detail_generated = completion.choices[0].message.content
        let result = { content: info }
        res.status(200).json({ detail_generated, result })
    } catch (error) {
        console.log("Error : ", error.message)
        res.status(500).json({ msg: error.message })
    }
} */

// Generate User Product Image


const generateProdutImage = async (req, res) => {
    try {

        const openai = new OpenAI({ apiKey: "sk-proj-EO8srdYN70SrNl4ADvXsT3BlbkFJLhX44CiiruceQR0gydVH" });

        let product = await ImageModel.findOne(
            { user: req.user.id }, // Query
            { images: 1, user: 1 } // Projection
        );

        const user = await UserModel.findById(req.user.id).exec()




        if (!product) {
            product = await ImageModel.create({ images: [], user: req.user.id })
        }

        // Step 1: Generate a prompt using ChatGPT
        const { img, prompt, size, name } = req.body
        let fakeProduct = await openai.chat.completions.create({
            messages: [
                {
                    role: "user",
                    content: [{
                        type: "text",
                        text: "write a fake description of the product in a way that I will use it to genrate fake images of this product."
                    }, {
                        type: "image_url",
                        image_url: {
                            url: img
                        }
                    }]
                }
            ],
            model: "gpt-4o-mini",
        })

        let fakeProductDescription = fakeProduct.choices[0].message.content


        const options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.OPENAI_APIKEY}`, // Use environment variable
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: `Generate a highly realistic, 4K-quality image. 
                Take inspiration from the user's input (below) but prioritize the AI-generated description for image generation. 
                
                User's Reference Prompt: ${prompt}
                
                AI-Prioritized Prompt (Primary Focus): ${fakeProductDescription}`,
                n: 1,
                size: size ? size : '1024x1024',
            }),
        };

        try {
            const resp = await fetch("https://api.openai.com/v1/images/generations", options);

            if (!resp.ok) {
                const errorDetails = await resp.json();
                console.error("Error generating image: ", errorDetails);
                return res.status(resp.status).json({ error: "Failed to generate image.", details: errorDetails });
            }

            const openAIResponse = await resp.json();
            const imageUrl = openAIResponse.data[0]?.url;

            if (!imageUrl) {
                return res.status(500).json({ error: "Image URL not found in OpenAI response." });
            }


            try {


                const data = await cloudinary.v2.uploader
                    .upload(imageUrl)
                //   data.secure_url
                product.images.push({ img: data.secure_url, prompt, size, name })
                await product.save()
                user.regenerations += 1
                await user.save()
                return res.status(200).json({ img: data.secure_url });

            } catch (err) {
                console.error("Error in image upload to cloudinary: ", err);
                return res.status(400).json({ error: "Error in image upload to cloudinary.", details: err.message });
            }
        } catch (e) {
            console.error("Error in image generation: ", e.message);
            return res.status(500).json({ error: "Failed to generate image.", details: e.message });
        }
    } catch (error) {
        console.error("Unexpected error: ", error.message);
        res.status(500).json({ error: "An unexpected error occurred.", details: error.message });
    }
};



const getProdutImage = async (req, res) => {
    try {
        const data = await ImageModel.findOne({ user: req.user.id }, { _id: 0 }).exec()
        if (!data) {
            return res.status(200).json({ images: [], user: req.user.id })
        }
        return res.status(200).json(data.toObject({
            versionKey: false
        }));
    } catch (error) {

        console.log(error.response);
        res.status(500).json({ msg: error.message });

    }

}




const getProducts = async (req, res) => {
    try {
        const products = await ProductModel.find({ user: req.user.id }).exec()

        return res.status(200).json({ message: "Products!", data: products })
    } catch (error) {
        return res.status(500).json({ msg: error.message });

    }
}


const getProduct = async (req, res) => {
    try {
        const { id } = req.query
        const product = await ProductModel.findById(id).exec()

        return res.status(200).json({ message: "Product!", data: product })
    } catch (error) {
        return res.status(500).json({ msg: error.message });

    }
}

export {
    scrapperController,
    //  userInfoProductGeneratorController,
    generateProdutImage,
    getProdutImage,
    getProducts,
    getProduct
}