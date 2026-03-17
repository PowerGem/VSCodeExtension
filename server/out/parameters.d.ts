/**
 * TARA Parameter Metadata Database
 * Extracted from TARA 2601 Manual Appendix A.1
 * Used for validation and IntelliSense in .dir files
 */
export interface Parameter {
    name: string;
    optionBlock: string;
    type: 'number' | 'string' | 'boolean' | 'enum';
    default?: number | string | boolean;
    description: string;
    minValue?: number;
    maxValue?: number;
    validValues?: string[];
}
export declare const TARA_PARAMETERS: Parameter[];
export declare function getParametersByOptionBlock(blockName: string): Parameter[];
export declare function findParameter(name: string, optionBlock?: string): Parameter | undefined;
export declare function getValidOptionBlocks(): string[];
