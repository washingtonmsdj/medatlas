import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { createExplosionLayout } from '../atlas/explosion-layout'
import { loadChunkBuffer } from '../atlas/model'
import { PointerTap } from '../atlas/pointer-tap'
import {
  ATLAS_SYSTEMS,
  type AtlasExplorerSceneState,
} from '../atlas/systems'
import type { HumanAtlas } from '../atlas/types'

export type AtlasSceneAppearance = 'clinical' | 'explorer' | 'patient'

interface Props {
  atlas: HumanAtlas
  state: AtlasExplorerSceneState
  onSelect: (partId: string) => void
  inspectedPartId?: string
  onProgress: (progress: number) => void
  onError: (message: string) => void
  appearance?: AtlasSceneAppearance
}

export function HumanAtlasExplorerScene({
  atlas,
  state,
  onSelect,
  inspectedPartId,
  onProgress,
  onError,
  appearance = 'clinical',
}: Props) {
  const host = useRef<HTMLDivElement>(null)
  const latest = useRef(state)
  const select = useRef(onSelect)
  const inspected = useRef(inspectedPartId)

  latest.current = state
  select.current = onSelect
  inspected.current = inspectedPartId

  useEffect(() => {
    const element = host.current
    if (!element) return

    let disposed = false
    let frame = 0
    let ready = false
    let dirty = true
    let lastState: AtlasExplorerSceneState | null = null
    let lastView = ''
    let lastReset = -1
    let lastIsolate = ''
    let lastInspectedPartId: string | undefined
    let layoutKey = ''
    let amount = 0

    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      })
    } catch {
      onError(
        'Este navegador não conseguiu iniciar o visualizador 3D completo.',
      )
      return
    }

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, window.innerWidth < 768 ? 1.5 : 2),
    )
    const isLightSurface = appearance === 'patient'
    const clearColor = isLightSurface ? '#f1f5f8' : '#071522'
    const groundColor = isLightSurface ? 0xdbe3e8 : 0x0a1b2e
    const platformColor = isLightSurface ? 0xf2f4f5 : 0x102b49

    renderer.setClearColor(clearColor)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = isLightSurface ? 1.1 : 1.22
    const canvasLabel =
      appearance === 'patient'
        ? 'Anatomia 3D interativa de referência.'
        : appearance === 'clinical'
          ? 'Anatomia 3D clínica interativa de referência.'
          : 'Atlas anatômico humano 3D interativo.'

    renderer.domElement.tabIndex = 0
    renderer.domElement.setAttribute(
      'aria-label',
      `${canvasLabel} Arraste para girar, use zoom, clique para inspecionar ou use as setas do teclado. Mais e menos ajustam o zoom; Home reenquadra.`,
    )
    renderer.domElement.setAttribute(
      'aria-keyshortcuts',
      'ArrowLeft ArrowRight ArrowUp ArrowDown + - Home',
    )
    element.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.005, 100)
    const controls = new OrbitControls(camera, renderer.domElement)

    camera.position.set(1.4, 1.05, 3.6)
    controls.target.set(0, 0.85, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.085
    controls.minDistance = 0.07
    controls.maxDistance = 40
    controls.maxPolarAngle = Math.PI * 0.96
    controls.addEventListener('change', () => {
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
        isLightSurface ? 0xffffff : 0xd9f2ff,
        isLightSurface ? 0xa7acb2 : 0x07101c,
        isLightSurface ? 1.05 : 1.32,
      ),
    )

    const key = new THREE.DirectionalLight(
      isLightSurface ? 0xfffaf4 : 0xccecff,
      isLightSurface ? 2.3 : 2.65,
    )
    key.position.set(-2.2, 4.2, 3.4)
    scene.add(key)

    const rim = new THREE.DirectionalLight(
      isLightSurface ? 0xe9f0ff : 0x56a7ff,
      isLightSurface ? 1.8 : 2.2,
    )
    rim.position.set(2.4, 2.1, -3.2)
    scene.add(rim)

    if (!isLightSurface) {
      const clinicalFill = new THREE.PointLight(0x39d8ff, 1.25, 8)
      clinicalFill.position.set(-1.8, 1.4, 1.3)
      scene.add(clinicalFill)
    }

    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(30, 96),
      new THREE.MeshStandardMaterial({
        color: groundColor,
        roughness: 1,
        metalness: isLightSurface ? 0 : 0.08,
      }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.019
    scene.add(ground)

    const platform = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.7, 0.028, 100),
      new THREE.MeshStandardMaterial({
        color: platformColor,
        metalness: isLightSurface ? 0.12 : 0.24,
        roughness: isLightSurface ? 0.67 : 0.5,
      }),
    )
    platform.position.y = -0.016
    scene.add(platform)

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.63, 0.632, 128),
      new THREE.MeshBasicMaterial({
        color: isLightSurface ? 0x8c969f : 0x4c7ca0,
        transparent: true,
        opacity: isLightSurface ? 0.4 : 0.5,
        side: THREE.DoubleSide,
      }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.001
    scene.add(ring)

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.551, 128),
      new THREE.MeshBasicMaterial({
        color: isLightSurface ? 0xa4aeb8 : 0x5f9bc6,
        transparent: true,
        opacity: isLightSurface ? 0.16 : 0.18,
        side: THREE.DoubleSide,
      }),
    )
    innerRing.rotation.x = -Math.PI / 2
    innerRing.position.y = 0.001
    scene.add(innerRing)

    const width = THREE.MathUtils.ceilPowerOfTwo(atlas.parts.length)
    const partStateData = new Float32Array(width * 4)
    const partStateTexture = new THREE.DataTexture(
      partStateData,
      width,
      1,
      THREE.RGBAFormat,
      THREE.FloatType,
    )
    partStateTexture.needsUpdate = true

    const selectedData = new Uint8Array(width * 4)
    const selectionTexture = new THREE.DataTexture(selectedData, width, 1)
    selectionTexture.needsUpdate = true

    const inspectedData = new Uint8Array(width * 4)
    const inspectionTexture = new THREE.DataTexture(inspectedData, width, 1)
    inspectionTexture.needsUpdate = true

    const hoveredData = new Uint8Array(width * 4)
    const hoverTexture = new THREE.DataTexture(hoveredData, width, 1)
    hoverTexture.needsUpdate = true

    const materials: THREE.Material[] = []
    const geometries: THREE.BufferGeometry[] = []
    const pickers: Array<THREE.Mesh | undefined> = []
    const centers = atlas.parts.map((part) =>
      new THREE.Vector3()
        .fromArray(part.bounds[0])
        .add(new THREE.Vector3().fromArray(part.bounds[1]))
        .multiplyScalar(0.5),
    )
    const bounds = atlas.parts.map(
      (part) =>
        new THREE.Box3(
          new THREE.Vector3().fromArray(part.bounds[0]),
          new THREE.Vector3().fromArray(part.bounds[1]),
        ),
    )
    const atlasBounds = bounds.reduce(
      (combined, box) => combined.union(box),
      new THREE.Box3(),
    )
    const atlasCenter = atlasBounds.getCenter(new THREE.Vector3())
    const atlasSize = atlasBounds.getSize(new THREE.Vector3())
    const offsets: THREE.Vector3[] = []

    const markerPositions = new Float32Array(atlas.parts.length * 3)
    const markerGeometry = new THREE.BufferGeometry()
    markerGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(markerPositions, 3),
    )
    const markerMaterial = new THREE.PointsMaterial({
      color: isLightSurface ? 0x64748b : 0x8ccff5,
      size: 5,
      sizeAttenuation: false,
      transparent: true,
      opacity: 0.72,
      depthTest: false,
    })
    markerMaterial.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <clipping_planes_fragment>',
        '#include <clipping_planes_fragment>\nif (distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;',
      )
    }
    const markers = new THREE.Points(markerGeometry, markerMaterial)
    markers.frustumCulled = false
    markers.renderOrder = 10
    markers.visible = false
    scene.add(markers)

    const hover = document.createElement('div')
    hover.className = 'reference-part-hover'
    hover.setAttribute('role', 'tooltip')
    hover.hidden = true
    element.appendChild(hover)

    type ProjectedTarget = {
      index: number
      x: number
      y: number
      left: number
      right: number
      top: number
      bottom: number
    }

    let targets: ProjectedTarget[] = []
    const projected = new THREE.Vector3()

    const findProjectedTarget = (
      x: number,
      y: number,
      radius: number,
    ) => {
      let best = -1
      let score = Infinity

      for (const target of targets) {
        const dx = Math.max(target.left - x, 0, x - target.right)
        const dy = Math.max(target.top - y, 0, y - target.bottom)
        const distance = Math.hypot(dx, dy)

        if (distance > radius) continue

        const candidate =
          distance + Math.hypot(target.x - x, target.y - y) * 0.025

        if (candidate < score) {
          score = candidate
          best = target.index
        }
      }

      return best
    }

    const materialFor = (systemId: string) => {
      const system = ATLAS_SYSTEMS.find(
        (candidate) => candidate.id === systemId,
      )
      const isSurface = systemId === 'integumentary'

      const material = new THREE.MeshStandardMaterial({
        color: system?.color ?? '#aebbb8',
        metalness: 0.08,
        roughness: 0.53,
        side: THREE.DoubleSide,
        transparent: isSurface,
        opacity: isSurface ? 0.1 : 1,
        depthWrite: !isSurface,
      })

      material.onBeforeCompile = (shader) => {
        shader.uniforms.partState = { value: partStateTexture }
        shader.uniforms.selectionState = { value: selectionTexture }
        shader.uniforms.inspectionState = { value: inspectionTexture }
        shader.uniforms.hoverState = { value: hoverTexture }
        shader.uniforms.stateWidth = { value: width }

        shader.vertexShader =
          'attribute float partIndex; uniform sampler2D partState; uniform sampler2D selectionState; uniform sampler2D inspectionState; uniform sampler2D hoverState; uniform float stateWidth; varying float partVisible; varying float partSelected; varying float partInspected; varying float partHovered;\n' +
          shader.vertexShader

        shader.vertexShader = shader.vertexShader.replace(
          '#include <begin_vertex>',
          '#include <begin_vertex>\nvec2 stateUv = vec2((partIndex + 0.5) / stateWidth, 0.5); vec4 state = texture2D(partState, stateUv); transformed += state.xyz; partVisible = state.w; partSelected = texture2D(selectionState, stateUv).r; partInspected = texture2D(inspectionState, stateUv).r; partHovered = texture2D(hoverState, stateUv).r;',
        )

        shader.fragmentShader =
          'varying float partVisible; varying float partSelected; varying float partInspected; varying float partHovered;\n' +
          shader.fragmentShader

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <clipping_planes_fragment>',
          '#include <clipping_planes_fragment>\nif (partVisible < 0.5) discard;',
        )

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <color_fragment>',
          '#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.18, 0.72, 0.92), partSelected * 0.78); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0, 0.56, 0.03), partInspected);',
        )

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <opaque_fragment>',
          'float hoverStrength = partHovered * (1.0 - partInspected); outgoingLight = mix(outgoingLight, vec3(0.68, 0.92, 1.0), hoverStrength * 0.34); outgoingLight = mix(outgoingLight, vec3(1.0, 0.62, 0.05), partInspected * 0.86);\n#include <opaque_fragment>',
        )
      }

      materials.push(material)
      return material
    }

    const materialBySystem = new Map(
      ATLAS_SYSTEMS.map((system) => [
        system.id,
        materialFor(system.id),
      ]),
    )

    let loadedChunks = 0

    const loadChunk = async (chunkIndex: number) => {
      const chunk = atlas.chunks[chunkIndex]
      if (!chunk) return

      const buffer = await loadChunkBuffer(chunk)
      if (disposed) return

      const groups = new Map<string, THREE.BufferGeometry[]>()

      atlas.parts.forEach((part, partIndex) => {
        if (part.chunk !== chunkIndex) return

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(
            new Float32Array(
              buffer,
              part.positions,
              part.vertexCount * 3,
            ),
            3,
          ),
        )
        geometry.setAttribute(
          'normal',
          new THREE.BufferAttribute(
            new Int16Array(
              buffer,
              part.normals,
              part.vertexCount * 3,
            ),
            3,
            true,
          ),
        )
        geometry.setIndex(
          new THREE.BufferAttribute(
            new Uint32Array(
              buffer,
              part.indices,
              part.indexCount,
            ),
            1,
          ),
        )
        geometry.boundingBox = bounds[partIndex].clone()
        geometry.computeBoundingSphere()
        geometry.setAttribute(
          'partIndex',
          new THREE.BufferAttribute(
            new Float32Array(part.vertexCount).fill(partIndex),
            1,
          ),
        )

        const picker = new THREE.Mesh(geometry)
        picker.matrixAutoUpdate = false
        pickers[partIndex] = picker
        geometries.push(geometry)

        const list = groups.get(part.system) ?? []
        list.push(geometry)
        groups.set(part.system, list)
      })

      groups.forEach((group, systemId) => {
        const merged = mergeGeometries(group, false)
        if (!merged) {
          throw new Error('Não foi possível montar a geometria anatômica.')
        }

        geometries.push(merged)

        const material =
          materialBySystem.get(systemId as never) ??
          materialFor(systemId)
        const mesh = new THREE.Mesh(merged, material)
        mesh.frustumCulled = false
        scene.add(mesh)
      })

      loadedChunks += 1
      onProgress(
        Math.round((loadedChunks / atlas.chunks.length) * 100),
      )
      lastState = null
      dirty = true
    }

    void (async () => {
      try {
        let cursor = 0

        await Promise.all(
          Array.from({ length: 3 }, async () => {
            while (cursor < atlas.chunks.length) {
              const index = cursor
              cursor += 1
              await loadChunk(index)
            }
          }),
        )

        if (!disposed) {
          ready = true
          dirty = true
        }
      } catch (error) {
        if (!disposed) {
          onError(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o atlas completo.',
          )
        }
      }
    })()

    let packingWidth = 1
    let packingHeight = 1

    const fit = (view: AtlasExplorerSceneState['view'], extent = 0) => {
      const mobile = element.clientWidth < 768

      if (appearance === 'explorer' && element.clientWidth > 900) {
        const width = element.clientWidth
        const height = element.clientHeight
        const left = 270
        const right = Math.max(left + 180, width - 340)
        const top = 100
        const bottom = Math.max(top + 180, height - 110)

        camera.setViewOffset(
          width,
          height,
          width / 2 - (left + right) / 2,
          height / 2 - (top + bottom) / 2,
          width,
          height,
        )
      } else {
        camera.clearViewOffset()
      }

      const direction =
        view === 'front'
          ? new THREE.Vector3(0, 0.02, 1)
          : view === 'back'
            ? new THREE.Vector3(0, 0.02, -1)
            : view === 'side'
              ? new THREE.Vector3(1, 0.02, 0)
              : new THREE.Vector3(0.35, 0.06, 1).normalize()

      if (appearance !== 'explorer' && extent < 0.05 && !atlasBounds.isEmpty()) {
        const verticalFov = THREE.MathUtils.degToRad(camera.fov)
        const horizontalFov =
          2 * Math.atan(Math.tan(verticalFov / 2) * Math.max(camera.aspect, 0.35))
        const fitHeight =
          atlasSize.y /
          Math.max(0.001, 2 * Math.tan(verticalFov / 2))
        const fitWidth =
          atlasSize.x /
          Math.max(0.001, 2 * Math.tan(horizontalFov / 2))
        const fitDepth = atlasSize.z * 0.65
        const surfacePadding =
          appearance === 'patient'
            ? mobile
              ? 1.25
              : 1.18
            : mobile
              ? 1.32
              : 1.22
        const distance = Math.max(
          0.16,
          (Math.max(fitHeight, fitWidth) + fitDepth) * surfacePadding,
        )

        controls.target.copy(atlasCenter)
        camera.position
          .copy(atlasCenter)
          .addScaledVector(direction, distance)
        controls.update()
        dirty = true
        return
      }

      const reservedHeight = mobile ? 300 : 220
      const availableAspect = Math.max(
        0.35,
        (element.clientWidth - (mobile ? 40 : 300)) /
          Math.max(160, element.clientHeight - reservedHeight),
      )

      let assembledDistance = mobile ? 4.8 : 4

      if (
        appearance === 'explorer' &&
        extent < 0.05 &&
        !atlasBounds.isEmpty()
      ) {
        const width = Math.max(1, element.clientWidth)
        const height = Math.max(1, element.clientHeight)
        const leftReserved = width > 900 ? 270 : mobile ? 18 : 56
        const rightReserved = width > 900 ? 340 : mobile ? 18 : 56
        const topReserved = width > 900 ? 112 : mobile ? 150 : 92
        const bottomReserved = width > 900 ? 118 : mobile ? 190 : 104
        const usableWidth = Math.max(
          180,
          width - leftReserved - rightReserved,
        )
        const usableHeight = Math.max(
          220,
          height - topReserved - bottomReserved,
        )
        const verticalFov = THREE.MathUtils.degToRad(camera.fov)
        const horizontalFov =
          2 *
          Math.atan(
            Math.tan(verticalFov / 2) *
              Math.max(camera.aspect, 0.35),
          )
        const fitHeight =
          atlasSize.y /
          Math.max(0.001, 2 * Math.tan(verticalFov / 2))
        const fitWidth =
          atlasSize.x /
          Math.max(0.001, 2 * Math.tan(horizontalFov / 2))
        const heightScale = height / usableHeight
        const widthScale = width / usableWidth

        assembledDistance = Math.max(
          3.8,
          fitHeight * heightScale * 1.06,
          fitWidth * widthScale * 1.06,
        )
      }

      const atlasDistance =
        (Math.max(packingHeight, packingWidth / availableAspect) /
          (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) *
        1.08
      const distance = THREE.MathUtils.lerp(
        assembledDistance,
        Math.max(0.2, atlasDistance),
        extent,
      )

      controls.target.set(
        extent > 0.1 && !mobile ? -packingWidth * 0.12 : 0,
        extent > 0.1 || mobile
          ? 0.85
          : appearance === 'explorer'
            ? atlasCenter.y
            : 0.68,
        0,
      )
      camera.position
        .copy(controls.target)
        .addScaledVector(direction, distance)
      controls.update()
      dirty = true
    }

    const resize = () => {
      layoutKey = ''
      lastState = null
      camera.aspect =
        Math.max(1, element.clientWidth) /
        Math.max(1, element.clientHeight)
      camera.updateProjectionMatrix()
      renderer.setSize(
        Math.max(1, element.clientWidth),
        Math.max(1, element.clientHeight),
        false,
      )
      fit(latest.current.view, amount)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(element)
    resize()

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const tap = new PointerTap()
    const worldBox = new THREE.Box3()
    const hitPoint = new THREE.Vector3()
    let pendingHover: { x: number; y: number } | null = null
    let hoverDirty = false
    let lastHoveredIndex = -1

    const hitTest = (clientX: number, clientY: number) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(pointer, camera)

      let nearest = Infinity
      let found = -1

      pickers.forEach((mesh, index) => {
        if (!mesh || partStateData[index * 4 + 3] < 0.5) return

        worldBox
          .copy(bounds[index])
          .translate(mesh.position)

        if (!raycaster.ray.intersectBox(worldBox, hitPoint)) return

        const hits = raycaster.intersectObject(mesh, false)
        if (hits[0] && hits[0].distance < nearest) {
          nearest = hits[0].distance
          found = index
        }
      })

      return found
    }

    const setHoveredIndex = (index: number) => {
      if (index === lastHoveredIndex) return

      if (lastHoveredIndex >= 0) {
        hoveredData[lastHoveredIndex * 4] = 0
      }

      if (index >= 0) {
        hoveredData[index * 4] = 255
      }

      hoverTexture.needsUpdate = true
      lastHoveredIndex = index
      renderer.domElement.style.cursor = index >= 0 ? 'pointer' : 'grab'
      dirty = true
    }

    const clearHover = () => {
      pendingHover = null
      hoverDirty = false
      hover.hidden = true
      setHoveredIndex(-1)
    }

    const pointerDown = (event: PointerEvent) => {
      clearHover()
      tap.down(
        event.pointerId,
        event.clientX,
        event.clientY,
        event.pointerType === 'touch' ? 12 : 5,
      )
    }

    const pointerMove = (event: PointerEvent) => {
      tap.move(event.pointerId, event.clientX, event.clientY)

      if (event.pointerType === 'touch' || !ready) {
        clearHover()
        return
      }

      if (appearance === 'explorer') {
        if (event.buttons || amount <= 0.45) {
          clearHover()
          return
        }

        const rect = element.getBoundingClientRect()
        const x = event.clientX - rect.left
        const y = event.clientY - rect.top
        const hoveredIndex = findProjectedTarget(x, y, 12)

        setHoveredIndex(hoveredIndex)
        hover.hidden = hoveredIndex < 0

        if (hoveredIndex >= 0) {
          hover.textContent = atlas.parts[hoveredIndex].name
          hover.style.left =
            Math.max(8, Math.min(x + 14, element.clientWidth - 260)) + 'px'
          hover.style.top =
            Math.max(8, Math.min(y + 18, element.clientHeight - 55)) + 'px'
        }

        return
      }

      pendingHover = { x: event.clientX, y: event.clientY }
      hoverDirty = true
    }

    const pointerCancel = (event: PointerEvent) => {
      tap.cancel(event.pointerId)
      clearHover()
    }

    const pointerLeave = () => {
      clearHover()
    }

    const pointerUp = (event: PointerEvent) => {
      const validTap = tap.up(
        event.pointerId,
        event.clientX,
        event.clientY,
      )

      if (!validTap || !ready) return

      const found = hitTest(event.clientX, event.clientY)

      if (found >= 0) select.current(atlas.parts[found].id)
    }

    const keyboardOffset = new THREE.Vector3()
    const keyboardSpherical = new THREE.Spherical()

    const keyDown = (event: KeyboardEvent) => {
      if (!ready) return

      const handled = [
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        '+',
        '=',
        '-',
        '_',
        'Home',
      ].includes(event.key)

      if (!handled) return

      event.preventDefault()
      clearHover()

      if (event.key === 'Home') {
        fit(latest.current.view, amount)
        return
      }

      keyboardOffset.copy(camera.position).sub(controls.target)
      keyboardSpherical.setFromVector3(keyboardOffset)

      const rotationStep = event.shiftKey ? 0.18 : 0.1
      const zoomFactor = event.shiftKey ? 0.78 : 0.88

      if (event.key === 'ArrowLeft') {
        keyboardSpherical.theta -= rotationStep
      } else if (event.key === 'ArrowRight') {
        keyboardSpherical.theta += rotationStep
      } else if (event.key === 'ArrowUp') {
        keyboardSpherical.phi -= rotationStep
      } else if (event.key === 'ArrowDown') {
        keyboardSpherical.phi += rotationStep
      } else if (event.key === '+' || event.key === '=') {
        keyboardSpherical.radius *= zoomFactor
      } else if (event.key === '-' || event.key === '_') {
        keyboardSpherical.radius /= zoomFactor
      }

      keyboardSpherical.phi = THREE.MathUtils.clamp(
        keyboardSpherical.phi,
        0.08,
        Math.PI * 0.94,
      )
      keyboardSpherical.radius = THREE.MathUtils.clamp(
        keyboardSpherical.radius,
        controls.minDistance,
        controls.maxDistance,
      )

      keyboardOffset.setFromSpherical(keyboardSpherical)
      camera.position.copy(controls.target).add(keyboardOffset)
      controls.update()
      dirty = true
    }

    renderer.domElement.addEventListener('pointerdown', pointerDown)
    renderer.domElement.addEventListener('pointermove', pointerMove)
    renderer.domElement.addEventListener('pointerup', pointerUp)
    renderer.domElement.addEventListener('pointercancel', pointerCancel)
    renderer.domElement.addEventListener('pointerleave', pointerLeave)
    renderer.domElement.addEventListener('keydown', keyDown)

    const clock = new THREE.Clock()

    const animate = () => {
      if (disposed) return

      frame = requestAnimationFrame(animate)
      const delta = Math.min(clock.getDelta(), 0.05)
      const current = latest.current

      const stateChanged =
        lastState?.visible !== current.visible ||
        lastState?.selected !== current.selected ||
        lastState?.isolate !== current.isolate

      const moving = Math.abs(amount - current.explode) > 0.0001
      const currentInspectedPartId = inspected.current

      if (hoverDirty && pendingHover && appearance !== 'explorer') {
        const hoveredIndex = hitTest(pendingHover.x, pendingHover.y)
        setHoveredIndex(hoveredIndex)
        hoverDirty = false
      }

      if (currentInspectedPartId !== lastInspectedPartId) {
        atlas.parts.forEach((part, index) => {
          inspectedData[index * 4] =
            part.id === currentInspectedPartId ? 255 : 0
        })
        inspectionTexture.needsUpdate = true
        lastInspectedPartId = currentInspectedPartId
        dirty = true
      }

      if (moving) {
        amount = THREE.MathUtils.damp(
          amount,
          current.explode,
          8,
          delta,
        )
        dirty = true
      }

      if (stateChanged || moving) {
        const visible = new Set(current.visible)
        const selection = new Set(current.selected)
        const visibleParts = atlas.parts.filter((part) =>
          current.isolate
            ? selection.has(part.id)
            : visible.has(part.system as never) ||
              selection.has(part.id),
        )

        const nextLayoutKey =
          visibleParts.map((part) => part.id).join(',') +
          ':' +
          camera.aspect.toFixed(3)

        if (nextLayoutKey !== layoutKey) {
          const layout = createExplosionLayout(
            visibleParts,
            camera.aspect,
          )
          packingWidth = layout.width
          packingHeight = layout.height

          atlas.parts.forEach((part, index) => {
            const cell = layout.cells.get(part.id)
            offsets[index] = cell
              ? new THREE.Vector3(cell.x, cell.y + 0.85, 0)
              : centers[index].clone()
          })

          layoutKey = nextLayoutKey
        }

        atlas.parts.forEach((part, index) => {
          const center = centers[index]
          const destination = offsets[index] ?? center

          let dx = 0
          let dy = 0
          let dz = 0

          if (amount <= 0.45) {
            const t = amount / 0.45
            const group = Math.max(
              0,
              ATLAS_SYSTEMS.findIndex(
                (system) => system.id === part.system,
              ),
            )
            const angle =
              (group / ATLAS_SYSTEMS.length) * Math.PI * 2
            dx = Math.sin(angle) * t * 0.48
            dy = (center.y - 0.85) * t * 0.28
            dz = Math.cos(angle) * t * 0.48
          } else {
            const t = (amount - 0.45) / 0.55
            dx = THREE.MathUtils.lerp(
              0,
              destination.x - center.x,
              t,
            )
            dy = THREE.MathUtils.lerp(
              0,
              destination.y - center.y,
              t,
            )
            dz = THREE.MathUtils.lerp(
              0,
              -center.z,
              t,
            )
          }

          const selected = selection.has(part.id)
          const isVisible = current.isolate
            ? selected
            : visible.has(part.system as never) || selected

          partStateData.set(
            [dx, dy, dz, isVisible ? 1 : 0],
            index * 4,
          )
          selectedData[index * 4] = selected ? 255 : 0

          markerPositions.set(
            isVisible
              ? [center.x + dx, center.y + dy, center.z + dz]
              : [10000, 10000, 10000],
            index * 3,
          )

          const picker = pickers[index]
          if (picker) {
            picker.position.set(dx, dy, dz)
            picker.updateMatrix()
            picker.updateMatrixWorld(true)
          }
        })

        partStateTexture.needsUpdate = true
        selectionTexture.needsUpdate = true
        markerGeometry.attributes.position.needsUpdate = true
        lastState = current
        dirty = true
      }

      if (
        current.view !== lastView ||
        current.reset !== lastReset
      ) {
        fit(current.view, amount)
        lastView = current.view
        lastReset = current.reset
      }

      const isolateKey = current.isolate
        ? current.selected.join(',') +
          ':' +
          current.view +
          ':' +
          current.reset +
          ':' +
          camera.aspect
        : ''

      if (isolateKey !== lastIsolate) {
        if (current.isolate && current.selected.length > 0) {
          const box = new THREE.Box3()

          atlas.parts.forEach((part, index) => {
            if (!current.selected.includes(part.id)) return

            box.union(
              bounds[index]
                .clone()
                .translate(
                  new THREE.Vector3(
                    partStateData[index * 4],
                    partStateData[index * 4 + 1],
                    partStateData[index * 4 + 2],
                  ),
                ),
            )
          })

          if (!box.isEmpty()) {
            const center = box.getCenter(new THREE.Vector3())
            const size = box.getSize(new THREE.Vector3())
            const isolatedVerticalFov = THREE.MathUtils.degToRad(camera.fov)
            const isolatedHorizontalFov =
              2 *
              Math.atan(
                Math.tan(isolatedVerticalFov / 2) *
                  Math.max(camera.aspect, 0.35),
              )
            const isolatedFitHeight =
              size.y /
              Math.max(
                0.001,
                2 * Math.tan(isolatedVerticalFov / 2),
              )
            const isolatedFitWidth =
              size.x /
              Math.max(
                0.001,
                2 * Math.tan(isolatedHorizontalFov / 2),
              )
            const isolatedFitDepth = size.z * 0.52
            const isolatedPadding =
              appearance === 'explorer'
                ? 1.45
                : appearance === 'patient'
                  ? 1.22
                  : element.clientWidth < 768
                    ? 1.18
                    : 1.12
            const distance = Math.max(
              (
                Math.max(isolatedFitHeight, isolatedFitWidth) +
                isolatedFitDepth
              ) *
                isolatedPadding,
              0.08,
            )
            const isolatedDirection =
              current.view === 'front'
                ? new THREE.Vector3(0, 0.02, 1)
                : current.view === 'back'
                  ? new THREE.Vector3(0, 0.02, -1)
                  : current.view === 'side'
                    ? new THREE.Vector3(1, 0.02, 0)
                    : new THREE.Vector3(0.2, 0.1, 1).normalize()

            controls.target.copy(center)
            camera.position
              .copy(center)
              .addScaledVector(isolatedDirection, distance)
            controls.update()
            dirty = true
          }
        } else if (lastIsolate) {
          fit(current.view, amount)
        }

        lastIsolate = isolateKey
      }

      controls.enableRotate = amount < 0.8
      controls.autoRotate =
        current.rotate &&
        !current.isolate &&
        amount < 0.4
      controls.autoRotateSpeed = 0.65
      controls.update()

      if (controls.autoRotate) dirty = true

      ground.visible =
        platform.visible =
        ring.visible =
        innerRing.visible =
          appearance === 'explorer' &&
          amount < 0.5 &&
          !current.isolate

      markers.visible =
        appearance === 'explorer' &&
        amount > 0.75 &&
        !current.isolate

      if (dirty) {
        renderer.render(scene, camera)

        targets = []

        if (appearance === 'explorer' && amount > 0.45) {
          const hasSolid = atlas.parts.some(
            (part, index) =>
              part.system !== 'integumentary' &&
              partStateData[index * 4 + 3] > 0.5,
          )

          atlas.parts.forEach((part, index) => {
            if (
              partStateData[index * 4 + 3] < 0.5 ||
              (hasSolid && part.system === 'integumentary')
            ) {
              return
            }

            let left = Infinity
            let right = -Infinity
            let top = Infinity
            let bottom = -Infinity

            for (let corner = 0; corner < 8; corner += 1) {
              projected
                .set(
                  part.bounds[corner & 1 ? 1 : 0][0] +
                    partStateData[index * 4],
                  part.bounds[corner & 2 ? 1 : 0][1] +
                    partStateData[index * 4 + 1],
                  part.bounds[corner & 4 ? 1 : 0][2] +
                    partStateData[index * 4 + 2],
                )
                .project(camera)

              const x =
                ((projected.x + 1) * element.clientWidth) / 2
              const y =
                ((1 - projected.y) * element.clientHeight) / 2

              left = Math.min(left, x)
              right = Math.max(right, x)
              top = Math.min(top, y)
              bottom = Math.max(bottom, y)
            }

            projected
              .copy(centers[index])
              .add(
                new THREE.Vector3(
                  partStateData[index * 4],
                  partStateData[index * 4 + 1],
                  partStateData[index * 4 + 2],
                ),
              )
              .project(camera)

            if (projected.z < -1 || projected.z > 1) return

            targets.push({
              index,
              x: ((projected.x + 1) * element.clientWidth) / 2,
              y: ((1 - projected.y) * element.clientHeight) / 2,
              left,
              right,
              top,
              bottom,
            })
          })
        }

        dirty = false
      }
    }

    animate()

    const contextLost = (event: Event) => {
      event.preventDefault()
      onError(
        'A sessão 3D foi pausada pelo dispositivo. Recarregue para continuar.',
      )
    }

    renderer.domElement.addEventListener(
      'webglcontextlost',
      contextLost,
    )

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()

      renderer.domElement.removeEventListener(
        'pointerdown',
        pointerDown,
      )
      renderer.domElement.removeEventListener(
        'pointermove',
        pointerMove,
      )
      renderer.domElement.removeEventListener(
        'pointerup',
        pointerUp,
      )
      renderer.domElement.removeEventListener(
        'pointercancel',
        pointerCancel,
      )
      renderer.domElement.removeEventListener(
        'pointerleave',
        pointerLeave,
      )
      renderer.domElement.removeEventListener('keydown', keyDown)
      renderer.domElement.removeEventListener(
        'webglcontextlost',
        contextLost,
      )

      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      environment.dispose()
      partStateTexture.dispose()
      selectionTexture.dispose()
      inspectionTexture.dispose()
      hoverTexture.dispose()
      markerGeometry.dispose()
      markerMaterial.dispose()
      hover.remove()

      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh &&
          !geometries.includes(object.geometry)
        ) {
          object.geometry.dispose()
          const objectMaterials = Array.isArray(object.material)
            ? object.material
            : [object.material]
          objectMaterials.forEach((material) =>
            material.dispose(),
          )
        }
      })

      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [appearance, atlas, onError, onProgress])

  return <div className="reference-atlas-scene" ref={host} />
}
