import express from "express";
import path from "path";
import { getDocFromUUID } from "./utils/cache";
import { logRequest } from "./middlewares/logRequest";
import bodyParser from "body-parser";
import { createWordDoc } from "./services/createWordDoc";
import { DOC_BASE_URL, PORT } from "./utils/config";

const app = express();
const port = PORT;

/**
 * Endpoint to convert markdown to Word document and store in cache.
 * @route GET /convert
 * @param {string} req.query.text - The Markdown text to convert.
 * @returns {object} - JSON with the document URL (will cause ChatGPT to display a download link as a markview element in the chat window)
 */
app.get("/convert", bodyParser.text(), logRequest, async (req, res) => {
  try {
    const markdownText = req.query.text as string;
    if (!markdownText) {
      res.status(400).send("Missing text parameter");
      return;
    }
    const uuid = await createWordDoc(markdownText);
    res.json({ documentUrl: `${DOC_BASE_URL}${uuid}` });
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});

/**
 * Endpoint to retrieves  a Word document by its UUID and sends it as a response.
 * @route GET /document/:id
 * @param {string} req.params.id - The UUID of the document.
 */
app.get("/document/:id", logRequest, async (req, res) => {
  const uuid = req.params.id as string;

  try {
    if (!uuid) {
      res.status(404).send("Document UUID not found");
      return;
    }
    let wordBlob = await getDocFromUUID(uuid);
    if (!wordBlob) {
      res.status(404).send("Document not found");
      return;
    }
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", "attachment; filename=Document.docx");
    res.send(wordBlob);
  } catch (error) {
    res.status(500).send("Error generating document");
  }
});

/**
 * Sends the privacy policy document from /assets folder
 * @route GET /legal
 */
app.get("/legal", (req, res) => {
  res.sendFile(path.join(process.cwd(), "assets/privacy.md"), {
    headers: { "Content-Type": "text/markdown" },
  });
});

/**
 * Sends the AI plugin configuration file from /assets folder
 * @route GET /.well-known/ai-plugin.json
 */
app.get("/.well-known/ai-plugin.json", (req, res) => {
  res.sendFile(path.join(process.cwd(), "assets/ai-plugin.json"), {
    headers: { "Content-Type": "application/json" },
  });
});

/**
 * Sends the OpenAI YAML configuration file from assets/folder
 * @route GET / or /.well-known/openai.yaml
 */
app.get(["/", "/.well-known/openai.yaml"], (req, res) => {
  res.sendFile(path.join(process.cwd(), "assets/openai.yaml"), {
    headers: { "Content-Type": "application/json" },
  });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
