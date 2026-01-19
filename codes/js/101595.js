/* Markdown (render)
##### Copyright 2025 Google LLC.
## Licensed under the Apache License, Version 2.0 (the "License");
You may not use this file except in compliance with the License.
You may obtain a copy of the License at

https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software 

distributed under the License is distributed on an "AS IS" BASIS,

WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.

See the License for the specific language governing permissions and

limitations under the License.
*/

/* Markdown (render)
# Gemini API: Get started with image generation
*/

/* Markdown (render)
The `imagen-3.0-generate-002` model is Google's highest quality text-to-image model, featuring a number of new and improved capabilities. Imagen 3 can do the following:

* Generate images with fine detail, rich lighting, and few distracting artifact
* Understand prompts written in natural language
* Generate images in a wide range of formats and styles
* Render text effectively

This notebook is using the [Python SDK](https://googleapis.github.io/python-genai/#imagen). For the REST API, check out the [Get Started with Imagen](../Get_started_imagen_rest.ipynb) guide.
*/

/* Markdown (render)
<!-- Warning Badge -->
<table>
  <tr>
    <!-- Emoji -->
    <td bgcolor="#f5949e">
      <font size=30>⚠️</font>
    </td>
    <!-- Text Content Cell -->
    <td bgcolor="#f5949e">
      <h3><font color=black>Image generation is a paid-only feature and won't work if you are on the free tier. Check the <a href="https://ai.google.dev/pricing#imagen3"><font color='#217bfe'>pricing</font></a> page for more details.</font></h3>
    </td>
  </tr>
</table>
*/

/* Markdown (render)
## Setup
### Install SDK

Install the SDK from [npm](https://github.com/googleapis/js-genai)/[cdn](https://esm.sh/@google/genai@1.4.0).
*/

// [CODE STARTS]
module = await import("https://esm.sh/@google/genai@1.4.0");
// [CODE ENDS]

/* Markdown (render)
### Initialize SDK client

With the new package you now only need to initialize a client with you API key (or OAuth if using [Vertex AI](https://cloud.google.com/vertex-ai)). The model is now set in each call.
*/

// [CODE STARTS]
GoogleGenAI = module.GoogleGenAI;
ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// [CODE ENDS]

/* Markdown (render)
## Generate images
### Select model

The model you will use is `imagen-3.0-generate-002`.
*/

// [CODE STARTS]
MODEL_ID = "imagen-3.0-generate-002"
// [CODE ENDS]

/* Markdown (render)
### Prompt creation

Now, write your prompt and set some optional parameters. The `imagen-3.0-generate-002` model is trained on long captions and will provide better results for longer and more descriptive prompts. Note that if you use a short prompt, it may result in low adherence and more random output.

Check the [prompt guide](https://ai.google.dev/gemini-api/docs/imagen-prompt-guide) for more advice on creating your prompts.

Here are the parameters you can set relating to your prompt:
* `number_of_images`: Specifies how many iamges will be generated. The default value is 4, with valid values between 1 to 4, inclusive. In the below code cell, `sample_count` is used to define this.
* `person_generation`: Allows the model to generate images with adults. Kids are always blocked. The supported values are `DONT_ALLOW` and `ALLOW_ADULT`. The default value is `ALLOW_ADULT`.
* `aspect_ratio`: Specifies the aspect ratio of the images produces. The supported values are `1:1`, `3:4`, `4:3`, `16:9`, and `9:16`. The default value is `1:1`.
* `output_mime_type`: The output type of your image, which will be `image/jpeg`. This is the only allowed value at the moment.

A non-visible digital [SynthID](https://deepmind.google/technologies/synthid/) watermark is always added to generated images.
*/

// [CODE STARTS]
prompt = "A cat lounging lazily on a sunny windowstill playing with a kid toy."
number_of_images = 4
personGeneration = "ALLOW_ADULT"
aspectRatio = "1:1"
// [CODE ENDS]

/* Markdown (render)
### Generate the images
*/

// [CODE STARTS]
response = await ai.models.generateImages({
    model: 'imagen-3.0-generate-002',
    prompt: prompt,
    config: {
        numberOfImages: 4,
        aspectRatio: aspectRatio,
        personGeneration: personGeneration
    },
});
// [CODE ENDS]

/* Markdown (render)
### Display the images

Use the code below to inspect the images you generated.
*/

// [CODE STARTS]
for (const generatedImage of response.generatedImages) {
    const base64 = generatedImage.image.imageBytes;
    console.image(base64, "image/png");
}
// [CODE ENDS]

/* Output Sample
<img src="https://iili.io/F5tua94.md.png" alt="F5tua94.md.png" border="0">
<img src="https://iili.io/F5tu5cG.md.png" alt="F5tu5cG.md.png" border="0">
<img src="https://iili.io/F5tu7Sf.md.png" alt="F5tu7Sf.md.png" border="0">
<img src="https://iili.io/F5tucAl.md.png" alt="F5tucAl.md.png" border="0">
*/

/* Markdown (render)
## Next Steps
### Useful documentation references:

To improve your prompting skills, check the [prompt guide](https://ai.google.dev/gemini-api/docs/imagen-prompt-guide) for great advices on creating your prompts.

### Check those cool Imagen examples:
Here are some Imagen examples to get your imagination started on how to use it in creative ways:
*  [Illustrate a book](../examples/Book_illustration.ipynb): Use Gemini and Imagen to create illustration for an open-source book

### Continue your discovery of the Gemini API

Gemini is not only good at generating images, but also at understanding them. Check the [Spatial understanding](./Spatial_understanding.ipynb) guide for an introduction on those capabilities, and the [Video understanding](./Video_understanding.ipynb) one for video examples.
*/
