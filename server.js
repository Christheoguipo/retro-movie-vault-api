const url = require("url"),
  http = require("http"),
  fs = require("fs");

http
  .createServer((request, response) => {
    let addr = request.url,
      q = url.parse(addr, true),
      filepath = "";

    fs.appendFile('log.txt', 'URL: ' + addr + '\nTimestamp: ' + new Date() + '\n\n', (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Added to log.');
      }
    });

    if (q.pathname.includes("documentation")) {
      filepath = __dirname + "/documentation.html";
    } else {
      filepath = "index.html";
    }

    fs.readFile(filepath, (err, data) => {
      if (err) {
        throw err;
      }
      response.writeHead(200, { "Content-Type": "text/html" });
      response.write(data);
      response.end();
    });

  })
  .listen(8080);

console.log("My first Node test server is running on Port 8080.");
