import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import EventEmitter from '../Utils/EventEmitter.js'

export default class Box extends EventEmitter {
    constructor({ world }) {
        super()

        this.world = world
        this.experience = world.experience
        this.scene = this.experience.scene
        this.ui = window.tamagotchiUI

        this.loader = new GLTFLoader()
        this.palette = ['#f9b4a5', '#ffcfd8', '#fbe4cf', '#8cd3c4', '#c9b5ff']
        this.hatchDelay = 8000
        this.state = {
            isHatching: false,
            hasHatched: false
        }

        this.handleAnimationFinished = this.onAnimationFinished.bind(this)

        this.loadModel()
        this.hatchSound = new Audio('sounds/pop.wav')
    }

    loadModel() {
        this.loader.load(
            'models/GiftBox/gift_loot_box_thing_wip.glb',
            (gltf) => {
                this.model = gltf.scene
                this.model.scale.set(0.52, 0.52, 0.52)
                this.model.position.set(0, 0, 0)
                this.applyModernPalette(this.model)
                this.model.traverse((child) => {
                    if (!child.isMesh) return
                    child.castShadow = true
                    child.receiveShadow = true
                })
                this.scene.add(this.model)

                gltf.animations.forEach((clip) => {
                    if (clip.name === 'Take 001') {
                        clip.name = 'Hatch'
                    }
                })

                this.animations = gltf.animations
                this.mixer = new THREE.AnimationMixer(this.model)

                if (this.experience.gui) {
                    this.debugFolder = this.experience.gui.addFolder('Gift Box')
                    this.hatchButton = this.debugFolder
                        .add({ hatch: () => this.triggerAnimation() }, 'hatch')
                        .name('Hatch')
                }
            },
            undefined,
            (error) => {
                console.error('Failed to load gift box model', error)
            }
        )
    }

    canTrigger() {
        return Boolean(this.model && this.animations && this.mixer) && !this.state.isHatching && !this.state.hasHatched
    }

    triggerAnimation() {
        if (!this.canTrigger()) {
            return false
        }

        this.state.isHatching = true
        this.ui?.showHatchingOverlay?.(true)
        this.ui?.setStatusMessage?.('Egg wobbling… almost ready!')
        this.ui?.logEvent?.('Incubation sequence started')
        this.trigger('boxHatching')

        if (this.hatchButton && this.hatchButton.disable) {
            this.hatchButton.disable()
        }

        if (this.hatchTimer) {
            clearTimeout(this.hatchTimer)
        }

        this.hatchTimer = window.setTimeout(() => {
            const started = this.playAnimation('Hatch')
            if (!started) {
                this.state.isHatching = false
                this.ui?.showHatchingOverlay?.(false)
            }
        }, this.hatchDelay)

        return true
    }

    playAnimation(name) {
        if (!this.animations || !this.mixer) {
            return false
        }

        const clip = THREE.AnimationClip.findByName(this.animations, name)
        if (!clip) {
            console.warn(`Animation ${name} not found`)
            return false
        }

        this.mixer.stopAllAction()
        const action = this.mixer.clipAction(clip)
        action.reset()
        action.loop = THREE.LoopOnce
        action.clampWhenFinished = true
        action.play()

        if (this.hatchSoundTimer) {
            clearTimeout(this.hatchSoundTimer)
        }
        this.hatchSoundTimer = window.setTimeout(() => {
            this.playHatchSound()
        }, 420)

        this.mixer.removeEventListener('finished', this.handleAnimationFinished)
        this.mixer.addEventListener('finished', this.handleAnimationFinished)
        return true
    }

    playHatchSound() {
        if (!this.hatchSound) return
        this.hatchSound.currentTime = 0
        this.hatchSound.play().catch(() => {})
    }

    onAnimationFinished() {
        this.mixer.removeEventListener('finished', this.handleAnimationFinished)
        this.state.isHatching = false
        this.state.hasHatched = true

        if (this.hatchTimer) {
            clearTimeout(this.hatchTimer)
            this.hatchTimer = null
        }

        if (this.hatchSoundTimer) {
            clearTimeout(this.hatchSoundTimer)
            this.hatchSoundTimer = null
        }

        this.disposeModel()

        if (this.hatchButton && typeof this.hatchButton.destroy === 'function') {
            this.hatchButton.destroy()
            this.hatchButton = null
        }

        if (this.debugFolder && typeof this.debugFolder.destroy === 'function') {
            this.debugFolder.destroy()
            this.debugFolder = null
        }

        this.ui?.showHatchingOverlay?.(false)
        this.ui?.setStatusMessage?.('Your buddy just hatched! Give them something to do')

        this.trigger('boxHatched')
    }

    disposeModel() {
        if (!this.model) return
        this.scene.remove(this.model)
        this.model.traverse((child) => {
            if (!child.isMesh) return
            if (child.geometry && typeof child.geometry.dispose === 'function') {
                child.geometry.dispose()
            }
            if (Array.isArray(child.material)) {
                child.material.forEach((material) => {
                    if (material && typeof material.dispose === 'function') {
                        material.dispose()
                    }
                })
            } else {
                if (child.material && typeof child.material.dispose === 'function') {
                    child.material.dispose()
                }
            }
        })
        this.model = null
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
                    cloned.color.lerp(swatch, 0.85)
                } else {
                    cloned.color = swatch
                }
                cloned.metalness = Math.min(0.28, (cloned.metalness ?? 0.1) + 0.12)
                const roughBase = cloned.roughness ?? 0.58
                cloned.roughness = THREE.MathUtils.clamp(roughBase + 0.08, 0.4, 0.75)
                cloned.emissive = swatch.clone().multiplyScalar(0.08)
                cloned.emissiveIntensity = 0.2
                cloned.flatShading = true
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

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime)
        }
    }
}