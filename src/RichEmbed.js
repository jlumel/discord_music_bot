const Discord = require('discord.js')

const RichEmbed = (song, i) => {
    const embed = new Discord.MessageEmbed()
        .addField(i > 0 ? 'Track ' + i : 'Playing' ,song.title)
        .setThumbnail(song.thumbnail)
        .addField(song.duration ? 'Duración' : 'Live',song.duration ? song.duration : 'Stream')
    return embed
}

module.exports = RichEmbed