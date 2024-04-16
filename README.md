# CS-3220 Web Applications Project 6

## Setup Node.Js

Install Node.Js [here](https://nodejs.org/en). Install Node 21 from the little text underneath the big button.

## Setup Bun

The data-loader used to load the data into the database uses Bun, not Node.Js. This was before we were informed that Bun was not permitted. However, since this is not technically part of the project, I have not changed it. Install Bun on the command line from [here](https://bun.sh/). No Bun functions should be used for the client or server.

## Setup Local Environment

Clone the repository using Git as you would any other repository. The server and data-loader repository directories require a `.env` file (that is not checked into Git) to use. The server requires a `JWT_SECRET` which is the secret to sign the JWT tokens used for user authentication. The server and data-loaders require a `ATLAS_CONNECTION_STRING`, which is the connection string used to connect to MongoDB Atlas (we will be using a cloud-based database). The server optionally takes a `PORT` variable to change its port. The default port is 3001. The `.env` file might look something like this:

```.env
JWT_SECRET=abcdefghijklmnopqrstuvwxyz1234567890
ATLAS_CONNECTION_STRING=mongodb+srv://user:password@cluster-name.000000.mongodb.net/?retryWrites=true&w=majority&appName=my-app
```


You will receive these variable values personally.

Install TypeScript and EsLint globally by running:

```sh
$ npm i -g typescript@5.2.2 eslint@8.57
```

Go to both the client and server (and data-loader, if you wish) directories and run:

```sh
$ npm install
```

to install all of the necessary dependencies.

If you are using VSCode to develop, get the [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) plugin. TypeScript support should automatically be in VSCode, but if it is not, you may want the [Nightly TypeScript build](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next). For the plugins to work properly, it is important that you do not open the repository root, rather open the client folder, then right click on the folder in VSCode's explorer, then "Add Folder to Workspace..." and then add the server directory. You may also need to add the following to your workspace settings file:

```json
{
  "eslint.format.enable": true,
  "eslint.workingDirectories": [
    "./client",
    "./server"
  ],
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "eslint.codeActionsOnSave.rules": null
}  
```

To access the settings file, open VSCode settings, click on the "Workspace" tab, and then search for "eslint". There should be a button that says "Edit in settings.json". The values provided above should be within `settings` in the JSON.

## Running & Developing

Start the client or server by going to the server directory and running:

```sh
$ npm run start
```

If the database is empty, you need to use the data-loader to load the data. YOU PROBABLY DON'T NEED TO DO THIS. For the data-loader, use `bun file.ts` to pick which data to load. Don't do this multiple times, or else the database will have duplicates.

## MongoDB Compass

If you download [MongoDB Compass](https://www.mongodb.com/products/tools/compass), it can help you modify the data on the fly. You can use the same Atlas connection string used for the servers to modify the database.

## API

The client has an interface for interacting with the server, under `client/src/api/*`. You can use these functions to interact with the server and they will manage authentication for you.

In order for a faculty member that has a student as an advisor to access the student's information with the API, simply make sure `?studentId=<studentId>` is at the end of the window's location. The helper functions will automatically pick up on this and request the student's plan. Also, note that the server will return `Unauthorized` (401) if a faculty member tries to make a plan for themselves.

> To determine if the currently logged in user is a faculty, you can try getting advisors, and then seeing if it throws an error.

P.S. The password to all accounts should be "password", it will make things easier...
