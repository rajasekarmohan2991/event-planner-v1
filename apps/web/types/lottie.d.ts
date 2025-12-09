declare module 'lottie-web' {
  export interface AnimationConfig {
    container: HTMLElement
    renderer?: 'svg' | 'canvas' | 'html'
    loop?: boolean | number
    autoplay?: boolean
    path?: string
    animationData?: any
    rendererSettings?: {
      preserveAspectRatio?: string
      className?: string
    }
  }

  export interface AnimationItem {
    play(): void
    stop(): void
    pause(): void
    setSpeed(speed: number): void
    setDirection(direction: number): void
    goToAndPlay(value: number, isFrame?: boolean): void
    goToAndStop(value: number, isFrame?: boolean): void
    setSegment(init: number, end: number): void
    destroy(): void
    getDuration(inFrames?: boolean): number
    triggerEvent<T = any>(name: string, args: T): void
    addEventListener<T = any>(
      name: string,
      callback: (args: T) => void
    ): void
    removeEventListener<T = any>(
      name: string,
      callback?: (args: T) => void
    ): void
  }

  export interface AnimationEventType {
    enterFrame: number
    loopComplete: number
    complete: number
    segmentStart: number
    destroy: void
    config_ready: void
    data_ready: void
    loaded_images: void
    DOMLoaded: void
    error: string
  }

  export interface AnimationEventCallback<T = any> {
    (args: T): void
  }

  export interface Animation {
    loadAnimation(params: AnimationConfig): AnimationItem
    play(name?: string): void
    pause(name?: string): void
    setSpeed(speed: number, name?: string): void
    setDirection(direction: number, name?: string): void
    searchAnimations(animationData?: any, standalone?: boolean, renderer?: string): void
    registerAnimation(element: Element, animationData?: any): void
    destroy(name?: string): void
    setQuality(quality: string | number): void
  }

  const lottie: Animation
  export default lottie
}
