
document.addEventListener("DOMContentLoaded", function(event) {
  document.getElementById("compare").addEventListener("click", function compare(event) {
    var original = document.getElementById("original");
    original.addEventListener("load", function(event) {
      var contentDoc = original.contentDocument;
      var docStr = new XMLSerializer().serializeToString(contentDoc);
      var doc = new DOMParser().parseFromString(docStr, "text/html");

      var location = contentDoc.location;
      var uri = {
        spec: location.href,
        host: location.host,
        prePath: location.protocol + "//" + location.host, // TODO This is incomplete, needs username/password and port
        scheme: location.protocol.substr(0, location.protocol.indexOf(":")),
        pathBase: location.protocol + "//" + location.host + location.pathname.substr(0, location.pathname.lastIndexOf("/") + 1)
      }
      var readability = new Readability(uri, doc);
      var result = readability.parse();

      console.log(result);

      var readerDoc = document.getElementById("readerized").contentWindow.document;
      readerDoc.getElementById("title").textContent = result.title;
      readerDoc.getElementById("byline").textContent = result.byline;
      readerDoc.getElementById("content").innerHTML = result.content;
    });

    original.src = document.getElementById("url").value;
  });
});
