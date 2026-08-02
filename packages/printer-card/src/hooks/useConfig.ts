import { useConfig as useBaseConfig } from '@zupre/core';
import { Config } from '../types';

export const useConfig = () => useBaseConfig() as Config | undefined;
