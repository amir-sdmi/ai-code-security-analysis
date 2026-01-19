import prisma from '../../../utils/db';
import { verifyToken } from '../../../utils/auth';


export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { templateId, modifiedCode, saveAsFork } = req.body;

    //step 1: find the template by `templateId`
    const template = await prisma.template.findUnique({
        where: { id: templateId },
        include: { tags: true }
    });

    if (!template) {
        return res.status(404).json({ error: 'Template does not exist' });
    }

    //step 2: allow the visitor to view the template and modify it if they want to.
    //we will return the template's code to run or modify
    if (!saveAsFork) {
        //if not saving as a fork, just return the template with the modified code (if they want to run it)
        return res.status(200).json({
            message: 'Template ready for modification',
            template: {
                ...template,
                code: modifiedCode || template.code
            }
        });
    }

    //some of the try catch block is done with Copilot autocomplete.
    //below is only for authenticated users:--------------------------
    //step 3: if the user wants to save the modified version as a new template, they must verify
    const decoded = verifyToken(req.headers.authorization);

    if (!decoded) {
        return res.status(401).json({ error: 'Please log-in to save modified template!' });
    }

    try {
        //step 4: Save the modified code as a new, forked template (this is only allowed for authenticated users)
        const forkedTemplate = await prisma.template.create({
            data: {
                title: `${template.title} (Fork)`, //add a "Fork" to the title.
                explanation: `Forked version of template ID ${templateId}`, //users can change later, but for now we will make description indicating it’s a fork.
                code: modifiedCode || template.code, //save the modified code, or the original code if not modified
                isFork: true,
                forkedFromId: templateId,
                userId: decoded.userId, //save under the authenticated user's ID
                tags: {
                    create: template.tags.map(tag => ({ name: tag.name })) //copy tags from the OG template
                }
            },
            include: { tags: true }
        });

        //step 5: show if process was successful with the forked template details
        return res.status(201).json({
            message: 'Template saved as a forked version!',
            template: forkedTemplate
        });
    } catch (error) {
        //console error for me to see if there's an error
        //console.error("Error saving forked template:", error);
        return res.status(500).json({ error: 'Error saving forked template' });
    }
}
