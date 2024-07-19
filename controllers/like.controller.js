import mongoose from 'mongoose'
import { Like } from '../models/index.js'
import { asyncHandler, ApiResponse, ApiError } from '../utils/index.js'


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!videoId) throw new ApiError(401, 'Video Id not found')


    const likedVideo = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    if (likedVideo) {
        await Like.findByIdAndDelete(likedVideo._id)
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Video like removed successfully"))
    }
    await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isLiked: true },
                "Video like successfully"
            )
        )
})


const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!commentId) throw new ApiError(401, "Comment id is not provided")

    const likedAlready = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    if (likedAlready) {
        await Like.findByIdAndDelete(likedAlready._id)
        return res
            .status(200)
            .json(
                new ApiResponse(200, { isLiked: false }, 'Comment like remove successfully')
            )
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user?._id
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { isLiked: true },
                "Comment Like successfully"
            )
        )
})


const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'video',
                foreignField: '_id',
                as: "likedVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'ownerDetails'
                        }
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
            $project: {
                _id: 0,
                likedVideo: {
                    _id: 1,
                    "videoFile.url": 1,
                    "thumbnail.url": 1,
                    owner: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    duration: 1,
                    createdAt: 1,
                    isPublished: 1,
                    ownerDetails: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1,
                    },
                },
            },
        },
    ])

    if (!likedVideos.length) throw new ApiError(400, "Users as no Liked Videos")

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                likedVideos,
                "Liked videos fetched successfully"
            )
        )
})

export { toggleVideoLike, toggleCommentLike, getLikedVideos };