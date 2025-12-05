import * as THREE from 'three'

export default class Renderer {
    constructor(experience) {
        this.experience = experience
        this.canvas = experience.canvas
        this.sizes = experience.sizes
        this.scene = experience.scene
        this.camera = experience.camera

        this.setInstance()
    }

    setInstance() {
        this.instance = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        })
        if ('outputColorSpace' in this.instance) {
            this.instance.outputColorSpace = THREE.SRGBColorSpace
        }
        this.instance.toneMapping = THREE.ACESFilmicToneMapping
        this.instance.toneMappingExposure = 1.15
        this.instance.shadowMap.enabled = true
        this.instance.shadowMap.autoUpdate = true
        this.instance.shadowMap.type = THREE.PCFSoftShadowMap
        if ('useLegacyLights' in this.instance) {
            this.instance.useLegacyLights = false
        } else if ('physicallyCorrectLights' in this.instance) {
            this.instance.physicallyCorrectLights = true
        }
        this.instance.setClearColor('#f6ede1', 1)
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 1.8))
    }

    resize() {
        this.instance.setSize(this.sizes.width, this.sizes.height)
        this.instance.setPixelRatio(Math.min(this.sizes.pixelRatio, 1.8))
    }

    update() {
        this.instance.render(this.scene, this.camera.instance)
    }
}