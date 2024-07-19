import { Schema,model } from "mongoose";

const subscriptionsSchema = new Schema({
    subscriber :{
        type: Schema.Types.ObjectId,
        ref : 'User',
    },
    channel : {
        type: Schema.Types.ObjectId,
        ref : 'User',
    }
},
{
    timestamps : true
})

const Subscriptions = model('Subscription',subscriptionsSchema) 
export default Subscriptions