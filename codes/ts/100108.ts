import Ajv from "ajv";
const ajv = new Ajv({removeAdditional: 'all', strict: false});

// Regex for email, grabbed using ChatGPT
ajv.addFormat("email", /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
// Regex for datetime, grabbed using ChatGPT
ajv.addFormat("datetime", /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);

const validate = async (schema: object, data: any) => {
    try {
        const validator = ajv.compile(schema);
        const valid = await validator(data);
        if(!valid)
            return ajv.errorsText(validator.errors);
        return true;
    } catch (err) {
        return err.message;
    }
}

export {validate}
