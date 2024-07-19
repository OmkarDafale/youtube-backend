import { Router } from "express";
import upload from "../middlewares/multer.middleware.js";
import verifyJWT from '../middlewares/auth.middleware.js'
import {
    publishAVideo,
    updateVideo,
    deleteVideo,
    getAllVideos,
    getVideoById,
    togglePublishStatus
} from '../controllers/video.controller.js'
const videoRouter = Router()


videoRouter.get('/', getAllVideos)
videoRouter.post('/', verifyJWT, upload.fields([
    {
        name: 'videoFile',
        maxCount: 1
    },
    {
        name: 'thumbnail',
        maxCount: 1
    }
]),
    publishAVideo
)

videoRouter.route('/v/:videoId')
    .get(verifyJWT, getVideoById)
    .delete(verifyJWT, deleteVideo)
    .patch(verifyJWT, upload.single("thumbnail"), updateVideo)


videoRouter.patch('/toggle/publish/:videoId', verifyJWT, togglePublishStatus)


export default videoRouter