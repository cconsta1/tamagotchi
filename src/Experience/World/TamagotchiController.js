import * as THREE from 'three'
import Experience from '../Experience.js'

export default class TamagotchiController {
    constructor(robot) {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.robot = robot

        this.batteryLevel = 100
        this.batteryDrainRate = 100 / 300 // Drains in 5 minutes
        this.isAlive = true
        this.currentMode = 'feed'
        this.wasteObjects = []
        this.ui = window.tamagotchiUI
        this.lowPowerNotified = false

        this.mixer = new THREE.AnimationMixer(this.robot.model)
        this.actions = {}
        this.activeAction = null
        this.previousAction = null

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

        this.fadeToAction('Walking', 0.5)
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
            this.fadeToAction('Walking', 0.5)
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
        this.experience.world.lights.updateLightIntensity(intensity)
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
        console.log('The robot has died.')
        this.fadeToAction('Death', 0.5)
        this.ui?.setStatusMessage?.('Oh no! Your buddy powered down. Reset to revive')
        this.ui?.enableReset?.(true)
    }

    reset() {
        console.log('[Reset] Resetting the Tamagotchi...');

        this.clearWasteCreation();      // Stop waste generation during reset
        this.clearWasteObjects();       // Clean all waste objects safely

        this.batteryLevel = 100;
        this.isAlive = true;
        this.currentMode = 'feed';
        this.lowPowerNotified = false;
        this.updateExpression();
        this.updateLightIntensity();
        this.fadeToAction('Walking', 0.5);
        this.syncUI({ withMode: true });

        this.ui?.enableReset?.(false)
        this.ui?.setStatusMessage?.('All better! Choose a mode to keep playing')

        // Restart waste creation with fresh interval
        this.startWasteCreation();

        console.log('[Reset] Tamagotchi fully reset.');
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
            console.log('[Waste] Clearing existing waste creation interval.');
            clearInterval(this.wasteCreationInterval);
            this.wasteCreationInterval = null;
        }
    }

    //  Starts the waste creation process with clear debug logs
    startWasteCreation() {
        this.clearWasteCreation(); // Prevent duplicate intervals

        console.log('[Waste] Starting waste creation process.');
        this.wasteCreationInterval = setInterval(() => {
            if (this.isAlive) {
                console.log('[Waste] Attempting to create waste...');
                this.createWaste();
            }
        }, 15000); // Create waste every 15 seconds
    }

    // Creates a waste object with checks for overlaps and duplicates
    createWaste() {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const waste = new THREE.Mesh(geometry, material);

        const robotPosition = this.robot.model.position;
        const robotDirection = new THREE.Vector3();
        this.robot.model.getWorldDirection(robotDirection);

        let position, overlap;
        let attemptCount = 0;

        do {
            attemptCount++;
            const offsetX = (Math.random() - 0.5) * 2;
            const offsetZ = (Math.random() - 0.5) * 2;

            position = new THREE.Vector3(
                robotPosition.x - robotDirection.x * 2 + offsetX,
                0.25,
                robotPosition.z - robotDirection.z * 2 + offsetZ
            );

            overlap = this.wasteObjects.some(wasteObj => wasteObj.position.distanceTo(position) < 1);
        } while (overlap && attemptCount < 10); // Limit attempts to prevent infinite loops

        if (overlap) {
            console.warn('[Waste] Failed to place waste: too many overlaps.');
            return;
        }

        waste.position.copy(position);
        this.scene.add(waste);
        this.wasteObjects.push(waste);

        console.log(`[Waste] Created at (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}). Total waste: ${this.wasteObjects.length}`);
    }

    // Clears all waste objects from the scene with logging
    clearWasteObjects() {
        if (this.wasteObjects.length > 0) {
            console.log(`[Waste] Removing ${this.wasteObjects.length} waste objects.`);
            this.wasteObjects.forEach(waste => {
                this.scene.remove(waste);
            });
            this.wasteObjects = [];
        } else {
            console.log('[Waste] No waste objects to remove.');
        }
    }

    // Cleans all waste from the scene with logs
    cleanWaste() {
        if (this.wasteObjects.length > 0) {
            console.log(`[Waste] Cleaning up ${this.wasteObjects.length} waste objects...`);
            this.wasteObjects.forEach(waste => {
                this.scene.remove(waste);
            });
            this.wasteObjects = [];
            console.log('[Waste] All waste objects removed.');
        } else {
            console.log('[Waste] No waste to clean.');
        }
    }
}