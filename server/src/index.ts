import Express from 'express';
import connect from './models/atlasConnect';
import cors from 'cors';

await connect();

const app = Express();
app.use(cors());
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));

import userRoute from './routes/user';
import plannerRoute from './routes/planner';

app.use('/user', userRoute);
app.use('/planner', plannerRoute);

// Dev routes
// import dataInsertRoute from './routes/dataInsert';
// app.use('/dataInsert', dataInsertRoute);

app.all('*', (_, res) => res.sendStatus(404));

const port = process.env.PORT ?? 3001;
app.listen(port, () => console.log(`Application listening on port ${port}`));