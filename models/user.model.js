import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";
import bcyrpt from 'bcrypt'


const userSchema = new Schema({

    username: {
        type: String,
        required: [true, 'username is required'],
        unique: true,
        lowercase: true,
        trim: true,
        index: true
    },
    email: {
        type: String,
        required: [true, 'email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: [true, 'fullName is required'],
        trim: true,
        index: true
    },
    avatar: {
        type: {
            public_id: String,
            url: String // Cloudinary url
        },
        required: true
    },
    coverImage: {
        type: {
            public_id: String,
            url: String // Cloudinary url
        },
    },
    watchHistory: [
        {

            type: Schema.Types.ObjectId,
            ref: "Video"
        }
    ],
    password: {
        type: String,
        required: [true, "Password is Required"]
    },
    refreshToken: {
        type: String
    }
}, {
    timestamps: true
})



userSchema.pre("save", async function (next) {
    if (!this.isModified('password')) return next()
    this.password = await bcyrpt.hash(this.password, 10)
    return next()
})

userSchema.methods = {
    comparePassword: async function (plainTextPassword) {
        return await bcyrpt.compare(plainTextPassword, this.password)
    },
    generateAccessToken: function () {
        return jwt.sign({
            _id: this._id,
            email: this.email,
            username: this.email,
            fullName: this.fullName
        },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: process.env.ACCESS_TOKEN_EXPIRY
            }
        )
    },
    generateRefreshToken: function() {
        return jwt.sign({
            _id: this._id,
        },
            process.env.REFRESH_TOKEN_SECRET,
            {
                expiresIn: process.env.REFRESH_TOKEN_EXPIRY
            }
        )
    }
}


const User = model('User', userSchema)
export default User