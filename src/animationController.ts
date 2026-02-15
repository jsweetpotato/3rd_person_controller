import * as THREE from "three";

export class AnimationController {
  private mixer: THREE.AnimationMixer;
  private actions: Map<string, THREE.AnimationAction> = new Map();
  private currentAction: THREE.AnimationAction | null = null;

  constructor(model: THREE.Object3D, animations: THREE.AnimationClip[]) {
    // 1. 믹서 생성
    this.mixer = new THREE.AnimationMixer(model);

    // 2. 모든 애니메이션을 미리 Action으로 변환해서 저장
    animations.forEach((clip) => {
      // 믹서에 클립을 등록 (실행은 안 함)
      const action = this.mixer.clipAction(clip);

      // 이름으로 찾아쓸 수 있게 Map에 저장
      // (주의: Blender에서 정한 애니메이션 이름과 같아야 합니다)
      this.actions.set(clip.name, action);
    });
  }

  // 3. 애니메이션 재생 함수 (핵심 로직)
  play(name: string, fadeDuration: number = 0.2) {
    const newAction = this.actions.get(name);

    // 없는 애니메이션이거나, 이미 재생 중인거면 무시
    if (!newAction || newAction === this.currentAction) return;

    // A. 새 애니메이션 준비
    newAction.reset(); // 처음부터 다시 재생
    newAction.fadeIn(fadeDuration); // 서서히 나타나게
    newAction.play(); // 재생 시작

    // B. 기존 애니메이션 정리 (있다면)
    if (this.currentAction) {
      this.currentAction.fadeOut(fadeDuration); // 서서히 사라지게
    }

    // C. 현재 상태 업데이트
    this.currentAction = newAction;
  }

  // 4. 점프나 공격 같은 '한 번만 재생'하는 애니메이션용
  playOneShot(name: string, fadeDuration: number = 0.2) {
    const action = this.actions.get(name);
    if (!action) return;

    // 반복 끄기
    action.setLoop(THREE.LoopOnce, 1);
    // 다 끝나면 마지막 프레임에 멈춰있게 하기 (선택사항)
    action.clampWhenFinished = true;

    this.play(name, fadeDuration);

    // (심화) 애니메이션이 끝나면 다시 Idle로 돌아가게 하려면 믹서 이벤트를 들어야 합니다.
  }

  // 5. 매 프레임 업데이트 (필수)
  update(delta: number) {
    this.mixer.update(delta);
  }
}
