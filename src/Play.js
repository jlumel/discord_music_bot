const ytdl = require('ytdl-core-discord')
const RichEmbed = require('./RichEmbed')

const Play = async (connection, message, server) => {

    

    if (server.getFirstSong()) {
        
        const url = server.getFirstSong().url
        const dispatcher = connection.play(await ytdl(url), { filter: "audioonly", type: 'opus' })
        const embed = RichEmbed(server.getFirstSong())
        message.channel.send(embed)

        dispatcher.on("finish", () => {

            server.queue.shift()

            if (server.queue.length) {
                Play(connection, message, server)
            }
        })
    }
}

module.exports = Play