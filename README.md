# Talq-Backend

## Run it locally

### Prerequisites

- You'll need to install the Frontend API repository to work with the backend, vice versa.
- You'll need to setup a MongoDB database
- You'll need to setup a cloudinary account in order to store images

### Cloning the repository

Make a appropriate directory and cd to it using the terminal

```bash
# Clone this repository
$ git clone git@github.com:Lucas256w/Talq-Backend.git

# Go into the repository
$ cd Talq-Backend
```

### Install dependencies

```bash
# Install dependencies
$ npm install
```

### Setting up environment variables

- Make a file at the root directory called `.env`.
- Populate `.env` located in server with the following environment variables:
  - `CONNECTION_STRING`: Connection string to your MongoDB database
  - `SECRET_KEY_PUBLIC`: The secret key that JWT use to sign users
  - `CORS_ALLOWED_ORIGIN`: The endpoints that are allowed to access the API
  - `CLOUDINARY_CLOUD_NAME` name given by cloudinary
  - `CLOUDINARY_API_KEY` key given by cloudinary
  - `CLOUDINARY_API_SECRET` secret given by cloudinary


### Starting the application

From root directory run the following commands:

```bash
# Start the server
$ npm run serverstart

```
