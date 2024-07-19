import { Router } from "express";
import {
    getLikedVideos,
    toggleCommentLike,
    toggleVideoLike,
} from '../controllers/like.controller.js'

import verifyJWT from "../middlewares/auth.middleware.js";

const likeRouter = Router()

likeRouter.use(verifyJWT)

likeRouter.get('/likedVideos',getLikedVideos)
likeRouter.post('/toggle/v/:videoId', toggleVideoLike)
likeRouter.post('/toggle/c/:commentId', toggleCommentLike)

export default likeRouter