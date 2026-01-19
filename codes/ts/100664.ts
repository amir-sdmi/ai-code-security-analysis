import { createAction, PieceAuth, Property } from 'workflow-blocks-framework';
import { aiModelOptions, AiType } from '../../common/constants';
import { extractWithGeminiAI, extractWithOpenAI } from './crawling-with-ai-assistant';

export const analysisTextWithAssistants = createAction({
    name: 'analysis-text-with-ai-assistant',
    displayName: 'Analysis text by using AI assistant',
    auth: PieceAuth.None(),
    description: 'Analysis text by using AI assistant',
    requireAuth: false,
    props: {
        text: Property.LongText({
            displayName: 'Text',
            required: true,
        }),
        aiModel: Property.StaticDropdown({
            displayName: 'Ai Model',
            required: true,
            options: {
                options: aiModelOptions,
            },
        }),
        modelApiKey: Property.LongText({
            displayName: 'Model API key',
            required: true,
        }),
        prompt: Property.LongText({
            displayName: 'Extraction Prompt',
            required: true,
        }),
    },
    async run(context) {
        const { modelApiKey, prompt, text, aiModel } = context.propsValue;

        const modelSelected = aiModelOptions.find((option) => option.value === aiModel);

        const aiType: AiType = modelSelected?.type ?? AiType.OPENAI;

        const promptText = `${prompt} from this HTML:\`\`\`\n${text}\`\`\` \n and Respond ONLY in strict JSON format. No explanation, no extra text.`;

        // Use openai sdk
        if ([AiType.DEEPSEEK, AiType.OPENAI].includes(aiType as AiType)) {
            return await extractWithOpenAI(modelApiKey, aiType, aiModel, promptText);
        }

        // Use gemini sdk
        if (aiType === AiType.GEMINI) {
            return await extractWithGeminiAI(modelApiKey, aiType, aiModel, promptText);
        }

        return {};
    },
});
