import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from '../controllers/user.controller.js'
import { Router } from 'express'
import upload from '../middlewares/multer.middleware.js'
import verifyJWT from '../middlewares/auth.middleware.js'

const userRouter = Router()



userRouter.post('/register', upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    } 
]), registerUser)
userRouter.post('/login',loginUser)


//Secured Routes
userRouter.post('/logout',verifyJWT,logoutUser)
userRouter.post('/refresh-token',verifyJWT,refreshAccessToken)
userRouter.post('/change-password',verifyJWT,changeCurrentPassword)
userRouter.get('/current-user',verifyJWT,getCurrentUser)


userRouter.patch('/update-user',verifyJWT,updateUserDetails)
userRouter.patch('/update-avatar',verifyJWT,upload.single("avatar"),updateUserAvatar)
userRouter.patch('/update-coverImage',verifyJWT,upload.single("coverImage"),updateUserCoverImage)

userRouter.get('/getChannelProfile/:username',verifyJWT,getUserChannelProfile)
userRouter.get('/watch-history',verifyJWT,getWatchHistory)


export default userRouter