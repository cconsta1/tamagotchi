import Lights from './Lights.js'
import Floor from './Floor.js'
import Box from './Box.js'
import Robot from './Robot.js'

export default class World {
    constructor({ experience }) {
        this.experience = experience
        this.scene = experience.scene
        this.ui = window.tamagotchiUI

        // Allow experience consumers to grab the world reference later on
        this.experience.world = this

        this.setup()
        this.registerEvents()
    }

    setup() {
        this.lights = new Lights({ experience: this.experience })
        this.floor = new Floor({ experience: this.experience })
        this.box = new Box({ world: this })
        this.robot = new Robot({ world: this })
    }

    registerEvents() {
        if (!this.box) return

        this.box.on('boxHatched', () => {
            this.robot.loadModel()
        })
    }

    update(deltaTime) {
        this.box?.update(deltaTime)
        this.robot?.update(deltaTime)
    }
}