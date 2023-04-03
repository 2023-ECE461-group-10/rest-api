import { app } from './server';

app.listen(process.env.PORT, () => console.log(`Running on port ${process.env.PORT}`));