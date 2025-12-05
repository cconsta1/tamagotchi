import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import TamagotchiController from './TamagotchiController.js'

export default class Robot {
    constructor({ world }) {
        this.world = world
        this.experience = world.experience
        this.scene = this.experience.scene
        this.loader = new GLTFLoader()

        this.tamagotchiController = null
        this.palette = ['#dfe2e8', '#7fc7c2', '#ff9a88', '#ffe7ac', '#b0c5dd', '#f4f1eb']
        this.loading = false
    }

    hasSpawned() {
        return Boolean(this.model)
    }

    loadModel() {
        if (this.loading || this.model) {
            return
        }

        this.loading = true
        this.loader.load(
            'models/RobotExpressive/RobotExpressive.glb',
            (gltf) => {
                this.loading = false
                if (this.model) return

                this.model = gltf.scene
                this.model.animations = gltf.animations
                this.model.scale.set(1.05, 1.05, 1.05)
                this.model.position.set(0, -0.05, 0)

                this.applyModernPalette(this.model)
                this.model.traverse((child) => {
                    if (!child.isMesh) return
                    child.castShadow = true
                    child.receiveShadow = true
                    if (child.material) {
                        child.material.flatShading = true
                    }
                })

                this.scene.add(this.model)

                this.tamagotchiController = new TamagotchiController({ robot: this, experience: this.experience })
                window.tamagotchiUI?.setStatusMessage?.("Hi! I'm awake and ready to play.")
                window.tamagotchiUI?.logEvent?.('Your robot friend just said hello')
            },
            undefined,
            (error) => {
                this.loading = false
                console.error('Failed to load robot model', error)
            }
        )
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
                    cloned.color.lerp(swatch, 0.7)
                } else {
                    cloned.color = swatch
                }
                cloned.metalness = Math.min(0.32, (cloned.metalness ?? 0.08) + 0.12)
                const roughBase = cloned.roughness ?? 0.58
                cloned.roughness = THREE.MathUtils.clamp(roughBase, 0.45, 0.68)
                cloned.emissive = swatch.clone().multiplyScalar(0.1)
                cloned.emissiveIntensity = 0.2
                cloned.flatShading = true
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
        this.tamagotchiController?.update(deltaTime)
    }
}