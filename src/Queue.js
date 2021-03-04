class Queue {

    constructor() {

        this.queue = []

    }
    addSong(song) {
       this.queue.push(song)
       return song
    }

    empty() {
        this.queue = []
    }

    isEmpty() {
        if (this.queue.length) {
            return false
        } else {
            return true
        }
    }

    getFirstSong() {
        return this.queue[0]
    }
}

module.exports = Queue