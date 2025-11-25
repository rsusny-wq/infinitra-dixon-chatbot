/**
 * VIN Components Export Index
 * Centralized exports for all VIN-related components
 */

export { default as VINScanner } from './VINScanner';
export { default as DiagnosticChoiceInterface } from './DiagnosticChoiceInterface';
export { default as ManualVINEntry } from './ManualVINEntry';
export { default as VINScanningFlow } from './VINScanningFlow';

export type { VINScannerProps } from './VINScanner';
export type { DiagnosticChoiceProps, DiagnosticOption } from './DiagnosticChoiceInterface';
export type { ManualVINEntryProps } from './ManualVINEntry';
export type { VINScanningFlowProps, VINProcessingResult, VINScanningStep } from './VINScanningFlow';
