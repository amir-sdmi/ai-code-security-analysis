import Joi from 'joi';

// schema

export const completionUsageSchema = Joi.object({
    prompt_tokens: Joi.number().required(),
    completion_tokens: Joi.number().required(),
    total_tokens: Joi.number().required()
});

export const roles = [
    'system',
    'user',
    'assistant',
    'function'
    // nb. if using chatgpt and you pull an export you'll see "tool" role used by plugins
];

export const chatCompletionMessageSchema = Joi.object({
    role: Joi.string().valid(...roles).required(),
    content: Joi.alternatives(Joi.string(), Joi.any().valid(null, '')), // nb, content can be null if function_call
    function_call: Joi.object({
        name: Joi.string().required(),
        arguments: Joi.string().optional(), // string because must be JSON
    }).optional(),
    name: Joi.alternatives(Joi.string(), Joi.any().valid(null, '')) // nb, name can be null
});

export const chatCompletionChoicesSchema = Joi.array().items(Joi.object({
    index: Joi.number().required(),
    message: chatCompletionMessageSchema.required(),
    finish_reason: Joi.string().required()
}));

export const chatCompletionResponseSchema = Joi.object({
    id: Joi.string().required(),
    created: Joi.number().required(),
    object: Joi.string().required(),
    model: Joi.string().required(),
    usage: completionUsageSchema.required(),
    choices:chatCompletionChoicesSchema.min(1)
});

export const chatCompletionRequestSchema = Joi.object({
    model: Joi.string().required(),
    temperature: Joi.number().min(0).max(2).optional(),
    top_p: Joi.number().min(0).max(1).optional(),
    n: Joi.number().min(1).max(8).optional(), // nb
    frequency_penalty: Joi.number().min(0).max(1).optional(),
    presence_penalty: Joi.number().min(0).max(1).optional(),
    functions: Joi.array().optional(),
    function_call: Joi.alternatives(
        Joi.string().valid('none', 'auto'),
        Joi.object({ name: Joi.string() })
    ).optional(),
    max_tokens: Joi.number().optional(),
    logit_bias: Joi.object().optional(),
    user: Joi.string().optional(), // https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids
    stream: Joi.boolean().optional(),
    stop: Joi.alternatives(Joi.string(), Joi.array().items(Joi.string())).optional(),
    messages: Joi.array().items(chatCompletionMessageSchema).min(1).required()
});

export const emptySchema = Joi.alternatives(
    Joi.any().valid(null, ''),
    Joi.array().length(0),
    Joi.object().length(0)
);

export const inputSchema = Joi.string().required();

export const isValid = schema => data => {
    const { error, value } = schema.validate(data);
    if (error) {
        console.error(error.stack);
        console.error(error?.annotate());
        return false;
    }
    return true;
};
