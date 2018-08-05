
importScripts('https://storage.googleapis.com/workbox-cdn/releases/3.4.1/workbox-sw.js');

workbox.routing.registerRoute(
  /\.(?:png|svg|gif)$/,
  workbox.strategies.cacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.Plugin({
        maxEntries: 100,
        maxAgeSeconds: 86400 * 7,
      })
    ]
  })
);

workbox.routing.registerRoute(
  /\.(?:js|css|html)$/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'apps'
  })
);

workbox.routing.registerRoute(
  /.*(?:bootstrapcdn\.com|cloudflare\.com|d3js\.org|github\.io|jquery\.com|jsdelivr\.net|rawgit\.com|unpkg\.com).*$/,
  workbox.strategies.staleWhileRevalidate({
    cacheName: 'externals'
  })
);
