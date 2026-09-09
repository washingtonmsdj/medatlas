import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import {
  organDetailModelUrl,
  type OrganDetailDefinition,
} from '../anatomy-detail/catalog'
import type { AtlasSceneAppearance } from './HumanAtlasExplorerScene'

interface Props {
  organ: OrganDetailDefinition
  appearance?: AtlasSceneAppearance
  rotate?: boolean
  section?: boolean
  reset?: number
  onReady?: (label: string) => void
  onError?: (message: string) => void
}

export function OrganDetailScene({
  organ,
  appearance = 'clinical',
  rotate = false,
  section = false,
  reset = 0,
  onReady,
  onError,
}: Props) {
  const host = useRef<HTMLDivElement>(null)
  const latestRotate = useRef(rotate)
  const latestSection = useRef(section)
  const latestReset = useRef(reset)
  const ready = useRef(onReady)
  const failed = useRef(onError)

  latestRotate.current = rotate
  latestSection.current = section
  latestReset.current = reset
  ready.current = onReady
  failed.current = onError

  useEffect(() => {
    const element = host.current
    if (!element) return

    let disposed = false
    let frame = 0
    let dirty = true
    let viewportVisible = true
    let pageVisible = !document.hidden
    let lastRotate = latestRotate.current
    let lastSection = latestSection.current
    let lastReset = latestReset.current
    let model: THREE.Group | null = null
    let modelScale = 1

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      })
    } catch {
      failed.current?.(
        'Este navegador não conseguiu iniciar o detalhe anatômico 3D.',
      )
      return
    }

    const patient = appearance === 'patient'
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2),
    )
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = patient ? 1.08 : 1.16
    renderer.setClearColor(patient ? '#f1f5f8' : '#071522')
    renderer.localClippingEnabled = true
    renderer.domElement.tabIndex = 0
    renderer.domElement.setAttribute(
      'aria-label',
      `Modelo 3D detalhado de ${organ.label}. Arraste para girar e use a rolagem para aproximar.`,
    )
    element.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100)
    camera.position.set(0, 0.3, 6.8)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.065
    controls.enablePan = false
    controls.minDistance = 2.5
    controls.maxDistance = 12
    controls.target.set(0, 0, 0)
    controls.autoRotate = latestRotate.current
    controls.autoRotateSpeed = 0.7
    controls.addEventListener('change', () => {
      dirty = true
    })
    controls.addEventListener('start', () => {
      dirty = true
    })

    const pmrem = new THREE.PMREMGenerator(renderer)
    const room = new RoomEnvironment()
    const environment = pmrem.fromScene(room, 0.04)
    scene.environment = environment.texture
    room.dispose()
    pmrem.dispose()

    scene.add(
      new THREE.HemisphereLight(
        patient ? 0xffffff : 0xdcefff,
        patient ? 0xaab3ba : 0x07101c,
        patient ? 1.05 : 1.25,
      ),
    )

    const key = new THREE.DirectionalLight(patient ? 0xfff7ef : 0xffe8dc, 2.8)
    key.position.set(4.5, 5.6, 5.8)
    scene.add(key)

    const fill = new THREE.DirectionalLight(patient ? 0xe8f1ff : 0xbddcff, 1.8)
    fill.position.set(-4.2, 1.8, 4.5)
    scene.add(fill)

    const rim = new THREE.DirectionalLight(organ.accent, patient ? 1.0 : 1.6)
    rim.position.set(-3.5, 2.4, -4.4)
    scene.add(rim)

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.55, 1.68, 0.16, 72),
      new THREE.MeshStandardMaterial({
        color: patient ? 0xe5eaed : 0x102b49,
        roughness: 0.74,
        metalness: patient ? 0.04 : 0.18,
      }),
    )
    plinth.position.y = -1.78
    scene.add(plinth)

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.38, 1.39, 96),
      new THREE.MeshBasicMaterial({
        color: organ.accent,
        transparent: true,
        opacity: patient ? 0.22 : 0.42,
        side: THREE.DoubleSide,
      }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = -1.69
    scene.add(ring)

    const sectionPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)

    const applySection = (enabled: boolean) => {
      if (!model) return
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material]
        for (const material of materials) {
          material.clippingPlanes = enabled ? [sectionPlane] : null
          material.clipShadows = false
          material.needsUpdate = true
        }
      })
      dirty = true
    }

    const frameModel = () => {
      if (!model) return
      const bounds = new THREE.Box3().setFromObject(model)
      const center = bounds.getCenter(new THREE.Vector3())
      const size = bounds.getSize(new THREE.Vector3())
      const maxDimension = Math.max(size.x, size.y, size.z, 0.001)

      model.position.sub(center)
      modelScale = 3.15 / maxDimension
      model.scale.setScalar(modelScale)
      model.updateMatrixWorld(true)

      controls.target.set(0, -0.08, 0)
      camera.position.set(0.15, 0.28, 6.35)
      controls.update()
      dirty = true
    }

    const loader = new GLTFLoader()
    loader.load(
      organDetailModelUrl(organ),
      (gltf) => {
        if (disposed) {
          gltf.scene.traverse((object) => {
            if (!(object instanceof THREE.Mesh)) return
            object.geometry.dispose()
          })
          return
        }

        model = gltf.scene
        model.name = `organ-detail-${organ.id}`
        model.rotation.set(0.04, -0.28, 0)
        scene.add(model)

        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return
          object.castShadow = false
          object.receiveShadow = false
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material]
          for (const material of materials) {
            if (material instanceof THREE.MeshStandardMaterial) {
              material.envMapIntensity = patient ? 0.85 : 1.05
              material.roughness = Math.max(material.roughness, 0.34)
            }
            material.needsUpdate = true
          }
        })

        frameModel()
        applySection(latestSection.current)
        ready.current?.(organ.label)
      },
      undefined,
      () => {
        if (disposed) return
        failed.current?.(
          `Não foi possível carregar o modelo detalhado de ${organ.label}.`,
        )
      },
    )

    const resize = () => {
      const width = Math.max(1, element.clientWidth)
      const height = Math.max(1, element.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      dirty = true
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(element)

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        viewportVisible = entry.isIntersecting
        if (viewportVisible) dirty = true
      },
      { rootMargin: '120px' },
    )
    visibilityObserver.observe(element)

    const onVisibilityChange = () => {
      pageVisible = !document.hidden
      if (pageVisible) dirty = true
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    const animate = () => {
      frame = requestAnimationFrame(animate)
      if (!viewportVisible || !pageVisible) return

      if (lastRotate !== latestRotate.current) {
        controls.autoRotate = latestRotate.current
        lastRotate = latestRotate.current
        dirty = true
      }

      if (lastSection !== latestSection.current) {
        applySection(latestSection.current)
        lastSection = latestSection.current
      }

      if (lastReset !== latestReset.current) {
        model?.rotation.set(0.04, -0.28, 0)
        if (model) model.scale.setScalar(modelScale)
        camera.position.set(0.15, 0.28, 6.35)
        controls.target.set(0, -0.08, 0)
        controls.update()
        lastReset = latestReset.current
        dirty = true
      }

      if (controls.update()) dirty = true
      if (controls.autoRotate) dirty = true
      if (!dirty) return

      renderer.render(scene, camera)
      dirty = false
    }

    resize()
    animate()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      visibilityObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibilityChange)
      controls.dispose()

      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return
        object.geometry.dispose()
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material]
        for (const material of materials) material.dispose()
      })
      environment.texture.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [appearance, organ])

  return (
    <div
      ref={host}
      className={`organ-detail-scene organ-detail-scene-${appearance}`}
      data-organ={organ.id}
    />
  )
}
