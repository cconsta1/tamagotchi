import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Lights {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene
        this.setLights()
    }

    setLights() {
        this.hemiLight = new THREE.HemisphereLight(0xfff5e4, 0xf4d9c2, 0.9)
        this.hemiLight.position.set(0, 30, 0)
        this.scene.add(this.hemiLight)

        this.dirLight = new THREE.DirectionalLight(0xffe4c7, 0.85)
        this.dirLight.position.set(-4, 10, 6)
        this.dirLight.castShadow = true
        this.dirLight.shadow.camera.top = 10
        this.dirLight.shadow.camera.bottom = -10
        this.dirLight.shadow.camera.left = -10
        this.dirLight.shadow.camera.right = 10
        this.scene.add(this.dirLight)

        this.fillLight = new THREE.RectAreaLight(0xf9d7d5, 2, 10, 6)
        this.fillLight.position.set(5, 6, -4)
        this.fillLight.lookAt(0, 2, 0)
        this.scene.add(this.fillLight)

        this.backLight = new THREE.PointLight(0xcbded6, 0.6, 25)
        this.backLight.position.set(3, 6, -8)
        this.scene.add(this.backLight)
    }

    updateLightIntensity(intensity) {
        const safeIntensity = Math.max(intensity, 0.2) // Do not go to total darkness
        this.hemiLight.intensity = safeIntensity
        this.dirLight.intensity = safeIntensity
        this.fillLight.intensity = safeIntensity * 1.4
        this.backLight.intensity = safeIntensity * 0.7
    }
}