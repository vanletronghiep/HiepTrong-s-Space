# Earth imagery credits

Earth textures: **Solar System Scope (INOVE), based on NASA imagery**. Licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Resized, converted and optimized; globe lighting and rendering modified for Hiep Trong Space.

Source and published license notice: [Solar System Scope textures](https://www.solarsystemscope.com/textures/), retrieved 3 November 2026.

| Original               | Download                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| Surface, 8192×4096     | [8k_earth_daymap.jpg](https://www.solarsystemscope.com/textures/download/8k_earth_daymap.jpg)     |
| City lights, 8192×4096 | [8k_earth_nightmap.jpg](https://www.solarsystemscope.com/textures/download/8k_earth_nightmap.jpg) |
| Clouds, 8192×4096      | [8k_earth_clouds.jpg](https://www.solarsystemscope.com/textures/download/8k_earth_clouds.jpg)     |

Local derivatives use 4096×2048 (`4k`) and 2048×1024 (`2k`) equirectangular WebP maps. Cloud images are grayscale opacity masks. The surface is darkened in the shader; night lights are graded gold, with a cloud shell and blue atmospheric edge. No geographic data or live weather is added.

Transparent 2048×2048 and 1024×1024 posters are rendered from these maps using the same review scene, grading and orientation. They are visual-review candidates; regenerate them if the approved material changes. No normal map is included in this proof.

See [asset-manifest.json](asset-manifest.json) for original/derivative dimensions, exact byte sizes, SHA-256 hashes, poster details and profile budgets. High-resolution originals remain in the preparation cache, outside the shipping assets.

When integrating the homepage, include the first paragraph above in a quiet, visible in-page “Earth imagery credits” disclosure, retaining its source and license links. The review gallery already displays this credit. The supplied photographs/videos remain design references; the watermarked stock preview is not used in the assets.
