import express from 'express'
import cors from 'cors'
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { userRouter, videoRouter, likeRouter, commentRouter, subscriptionRouter } from './routes/Route.js'
const app = express()


app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
);app.use(express.json())
app.use(express.static('public'))
app.use(cookieParser())
app.use(morgan('dev'))


app.use('/api/v1/users', userRouter)
app.use('/api/v1/video', videoRouter)
app.use('/api/v1/like', likeRouter) 
app.use('/api/v1/comment', commentRouter)
app.use('/api/v1/subscription', subscriptionRouter)

export default app;