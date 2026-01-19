import * as THREE from 'three';
import { GLTFLoader } from 'GLTFLoader';
import * as SkeletonUtils from 'SkeletonUtils';

/** @class QuaterniusModel encapsulates a GLB model and its animations, along
 * with operations to offset its rotation and dynamically compute its bounding
 * box. */
export class QuaterniusModel extends THREE.Object3D {
  #clock = new THREE.Clock();
  #mixer = new THREE.AnimationMixer(this);
  #loadingComplete;
  #animationData;
  #modelData;
  lastAnimation = undefined;

  /**
   * Instantiates a QuaterniusModel. Inherits from THREE's Object3D().
   */
  constructor() {
    super();
    this.animations = [];
  }

  /**
   * Load a GLB model to use as the QuaterniusModel, optionally with a visual
   * rotational offset along the y-axis.
   * 
   * @param {string} path The path to the .glb file.
   * @param {number} rotationOffset Visual rotational offset along the y-axis.
   * @returns 
   */
  async load(path, rotationOffset) {
    const loader = new GLTFLoader();

    this.#loadingComplete = new Promise((resolve, reject) =>
      loader.load(path, (gltf) => {
        this.#modelData = gltf.scene;
        this.#modelData.updateMatrixWorld( true )
        var bound = new THREE.Box3();

        // Original bounding box is incorrect. Correction written by ChatGPT:
        // https://chat.openai.com/share/380cd060-a4fd-4eff-aa1f-4bc3e32c9a55
        this.#modelData.traverse((child) => {
          if (child.isMesh) {
            // For some reason, computing an unused bounding box resolves issues
            bound.expandByObject(child);
            child.geometry.computeBoundingBox();
          }
          // console.log(bound.min, bound.max);
         
        });

        this.#modelData.rotation.set(0, rotationOffset, 0);

        this.add(this.#modelData);

        this.#animationData = gltf.animations;
        for (var i = 0; i < this.#animationData.length; i++) {
          var animation = this.#animationData[i];
          this.animations.push(this.#mixer.clipAction(animation));
        }
        resolve();
      })
    );
    return this.#loadingComplete;
  }

  /**
   * Begin playing a specified animation, either once or in a loop. Any prior
   * animations are stopped automatically for consistency.
   * 
   * @param {number} index The index of the animation to play.
   * @param {boolean} loop Whether the animation should loop or play once.
   * @param {number} transitionTime The duration (in seconds) of the transition
   * into the animation.
   */
  cueAnimation(index, loop, transitionTime) {
    if(this.animations.length - 1 >= index) {
      if(this.lastAnimation != index) {
        this.stopAnimation(transitionTime);
      }
      const animation = this.animations[index];
      
      if(!loop) {
        animation.clampWhenFinished = true;
        animation.setLoop(THREE.LoopOnce);
      } else {
        animation.setLoop(THREE.LoopRepeat);
      }
      if(!animation.isRunning()) {
        animation.reset();
      }
      animation.play();
      animation.fadeIn(transitionTime);
      this.lastAnimation = index;
    }
  }

  /**
   * Stop the current animation.
   */
  stopAnimation(transitionTime) {
    if(this.animations.length > 0 && this.lastAnimation !== undefined) {
      this.animations[this.lastAnimation].fadeOut(transitionTime);
      this.lastAnimation = undefined;
    }
  }

  /**
   * Advance the next frame of the QuaterniusModel's animations.
   */
  advanceAnimation() {
    this.#mixer.update(this.#clock.getDelta());
  }

  /**
   * Private method called by the clone of a QuaterniusModel to complete a deep
   * copy.
   * 
   * @param {*} model 
   * @param {*} animations 
   * @param {*} load 
   */
  #copy(model, animations, load) {
    this.#modelData = SkeletonUtils.clone(model);
    this.add(this.#modelData);

    this.#animationData = animations;
    for (var i = 0; i < animations.length; i++) {
      var animation = animations[i];
      this.animations.push(this.#mixer.clipAction(animation));
    }

    this.#loadingComplete = load;
  }

  /**
   * Clone the QuaterniusModel.
   * @returns An independent clone of the QuaterniusModel.
   */
  clone() {
    const clone = new QuaterniusModel();
    clone.#copy(this.#modelData, this.#animationData, this.#loadingComplete);

    return clone;
  }

}