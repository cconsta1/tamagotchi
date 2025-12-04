import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import Experience from '../Experience.js'
import EventEmitter from '../Utils/EventEmitter.js'

export default class Box extends EventEmitter {
    constructor() {
        super()
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.ui = window.tamagotchiUI
        this.palette = ['#ffb3b3', '#ffd6a5', '#caffbf', '#9bf6ff', '#bdb2ff']

        // Load the model
        this.loadModel()
    }

    loadModel() {
        const loader = new GLTFLoader()
        loader.load('models/GiftBox/gift_loot_box_thing_wip.glb', (gltf) => {
            this.model = gltf.scene
            this.model.scale.set(0.5, 0.5, 0.5)
            this.applyModernPalette(this.model)
            this.scene.add(this.model)

            // Rename the animation
            gltf.animations.forEach((clip) => {
                if (clip.name === 'Take 001') {
                    clip.name = 'Hatch'
                }
            })

            // Log available animations
            console.log('Available animations for Box:', gltf.animations.map(anim => anim.name))

            // Store animations
            this.animations = gltf.animations 
            this.mixer = new THREE.AnimationMixer(this.model)

            // Add a button to trigger the animation after 10 seconds
            this.hatchButton = this.experience.gui.add({ triggerAnimation: () => this.triggerAnimation() }, 'triggerAnimation').name('Hatch')
        }, undefined, (e) => {
            console.error(e)
        })

        // Load the hatch sound
        this.hatchSound = new Audio('sounds/pop.wav')
    }

    playHatchSound() {
        if (this.hatchSound) {
            this.hatchSound.play()
        }
    }

    onAnimationFinished() {
        // Remove the box from the scene
        if (this.model) {
            this.scene.remove(this.model)
            this.model.traverse((child) => {
                if (child.geometry) child.geometry.dispose()
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((material) => material.dispose())
                    } else {
                        child.material.dispose()
                    }
                }
            })
            this.model = null
        }

        // Remove the hatch button from the GUI
        if (this.hatchButton) {
            this.hatchButton.destroy()
            this.hatchButton = null
        }

        this.ui?.showHatchingOverlay?.(false)
        this.ui?.setStatusMessage?.('Your buddy just hatched! Give them something to do')

        // Emit an event to notify that the box animation is finished
        this.trigger('boxHatched')
    }

    triggerAnimation() {
        if (this.hatchButton) {
            this.hatchButton.disable() // Disable the button to prevent multiple triggers
        }
        this.ui?.showHatchingOverlay?.(true)
        this.ui?.setStatusMessage?.('Egg wobbling… almost ready!')
        setTimeout(() => {
            this.playAnimation('Hatch')
        }, 10000) // Hatch after 10 seconds
    }

    applyModernPalette(object3d) {
        if (!object3d) return
        let index = 0
        object3d.traverse((child) => {
            if (!child.isMesh || !child.material) return
            const tintMaterial = (material) => {
                if (!material) return material
                const cloned = material.clone()
                const swatch = new THREE.Color(this.palette[index % this.palette.length])
                if (cloned.color) {
                    cloned.color.lerp(swatch, 0.8)
                } else {
                    cloned.color = swatch
                }
                cloned.metalness = Math.min(0.3, (cloned.metalness ?? 0.1) + 0.15)
                const roughBase = cloned.roughness ?? 0.55
                cloned.roughness = THREE.MathUtils.clamp(roughBase, 0.35, 0.7)
                cloned.emissive = swatch.clone().multiplyScalar(0.12)
                cloned.emissiveIntensity = 0.22
                index += 1
                return cloned
            }

            if (Array.isArray(child.material)) {
                child.material = child.material.map((mat) => tintMaterial(mat))
            } else {
                child.material = tintMaterial(child.material)
            }
        })
    }

    playAnimation(name) {
        const clip = THREE.AnimationClip.findByName(this.animations, name)
        if (clip) {
            const action = this.mixer.clipAction(clip)
            action.reset().play()
            action.clampWhenFinished = true
            action.loop = THREE.LoopOnce

            // Play the hatch sound a bit earlier to synchronize with the animation
            setTimeout(() => {
                this.playHatchSound()
            }, 500) // Adjust the timing as needed

            // Listen for the finished event
            this.mixer.addEventListener('finished', () => {
                this.onAnimationFinished()
            })
        } else {
            console.warn(`Animation ${name} not found`)
        }
    }

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime)
        }
    }
}