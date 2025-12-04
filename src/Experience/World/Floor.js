import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Floor {
    constructor() {
        this.experience = new Experience()
        this.scene = this.experience.scene

        this.setGround()
        this.setPlinth()
    }

    setGround() {
        const texture = this.createTatamiTexture()

        const base = new THREE.Mesh(
            new THREE.CircleGeometry(120, 96),
            new THREE.MeshStandardMaterial({
                color: new THREE.Color('#f7eee4'),
                map: texture,
                metalness: 0.05,
                roughness: 0.9,
                transparent: true,
                opacity: 0.98
            })
        )
        base.rotation.x = -Math.PI / 2
        base.receiveShadow = true
        this.scene.add(base)

        const stitching = new THREE.Mesh(
            new THREE.RingGeometry(18, 19, 96),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color('#f4d5bf'),
                transparent: true,
                opacity: 0.6
            })
        )
        stitching.rotation.x = -Math.PI / 2
        stitching.position.y = 0.01
        this.scene.add(stitching)
    }

    setPlinth() {
        const plinthMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#fff2e2'),
            roughness: 0.45,
            metalness: 0.02
        })

        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(10, 10.8, 0.3, 80), plinthMaterial)
        plinth.position.y = -0.15
        plinth.receiveShadow = true
        plinth.castShadow = false
        this.scene.add(plinth)

        const inset = new THREE.Mesh(
            new THREE.CylinderGeometry(8.5, 8.5, 0.08, 80),
            new THREE.MeshStandardMaterial({
                color: new THREE.Color('#ffd9c8'),
                roughness: 0.4,
                metalness: 0.05
            })
        )
        inset.position.y = -0.02
        this.scene.add(inset)

        const accentRing = new THREE.Mesh(
            new THREE.RingGeometry(8.7, 9.5, 80),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color('#ffa7b6'),
                transparent: true,
                opacity: 0.35
            })
        )
        accentRing.rotation.x = -Math.PI / 2
        accentRing.position.y = 0.001
        this.scene.add(accentRing)
    }

    createTatamiTexture() {
        const size = 1024
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = '#fff9f2'
        ctx.fillRect(0, 0, size, size)

        ctx.strokeStyle = 'rgba(188, 164, 132, 0.15)'
        ctx.lineWidth = 12
        for (let i = 0; i <= size; i += size / 8) {
            ctx.beginPath()
            ctx.moveTo(0, i)
            ctx.lineTo(size, i)
            ctx.stroke()
        }

        ctx.fillStyle = 'rgba(231, 205, 174, 0.12)'
        const cell = size / 16
        for (let x = 0; x < size; x += cell) {
            for (let y = 0; y < size; y += cell) {
                if (((x / cell) + (y / cell)) % 2 === 0) {
                    ctx.fillRect(x, y, cell, cell)
                }
            }
        }

        const texture = new THREE.CanvasTexture(canvas)
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        texture.needsUpdate = true
        return texture
    }
}
