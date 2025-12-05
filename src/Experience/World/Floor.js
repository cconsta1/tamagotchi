import * as THREE from 'three'

export default class Floor {
    constructor({ experience }) {
        this.experience = experience
        this.scene = experience.scene

        this.setGround()
        this.setPlinth()
    }

    setGround() {
        const texture = this.createTatamiTexture()

        const base = new THREE.Mesh(
            new THREE.CircleGeometry(120, 48),
            new THREE.MeshStandardMaterial({
                color: new THREE.Color('#fbead8'),
                map: texture,
                metalness: 0.025,
                roughness: 0.9,
                flatShading: true,
                transparent: true,
                opacity: 0.98
            })
        )
        base.rotation.x = -Math.PI / 2
        base.receiveShadow = true
        this.scene.add(base)

        const stitching = new THREE.Mesh(
            new THREE.RingGeometry(18, 19, 36),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color('#e6c1ab'),
                transparent: true,
                opacity: 0.42
            })
        )
        stitching.rotation.x = -Math.PI / 2
        stitching.position.y = 0.01
        this.scene.add(stitching)
    }

    setPlinth() {
        const plinthMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color('#f3d9c2'),
            roughness: 0.48,
            metalness: 0.02,
            flatShading: true
        })

        const plinth = new THREE.Mesh(new THREE.CylinderGeometry(9.6, 11, 0.4, 36), plinthMaterial)
        plinth.position.y = -0.18
        plinth.receiveShadow = true
        this.scene.add(plinth)

        const inset = new THREE.Mesh(
            new THREE.CylinderGeometry(8.1, 8.3, 0.12, 32),
            new THREE.MeshStandardMaterial({
                color: new THREE.Color('#e9c6b6'),
                roughness: 0.42,
                metalness: 0.06,
                flatShading: true
            })
        )
        inset.position.y = -0.05
        inset.receiveShadow = true
        this.scene.add(inset)

        const accentRing = new THREE.Mesh(
            new THREE.RingGeometry(8.6, 9.2, 40),
            new THREE.MeshBasicMaterial({
                color: new THREE.Color('#d29cb5'),
                transparent: true,
                opacity: 0.32
            })
        )
        accentRing.rotation.x = -Math.PI / 2
        accentRing.position.y = 0.002
        this.scene.add(accentRing)
    }

    createTatamiTexture() {
        const size = 1024
        const canvas = document.createElement('canvas')
        canvas.width = canvas.height = size
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = '#fff3e8'
        ctx.fillRect(0, 0, size, size)

        ctx.strokeStyle = 'rgba(204, 165, 131, 0.12)'
        ctx.lineWidth = 10
        for (let i = 0; i <= size; i += size / 8) {
            ctx.beginPath()
            ctx.moveTo(0, i)
            ctx.lineTo(size, i)
            ctx.stroke()
        }

        ctx.fillStyle = 'rgba(228, 192, 157, 0.1)'
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
        texture.anisotropy = 4
        if ('colorSpace' in texture) {
            texture.colorSpace = THREE.SRGBColorSpace
        }
        texture.needsUpdate = true
        return texture
    }
}
