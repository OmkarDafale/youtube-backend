import jwt from 'jsonwebtoken'
import { asyncHandler,ApiError } from '../utils/index.js'
import User from '../models/user.model.js'

const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const accessToken = req.cookies?.accessToken || req.header('Authorization')?.split(' ')[1];

        if(!accessToken) throw new ApiError(401,"Unauthorized request")

        const decodeToken = jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodeToken?._id).select("-password -refreshToken");

        if(!user) throw new ApiError(401,"Invalid access token")
        req.user = user
        next()

    } catch (error) {
        throw new ApiError(401,error?.message ||"Invalid access token")
    }
})

export default verifyJWT