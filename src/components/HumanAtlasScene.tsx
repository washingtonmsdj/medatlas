import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { loadPartGeometry } from '../atlas/model'
import { findAtlasConcept, loadHumanAtlas } from '../atlas/source'

interface Props {
  conceptId: string
  onReady?: (label: string) => void
  onError?: (message: string) => void
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
    camera.position.set(0.1, 1.03, 0.18)

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
    controls.minDistance = 0.02
    controls.maxDistance = 2

    scene.add(new THREE.HemisphereLight(0xffffff, 0x233349, 2.1))

    const key = new THREE.DirectionalLight(0xffffff, 3)
    key.position.set(-1, 2, 2)
    scene.add(key)

    const rim = new THREE.DirectionalLight(0x78cfff, 2.2)
    rim.position.set(2, 1, -2)
    scene.add(rim)

    const grid = new THREE.GridHelper(0.3, 14, 0x31506c, 0x17293c)
    grid.position.y = 0.985
    scene.add(grid)

    let geometry: THREE.BufferGeometry | undefined
    let material: THREE.MeshStandardMaterial | undefined

    const fit = (targetGeometry: THREE.BufferGeometry) => {
      const box =
        targetGeometry.boundingBox ??
        new THREE.Box3().setFromBufferAttribute(
          targetGeometry.getAttribute('position') as THREE.BufferAttribute,
        )
      const center = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      const radius = Math.max(size.x, size.y, size.z) * 0.5
      const distance = Math.max(radius * 3.4, 0.07)

      controls.target.copy(center)
      camera.position.copy(center).add(new THREE.Vector3(0.45, 0.2, 1).normalize().multiplyScalar(distance))
      camera.near = Math.max(distance / 100, 0.0005)
      camera.far = Math.max(distance * 50, 2)
      camera.updateProjectionMatrix()
      controls.update()
    }

    const resize = () => {
      const width = element.clientWidth
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
        const atlas = await loadHumanAtlas(abort.signal)
        const concept = findAtlasConcept(atlas, conceptId)
        const part = atlas.parts.find((candidate) =>
          concept.elements.includes(candidate.id),
        )

        if (!part) {
          throw new Error('A estrutura selecionada não possui geometria renderizável.')
        }

        geometry = await loadPartGeometry(atlas, part, abort.signal)

        if (disposed) {
          geometry.dispose()
          return
        }

        material = new THREE.MeshStandardMaterial({
          color: '#54c7ff',
          roughness: 0.44,
          metalness: 0.08,
        })

        const mesh = new THREE.Mesh(geometry, material)
        scene.add(mesh)
        fit(geometry)
        onReady?.(concept.name)
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
      geometry?.dispose()
      material?.dispose()
      grid.geometry.dispose()
      ;(grid.material as THREE.Material).dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [conceptId, onError, onReady])

  return <div className="human-atlas-scene" ref={host} />
}
