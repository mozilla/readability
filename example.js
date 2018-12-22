var readability = require("./index.js");
var JSDOMParser = readability.JSDOMParser;
const fs = require('fs');

var fname = "test/test-pages/001/source.html"
var url = "https://example.com"

function readFile(){
   console.log("Reading file");
   fs.readFile(fname, 'utf8', function (err,data) {
   if (err) {
      return console.log(err);
   }
      console.log("Read file");
      parseToDOM(data);
   });
}

function parseToDOM(text){
   console.log("Parsing html");
   console.log(text);
   const dom = new JSDOMParser().parse(text,url);
   console.log(dom)
   console.log("Parsed html");
   readabilityCheck(dom);
}

function readabilityCheck(dom){
   console.log("\n\n\n\nChecking readability");
   var article = new readability.Readability(dom,{debug:true}).parse();
}

readFile();
