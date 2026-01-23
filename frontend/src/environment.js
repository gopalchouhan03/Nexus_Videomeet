let IS_PROD = false;
const server = IS_PROD ?
    "https://videocall-api.example.com" :
    "http://localhost:8000"

export default server;