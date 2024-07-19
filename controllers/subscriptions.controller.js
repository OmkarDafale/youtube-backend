import mongoose from 'mongoose'
import { Subscriptions } from '../models/index.js'
import { asyncHandler, ApiError, ApiResponse } from '../utils/index.js'


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if (!channelId) throw new ApiError(401, "Invalid Channel Id")

    const isSubscribed = await Subscriptions.findOne({
        subscriber: req.user?._id,
        channel: channelId
    })

    if (isSubscribed) {
        await Subscriptions.findByIdAndDelete(isSubscribed._id)
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { subscribed: false },
                    "Unsubscribed successfully"
                )
            )
    }

    await Subscriptions.create({
        subscriber: req.user?._id,
        channel: channelId
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { subscribed: true },
                "Subscribed successfully"
            )
        )
})


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId) throw new ApiError(401, "Invalid Channel Id")

    const subscribers = await Subscriptions.aggregate(
        [
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'subscriber',
                    foreignField: '_id',
                    as: 'subscribers'
                }
            },
            {
                $unwind: '$subscribers'
            },
            {
                $facet: {
                    data: [
                        {
                            $project: {
                                _id: 1,
                                subscriber: {
                                    _id: '$subscribers._id',
                                    username: '$subscribers.username',
                                    fullName: '$subscribers.fullName',
                                    'avatar.url': '$subscribers.avatar.url'
                                }
                            }
                        }
                    ],
                    count: [
                        {
                            $count: 'totalSubscribers'
                        }
                    ]
                }
            },
            {
                $project: {
                    data: 1,
                    totalSubscribers: { $arrayElemAt: ['$count.totalSubscribers', 0] }
                }
            }
        ]
    )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers,
                "Subscribers data fetched successfully"
            )
        )
})

const getSubscribedChannels = asyncHandler(async (req, res) => {

    const subscriberId = req.user?._id

    const subscribedChannels = await Subscriptions.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'channel',
                foreignField: "_id",
                as: "subscribedChannel",
                pipeline: [
                    {
                        $lookup: {
                            from: "videos",
                            localField: "_id",
                            foreignField: 'owner',
                            as: "videos"
                        }
                    },
                    {
                        $addFields: {
                            latestVideo: {
                                $last: "$videos"
                            }
                        }
                    }
                ]
            }
        },
        {
            $unwind: '$subscribedChannel'
        },
        {
            $project: {
                _id: 0,
                subscribedChannel: {
                    username: 1,
                    fullName: 1,
                    "avatar.url": 1,
                    latestVideo: {
                        _id: 1,
                        "videoFile.url": 1,
                        "thumbnail.url": 1,
                        owner: 1,
                        title: 1,
                        description: 1,
                        duration: 1,
                        createdAt: 1,
                        views: 1
                    }
                }
            }
        }
    ])

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedChannels,
                "subscribed channels fetched successfully"
            )
        );
})

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };