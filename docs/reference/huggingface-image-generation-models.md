# Hugging Face Image Generation Models Guide

> Last updated: 2026-01-28

A comprehensive guide to image generation models available on Hugging Face, including pricing across major API providers.

## Table of Contents

- [Text-to-Image Models](#text-to-image-models)
- [Image-to-Image Models](#image-to-image-models)
- [Inpainting Models](#inpainting-models)
- [ControlNet Models](#controlnet-models)
- [Pricing Comparison](#pricing-comparison)
- [Provider Overview](#provider-overview)
- [Self-Hosting Guide](#self-hosting-guide)
- [Integration Examples](#integration-examples)

---

## Text-to-Image Models

### FLUX Models (Black Forest Labs) - Top Tier

The FLUX family represents the current state-of-the-art in image generation.

#### FLUX.2 Series (Released November 2025)

| Model | Repo ID | Description | License |
|-------|---------|-------------|---------|
| **FLUX.2-pro** | `black-forest-labs/FLUX.2-pro` | State-of-the-art image quality, exceptional prompt fidelity | Restricted |
| **FLUX.2-flex** | `black-forest-labs/FLUX.2-flex` | Fine-grained control over generation parameters | Restricted |
| **FLUX.2-dev** | `black-forest-labs/FLUX.2-dev` | 32B open-weight model supporting generation and editing | Restricted |

#### FLUX.1 Series

| Model | Repo ID | Description | License |
|-------|---------|-------------|---------|
| **FLUX.1-schnell** | `black-forest-labs/FLUX.1-schnell` | Ultra-fast generation (1-4 steps) | **Apache 2.0** ✅ |
| **FLUX.1-dev** | `black-forest-labs/FLUX.1-dev` | High-quality development model | Restricted |

**Key Features:**
- Excellent text integration - renders prompts word-for-word within images
- Diffusion transformer architecture
- FLUX.1-schnell is fully open source (Apache 2.0)

---

### Stable Diffusion Models (Stability AI)

The industry standard with extensive ecosystem support.

#### SD 3.5 Series

| Model | Repo ID | Description | License |
|-------|---------|-------------|---------|
| **SD 3.5 Large** | `stabilityai/stable-diffusion-3.5-large` | Most powerful in SD family | CreativeML Open RAIL |
| **SD 3.5 Medium** | `stabilityai/stable-diffusion-3.5-medium` | Balanced performance/quality | CreativeML Open RAIL |

#### Earlier Versions

| Model | Repo ID | Description | License |
|-------|---------|-------------|---------|
| **SDXL** | `stabilityai/stable-diffusion-xl-base-1.0` | High-resolution generation | CreativeML Open RAIL |
| **SD 2.1** | `stabilityai/stable-diffusion-2-1` | Widely used, well-documented | CreativeML Open RAIL |
| **SD 1.5** | `runwayml/stable-diffusion-v1-5` | Classic version (gated) | CreativeML Open RAIL |

---

## Image-to-Image Models

### InstructPix2Pix

| Model | Repo ID | Use Case |
|-------|---------|----------|
| **InstructPix2Pix** | `timbrooks/instruct-pix2pix` | Edit images using natural language instructions |

**Capabilities:**
- Zero-shot image editing based on text instructions
- No training required for new edits
- Production-ready and actively maintained

### InstantID

| Model | Repo ID | Use Case |
|-------|---------|----------|
| **InstantID** | `InstantX/InstantID` | Zero-shot identity-preserving generation |
| **InstantID-SD1.5** | `TheDenk/InstantID-SD1.5` | SD 1.5 compatible version |

**Capabilities:**
- Face identity preservation with single image input
- Integrates with pre-trained diffusion models
- State-of-the-art for personalized image synthesis

### Pix2Pix Variants

| Model | Repo ID | Use Case |
|-------|---------|----------|
| **Pix2Pix Night2Day** | `huggan/pix2pix-night2day` | Style transfer (night to day) |

---

## Inpainting Models

### FLUX Inpainting

| Model | Repo ID | Resolution |
|-------|---------|------------|
| **FLUX Inpainting Beta** | `alimama-creative/FLUX.1-dev-Controlnet-Inpainting-Beta` | 1024px |
| **FLUX Inpainting Alpha** | `alimama-creative/FLUX.1-dev-Controlnet-Inpainting-Alpha` | 1024px |

### Stable Diffusion Inpainting

| Model | Repo ID | Resolution |
|-------|---------|------------|
| **SD3 Inpainting** | `alimama-creative/SD3-Controlnet-Inpainting` | 1024px |
| **SD2 Inpainting** | `stabilityai/stable-diffusion-2-inpainting` | 512px |
| **SD1.5 Inpainting** | `runwayml/stable-diffusion-inpainting` | 512px |

---

## ControlNet Models

ControlNet enables conditioning image generation on various inputs like edges, depth, and pose.

### ControlNet v1.1 (SD 1.5)

| Model | Repo ID | Conditioning Type |
|-------|---------|-------------------|
| **Canny** | `lllyasviel/control_v11p_sd15_canny` | Edge detection |
| **OpenPose** | `lllyasviel/control_v11p_sd15_openpose` | Human pose |
| **Depth** | `lllyasviel/control_v11p_sd15_depth` | Depth maps |
| **Inpaint** | `lllyasviel/control_v11p_sd15_inpaint` | Inpainting masks |

**License:** Apache 2.0 (Open Source)

### SDXL ControlNet

| Model | Repo ID | Conditioning Type |
|-------|---------|-------------------|
| **SDXL Inpaint** | `destitech/controlnet-inpaint-dreamer-sdxl` | Inpainting/outpainting |

---

## Pricing Comparison

### Text-to-Image Pricing

| Model | Replicate | Fal.ai | Together AI | Self-hosted |
|-------|-----------|--------|-------------|-------------|
| **FLUX.2-pro** | $0.055 | $0.03/MP | $0.05-0.06 | ~$1.45/hr (H100) |
| **FLUX.1-dev** | $0.030 | $0.012/MP | $0.025 | ~$0.72/hr (A100) |
| **FLUX.1-schnell** | $0.003 | $0.008 | - | **Free** (Apache 2.0) |
| **SD 3.5 Large** | $0.036 | - | $0.025 | **Free** |
| **SDXL** | $0.0037 | $0.01-0.05 | - | **Free** |

### Image-to-Image Pricing

| Model | Replicate | Fal.ai | Self-hosted |
|-------|-----------|--------|-------------|
| **InstructPix2Pix** | $0.049 | - | **Free** |
| **InstantID** | $0.026 | - | **Free** |

### Inpainting Pricing

| Model | Replicate | Fal.ai | Self-hosted |
|-------|-----------|--------|-------------|
| **FLUX Inpainting [pro]** | ~$0.04 | $0.05/MP | **Free** |
| **FLUX Inpainting [dev]** | ~$0.03 | $0.035/MP | **Free** |
| **SD3 Inpainting** | ~$0.03 | - | **Free** |
| **SD2 Inpainting** | ~$0.01 | - | **Free** |

### ControlNet Pricing

| Model | Replicate | HuggingFace | Self-hosted |
|-------|-----------|-------------|-------------|
| **ControlNet (all types)** | ~$0.01-0.03 | $0.0001-0.012/sec | **Free** |

### Cheapest Options by Use Case

| Use Case | Model | Provider | Price per Image |
|----------|-------|----------|-----------------|
| **Cheapest overall** | FLUX.1-schnell | Pixazo | **$0.0012** |
| **Best quality** | FLUX.2-pro | Fal.ai | $0.03/MP |
| **Production balance** | FLUX.1-dev | Fal.ai | $0.012/MP |
| **Free (self-host)** | FLUX.1-schnell | Your GPU | **$0** |

---

## Provider Overview

### Replicate

- **Billing Model:** Per-second compute time
- **Hardware Range:** $0.000100/sec (CPU) to $0.012200/sec (8x H100)
- **Best For:** Sporadic usage, pay only for active processing
- **Free Tier:** Setup and idle time free

### Fal.ai

- **Billing Model:** Per-megapixel pricing
- **Price Range:** $0.008-$0.03/MP depending on model
- **Best For:** High-quality outputs, FLUX models
- **Features:** 10x cheaper, 6x more efficient than alternatives

### Together AI

- **Billing Model:** Per-image pricing
- **Price Range:** $0.025-$0.08 per image
- **Best For:** Production deployments, scalability
- **Features:** Fast, reliable API access

### Hugging Face

- **Free Tier:** Yes (with monthly credits)
- **PRO Plan:** $9/month (8x ZeroGPU quota)
- **Inference Endpoints:** $0.032/CPU core-hr, $0.5/GPU-hr
- **Spaces GPU:** $0.40-$40/hour (T4 to 8x H200)
- **Best For:** Development, experimentation, continuous workloads

### Stability AI (Official)

- **Billing Model:** Credit-based system
- **Price Range:** 3.5-8 credits per request
- **Best For:** Official support, enterprise licensing
- **Features:** Direct access to newest models first

---

## Self-Hosting Guide

### Cloud GPU Pricing

| GPU | Provider | Price/Hour | Best For |
|-----|----------|------------|----------|
| **T4** | Various | $0.09 | Budget/testing |
| **RTX A6000 48GB** | Hyperstack | $0.50 | Production |
| **A100** | AWS/GCP | $0.66-0.72 | High performance |
| **H100** | Budget providers | ~$1.45 | Maximum speed |
| **8x H100** | AWS p5e.48xlarge | ~$39.80 | Enterprise scale |

### Alternative Cloud Providers

| Provider | Savings vs AWS/GCP | Notes |
|----------|-------------------|-------|
| **RunPod** | 40-60% | Cold start: 10-30s |
| **Modal** | Variable | Cold start: <5s, up to $25k credits |
| **Hyperstack** | 50-70% | Good A6000 pricing |

### Cost Optimization Tips

1. **Per-minute billing** can save 40% vs hourly for short tasks
2. **Spot instances** offer substantial discounts (varies by availability)
3. **Reserved instances** are better for consistent workloads
4. **Open-source models** (FLUX.1-schnell, SD 3.5, SDXL) are free to run

---

## Integration Examples

### Text-to-Image with FLUX

```python
from diffusers import DiffusionPipeline
import torch

# Load FLUX.1-schnell (fastest, Apache 2.0)
pipe = DiffusionPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-schnell",
    torch_dtype=torch.float16
)
pipe.to("cuda")

# Generate image
image = pipe(
    "A cat wearing sunglasses on a beach",
    num_inference_steps=4  # schnell is fast!
).images[0]

image.save("cat_beach.png")
```

### Image Editing with InstructPix2Pix

```python
from diffusers import StableDiffusionInstructPix2PixPipeline
from PIL import Image
import torch

# Load model
pipe = StableDiffusionInstructPix2PixPipeline.from_pretrained(
    "timbrooks/instruct-pix2pix",
    torch_dtype=torch.float16
)
pipe.to("cuda")

# Load and edit image
input_image = Image.open("photo.jpg")
edited = pipe(
    "Make it a watercolor painting",
    image=input_image,
    num_inference_steps=20
).images[0]

edited.save("watercolor.png")
```

### Inpainting with FLUX

```python
from diffusers import FluxInpaintPipeline
from PIL import Image
import torch

# Load FLUX inpainting
pipe = FluxInpaintPipeline.from_pretrained(
    "black-forest-labs/FLUX.1-dev",
    torch_dtype=torch.float16
)
pipe.to("cuda")

# Load image and mask
image = Image.open("photo.jpg")
mask = Image.open("mask.png")  # White = inpaint area

# Inpaint
result = pipe(
    prompt="A beautiful garden",
    image=image,
    mask_image=mask,
    num_inference_steps=30
).images[0]

result.save("inpainted.png")
```

### ControlNet with Canny Edges

```python
from diffusers import StableDiffusionControlNetPipeline, ControlNetModel
from PIL import Image
import torch
import cv2
import numpy as np

# Load ControlNet
controlnet = ControlNetModel.from_pretrained(
    "lllyasviel/control_v11p_sd15_canny",
    torch_dtype=torch.float16
)

pipe = StableDiffusionControlNetPipeline.from_pretrained(
    "runwayml/stable-diffusion-v1-5",
    controlnet=controlnet,
    torch_dtype=torch.float16
)
pipe.to("cuda")

# Create canny edge image
image = np.array(Image.open("photo.jpg"))
edges = cv2.Canny(image, 100, 200)
canny_image = Image.fromarray(edges)

# Generate with edge control
result = pipe(
    "A detailed pencil sketch",
    image=canny_image,
    num_inference_steps=30
).images[0]

result.save("controlled.png")
```

---

## Recommendations

### Best Overall Quality
**FLUX.2-pro** on Fal.ai ($0.03/MP) or Replicate ($0.055/image)

### Best Open Source
**FLUX.1-schnell** - Apache 2.0 license, fully open, 1-4 step generation

### Best for Speed
**FLUX.1-schnell** - Ultra-fast generation in 1-4 steps

### Best for Inpainting
**FLUX.1-dev-Controlnet-Inpainting-Beta** or **SD3-Controlnet-Inpainting**

### Best for Image Editing
**InstructPix2Pix** - Natural language image editing

### Best for Identity Preservation
**InstantID** - Single-image face identity preservation

### Best for Controlled Generation
**ControlNet v1.1 series** - Extensive conditioning options

---

## Sources

- [Hugging Face Diffusers Documentation](https://huggingface.co/docs/diffusers)
- [Hugging Face Inference Providers Pricing](https://huggingface.co/docs/inference-providers/en/pricing)
- [Replicate Pricing](https://replicate.com/pricing)
- [Together AI Pricing](https://www.together.ai/pricing)
- [Fal.ai Pricing](https://fal.ai/pricing)
- [Stability AI Pricing](https://platform.stability.ai/pricing)
- [Black Forest Labs FLUX Models](https://blackforestlabs.ai/)
- [The Best Open-Source Image Generation Models (BentoML)](https://www.bentoml.com/blog/a-guide-to-open-source-image-generation-models)
