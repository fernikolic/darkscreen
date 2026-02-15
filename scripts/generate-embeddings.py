#!/usr/bin/env python3
"""
Generate CLIP embeddings for all Darkscreen screenshots.

Outputs:
  - src/data/embeddings.bin   (Float32Array binary, 512 floats per image)
  - src/data/embedding-index.json (maps array position -> image path)

Requirements:
  pip install openai-clip torch pillow

Usage:
  python scripts/generate-embeddings.py
  python scripts/generate-embeddings.py --force     # regenerate all
  python scripts/generate-embeddings.py --device cpu # force CPU
"""

import argparse
import json
import os
import struct
import re
import sys
from pathlib import Path

try:
    import clip
    import torch
    from PIL import Image
except ImportError:
    print("Missing dependencies. Install with:")
    print("  pip install openai-clip torch pillow")
    sys.exit(1)

PROJECT_ROOT = Path(__file__).resolve().parent.parent
APPS_FILE = PROJECT_ROOT / "src" / "data" / "apps.ts"
SCREENSHOT_DIR = PROJECT_ROOT / "public" / "screenshots"
EMBEDDINGS_BIN = PROJECT_ROOT / "src" / "data" / "embeddings.bin"
INDEX_FILE = PROJECT_ROOT / "src" / "data" / "embedding-index.json"

def parse_args():
    parser = argparse.ArgumentParser(description="Generate CLIP embeddings for screenshots")
    parser.add_argument("--force", action="store_true", help="Regenerate all embeddings")
    parser.add_argument("--device", default="auto", help="Device: auto, cpu, cuda, mps")
    parser.add_argument("--batch-size", type=int, default=32, help="Batch size for embedding")
    return parser.parse_args()

def get_image_paths():
    """Extract all image paths referenced in apps.ts."""
    content = APPS_FILE.read_text()
    paths = re.findall(r'image:\s*"(/screenshots/[^"]+)"', content)
    existing = []
    for p in paths:
        full = PROJECT_ROOT / "public" / p.lstrip("/")
        if full.exists():
            existing.append(p)
    return existing

def resolve_device(requested):
    if requested != "auto":
        return requested
    if torch.cuda.is_available():
        return "cuda"
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"

def main():
    args = parse_args()
    device_name = resolve_device(args.device)
    device = torch.device(device_name)

    print(f"Device: {device_name}")
    print(f"Loading CLIP model (ViT-B/32)...")

    model, preprocess = clip.load("ViT-B/32", device=device)
    # Set model to inference mode (no gradient tracking)
    model.requires_grad_(False)

    image_paths = get_image_paths()
    print(f"Found {len(image_paths)} screenshots")

    # Load existing index if not forcing
    existing_index = []
    if not args.force and INDEX_FILE.exists():
        existing_index = json.loads(INDEX_FILE.read_text())
        if set(existing_index) == set(image_paths):
            print("All embeddings up to date. Use --force to regenerate.")
            return
        print(f"Index has {len(existing_index)} entries, need {len(image_paths)}")

    # Generate embeddings in batches
    all_embeddings = []
    total = len(image_paths)

    for i in range(0, total, args.batch_size):
        batch_paths = image_paths[i:i + args.batch_size]
        images = []

        for p in batch_paths:
            full = PROJECT_ROOT / "public" / p.lstrip("/")
            try:
                img = Image.open(full).convert("RGB")
                images.append(preprocess(img))
            except Exception as e:
                print(f"  Warning: failed to load {p}: {e}")
                images.append(torch.zeros(3, 224, 224))

        batch_tensor = torch.stack(images).to(device)

        with torch.no_grad():
            features = model.encode_image(batch_tensor)
            features = features / features.norm(dim=-1, keepdim=True)

        all_embeddings.append(features.cpu())

        done = min(i + args.batch_size, total)
        pct = done / total * 100
        print(f"\r  [{done}/{total}] {pct:.1f}%", end="", flush=True)

    print()

    embeddings = torch.cat(all_embeddings, dim=0).float()
    print(f"Embedding shape: {embeddings.shape} ({embeddings.shape[0]} images x {embeddings.shape[1]} dims)")

    # Save binary (raw Float32Array)
    EMBEDDINGS_BIN.parent.mkdir(parents=True, exist_ok=True)
    with open(EMBEDDINGS_BIN, "wb") as f:
        for row in embeddings:
            f.write(struct.pack(f"{len(row)}f", *row.tolist()))

    size_mb = EMBEDDINGS_BIN.stat().st_size / 1024 / 1024
    print(f"Saved embeddings: {EMBEDDINGS_BIN} ({size_mb:.1f} MB)")

    INDEX_FILE.write_text(json.dumps(image_paths, indent=2))
    print(f"Saved index: {INDEX_FILE} ({len(image_paths)} entries)")

if __name__ == "__main__":
    main()
