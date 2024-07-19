import {
    toggleSubscription, getUserChannelSubscribers, getSubscribedChannels
} from '../controllers/subscriptions.controller.js'
import { Router } from 'express'
import verifyJWT from '../middlewares/auth.middleware.js'

const subscriptionRouter = Router()

subscriptionRouter.use(verifyJWT)

subscriptionRouter.route('/c/:channelId')
    .get(getUserChannelSubscribers)
    .post(toggleSubscription)

subscriptionRouter.route('/u/subscribedChannel').get(getSubscribedChannels)

export default subscriptionRouter


