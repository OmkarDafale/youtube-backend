import { asyncHandler, ApiError, ApiResponse } from '../utils/index.js'
import {User}  from '../models/index.js'
import { uploadOnCloudinary, deleteOnCloudinary } from '../utils/cloudinary.js'
import mongoose from 'mongoose'


const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) throw new ApiError(500, " No such user exists")

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty etc...
    // check if user already exists: username, email
    // check for images, avatar
    // upload to cloudinary, avatar check
    // create user object - create entry in db
    // remove password and refresh token from response
    // check for user creation
    // return response

    const { username, email, fullName, password } = req.body;

    if ([username, email, fullName, password].some((field) => (field?.trim() === ''))) {
        throw new ApiError(400, "All fields are Required")
    }

    const userExists = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (userExists) throw new ApiError(409, 'User with username or email already exists')

    const avatarLocalPath = req.files?.avatar[0]?.path
    // console.log("avatarLocalPath", avatarLocalPath);

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required")
    
    const avatar = await uploadOnCloudinary(avatarLocalPath).catch((error) => console.log(error))
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if (!avatar) throw new ApiError(400, "Avatar file is required!!!.")

    const user = await User.create({
        fullName,
        avatar: {
            public_id: avatar.public_id,
            url: avatar.secure_url
        },
        coverImage: {
            public_id: coverImage.public_id || "",
            url: coverImage.secure_url || ""
        },
        username: username.toLowerCase(),
        email,
        password
    })

    const createdUser = await User.findById(user._id).select('-password');
    if (!createdUser) throw new ApiError(500, 'User registration failed,please try again');

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User Registered successfully")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send tokens in cookies

    const { email, username, password } = req.body;
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required.")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]
    })
    if (!user) throw new ApiError(404, "User doesn't exists")

    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect) throw new ApiError(401, "Invalid user Credentials.")

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id)

    const loggedUser = await User.findById(user._id).select('-password -refreshToken');

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken",refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedUser, accessToken, refreshToken
                },
                "User logged in successfully !!!"
            )
        )
})


const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "User logout successfully!!!"
            )
        )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req?.cookies?.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) throw new ApiError(401, 'Unauthorized request');

    const user = await User.findOne({
        refreshToken: incomingRefreshToken
    }).select('_id')


    if (!user) {
        throw new ApiError(401, 'Invalid Refresh token')
    }
    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    }

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken
                },
                "Access token refreshed"
            )
        )
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(401, "Need to pass userId")

    const isOldPasswordCorrect = await user.comparePassword(oldPassword)
    if (!isOldPasswordCorrect) throw new ApiError(400, "Incorrect old password")

    user.password = newPassword;
    await user.save({ validateBeforeSave: false })


    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "User password changed successfully"
            )
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                req.user,
                "Current user fetched successfully"
            )
        )
})

const updateUserDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(req?.user?._id, {
        $set: {
            email,
            fullName
        }

    }, { new: true }).select('-password -refreshToken')

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "User details updated successfully"
            )
        )
});


const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing")
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url) throw new ApiError(400, "Error while uploading avatar")

    const user = await User.findById(req?.user?._id).select('avatar');

    const avatarToDelete = user.avatar.public_id;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            avatar: {
                public_id: avatar.public_id,
                url: avatar.secure_url
            }
        }
    }, { new: true }).select('-password -refreshToken')

    if (avatarToDelete && updatedUser.avatar.public_id) {
        await deleteOnCloudinary(avatarToDelete);
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "Avatar updated successfully"
            )
        )
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) throw new ApiError(400, "coverImage file is missing");

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading coverImage");
    }

    const user = await User.findById(req.user?._id).select('coverImage')

    const coverImageToDelete = user.coverImage.public_id;

    const updatedUser = await User.findByIdAndUpdate(req.user._id, {
        $set: {
            coverImage: {
                public_id: coverImage.public_id,
                url: coverImage.secure_url
            }
        }
    }, { new: true }).select('-password -refreshToken')


    if (coverImageToDelete && updatedUser.coverImage.public_id) {
        await deleteOnCloudinary(coverImageToDelete)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedUser,
                "Cover Image updated successfully"
            )
        )
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params
    if (!username) throw new ApiError(404, "username is missing")

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'channel',
                as: 'subscribers'
            }
        },
        {
            $lookup: {
                from: 'subscriptions',
                localField: '_id',
                foreignField: 'subscriber',
                as: 'subscribedTo'
            }
        },
        {
            $addFields: {
                subscriberCount: {
                    $size: '$subscribers'
                },
                channelSubscribedTo: {
                    $size: '$subscribedTo'
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                username: 1,
                fullName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscriberCount: 1,
                channelSubscribedTo: 1,
                isSubscribed: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, 'Channel doesnt exists')
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel,
                "User channel fetched successfully"
            )
        )
})


const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'watchHistory',
                foreignField: '_id',
                as: 'watchHistory',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'owner',
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: '$owner'
                            }
                        }
                    }
                ]
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})




export {
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
}