import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default class Camera {
    constructor(experience) {
        this.experience = experience
        this.sizes = experience.sizes
        this.scene = experience.scene
        this.canvas = experience.canvas

        this.target = new THREE.Vector3(0, 2, 0)
        this.tempDirection = new THREE.Vector3()
        this.tempPosition = new THREE.Vector3()

        this.setInstance()
        this.setControls()
    }

    setInstance() {
        this.instance = new THREE.PerspectiveCamera(44, this.sizes.width / this.sizes.height, 0.1, 80)
        this.instance.position.set(-9, 5.4, 16)
        this.instance.lookAt(this.target)
        this.scene.add(this.instance)

        const initialDistance = this.instance.position.distanceTo(this.target)
        this.zoom = {
            current: initialDistance,
            target: initialDistance,
            min: 6,
            max: 18,
            lerp: 0.12
        }
    }

    setControls() {
        this.controls = new OrbitControls(this.instance, this.canvas)
        this.controls.enableDamping = true
        this.controls.dampingFactor = 0.08
        this.controls.enablePan = false
        this.controls.enableZoom = false
        this.controls.target.copy(this.target)
        this.controls.minPolarAngle = Math.PI / 4.2
        this.controls.maxPolarAngle = Math.PI / 2.1
        this.controls.minAzimuthAngle = -Math.PI / 2.3
        this.controls.maxAzimuthAngle = Math.PI / 2.3

        this.handleWheel = this.onWheel.bind(this)
        this.canvas.addEventListener('wheel', this.handleWheel, { passive: false })
    }

    onWheel(event) {
        event.preventDefault()
        const direction = event.deltaY > 0 ? 1 : -1
        const magnitude = THREE.MathUtils.clamp(Math.abs(event.deltaY) / 250, 0.08, 0.6)
        const step = (this.zoom.max - this.zoom.min) * magnitude * 0.12
        this.zoom.target = THREE.MathUtils.clamp(
            this.zoom.target + direction * step,
            this.zoom.min,
            this.zoom.max
        )
    }

    resize() {
        this.instance.aspect = this.sizes.width / this.sizes.height
        this.instance.updateProjectionMatrix()
    }

    update(deltaTime = 0.016) {
        if (this.controls) {
            this.controls.update()
        }

        if (!this.zoom) return

        const frameLerp = 1 - Math.pow(1 - this.zoom.lerp, Math.max(deltaTime * 60, 0.0001))
        this.zoom.current = THREE.MathUtils.lerp(this.zoom.current, this.zoom.target, frameLerp)

        this.tempDirection.copy(this.instance.position).sub(this.controls.target)
        if (this.tempDirection.lengthSq() < 1e-6) {
            this.tempDirection.set(0, 1, 0)
        }
        this.tempDirection.normalize()
        this.tempPosition.copy(this.controls.target).addScaledVector(this.tempDirection, this.zoom.current)
        this.instance.position.copy(this.tempPosition)
        this.instance.lookAt(this.controls.target)
    }

    destroy() {
        this.canvas.removeEventListener('wheel', this.handleWheel)
        this.controls?.dispose()
    }
}