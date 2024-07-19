import { asyncHandler, ApiResponse, ApiError } from "../utils/index.js"
import { Comment, Like, Video } from '../models/index.js'
import mongoose from "mongoose";



const getVideoComments = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query
    const { videoId } = req.params;
    if (!videoId) throw new ApiError(400, "Video id not provided")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(401, "Video not Found")


    const commentsAggregate = Comment.aggregate(
        [
            {
                $match: {
                    video: new mongoose.Types.ObjectId(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    likesCount: {
                        $size: "$likes"
                    },
                    owner: {
                        $first: "$owner"
                    },
                    isLiked: {
                        $cond: {
                            if: { $in: [req.user?._id, "$likes.likedBy"] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $sort: {
                    createdAt: -1
                }
            },
            {
                $project: {
                    content: 1,
                    createdAt: 1,
                    likesCount: 1,
                    owner: {
                        username: 1,
                        fullName: 1,
                        "avatar.url": 1
                    },
                    isLiked: 1
                }
            }
        ]
    )

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const comments = await Comment.aggregatePaginate(
        commentsAggregate,
        options
    );

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
})

const addComment = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { videoId } = req.params;
    console.log(content, videoId, 'backend')
    if (!content || !videoId) throw new ApiError(400, "Content and Video Id is required")

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(400, "No such video, Video not found")

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user?._id
    })

    if (!comment) throw new ApiError(500, 'Something went wrong unable to create comment try again later')

    return res
        .status(200)
        .json(
            new ApiResponse(
                201,
                comment,
                "Comment added successfully"
            )
        )
})

const updateComment = asyncHandler(async (req, res) => {
    const { content } = req.body
    const { commentId } = req.params
    if (!content || !commentId) throw new ApiError(401,
        "Content and CommentID are required")

    const comment = await Comment.findById(commentId);
    if (!comment) throw new ApiError(401, "Comment Id is invalid")

    if (comment.owner.toString() !== req.user?._id.toString())
        throw new ApiError(401, "You are not the owner of the comment and cannot update it")

    const updatedComment = await Comment.findByIdAndUpdate(comment._id, {
        $set: {
            content
        }
    }, { new: true })

    if (!updatedComment) {
        throw new ApiError(500, "Failed to edit comment please try again");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedComment, "Comment edited successfully")
        );
})


const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const comment = await Comment.findById(commentId)

    if (!comment) throw new ApiError(401, "Comment not found")

    if (comment.owner.toString() !== req.user?._id.toString())
        throw new ApiError(401, 'You are not the owner of the comment and cannot delet the comment')

    await Comment.findByIdAndDelete(comment._id)
    await Like.deleteMany({
        comment: commentId,
        likedBy: req.user
    })

    return res
        .status(200)
        .json(
            new ApiResponse(200, { commentId }, "Comment deleted successfully")
        );
})

export { getVideoComments, addComment, updateComment, deleteComment };