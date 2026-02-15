import * as THREE from "three";

const normalizeAngle = (angle: number) => {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
};

export const lerpAngle = (start: number, end: number, t: number) => {
  start = normalizeAngle(start);
  end = normalizeAngle(end);

  if (Math.abs(end - start) > Math.PI) {
    if (end > start) {
      start += 2 * Math.PI;
    } else {
      end += 2 * Math.PI;
    }
  }

  return normalizeAngle(start + (end - start) * t);
};

export function getModelSize(model: THREE.Group<THREE.Object3DEventMap> | THREE.Mesh | THREE.Object3D<THREE.Object3DEventMap>) {
  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  size.multiplyScalar(0.5);
  return size;
}

export function getWorldTransform(mesh: THREE.Object3D) {
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  mesh.getWorldPosition(position);
  mesh.getWorldQuaternion(quaternion);
  return { position, quaternion };
}
