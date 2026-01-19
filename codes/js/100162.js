const express = require('express');

const router = express.Router({ mergeParams: true });
const MessageController = require('./../app/controllers/User/MessageController');
const AuthorMiddleware = require("../app/middlewares/AuthMiddleware");
const { isAuth , getUser} = AuthorMiddleware;

// add
router.post('/',getUser, MessageController.add);

// chat with chatgpt
router.post('/chatbot', MessageController.chatWithChatgpt);

// get
router.get('/:conversationId',getUser, MessageController.fetchMessages);
// router.get('/', MessageController.getAll);

// delete
router.delete('/',getUser, MessageController.delete);

// update reader
router.put('/:id', MessageController.update);

router.post("/react",getUser,MessageController.reactMessage);
router.put("/removeMessage",MessageController.removeMessage);
module.exports = router;
