import { createServer } from "./server";
import 'dotenv/config'

createServer(+process.env.PORT!).listen(process.env.PORT, () => {
    console.log(`Server is listening on port ${process.env.PORT}`);
});