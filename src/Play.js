const ytdl = require('ytdl-core-discord')
const spdl = require('spdl-core')
const RichEmbed = require('./RichEmbed')

const Play = async (connection, message, server) => {

    let dispatcher

    if (server.getFirstSong() && !spdl.validateURL(server.getFirstSong().url)) {

        dispatcher = connection.play(await ytdl(server.getFirstSong().url), { filter: "audioonly", type: 'opus' })

    } else if (server.getFirstSong() && spdl.validateURL(server.getFirstSong().url)) {

        dispatcher = connection.play(await spdl(server.getFirstSong().url))
    }

    const embed = RichEmbed(server.getFirstSong())
    message.channel.send(embed)

    dispatcher.on("finish", () => {

        server.queue.shift()
        
        if (!server.isEmpty()) {
            Play(connection, message, server)
        }
    })
}

module.exports = Play