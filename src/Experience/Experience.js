import * as THREE from 'three'
import { GUI } from 'lil-gui'

import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import World from './World/World.js'

let instance = null

export default class Experience {
    constructor(_canvas) {
        // Singleton
        if (instance) {
            return instance
        }
        instance = this

        // Global access
        this.canvas = _canvas

        this.config = {
            debug: window.location.hash.includes('debug')
        }

        // Setup
        this.sizes = new Sizes()
        this.time = new Time()
        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color('#fdf1e2')
        this.scene.fog = new THREE.FogExp2('#f8e7d4', 0.0125)

        this.gui = this.config.debug ? new GUI({ width: 320 }) : null
        this.camera = new Camera(this)
        this.renderer = new Renderer(this)
        this.world = new World({ experience: this })

        // Events
        this.sizes.on('resize', () => {
            this.resize()
        })

        this.time.on('tick', () => {
            this.update()
        })

    }

    resize() {
        this.camera.resize()
        this.renderer.resize()
    }

    update() {
        const deltaTime = this.time.delta

        this.world.update(deltaTime)

        this.camera.update(deltaTime)

        this.renderer.update()
    }
}