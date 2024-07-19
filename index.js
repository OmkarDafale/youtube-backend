import connectToDatabase from "./db/db.js";
import dotenv from 'dotenv';
import app from "./app.js";

dotenv.config();

(async () => {
    try {
        await connectToDatabase();
        const PORT = process.env.PORT || 4000;
        app.listen(PORT, () => {
            console.log(`Server is listening on : ${PORT}`);
        });
    } catch (error) {
        console.error('MongoDB connection failed!!!', error);
    }
})();
