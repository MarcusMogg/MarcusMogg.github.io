module.exports = {
  "title": "MOGG",
  "description": "",
  "head": [
    [
      "meta",
      {
        "name": "viewport",
        "content": "width=device-width,initial-scale=1,user-scalable=no"
      }
    ]
  ],
  "theme": "reco",
  "themeConfig": {
    "nav": [
      {
        "text": "Home",
        "link": "/",
        "icon": "reco-home"
      },
      {
        "text": "TimeLine",
        "link": "/timeline/",
        "icon": "reco-date"
      },

    ],
    subSidebar: 'auto',
    "type": "blog",
    "blogConfig": {
      "category": {
        "location": 2,
        "text": "Category"
      },
      "tag": {
        "location": 3,
        "text": "Tag"
      }
    },

    "search": true,
    "searchMaxSuggestions": 10,
    "lastUpdated": "Last Updated",
    "author": "MOGG",
    "authorAvatar": "/avatar.png",
    "startYear": "2020"
  },
  "markdown": {
    "lineNumbers": true
  },
  plugins: [
    [
      require("./my-vuepress-mathjax/index.js")
    ],
  ],
}