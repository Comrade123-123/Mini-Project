import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { makeShadow } from './textures.js'

export const FOV = 28
export const DIST = 12.5

const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t) }

// One lung from a deformed sphere: tapered apex, wide concave base, flattened medial side,
// fissure grooves, and (for the left lung) the cardiac notch. Medial side is +x.
function buildLung(notch) {
  const g = new THREE.SphereGeometry(1, 128, 96)
  g.rotateY(-Math.PI / 2) // keep the texture seam at the back
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
    const med = sm(0, 0.7, x)
    const w = (1 - 0.42 * sm(0.1, 1, y)) * (1 + 0.12 * (1 - sm(-1, 0, y)))
    let X = x * (1 - 0.5 * med) * w * 0.95
    let Y = y * 1.6
    const Z = z * 0.78 * w
    Y += sm(-0.45, -1, y) * 0.34 * (1 - Math.min(1, Math.hypot(x, z))) // concave diaphragm
    if (notch) X -= Math.exp(-(((y + 0.3) / 0.38) ** 2)) * sm(0.05, 0.8, x) * 0.5
    let s = 1 - 0.07 * Math.exp(-(((y * 0.75 + z * 0.66 - 0.05) / 0.07) ** 2)) // oblique fissure
    if (!notch) s -= 0.06 * Math.exp(-(((y - 0.28) / 0.06) ** 2)) * sm(0, 0.35, z) * (1 - med) // horizontal fissure
    pos.setXYZ(i, X * s, Y * s * 1, Z * s)
  }
  g.computeVertexNormals()
  return g
}

const tube = (pts, r) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 28, r, 10, false)

// Shared uniforms drive the evidence layer painted on the lung surface.
const U = {
  uHot0: { value: new THREE.Vector3(-0.12, 0.62, 0.6) },  // Grad-CAM hotspot (smooth)
  uHot1: { value: new THREE.Vector3(-0.1, -0.68, 0.6) },  // Integrated Gradients hotspot (pixel grain)
  uSig: { value: 0.4 },
  uBoost: { value: 1 },
}

function lungMaterial() {
  const m = new THREE.MeshPhysicalMaterial({ color: 0xf3f6fc, roughness: 0.34, clearcoat: 0.75, clearcoatRoughness: 0.22, sheen: 0.5, sheenColor: new THREE.Color(0xdbe6ff), transparent: true })
  m.customProgramCacheKey = () => 'lumen-lung'
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U)
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLocal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;')
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vLocal; uniform vec3 uHot0; uniform vec3 uHot1; uniform float uSig; uniform float uBoost;
        float h31(vec3 p){ p = fract(p * 0.3183099 + .1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
          return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z); }
        vec3 heatCol; float heatAmt;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float lob = vn(vLocal * 9.0) * 0.6 + vn(vLocal * 24.0) * 0.4;
        diffuseColor.rgb *= 0.92 + 0.12 * lob;
        vec3 d0 = vLocal - uHot0, d1 = vLocal - uHot1;
        float hs = exp(-dot(d0, d0) / (uSig * uSig));
        float hg = exp(-dot(d1, d1) / (uSig * uSig * 1.3));
        float gr = smoothstep(0.25, 0.9, h31(floor(vLocal * 34.0)));
        float heat = hs + hg * gr * 1.4;
        heatCol = mix(vec3(0.58, 0.77, 1.0), vec3(0.1, 0.29, 0.86), smoothstep(0.3, 1.1, heat));
        heatAmt = smoothstep(0.08, 0.7, heat) * uBoost;
        diffuseColor.rgb = mix(diffuseColor.rgb, heatCol, heatAmt);`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += heatCol * heat * 0.24 * uBoost;')
  }
  return m
}

export function createStage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x000000, 0)

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100)
  camera.position.set(0, 0.4, DIST)
  camera.lookAt(0, 0, 0)
  const key = new THREE.DirectionalLight(0xffffff, 1.0)
  key.position.set(3, 6, 5)
  scene.add(key, new THREE.AmbientLight(0xdfe6ff, 0.45))

  const root = new THREE.Group(), spin = new THREE.Group(), rig = new THREE.Group()
  scene.add(root); root.add(spin); spin.add(rig)
  rig.position.y = -0.45

  const lungMat = lungMaterial()
  const metal = new THREE.MeshStandardMaterial({ color: 0xd3d9e8, metalness: 1, roughness: 0.26, emissive: new THREE.Color(0x1d4ee0), emissiveIntensity: 0 })
  const ringBlue = new THREE.MeshStandardMaterial({ color: 0x1d4ee0, emissive: new THREE.Color(0x1d4ee0), emissiveIntensity: 0.9, roughness: 0.3 })

  // lungs with their own bronchial branches
  const makeLung = (mirror, notch) => {
    const grp = new THREE.Group()
    grp.add(new THREE.Mesh(buildLung(notch), lungMat))
    const t = (pts, r) => grp.add(new THREE.Mesh(tube(pts, r), metal))
    t([[0.78, 1.35, 0], [0.62, 0.95, 0], [0.38, 0.6, 0], [0.0, 0.2, 0], [-0.32, -0.2, 0]], 0.075)
    t([[0.2, 0.45, 0], [-0.05, 0.85, 0.05], [-0.28, 1.2, 0]], 0.05)
    t([[0.0, 0.2, 0], [-0.3, 0.35, 0.05], [-0.55, 0.15, 0]], 0.04)
    t([[-0.32, -0.2, 0], [-0.2, -0.6, 0.05], [-0.3, -1.05, 0]], 0.045)
    t([[-0.32, -0.2, 0], [-0.55, -0.45, 0], [-0.7, -0.8, 0]], 0.035)
    t([[-0.05, 0.85, 0.05], [-0.25, 0.95, 0.12], [-0.45, 1.0, 0.1]], 0.028)
    if (mirror) grp.scale.x = -1
    return grp
  }
  const lungR = makeLung(false, false) // patient's right, viewer's left
  const lungL = makeLung(true, true)
  rig.add(lungR, lungL)

  // trachea: cartilage rings and a blue carina ring
  const trachea = new THREE.Group()
  for (let i = 0; i < 11; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.036, 14, 36), metal)
    ring.rotation.x = Math.PI / 2
    ring.position.y = 1.5 + i * 0.115
    ring.scale.set(1, 0.8, 1)
    trachea.add(ring)
  }
  const carina = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.018, 12, 40), ringBlue)
  carina.rotation.x = Math.PI / 2; carina.position.y = 1.42
  trachea.add(carina)
  rig.add(trachea)

  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: (() => { const t = new THREE.CanvasTexture(makeShadow()); t.colorSpace = THREE.SRGBColorSpace; return t })(), transparent: true, depthWrite: false }))
  shadow.rotation.x = -Math.PI / 2
  spin.add(shadow)

  let W = 1, H = 1
  const resize = () => {
    W = window.innerWidth; H = window.innerHeight
    renderer.setSize(W, H, false)
    camera.aspect = W / H
    camera.updateProjectionMatrix()
  }
  resize()

  const ANCHORS = {
    air: [trachea, [0.19, 1.95, 0]],
    gradcam: [lungL, [-0.8, 0.6, 0.15]],
    ig: [lungL, [-0.82, -0.66, 0.15]],
  }
  const v = new THREE.Vector3()
  const lerp = THREE.MathUtils.lerp

  return {
    resize,
    halfWidth: () => Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * DIST * camera.aspect,
    render(s, time) {
      root.position.set(s.x, s.y, 0)
      root.scale.setScalar(s.s)
      root.rotation.x = s.tilt
      spin.rotation.y = s.rotY

      const breathe = Math.sin(time * 0.0016)
      const spread = 0.72 + s.e * 0.75
      lungR.position.x = -spread
      lungL.position.x = spread
      lungR.scale.set(1 + breathe * 0.012, 1 + breathe * 0.02, 1 + breathe * 0.012)
      lungL.scale.set(-(1 + breathe * 0.012), 1 + breathe * 0.02, 1 + breathe * 0.012)
      trachea.position.y = s.e * 0.9
      shadow.position.y = -1.75 - 0.45 + 0.01

      // focus: 0 lungs, 1 airways, 2 evidence
      const tOpacity = s.focus === 1 ? 0.18 : 1
      lungMat.opacity += (tOpacity - lungMat.opacity) * 0.1
      lungMat.transparent = lungMat.opacity < 0.995
      const tBoost = s.focus === 0 ? 0.3 : s.focus === 1 ? 0 : s.focus === 2 ? 1.25 : 1
      U.uBoost.value += (tBoost - U.uBoost.value) * 0.1
      metal.emissiveIntensity += ((s.focus === 1 ? 0.55 : 0) - metal.emissiveIntensity) * 0.1

      renderer.render(scene, camera)
      root.updateMatrixWorld(true)
    },
    project(keyName) {
      const [obj, p] = ANCHORS[keyName]
      v.set(...p)
      obj.localToWorld(v)
      v.project(camera)
      return { x: (v.x * 0.5 + 0.5) * W, y: (-v.y * 0.5 + 0.5) * H }
    },
    dispose() {
      renderer.dispose()
      scene.traverse((o) => { o.geometry?.dispose?.() })
      lungMat.dispose(); metal.dispose(); ringBlue.dispose()
    },
  }
}
