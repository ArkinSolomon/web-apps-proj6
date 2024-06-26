import Express from 'express';
import connect from './models/atlasConnect.js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

await connect();

const app = Express();
app.use(cors());
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

import userRoute from './routes/user.js';
import plannerRoute from './routes/planner.js';

app.use('/user', userRoute);
app.use('/planner', plannerRoute);

// Dev routes
// import dataInsertRoute from './routes/dataInsert';
// app.use('/dataInsert', dataInsertRoute);

app.all('*', (_, res) => res.sendStatus(404));

const port = process.env.PORT ?? 3001;
app.listen(port, () => console.log(`Application listening on port ${port}`));