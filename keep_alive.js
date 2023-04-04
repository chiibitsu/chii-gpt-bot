import http from 'http';

const server = http.createServer((req, res) => {
  res.write("ChiiGPT is awake!");
  res.end();
}).listen(8080);

export default server;