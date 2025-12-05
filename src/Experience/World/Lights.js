import * as THREE from 'three'

export default class Lights {
    constructor({ experience }) {
        this.experience = experience
        this.scene = experience.scene
        this.backgroundWarm = new THREE.Color('#fff5ea')
        this.backgroundDusk = new THREE.Color('#f7e6d4')

        this.createLights()
    }

    createLights() {
        this.ambientLight = new THREE.HemisphereLight('#ffeedd', '#f2cfa8', 0.6)
        this.ambientLight.position.set(0, 25, 0)
        this.scene.add(this.ambientLight)

        this.sunLight = new THREE.DirectionalLight('#ffd1a1', 1.8)
        this.sunLight.position.set(-7, 10, 6)
        this.sunLight.castShadow = true
        this.sunLight.shadow.mapSize.set(2048, 2048)
        this.sunLight.shadow.camera.left = -14
        this.sunLight.shadow.camera.right = 14
        this.sunLight.shadow.camera.top = 12
        this.sunLight.shadow.camera.bottom = -10
        this.sunLight.shadow.camera.near = 1
        this.sunLight.shadow.camera.far = 40
        this.sunLight.shadow.bias = -0.00025
        this.sunLight.shadow.normalBias = 0.03
        this.scene.add(this.sunLight)

        this.fillLight = new THREE.DirectionalLight('#e6f0ff', 0.7)
        this.fillLight.position.set(6, 5, -2)
        this.fillLight.castShadow = false
        this.scene.add(this.fillLight)

        this.rimLight = new THREE.PointLight('#ffd4d9', 1.1, 20, 1.4)
        this.rimLight.position.set(2.5, 4.5, -6)
        this.scene.add(this.rimLight)

        this.glowLight = new THREE.SpotLight('#ffe8d1', 0.5, 40, Math.PI / 5, 0.4)
        this.glowLight.position.set(-4, 8, 2)
        this.glowLight.target.position.set(0, 1.5, 0)
        this.scene.add(this.glowLight)
        this.scene.add(this.glowLight.target)

        this.baseIntensities = {
            ambient: this.ambientLight.intensity,
            sun: this.sunLight.intensity,
            fill: this.fillLight.intensity,
            rim: this.rimLight.intensity,
            glow: this.glowLight.intensity
        }
    }

    updateLightIntensity(intensity) {
        const safe = THREE.MathUtils.clamp(intensity, 0.35, 1)
        this.ambientLight.intensity = THREE.MathUtils.lerp(0.35, this.baseIntensities.ambient, safe)
        this.sunLight.intensity = this.baseIntensities.sun * safe
        this.fillLight.intensity = THREE.MathUtils.lerp(0.25, this.baseIntensities.fill, safe)
        this.rimLight.intensity = this.baseIntensities.rim * THREE.MathUtils.lerp(0.6, 1, safe)
        this.glowLight.intensity = this.baseIntensities.glow * THREE.MathUtils.lerp(0.7, 1, safe)

        if (this.scene.fog && this.scene.fog.isFogExp2) {
            this.scene.fog.density = THREE.MathUtils.lerp(0.022, 0.0125, safe)
        }

        if (this.scene.background && this.scene.background.isColor) {
            this.scene.background.copy(this.backgroundWarm)
            this.scene.background.lerp(this.backgroundDusk, 1 - safe)
        }
    }
}