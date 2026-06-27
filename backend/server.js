import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));

app.use(express.json());

async function startServer() {
    // await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is running at http://localhost:${PORT}`);
    });

    // app.use('/api', scoresRoute);
}

startServer();