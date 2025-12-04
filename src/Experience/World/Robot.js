import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Experience from '../Experience.js'
// import TamagotchiControllerDebug from './TamagotchiController.debug.js'
import TamagotchiController from './TamagotchiController.js'

export default class Robot {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.tamagotchiController = null
        this.palette = ['#ffb4a2', '#ffc6a5', '#ffd97d', '#9adbc5', '#a5b4ff', '#ffcad4']
    }

    loadModel() {
        const loader = new GLTFLoader()
        loader.load('models/RobotExpressive/RobotExpressive.glb', (gltf) => {
            this.model = gltf.scene
            this.model.animations = gltf.animations
            console.log("Robot animations:", gltf.animations)
            this.applyModernPalette(this.model)
            this.scene.add(this.model) // Ensure the model is added to the scene

            // Initialize the TamagotchiControllerDebug
            // this.tamagotchiController = new TamagotchiControllerDebug(this)
            this.tamagotchiController = new TamagotchiController(this)
            window.tamagotchiUI?.setStatusMessage?.('Hi! I\'m awake and ready to play.')
            window.tamagotchiUI?.logEvent?.('Your robot friend just said hello')
        }, undefined, (e) => {
            console.error(e)
        })
    }

    applyModernPalette(object3d) {
        if (!object3d) return
        let index = 0
        object3d.traverse((child) => {
            if (!child.isMesh || !child.material) return
            const assignColor = (material) => {
                if (!material) return material
                const cloned = material.clone()
                const swatch = new THREE.Color(this.palette[index % this.palette.length])
                if (cloned.color) {
                    cloned.color.lerp(swatch, 0.85)
                } else {
                    cloned.color = swatch
                }
                cloned.metalness = Math.min(0.45, (cloned.metalness ?? 0.15) + 0.2)
                const roughBase = cloned.roughness ?? 0.55
                cloned.roughness = THREE.MathUtils.clamp(roughBase + 0.05, 0.35, 0.65)
                cloned.emissive = swatch.clone().multiplyScalar(0.15)
                cloned.emissiveIntensity = 0.25
                cloned.clearcoat = 0.25
                cloned.clearcoatRoughness = 0.8
                index += 1
                return cloned
            }

            if (Array.isArray(child.material)) {
                child.material = child.material.map((mat) => assignColor(mat))
            } else {
                child.material = assignColor(child.material)
            }
        })
    }

    update(deltaTime) {
        if (this.tamagotchiController) {
            this.tamagotchiController.update(deltaTime)
        }
    }
}