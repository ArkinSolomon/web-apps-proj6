import Express from 'express';

const app = Express();

app.listen(process.env.PORT ?? 3001, () => console.log('Application listening'));