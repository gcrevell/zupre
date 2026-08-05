import { BaseConfig } from '@zupre/core';

export type ForecastMode = 'daily' | 'hourly' | 'twice_daily' | 'both';
export type CloudStyle = 'image' | 'css' | 'none';

export type Forecast = {
  entity: string;
  name?: string;
  forecast_type?: ForecastMode;
  max_items?: number;
  max_hourly?: number;
  min_column_width?: number;
  header_attributes?: string[];
  show_header?: boolean;
  show_forecast?: boolean;
  square?: boolean;
  disable_animations?: boolean;
  disable_dynamic_background?: boolean;
  cloud_style?: CloudStyle;
};

export type Config = Forecast & BaseConfig;
