self.options.myJS.forEach(function (url) {
  var script = document.createElement('script');
  script.src = url;
  document.head.appendChild(script);
});
self.options.myCSS.forEach(function (url) {
  var link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  link.id = "gliCss";
  document.head.appendChild(link);
});

