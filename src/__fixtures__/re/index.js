// @index('../../../node_modules/fs-extra/lib/index.js', /\.\.\.require\('(.+?)'\)/g, (m, _) => `${_.camel(m[1])}`)

// @endindex

// @index('../../../node_modules/fs-extra/package.json', /(?<="dependencies": \{).+?(?=\})/s, /"(.+?)": "(.+?)"/g, (m, _, e) => `${e.index}. ${m[1]} ==> ${m[2]}`)

// @endindex

  // @index('../../../node_modules/fs-extra/lib/index.js', /\.\.\.require\('(.+?)'\)/g, (m, _) => `${_.camel(m[1])}`)

  // @endindex