const ytsr = require('ytsr')

const Search = async (args) => {
    try {
        const filters = await ytsr.getFilters(args)
        const filter = filters.get('Type').get('Video')
        const options = {
            pages: 1
        }

        const searchResults = await ytsr(filter.url, options)

        return searchResults
    } catch (error) {
        console.log(error)
    }
}

module.exports = Search