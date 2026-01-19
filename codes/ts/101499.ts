import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

interface OutputFormat {
  [key: string]: string | string[] | OutputFormat;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function strict_output(
  system_prompt: string,
  user_prompt: string | string[],
  output_format: OutputFormat,
  default_category: string = "",
  output_value_only: boolean = false,
  model: string = "gemini-1.5-flash",
  temperature: number = 1,
  num_tries: number = 3,
  verbose: boolean = false
): Promise<{
  question: string;
  answer: string;
}[]> {
  const list_input: boolean = Array.isArray(user_prompt);
  const dynamic_elements: boolean = /<.*?>/.test(JSON.stringify(output_format));
  const list_output: boolean = /\[.*?\]/.test(JSON.stringify(output_format));

  let error_msg: string = "";

  for (let i = 0; i < num_tries; i++) {
    let output_format_prompt: string = `\nYou are to output the following in json format: ${JSON.stringify(
      output_format
    )}. \nDo not put quotation marks or escape character \\ in the output fields.`;

    if (list_output) {
      output_format_prompt += `\nIf output field is a list, classify output into the best element of the list.`;
    }

    if (dynamic_elements) {
      output_format_prompt += `\nAny text enclosed by < and > indicates you must generate content to replace it. Example input: Go to <location>, Example output: Go to the garden\nAny output key containing < and > indicates you must generate the key name to replace it. Example input: {'<location>': 'description of location'}, Example output: {school: a place for education}`;
    }

    if (list_input) {
      output_format_prompt += `\nGenerate a list of json objects, one json object for each input element.`;
    }

    await delay(1000);

    // Use Gemini API to get a response
    const prompt = system_prompt + output_format_prompt + error_msg + "\n\n" + user_prompt.toString();
    const modelInstance = genAI.getGenerativeModel({ model });

    try {
      const result = await modelInstance.generateContent(prompt);
      const responseText = result.response.text();
      let res: string = responseText.replace(/'/g, '"');
      res = res.replace(/(\w)"(\w)/g, "$1'$2");

      // Clean up the JSON string
      res = res.replace(/\n/g, "").trim();
      if (!res.startsWith("[")) res = "[" + res;
      if (!res.endsWith("]")) res = res + "]";

      if (verbose) {
        console.log("System prompt:", system_prompt + output_format_prompt + error_msg);
        console.log("\nUser prompt:", user_prompt);
        console.log("\nGemini response:", res);
      }

      // Attempt to parse the response into JSON
      let output: any;
      try {
        output = JSON.parse(res);
        console.log(output)
      } catch (parseError) {
        console.log(JSON.parse(res))
        console.error("JSON parse error:", parseError);
        console.log("Attempting to fix JSON...");
        
        // Attempt to fix common JSON issues
        res = res.replace(/,\s*}/g, "}");  // Remove trailing commas
        res = res.replace(/,\s*\]/g, "]");  // Remove trailing commas in arrays
        res = res.replace(/([{,]\s*)(\w+)(\s*:)/g, '$1"$2"$3');  // Wrap unquoted keys in double quotes
        
        try {
          output = JSON.parse(res);
        } catch (secondParseError) {
          console.error("Failed to fix JSON:", secondParseError);
          throw new Error("Unable to parse JSON after attempted fixes");
        }
      }

      if (list_input) {
        if (!Array.isArray(output)) {
          throw new Error("Output format not in a list of json");
        }
      } else {
        output = [output];
      }
      for (let index = 0; index < output.length; index++) {
        for (const key in output_format) {
          if (/<.*?>/.test(key)) continue;

          if (!(key in output[index])) {
            throw new Error(`${key} not in json output`);
          }

          if (Array.isArray(output_format[key])) {
            const choices = output_format[key] as string[];
            if (Array.isArray(output[index][key])) {
              output[index][key] = output[index][key][0];
            }
            if (!choices.includes(output[index][key]) && default_category) {
              output[index][key] = default_category;
            }
            if (output[index][key].includes(":")) {
              output[index][key] = output[index][key].split(":")[0];
            }
          }
        }

        if (output_value_only) {
          output[index] = Object.values(output[index]);
          if (output[index].length === 1) {
            output[index] = output[index][0];
          }
        }
      }

      return list_input ? output : output[0];
    } catch (e) {
      error_msg = `\n\nResult:\n\nError message: ${e}`;
      console.log("An exception occurred:", e);
      console.log("Current invalid json format:");
    }
  }

  return [];
}
