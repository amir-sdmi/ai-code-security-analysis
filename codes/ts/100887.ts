import { Socket } from 'socket.io'
import { Server as SocketIOServer } from 'socket.io'
import * as fs from 'fs'
import * as path from 'path'
import pdfParse from 'pdf-parse'
import { ChatGPT } from '../ai'
import { Standalone } from '../ai/standalone'

const ExtractFileName = (fileName: string) => {
	const cleanedFileName = fileName.substring(fileName.indexOf('-') + 1)
	console.log(cleanedFileName)
	return cleanedFileName
}

const processPDF = async (userId: string, fileNames: string[]) => {
	const filePaths = fileNames.map(fileName =>
		path.join(__dirname, '..', 'assets', 'uploads', userId, fileName),
	)

	// Read PDF files
	const pdfTexts = await Promise.all(
		filePaths.map(filePath => pdfParse(fs.readFileSync(filePath))),
	)

	// Extracted text content from each PDF
	const pdfTextArray = pdfTexts.map(data => data.text)

	// Generate a question for ChatGPT based on the PDF content
	const chatGPTResponses = await Promise.all(
		pdfTextArray.map(pdfText => ChatGPT(pdfText)),
	)
	// const chatGPTResponse = await ChatGPT(pdfTextArray)
	console.log(chatGPTResponses)
	return chatGPTResponses
}

export const startChat = (io: SocketIOServer) => (socket: Socket) => {
	console.log('user connected :' + socket.id)
	socket.emit('server_response', { type: 'bot', message: 'Welcome to AskPDF!' })
	let fileNames = []
	let userId = null
	let chatGPTResponses = null

	socket.on('files_send', async data => {
		fileNames = data.files
		userId = data.user_id

		const query = `Your files are received. Now you can chat!!`
		console.log('filesNames')
		console.log(fileNames)
		console.log('user-id is ' + userId + ' and file names are ' + fileNames.join(', '))
		socket.emit('server_response', { type: 'bot', message: query })

		// Process the PDFs and initiate conversation with ChatGPT
		chatGPTResponses = await processPDF(userId, fileNames)
		socket.emit('server_response', { type: 'bot', message: chatGPTResponses })
	})

	socket.on('send_message', async data => {
		socket.emit('user_message', { type: 'user', message: data.message })
		const res = await Standalone(data.message)

		// Continue the conversation with ChatGPT based on user's message
		chatGPTResponses = await ChatGPT(data.message)
		// chatGPTResponses = ['ChatGPT response is cooking....'] // Adjust as needed
		socket.emit('server_response', { type: 'bot', message: res })
	})
}
