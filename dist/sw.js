importScripts('/_nuxt/workbox.4c4f5ca6.js')

workbox.precaching.precacheAndRoute([
  {
    "url": "/_nuxt/4bf78135b52caf848eea.js",
    "revision": "02a67eae67d67fd518c73c6bf8bc21c4"
  },
  {
    "url": "/_nuxt/70868b3818c6a41a7b24.js",
    "revision": "02da867de8f9261a1013970b1cfe5f94"
  },
  {
    "url": "/_nuxt/96ba8c46c392cbabdf2b.js",
    "revision": "e22aa9f386cfa0f2cbd96a74ef770192"
  },
  {
    "url": "/_nuxt/fe3406d3dcaaed47691e.js",
    "revision": "161ee9f94f190e393266bfbeb20adf62"
  }
], {
  "cacheId": "nuxt-storybook-atomic",
  "directoryIndex": "/",
  "cleanUrls": false
})

workbox.clientsClaim()
workbox.skipWaiting()

workbox.routing.registerRoute(new RegExp('/_nuxt/.*'), workbox.strategies.cacheFirst({}), 'GET')

workbox.routing.registerRoute(new RegExp('/.*'), workbox.strategies.networkFirst({}), 'GET')
