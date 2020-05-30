//Importar librerias y Variables globales

const Discord = require('discord.js');

const botconfig = require('./botconfig.json');

const ytdl = require("ytdl-core-discord");

const ytsr = require("ytsr");

let version = botconfig.version

let servers = {};

//Loguear Bot

const bot = new Discord.Client();

bot.login(botconfig.token)

bot.on('ready', () => {
    console.log('Bot is online')
    bot.user.setPresence({ game: { name: '-help para más info' } })
})

//Mensajes

bot.on('message', async message => {

    let prefix = botconfig.prefix
    let messageArray = message.content.split(' ')
    let cmd = messageArray[0].toLowerCase()
    let args = messageArray.slice(1).join(' ')

    //Evitar que el Bot se responda a si mismo

    if (message.author.bot) {
        return
    }

    //Mensajes de informacion

    if (cmd === `${prefix}info`) {

        const embed = new Discord.RichEmbed().addField('Creado por', 'Lumel').addField('Version: ', version).addField('Agregar a tu canal', 'https://bit.ly/2ILf5Cr')
        message.channel.send(embed)

        return
    }

    if (cmd === `${prefix}help`) {
        const embed = new Discord.RichEmbed()
            .setTitle('Lista de comandos')
            .addField(`${prefix}info`, 'Muestra información sobre el bot')
            .addField(`${prefix}play {cancion/artista}`, 'Busca música en YouTube y la reproduce automáticamente en el canal de audio o las agrega a la cola de reproducción(Tenés que estar en un canal de audio)')
            .addField(`${prefix}search {cancion/artista}`, 'Busca música en YouTube y muestra los primeros 5 resultados para que elijas cuál reproducir(Tenés que estar en un canal de audio')
            .addField(`${prefix}playing`, 'Muestra información sobre la canción que se está reproduciendo en el momento')
            .addField(`${prefix}queue`, 'Muestra la cola de reproducción de audio')
            .addField(`${prefix}skip`, 'Pasa a la próxima canción de la cola de reproducción')
            .addField(`${prefix}jump`, 'Elimina el número de track que se indique')
            .addField(`${prefix}stop`, 'Detiene la reproducción y vacía la cola de reproducción')
            .addField(`${prefix}join`, 'Agrega al bot al canal de audio(Tenés que estar en un canal de audio)')
            .addField(`${prefix}leave`, 'Expulsa al bot del canal de audio(Tenés que estar en un canal de audio)')
        message.channel.send(embed)
    }

    //Comandos Voice Channel

    let channel = message.member.voiceChannel

    async function play(connection, message) {
        var server = servers[message.guild.id]
        let url = JSON.stringify(server.queue[0])

        if (url !== undefined) {
            server.dispatcher = connection.playOpusStream(await ytdl(url, { filter: "audioonly", highWaterMark: 1024 * 1024 * 32 }))

            server.queue.shift()

            server.dispatcher.on("end", function () {
                if (url) {
                    play(connection, message)
                    server.title.shift()
                    server.thumbnail.shift()
                    server.duration.shift()
                } else {
                    connection.disconnect()
                    server.title.shift()
                    server.thumbnail.shift()
                    server.duration.shift()
                }
            })
        } else {
            connection.disconnect()
        }
    }

    switch (cmd) {

        case `${prefix}join`:

            if (message.member.voiceChannel) {
                if (!message.guild.voiceConnection) {
                    channel.join().catch((err) => {
                        console.log(err)
                    })
                } else {
                    message.channel.send('Ya estoy en un canal de voz')
                }

            } else {
                message.channel.send('No estas en un canal de voz')
            }

            break;

        case `${prefix}leave`:
            if (message.member.voiceChannel) {

                if (message.guild.voiceConnection) {
                    message.guild.voiceConnection.disconnect()
                } else {
                    message.channel.send('No estoy en ningún canal de voz')
                }
            } else {
                message.channel.send('No estas en un canal de voz')
            }
            break;

        case `${prefix}play`:
            if (message.member.voiceChannel) {

                function search() {
                    let filter;

                    ytsr.getFilters(args, function (err, filters) {
                        if (err) throw err;
                        filter = filters.get('Type').find(o => o.name === 'Video');
                        ytsr.getFilters(filter.ref, function (err) {
                            if (err) throw err;
                            var options = {
                                limit: 1,
                                nextpageRef: filter.ref,
                            }
                            ytsr(null, options, function (err, searchResults) {
                                if (err) {
                                    message.channel.send('No se puede reproducir')
                                    return
                                } else {
                                    server.queue.push(searchResults.items[0].link)
                                    server.title.push(searchResults.items[0].title)
                                    server.thumbnail.push(searchResults.items[0].thumbnail)
                                    server.duration.push(searchResults.items[0].duration)
                                    if (!message.guild.voiceConnection) {
                                        channel.join().then(function (connection) {
                                            play(connection, message)
                                        }
                                        )
                                    }
                                    for (let i = 0; i < server.title.length; i++) {
                                        const title = server.title[i];
                                        const thumb = server.thumbnail[i];
                                        const dur = server.duration[i]
                                        const embed = new Discord.RichEmbed()
                                            .addField('Track ' + `${i + 1}`, title)
                                            .setThumbnail(thumb)
                                            .addField('Duración', dur)
                                        message.channel.send(embed)
                                    }
                                }

                            });
                        });
                    });
                }

                if (!args) {
                    message.channel.send('Especificá un criterio de búsqueda')
                    return
                }

                if (!servers[message.guild.id]) servers[message.guild.id] = {
                    queue: [],
                    title: [],
                    thumbnail: [],
                    duration: [],
                    search: {
                        queue: [],
                        title: [],
                        thumbnail: [],
                        duration: []
                    }
                }

                var server = servers[message.guild.id]

                search()

            } else {
                message.channel.send('No estas en un canal de voz')
            }

            break;

        case `${prefix}pause`:

            if (message.member.voiceChannel) {
                if (message.member.voiceChannel) {

                    var server = servers[message.guild.id]

                    if (message.guild.voiceConnection && server !== undefined) {

                        if (server.dispatcher) server.dispatcher.pause()
                    }
                }
            }

            break;

        case `${prefix}resume`:

            if (message.member.voiceChannel) {
                if (message.member.voiceChannel) {

                    var server = servers[message.guild.id]

                    if (message.guild.voiceConnection && server !== undefined) {

                        if (server.dispatcher) server.dispatcher.resume()
                    }
                }
            }

            break;

        case `${prefix}search`:

            if (message.member.voiceChannel) {
                message.channel.send('Respondé con el numero de opción (1-5) para agregarla a la cola de reproducción...')

                function busqueda() {
                    let filter;

                    ytsr.getFilters(args, function (err, filters) {
                        if (err) throw err;
                        filter = filters.get('Type').find(o => o.name === 'Video');
                        ytsr.getFilters(filter.ref, function (err) {
                            if (err) throw err;
                            var options = {
                                limit: 5,
                                nextpageRef: filter.ref,
                            }
                            ytsr(null, options, function (err, searchResults) {
                                if (err) {
                                    message.channel.send('Error en la búsqueda')
                                } else {
                                    server.search.queue = []
                                    server.search.title = []
                                    server.search.thumbnail = []
                                    server.search.duration = []

                                    for (let i = 0; i < searchResults.items.length; i++) {
                                        const link = searchResults.items[i].link;
                                        const title = searchResults.items[i].title;
                                        const thumb = searchResults.items[i].thumbnail;
                                        const dur = searchResults.items[i].duration;
                                        server.search.queue.push(link)
                                        server.search.title.push(title)
                                        server.search.thumbnail.push(thumb)
                                        server.search.duration.push(dur)
                                        const embed = new Discord.RichEmbed()
                                            .addField(`Opción ${i + 1}`, title)
                                            .setThumbnail(thumb)
                                            .addField('Duración', dur)
                                        message.channel.send(embed)
                                    }
                                }


                            });
                        });
                    });
                }

                if (!args) {
                    message.channel.send('Especificá un criterio de búsqueda')
                    return
                }

                if (!servers[message.guild.id]) servers[message.guild.id] = {
                    queue: [],
                    title: [],
                    thumbnail: [],
                    duration: [],
                    search: {
                        queue: [],
                        title: [],
                        thumbnail: [],
                        duration: []
                    }
                }

                var server = servers[message.guild.id]

                setTimeout(() => {
                    busqueda()
                }, 2000)

            } else {
                message.channel.send('No estas en un canal de voz')
            }

            break;

        case `${prefix}playing`:

            if (message.member.voiceChannel) {

                var server = servers[message.guild.id]

                if (server !== undefined) {
                    const title = server.title[0];
                    const thumb = server.thumbnail[0];
                    const dur = server.duration[0]
                    const embed = new Discord.RichEmbed()
                        .addField('Canción', title)
                        .setThumbnail(thumb)
                        .addField('Duración', dur)
                    message.channel.send(embed)

                } else {
                    message.channel.send('No se está reproduciendo nada en este momento')
                }
            } else {
                message.channel.send('No estas en un canal de voz')
            }

            break;

        case `${prefix}skip`:

            if (message.member.voiceChannel) {

                var server = servers[message.guild.id]

                if (message.guild.voiceConnection && server !== undefined) {
                    for (let i = 1; i < server.title.length; i++) {
                        const title = server.title[i];
                        const thumb = server.thumbnail[i];
                        const dur = server.duration[i]
                        const embed = new Discord.RichEmbed()
                            .addField('Track ' + `${i}`, title)
                            .setThumbnail(thumb)
                            .addField('Duración', dur)
                        message.channel.send(embed)
                    }
                    if (server.dispatcher) server.dispatcher.end()
                }
            } else {
                message.channel.send('No estas en un canal de voz')
            }
            break;

        case `${prefix}stop`:

            if (message.member.voiceChannel) {

                var server = servers[message.guild.id]
                if (message.guild.voiceConnection && server !== undefined) {
                    for (let i = server.queue.length - 1; i >= 0; i--) {
                        server.queue.splice(i, 1)
                        server.title.splice(i, 2)
                        server.thumbnail.splice(i, 2)
                        server.duration.splice(i, 2)
                    }
                    if (server.dispatcher) server.dispatcher.end()
                }
            } else {
                message.channel.send('No estas en un canal de voz')
            }
            break;

        case `${prefix}queue`:

            if (message.member.voiceChannel) {

                var server = servers[message.guild.id]

                for (let i = 0; i < server.title.length; i++) {
                    const title = server.title[i];
                    const thumb = server.thumbnail[i];
                    const dur = server.duration[i]
                    const embed = new Discord.RichEmbed()
                        .addField('Track ' + `${i + 1}`, title)
                        .setThumbnail(thumb)
                        .addField('Duración', dur)
                    message.channel.send(embed)
                }
            } else {
                message.channel.send('No estas en un canal de voz')
            }

            break;

        case `${prefix}jump`:

            if (message.member.voiceChannel) {
                var server = servers[message.guild.id]
                if (message.guild.voiceConnection && server !== undefined) {
                    if (parseInt(args) >= 2) {

                        for (let i = 0; i < server.title.length; i++) {
                            if (parseInt(args) === i + 1) {

                                server.queue.splice(i - 1, 1)
                                server.title.splice(i, 1)
                                server.thumbnail.splice(i, 1)
                                server.duration.splice(i, 1)
                            }
                        }
                        for (let i = 0; i < server.title.length; i++) {
                            const title = server.title[i];
                            const thumb = server.thumbnail[i];
                            const dur = server.duration[i]
                            const embed = new Discord.RichEmbed()
                                .addField('Track ' + `${i + 1}`, title)
                                .setThumbnail(thumb)
                                .addField('Duración', dur)
                            message.channel.send(embed)
                        }
                    } else {
                        message.channel.send('No se puede eliminar la canción que está sonando')
                    }

                }
            } else {
                message.channel.send('No estas en un canal de voz')
            }

            break;
        default:
            break;
    }

    if (/^[1-5]$/.test(cmd)) {

        if (message.member.voiceChannel) {

            var server = servers[message.guild.id]

            if (server !== undefined && server.search.queue !== []) {
                server.queue.push(server.search.queue[parseInt(cmd) - 1])
                server.title.push(server.search.title[parseInt(cmd) - 1])
                server.thumbnail.push(server.search.thumbnail[parseInt(cmd) - 1])
                server.duration.push(server.search.duration[parseInt(cmd) - 1])
                if (!message.guild.voiceConnection) {
                    channel.join().then(function (connection) {
                        play(connection, message)
                    }
                    )
                }

                for (let i = 0; i < server.title.length; i++) {
                    const title = server.title[i];
                    const thumb = server.thumbnail[i];
                    const dur = server.duration[i]
                    const embed = new Discord.RichEmbed()
                        .addField('Track ' + `${i + 1}`, title)
                        .setThumbnail(thumb)
                        .addField('Duración', dur)
                    message.channel.send(embed)
                }
            }
        }
    }
})