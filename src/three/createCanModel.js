import * as THREE from 'three';

const flavourShader = `
  #ifdef USE_MAP
    vec4 currentColour = texture2D(map, vMapUv);
    vec4 nextColour = texture2D(nextMap, vMapUv);
    diffuseColor *= mix(currentColour, nextColour, flavourMix);
  #endif
`;

function createLabelMaterial(track) {
  const uniforms = {
    nextMap: { value: null },
    flavourMix: { value: 0 },
  };
  const material = track(new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.18,
    roughness: 0.4,
  }));

  material.onBeforeCompile = function blendFlavourLabels(shader) {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = `
      uniform sampler2D nextMap;
      uniform float flavourMix;
      ${shader.fragmentShader}
    `;
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', flavourShader);
  };
  material.customProgramCacheKey = () => 'pulp-two-wrap-blend';

  return { material, uniforms };
}

function addCanEnds(addMesh, silver, endMaterials) {
  const collarGeometry = new THREE.CylinderGeometry(0.54, 0.54, 0.04, 80, 1, true);
  const rimGeometry = new THREE.TorusGeometry(0.54, 0.034, 12, 80);
  const discGeometry = new THREE.CircleGeometry(0.535, 80);
  for (const height of [-1.65, 1.65]) {
    addMesh(collarGeometry, silver, height);
    const rim = addMesh(rimGeometry, silver, height);
    rim.rotation.x = Math.PI / 2;
  }

  const top = addMesh(discGeometry, endMaterials.top, 1.657);
  top.rotation.x = -Math.PI / 2;
  const bottom = addMesh(discGeometry, endMaterials.bottom, -1.657);
  bottom.rotation.x = Math.PI / 2;
}

function createBodyGeometry() {
  const profile = [
    [0.54, -1.63], [0.55, -1.59], [0.6, -1.53], [0.63, -1.47], [0.64, -1.4],
    [0.64, 1.4], [0.63, 1.47], [0.6, 1.53], [0.55, 1.59], [0.54, 1.63],
  ];
  const points = profile.map(([radius, height]) => new THREE.Vector2(radius, height));
  const geometry = new THREE.LatheGeometry(points, 96);
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let index = 0; index < uv.count; index += 1) {
    uv.setY(index, (positions.getY(index) + 1.63) / 3.26);
  }
  return geometry;
}

export function createCanModel(track) {
  const group = new THREE.Group();
  group.rotation.z = -0.12;

  const silver = track(new THREE.MeshStandardMaterial({
    color: '#d4dade',
    metalness: 0.95,
    roughness: 0.24,
  }));
  const endMaterials = {
    top: track(new THREE.MeshBasicMaterial({ toneMapped: false })),
    bottom: track(new THREE.MeshBasicMaterial({ toneMapped: false })),
  };
  const label = createLabelMaterial(track);

  function addMesh(geometry, material, height = 0) {
    const mesh = new THREE.Mesh(track(geometry), material);
    mesh.position.y = height;
    group.add(mesh);
    return mesh;
  }

  const body = addMesh(createBodyGeometry(), label.material);
  body.rotation.y = Math.PI;
  addCanEnds(addMesh, silver, endMaterials);

  function setEndTexture(side, texture) {
    const diameter = side === 'top' ? 1460 : 1430;
    texture.repeat.set(diameter / 1696, diameter / 2528);
    texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2);
    endMaterials[side].map = texture;
    endMaterials[side].needsUpdate = true;
  }

  function setFlavour(currentFlavour, nextFlavour, currentTexture, nextTexture, amount) {
    if (currentTexture) {
      const needsCompile = !label.material.map;
      label.material.map = currentTexture;
      label.uniforms.nextMap.value = nextTexture || currentTexture;
      label.uniforms.flavourMix.value = nextTexture ? amount : 0;
      if (needsCompile) label.material.needsUpdate = true;
    }

    const brightness = THREE.MathUtils.lerp(currentFlavour.printBrightness ?? 1, nextFlavour.printBrightness ?? 1, amount);
    label.material.color.setScalar(brightness);
    label.material.envMapIntensity = brightness;
  }

  return {
    group,
    setFlavour,
    setEndTexture,
  };
}
