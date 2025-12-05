import * as THREE from 'three'

export default class TamagotchiController {
    constructor({ robot, experience }) {
        this.robot = robot
        this.experience = experience ?? robot.experience
        this.scene = this.experience.scene

        this.batteryLevel = 100
        this.batteryDrainRate = 100 / 300 // Drains in ~5 minutes
        this.isAlive = true
        this.currentMode = 'feed'
        this.wasteObjects = []
        this.ui = window.tamagotchiUI
        this.lowPowerNotified = false

        this.mixer = new THREE.AnimationMixer(this.robot.model)
        this.actions = {}
        this.activeAction = null
        this.previousAction = null

        this.wasteGeometry = new THREE.IcosahedronGeometry(0.35, 0)
        this.wasteMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#b89682'),
            roughness: 0.68,
            metalness: 0.08,
            flatShading: true
        })

        this.initAnimations()
        this.logMorphTargets()
        this.startWasteCreation()

        this.syncUI({ withMode: true })
    }

    initAnimations() {
        const animations = this.robot.model.animations

        for (const clip of animations) {
            const action = this.mixer.clipAction(clip)
            this.actions[clip.name] = action

            if (['Death', 'Dance', 'ThumbsUp', 'Jump'].includes(clip.name)) {
                action.loop = THREE.LoopOnce
                action.clampWhenFinished = true
            }
        }

        this.fadeToAction('Walking', 0.4)
    }

    fadeToAction(clipName, duration) {
        if (!this.isAlive && clipName !== 'Death') {
            return
        }

        this.previousAction = this.activeAction
        this.activeAction = this.actions[clipName]

        // Fade out of the old action
        if (this.previousAction && this.previousAction !== this.activeAction) {
            this.previousAction.fadeOut(duration)
        }

        // Fade into the new action
        this.activeAction
            .reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(duration)
            .play()
    }

    setMode(mode) {
        this.currentMode = mode
        this.syncUI({ withMode: true })
    }

    performAction() {
        if (!this.isAlive) return

        switch (this.currentMode) {
            case 'feed':
                this.feedBattery()
                this.playJumpAnimation()
                this.ui?.setStatusMessage?.('Battery topped up!')
                break
            case 'play':
                this.playDanceAnimation()
                this.ui?.setStatusMessage?.('Playtime! Mini dance unlocked')
                break
            case 'clean':
                this.cleanWaste()
                this.playThumbsUpAnimation()
                this.ui?.setStatusMessage?.('All tidy again')
                break
        }
    }


    playJumpAnimation() {
        this.fadeToAction('Jump', 0.5)
        const listener = () => {
            this.mixer.removeEventListener('finished', listener)
            this.restoreWalking()
        }
        this.mixer.addEventListener('finished', listener)
    }

    playDanceAnimation() {
        this.fadeToAction('Dance', 0.5)
        const listener = () => {
            this.mixer.removeEventListener('finished', listener)
            this.restoreWalking()
        }
        this.mixer.addEventListener('finished', listener)
    }

    playThumbsUpAnimation() {
        this.fadeToAction('ThumbsUp', 0.5)
        const listener = () => {
            this.mixer.removeEventListener('finished', listener)
            this.restoreWalking()
        }
        this.mixer.addEventListener('finished', listener)
    }

    feedBattery() {
        if (this.isAlive) {
            this.batteryLevel = 100
            this.updateExpression()
            this.syncUI()
        }
    }

    restoreWalking() {
        if (this.isAlive) {
            this.fadeToAction('Walking', 0.4)
        }
    }

    update(deltaTime) {
        if (this.isAlive) {
            this.batteryLevel -= this.batteryDrainRate * deltaTime
            this.syncUI()
            this.updateExpression()
            this.updateLightIntensity()
            if (this.batteryLevel <= 0) {
                this.batteryLevel = 0
                this.die()
            }
        }

        if (this.mixer) {
            this.mixer.update(deltaTime)
        }
    }

    updateLightIntensity() {
        const intensity = this.batteryLevel / 100
        this.experience.world?.lights?.updateLightIntensity(intensity)
    }

    logMorphTargets() {
        const face = this.robot.model.getObjectByName('Head_4')
        if (face && face.morphTargetDictionary) {
            console.log('Available morph targets:', face.morphTargetDictionary)
        } else {
            console.warn('No morph targets found for the face.')
        }
    }

    updateExpression() {
        const face = this.robot.model.getObjectByName('Head_4')
        if (face && face.morphTargetDictionary) {
            const sadIndex = face.morphTargetDictionary['Sad']

            if (sadIndex !== undefined) {
                const sadness = 1 - (this.batteryLevel / 100)
                face.morphTargetInfluences[sadIndex] = sadness
            }
        }

        if (this.batteryLevel <= 30 && this.isAlive && !this.lowPowerNotified) {
            this.lowPowerNotified = true
            this.ui?.setStatusMessage?.('Battery getting low – snack time?')
        } else if (this.batteryLevel > 35 && this.lowPowerNotified) {
            this.lowPowerNotified = false
        }
    }

    die() {
        this.isAlive = false
        this.lowPowerNotified = false
        this.fadeToAction('Death', 0.5)
        this.ui?.setStatusMessage?.('Oh no! Your buddy powered down. Reset to revive')
        this.ui?.enableReset?.(true)
    }

    reset() {
        this.clearWasteCreation()
        this.clearWasteObjects()

        this.batteryLevel = 100
        this.isAlive = true
        this.currentMode = 'feed'
        this.lowPowerNotified = false
        this.updateExpression()
        this.updateLightIntensity()
        this.fadeToAction('Walking', 0.4)
        this.syncUI({ withMode: true })

        this.ui?.enableReset?.(false)
        this.ui?.setStatusMessage?.('All better! Choose a mode to keep playing')

        this.startWasteCreation()
    }

    syncUI(options = {}) {
        const { withMode = false } = options
        this.ui?.updateBattery?.(this.batteryLevel)
        if (withMode) {
            this.ui?.onModeChange?.(this.currentMode)
        }
    }

    // Waste management methods

    //  Clears any running waste creation interval safely
    clearWasteCreation() {
        if (this.wasteCreationInterval) {
            clearInterval(this.wasteCreationInterval)
            this.wasteCreationInterval = null
        }
    }

    //  Starts the waste creation process with clear debug logs
    startWasteCreation() {
        this.clearWasteCreation()
        this.wasteCreationInterval = setInterval(() => {
            if (this.isAlive) {
                this.createWaste();
            }
        }, 15000)
    }

    // Creates a waste object with checks for overlaps and duplicates
    createWaste() {
        if (!this.robot.model) {
            return
        }

        const wasteMaterial = this.wasteMaterial.clone()
        const baseHSL = { h: 0, s: 0, l: 0 }
        wasteMaterial.color.getHSL(baseHSL)
        const hOffset = (Math.random() - 0.5) * 0.06
        const sOffset = (Math.random() - 0.5) * 0.1
        const lOffset = (Math.random() - 0.5) * 0.08
        wasteMaterial.color.setHSL(
            THREE.MathUtils.clamp(baseHSL.h + hOffset, 0, 1),
            THREE.MathUtils.clamp(baseHSL.s + sOffset, 0, 1),
            THREE.MathUtils.clamp(baseHSL.l + lOffset, 0, 1)
        )
        const waste = new THREE.Mesh(this.wasteGeometry, wasteMaterial)
        waste.castShadow = true
        waste.receiveShadow = true

        const robotPosition = this.robot.model.position
        const robotDirection = new THREE.Vector3()
        this.robot.model.getWorldDirection(robotDirection)

        let position
        let overlap
        let attemptCount = 0

        do {
            attemptCount += 1
            const offsetX = (Math.random() - 0.5) * 2
            const offsetZ = (Math.random() - 0.5) * 2

            position = new THREE.Vector3(
                robotPosition.x - robotDirection.x * 2 + offsetX,
                0.25,
                robotPosition.z - robotDirection.z * 2 + offsetZ
            )

            overlap = this.wasteObjects.some((wasteObj) => wasteObj.position.distanceTo(position) < 0.8)
        } while (overlap && attemptCount < 8)

        if (overlap) {
            return
        }

        waste.position.copy(position)
        waste.rotation.y = Math.random() * Math.PI * 2
        this.scene.add(waste)
        this.wasteObjects.push(waste)
    }

    // Clears all waste objects from the scene with logging
    clearWasteObjects() {
        if (this.wasteObjects.length > 0) {
            this.wasteObjects.forEach((waste) => {
                this.scene.remove(waste)
                if (waste.material && typeof waste.material.dispose === 'function') {
                    waste.material.dispose()
                }
            })
            this.wasteObjects = []
        }
    }

    // Cleans all waste from the scene with logs
    cleanWaste() {
        if (this.wasteObjects.length > 0) {
            this.wasteObjects.forEach((waste) => {
                this.scene.remove(waste)
                if (waste.material && typeof waste.material.dispose === 'function') {
                    waste.material.dispose()
                }
            })
            this.wasteObjects = []
        }
    }
}