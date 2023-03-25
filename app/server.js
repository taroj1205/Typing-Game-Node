const http = require('http');
const fs = require('fs');
const path = require('path');
const host = process.env.APP_HOST;
const port = process.env.APP_PORT;

server.listen(port, host, () => {
    console.log(`Server running on ${host}:${port}`);
});
