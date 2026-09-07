import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { loadConceptGeometries } from '../atlas/model'
import { findAtlasConcept, loadHumanAtlas } from '../atlas/source'

interface Props {
  conceptId: string
  onReady?: (label: string, partCount: number) => void
  onError?: (message: string) => void
}

const SYSTEM_COLORS: Record<string, string> = {
  skeletal: '#dce8f0',
  muscular: '#d66f72',
  nervous: '#e7c95b',
  arterial: '#d95d67',
  venous: '#577fd1',
  digestive: '#d89b62',
  respiratory: '#86b9c9',
  urinary: '#b58bc7',
  reproductive: '#d58fad',
  endocrine: '#d9bd62',
  lymphatic: '#7ab78a',
  integumentary: '#aab8bc',
}

export function HumanAtlasScene({
  conceptId,
  onReady,
  onError,
}: Props) {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = host.current

    if (!element) return

    const abort = new AbortController()
    let disposed = false
    let frame = 0

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#081524')

    const camera = new THREE.PerspectiveCamera(34, 1, 0.001, 100)
    camera.position.set(0.1, 1, 0.2)

    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      })
    } catch {
      onError?.('Este navegador não conseguiu iniciar o visualizador WebGL.')
      return
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    element.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 0.015
    controls.maxDistance = 4

    scene.add(new THREE.HemisphereLight(0xffffff, 0x24364d, 1.9))

    const key = new THREE.DirectionalLight(0xffffff, 2.8)
    key.position.set(-1, 2, 2)
    scene.add(key)

    const rim = new THREE.DirectionalLight(0x78cfff, 2)
    rim.position.set(2, 1, -2)
    scene.add(rim)

    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.MeshStandardMaterial[] = []
    const anatomyGroup = new THREE.Group()
    scene.add(anatomyGroup)

    const fit = (box: THREE.Box3) => {
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const radius = Math.max(size.x, size.y, size.z) * 0.5
      const verticalFov = THREE.MathUtils.degToRad(camera.fov)
      const distance = Math.max(
        radius / Math.tan(verticalFov / 2) * 1.45,
        0.07,
      )

      controls.target.copy(center)
      camera.position
        .copy(center)
        .add(
          new THREE.Vector3(0.42, 0.18, 1)
            .normalize()
            .multiplyScalar(distance),
        )
      camera.near = Math.max(distance / 120, 0.0005)
      camera.far = Math.max(distance * 60, 3)
      camera.updateProjectionMatrix()
      controls.update()
    }

    const resize = () => {
      const width = Math.max(1, element.clientWidth)
      const height = Math.max(320, element.clientHeight)

      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()

    const render = () => {
      if (disposed) return
      frame = requestAnimationFrame(render)
      controls.update()
      renderer.render(scene, camera)
    }

    render()

    void (async () => {
      try {
        const atlas = await loadHumanAtlas()
        const concept = findAtlasConcept(atlas, conceptId)
        const loaded = await loadConceptGeometries(
          atlas,
          concept,
          abort.signal,
        )

        if (disposed) {
          loaded.forEach(({ geometry }) => geometry.dispose())
          return
        }

        const conceptBounds = new THREE.Box3()

        for (const { part, geometry } of loaded) {
          geometries.push(geometry)
          conceptBounds.union(
            new THREE.Box3(
              new THREE.Vector3().fromArray(part.bounds[0]),
              new THREE.Vector3().fromArray(part.bounds[1]),
            ),
          )

          const material = new THREE.MeshStandardMaterial({
            color: SYSTEM_COLORS[part.system] ?? '#54c7ff',
            roughness: 0.46,
            metalness: 0.06,
            side: THREE.DoubleSide,
          })
          materials.push(material)

          const mesh = new THREE.Mesh(geometry, material)
          anatomyGroup.add(mesh)
        }

        fit(conceptBounds)
        onReady?.(concept.name, loaded.length)
      } catch (error) {
        if (!disposed && !abort.signal.aborted) {
          onError?.(
            error instanceof Error
              ? error.message
              : 'Não foi possível preparar a anatomia 3D.',
          )
        }
      }
    })()

    return () => {
      disposed = true
      abort.abort()
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [conceptId, onError, onReady])

  return <div className="human-atlas-scene" ref={host} />
}
