var exports = module.exports = {};

// Parse the returned url from bing
// @url: url retrieved from bing
exports.parseUrl = function(url) {
    // Extract the url
    var url = /&r=(.*)&p/.exec(url);
    // Return the decoded uri
    return decodeURIComponent(url[1]);
}
