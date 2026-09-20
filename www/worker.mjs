// www.filesanity.com: every request is a 301 to the bare domain, path and query kept.
export default { fetch: (req) => Response.redirect(`https://filesanity.com${new URL(req.url).pathname}${new URL(req.url).search}`, 301) }
