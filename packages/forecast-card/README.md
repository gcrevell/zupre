# forecast-card

A Home Assistant Lovelace card for a `weather.*` entity: a condition-driven
animated background (gradients, rain/snow/hail/stars, drifting clouds) with a
daily, hourly, twice-daily, or combined hourly+daily forecast strip.

## YAML configuration

```yaml
type: custom:forecast-card
entity: weather.home
name: Home                      # optional, defaults to the entity's friendly name

forecast_type: daily            # daily | hourly | twice_daily | both
max_items: 5                    # daily/twice_daily items shown
max_hourly: 8                   # hourly items shown
min_column_width: 50            # px; columns truncate rather than wrap below this

show_header: true               # icon, name, current temp, condition
show_forecast: true
square: false                   # force a 1:1 aspect ratio

disable_animations: false       # also respects prefers-reduced-motion
disable_dynamic_background: false
cloud_style: image              # image | css | none

header_attributes:              # optional chips shown under the header
  - humidity
  - wind_speed
```

Tapping the card dispatches `hass-more-info` for the configured entity, same
as HA's built-in weather card.

## Attribution

The background gradients, particle animations (rain/snow/hail/stars/
lightning), and the bundled cloud sprite (`src/card/assets/cloud.png`) are
ported/derived from [Bubble Card](https://github.com/Clooos/bubble-card)'s
`weather_forecast` module, MIT © 2023 Cloos. This package is also MIT
licensed; the forecast-fetching, rendering, and host-integration code around
those visuals is original to this repo.
