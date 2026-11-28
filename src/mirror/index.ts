/**
 * The mirror kit: the "Darkness Staring Back" motifs as reusable pieces
 * (docs/darkness-staring-back.md, section 2). Build each once here, then apply
 * them to screens.
 */
export { Reflection, type ReflectionProps } from "./Reflection";
export { GazeEyes, type GazeEyesProps } from "./GazeEyes";
export { Resolving, type ResolvingProps } from "./Resolving";
export { RecognitionBeat, type RecognitionBeatProps } from "./RecognitionBeat";
export {
  useGaze,
  gazeFromPoint,
  gazeFromTilt,
  clampUnit,
  CENTER_GAZE,
  DEFAULT_IDLE_MS,
  type Gaze,
  type UseGazeOptions,
} from "./useGaze";
export { prefersReducedMotion, SOFT_EASE } from "./motion";
